-- Virtual Trader JP: 日本株(東証)シミュレーション売買アプリ用テーブル・関数
--
-- apps/virtual-trader (米国株版, vt_*) と同じ設計を踏襲した姉妹アプリ。
-- 価格データ源をFinnhub(無料枠は海外取引所非対応)からYahoo Financeの
-- キー不要な非公式エンドポイントに差し替えたため、米国版にあった
-- vt_finnhub_keys相当のテーブル(ユーザーごとのAPIキー保存)は存在しない。
--
-- 設計メモ:
-- ・ポジション/取引/残高の更新は必ず vtjp_place_order() / vtjp_reset_portfolio() を経由させる。
--   クライアントから直接テーブルをinsert/updateさせない（RLSでも許可しない）ことで、
--   手数料計算や残高整合性のロジックを1箇所に集約する。
-- ・side列は現物のみのMVPでは常に'long'固定だが、将来の空売り対応のために先に持たせておく。
-- ・vtjp_price_cache/vtjp_price_ticksの書き込みはEdge Function（service_role）からのみ行う想定。
--   クライアントには読み取りしか許可しない。

create table if not exists public.vtjp_portfolios (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cash_balance numeric(14,2) not null default 1000000,
  updated_at timestamptz not null default now()
);

alter table public.vtjp_portfolios enable row level security;

create policy "Users can view their own jp portfolio"
  on public.vtjp_portfolios for select
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.vtjp_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null,
  side text not null default 'long' check (side in ('long', 'short')),
  quantity integer not null check (quantity > 0),
  avg_cost numeric(14,4) not null,
  updated_at timestamptz not null default now(),
  unique (user_id, symbol, side)
);

alter table public.vtjp_positions enable row level security;

create policy "Users can view their own jp positions"
  on public.vtjp_positions for select
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.vtjp_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null,
  side text not null default 'long' check (side in ('long', 'short')),
  action text not null check (action in ('buy', 'sell')),
  quantity integer not null check (quantity > 0),
  price numeric(14,4) not null,
  fee numeric(14,2) not null,
  realized_pnl numeric(14,2),
  executed_at timestamptz not null default now()
);

alter table public.vtjp_trades enable row level security;

create policy "Users can view their own jp trades"
  on public.vtjp_trades for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists vtjp_trades_user_executed_idx
  on public.vtjp_trades (user_id, executed_at desc);

-- 全ユーザー共有の価格キャッシュ（Edge Functionが1分程度の粒度で更新する）
-- updated_at と market_time は別物なので必ず分けて持つ:
--   updated_at  = こちらがYahooに取りに行った時刻
--   market_time = その価格が実際に板についた時刻(Yahooのregular_market_time)
-- 休場日にはYahooが前営業日の終値を返し続けるため、updated_atだけを見ていると
-- 「常に新鮮な価格」に見えてしまい、陳腐化チェックが機能しない。
create table if not exists public.vtjp_price_cache (
  symbol text primary key,
  price numeric(14,4) not null,
  prev_close numeric(14,4),
  market_time timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.vtjp_price_cache enable row level security;

create policy "Anyone signed in can read the jp price cache"
  on public.vtjp_price_cache for select
  to authenticated
  using (true);

-- アプリが「実際にいくらで約定できる価格を見ていたか」を残す時系列ティック。
-- 米国版ではここからローソク足を組み立てていたが、日本株版のチャートはYahooの
-- 日足履歴を直接描くようになったため、この表はチャート用ではなく約定価格の記録用。
create table if not exists public.vtjp_price_ticks (
  id bigint generated always as identity primary key,
  symbol text not null,
  ts timestamptz not null default now(),
  price numeric(14,4) not null
);

alter table public.vtjp_price_ticks enable row level security;

create policy "Anyone signed in can read jp price ticks"
  on public.vtjp_price_ticks for select
  to authenticated
  using (true);

create index if not exists vtjp_price_ticks_symbol_ts_idx
  on public.vtjp_price_ticks (symbol, ts desc);

-- 「今どの銘柄が見られているか」を示す共有フラグ。Edge Functionが更新対象を絞り込むのに使う。
create table if not exists public.vtjp_watched_symbols (
  symbol text primary key,
  last_viewed_at timestamptz not null default now()
);

alter table public.vtjp_watched_symbols enable row level security;

create policy "Anyone signed in can read jp watched symbols"
  on public.vtjp_watched_symbols for select
  to authenticated
  using (true);

-- 米国版と違い、この表への書き込みポリシーは意図的に作らない。
-- 閲覧マークを付けるのはEdge Function(service_role)側だけで、クライアントは書かない。
-- insert/updateを開けておくと、認証済みユーザーが任意の銘柄を無制限に流し込めてしまい、
-- 毎分のcronがその全件をYahooに取りに行く自爆的な負荷経路になる。

-- 東京時間ベースで東証の立会時間内かどうかを判定
-- 前場 9:00-11:30 / 後場 12:30-15:30 (2024年11月の後場延長を反映), 月-金
-- 日本の祝日・臨時休場は考慮しないMVP上の既知の制限。
create or replace function public.vtjp_market_is_open()
returns boolean
language sql
stable
as $$
  select
    extract(dow from (now() at time zone 'Asia/Tokyo')) between 1 and 5
    and (
      (
        (now() at time zone 'Asia/Tokyo')::time >= time '09:00'
        and (now() at time zone 'Asia/Tokyo')::time < time '11:30'
      )
      or (
        (now() at time zone 'Asia/Tokyo')::time >= time '12:30'
        and (now() at time zone 'Asia/Tokyo')::time < time '15:30'
      )
    );
$$;

create or replace function public.vtjp_get_or_create_portfolio()
returns public.vtjp_portfolios
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.vtjp_portfolios;
begin
  insert into public.vtjp_portfolios (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into v_row from public.vtjp_portfolios where user_id = auth.uid();
  return v_row;
end;
$$;

create or replace function public.vtjp_reset_portfolio()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.vtjp_positions where user_id = auth.uid();
  delete from public.vtjp_trades where user_id = auth.uid();

  insert into public.vtjp_portfolios (user_id, cash_balance)
  values (auth.uid(), 1000000)
  on conflict (user_id) do update set cash_balance = 1000000, updated_at = now();
end;
$$;

-- 成行注文を1トランザクションで実行する。手数料計算・平均取得単価・実現損益の更新は
-- すべてここに集約し、クライアント側では金額計算をさせない。
create or replace function public.vtjp_place_order(p_symbol text, p_action text, p_quantity integer)
returns public.vtjp_trades
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price numeric(14,4);
  v_price_updated_at timestamptz;
  v_market_time timestamptz;
  v_gross numeric(18,4);
  v_fee numeric(14,2);
  v_position public.vtjp_positions;
  v_portfolio public.vtjp_portfolios;
  v_realized numeric(14,2);
  v_trade public.vtjp_trades;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if p_action not in ('buy', 'sell') then
    raise exception 'invalid action';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'invalid quantity';
  end if;

  if not public.vtjp_market_is_open() then
    raise exception 'market is closed';
  end if;

  select price, updated_at, market_time
    into v_price, v_price_updated_at, v_market_time
    from public.vtjp_price_cache where symbol = p_symbol;

  if v_price is null then
    raise exception 'no cached price for this symbol yet, open its chart first';
  end if;

  if v_price_updated_at < now() - interval '5 minutes' then
    raise exception 'cached price is stale, reopen the chart to refresh it';
  end if;

  -- 日本の祝日はvtjp_market_is_open()では判別できない(平日なので開場扱いになる)。
  -- 休場日はYahooが前営業日の終値を返し続けるため、値がついた時刻が何時間も前なら
  -- 板が動いていないとみなして約定を止める。昼休みを挟んでも1時間強しか空かないので、
  -- 4時間を閾値にすれば通常の売買を妨げずに休場日だけを弾ける。
  if v_market_time is not null and v_market_time < now() - interval '4 hours' then
    raise exception 'no recent trades for this symbol, the market may be closed today';
  end if;

  perform public.vtjp_get_or_create_portfolio();
  select * into v_portfolio from public.vtjp_portfolios where user_id = v_user for update;

  v_gross := v_price * p_quantity;
  v_fee := round(v_gross * 0.00495, 2);

  select * into v_position from public.vtjp_positions
    where user_id = v_user and symbol = p_symbol and side = 'long'
    for update;

  if p_action = 'buy' then
    if v_portfolio.cash_balance < v_gross + v_fee then
      raise exception 'insufficient cash balance';
    end if;

    if v_position.user_id is null then
      insert into public.vtjp_positions (user_id, symbol, side, quantity, avg_cost)
      values (v_user, p_symbol, 'long', p_quantity, (v_gross + v_fee) / p_quantity);
    else
      update public.vtjp_positions
        set quantity = v_position.quantity + p_quantity,
            avg_cost = (v_position.quantity * v_position.avg_cost + v_gross + v_fee)
                       / (v_position.quantity + p_quantity),
            updated_at = now()
        where user_id = v_user and symbol = p_symbol and side = 'long';
    end if;

    update public.vtjp_portfolios
      set cash_balance = cash_balance - (v_gross + v_fee), updated_at = now()
      where user_id = v_user;

    insert into public.vtjp_trades (user_id, symbol, side, action, quantity, price, fee, realized_pnl)
    values (v_user, p_symbol, 'long', 'buy', p_quantity, v_price, v_fee, null)
    returning * into v_trade;
  else
    if v_position.user_id is null or v_position.quantity < p_quantity then
      raise exception 'insufficient shares to sell';
    end if;

    v_realized := round((v_price - v_position.avg_cost) * p_quantity - v_fee, 2);

    if v_position.quantity = p_quantity then
      delete from public.vtjp_positions where user_id = v_user and symbol = p_symbol and side = 'long';
    else
      update public.vtjp_positions
        set quantity = v_position.quantity - p_quantity, updated_at = now()
        where user_id = v_user and symbol = p_symbol and side = 'long';
    end if;

    update public.vtjp_portfolios
      set cash_balance = cash_balance + (v_gross - v_fee), updated_at = now()
      where user_id = v_user;

    insert into public.vtjp_trades (user_id, symbol, side, action, quantity, price, fee, realized_pnl)
    values (v_user, p_symbol, 'long', 'sell', p_quantity, v_price, v_fee, v_realized)
    returning * into v_trade;
  end if;

  return v_trade;
end;
$$;

grant execute on function public.vtjp_get_or_create_portfolio() to authenticated;
grant execute on function public.vtjp_reset_portfolio() to authenticated;
grant execute on function public.vtjp_place_order(text, text, integer) to authenticated;
grant execute on function public.vtjp_market_is_open() to authenticated, anon;
