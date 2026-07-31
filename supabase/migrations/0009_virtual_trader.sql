-- Virtual Trader: 米国株シミュレーション売買アプリ用テーブル・関数
--
-- 設計メモ:
-- ・ポジション/取引/残高の更新は必ず vt_place_order() / vt_reset_portfolio() を経由させる。
--   クライアントから直接テーブルをinsert/updateさせない（RLSでも許可しない）ことで、
--   手数料計算や残高整合性のロジックを1箇所に集約する。
-- ・side列は現物のみのMVPでは常に'long'固定だが、将来の空売り対応のために先に持たせておく。
-- ・vt_price_cache/vt_price_ticksの書き込みはEdge Function（service_role）からのみ行う想定。
--   クライアントには読み取りしか許可しない。

create table if not exists public.vt_finnhub_keys (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  api_key text not null,
  updated_at timestamptz not null default now()
);

alter table public.vt_finnhub_keys enable row level security;

-- 一度保存したキーはクライアントから読み返せないようにする（selectポリシーを作らない）。
-- Edge Functionはservice_roleでアクセスするためRLSの影響を受けない。
create policy "Users can save their own finnhub key"
  on public.vt_finnhub_keys for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own finnhub key"
  on public.vt_finnhub_keys for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- キーの値を見せずに「登録済みかどうか」だけを判定するための関数
create or replace function public.vt_has_finnhub_key()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.vt_finnhub_keys where user_id = auth.uid()
  );
$$;

create table if not exists public.vt_portfolios (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cash_balance numeric(14,2) not null default 1000000,
  updated_at timestamptz not null default now()
);

alter table public.vt_portfolios enable row level security;

create policy "Users can view their own portfolio"
  on public.vt_portfolios for select
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.vt_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null,
  side text not null default 'long' check (side in ('long', 'short')),
  quantity integer not null check (quantity > 0),
  avg_cost numeric(14,4) not null,
  updated_at timestamptz not null default now(),
  unique (user_id, symbol, side)
);

alter table public.vt_positions enable row level security;

create policy "Users can view their own positions"
  on public.vt_positions for select
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.vt_trades (
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

alter table public.vt_trades enable row level security;

create policy "Users can view their own trades"
  on public.vt_trades for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists vt_trades_user_executed_idx
  on public.vt_trades (user_id, executed_at desc);

-- 全ユーザー共有の価格キャッシュ（Edge Functionが1分程度の粒度で更新する）
create table if not exists public.vt_price_cache (
  symbol text primary key,
  price numeric(14,4) not null,
  prev_close numeric(14,4),
  updated_at timestamptz not null default now()
);

alter table public.vt_price_cache enable row level security;

create policy "Anyone signed in can read the price cache"
  on public.vt_price_cache for select
  to authenticated
  using (true);

-- 自前でローソク足を組み立てるための時系列ティック
create table if not exists public.vt_price_ticks (
  id bigint generated always as identity primary key,
  symbol text not null,
  ts timestamptz not null default now(),
  price numeric(14,4) not null
);

alter table public.vt_price_ticks enable row level security;

create policy "Anyone signed in can read price ticks"
  on public.vt_price_ticks for select
  to authenticated
  using (true);

create index if not exists vt_price_ticks_symbol_ts_idx
  on public.vt_price_ticks (symbol, ts desc);

-- 「今どの銘柄が見られているか」を示す共有フラグ。Edge Functionが更新対象を絞り込むのに使う。
create table if not exists public.vt_watched_symbols (
  symbol text primary key,
  last_viewed_at timestamptz not null default now()
);

alter table public.vt_watched_symbols enable row level security;

create policy "Anyone signed in can read watched symbols"
  on public.vt_watched_symbols for select
  to authenticated
  using (true);

create policy "Anyone signed in can mark a symbol as watched"
  on public.vt_watched_symbols for insert
  to authenticated
  with check (true);

create policy "Anyone signed in can refresh a watched symbol timestamp"
  on public.vt_watched_symbols for update
  to authenticated
  using (true)
  with check (true);

-- ニューヨーク時間ベースで通常取引時間内(平日9:30-16:00)かどうかを判定
create or replace function public.vt_market_is_open()
returns boolean
language sql
stable
as $$
  select
    extract(dow from (now() at time zone 'America/New_York')) between 1 and 5
    and (now() at time zone 'America/New_York')::time >= time '09:30'
    and (now() at time zone 'America/New_York')::time < time '16:00';
$$;

create or replace function public.vt_get_or_create_portfolio()
returns public.vt_portfolios
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.vt_portfolios;
begin
  insert into public.vt_portfolios (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into v_row from public.vt_portfolios where user_id = auth.uid();
  return v_row;
end;
$$;

create or replace function public.vt_reset_portfolio()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.vt_positions where user_id = auth.uid();
  delete from public.vt_trades where user_id = auth.uid();

  insert into public.vt_portfolios (user_id, cash_balance)
  values (auth.uid(), 1000000)
  on conflict (user_id) do update set cash_balance = 1000000, updated_at = now();
end;
$$;

-- 成行注文を1トランザクションで実行する。手数料計算・平均取得単価・実現損益の更新は
-- すべてここに集約し、クライアント側では金額計算をさせない。
create or replace function public.vt_place_order(p_symbol text, p_action text, p_quantity integer)
returns public.vt_trades
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price numeric(14,4);
  v_price_updated_at timestamptz;
  v_gross numeric(18,4);
  v_fee numeric(14,2);
  v_position public.vt_positions;
  v_portfolio public.vt_portfolios;
  v_realized numeric(14,2);
  v_trade public.vt_trades;
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

  if not public.vt_market_is_open() then
    raise exception 'market is closed';
  end if;

  select price, updated_at into v_price, v_price_updated_at
    from public.vt_price_cache where symbol = p_symbol;

  if v_price is null then
    raise exception 'no cached price for this symbol yet, open its chart first';
  end if;

  if v_price_updated_at < now() - interval '5 minutes' then
    raise exception 'cached price is stale, reopen the chart to refresh it';
  end if;

  perform public.vt_get_or_create_portfolio();
  select * into v_portfolio from public.vt_portfolios where user_id = v_user for update;

  v_gross := v_price * p_quantity;
  v_fee := round(v_gross * 0.00495, 2);

  select * into v_position from public.vt_positions
    where user_id = v_user and symbol = p_symbol and side = 'long'
    for update;

  if p_action = 'buy' then
    if v_portfolio.cash_balance < v_gross + v_fee then
      raise exception 'insufficient cash balance';
    end if;

    if v_position.user_id is null then
      insert into public.vt_positions (user_id, symbol, side, quantity, avg_cost)
      values (v_user, p_symbol, 'long', p_quantity, (v_gross + v_fee) / p_quantity);
    else
      update public.vt_positions
        set quantity = v_position.quantity + p_quantity,
            avg_cost = (v_position.quantity * v_position.avg_cost + v_gross + v_fee)
                       / (v_position.quantity + p_quantity),
            updated_at = now()
        where user_id = v_user and symbol = p_symbol and side = 'long';
    end if;

    update public.vt_portfolios
      set cash_balance = cash_balance - (v_gross + v_fee), updated_at = now()
      where user_id = v_user;

    insert into public.vt_trades (user_id, symbol, side, action, quantity, price, fee, realized_pnl)
    values (v_user, p_symbol, 'long', 'buy', p_quantity, v_price, v_fee, null)
    returning * into v_trade;
  else
    if v_position.user_id is null or v_position.quantity < p_quantity then
      raise exception 'insufficient shares to sell';
    end if;

    v_realized := round((v_price - v_position.avg_cost) * p_quantity - v_fee, 2);

    if v_position.quantity = p_quantity then
      delete from public.vt_positions where user_id = v_user and symbol = p_symbol and side = 'long';
    else
      update public.vt_positions
        set quantity = v_position.quantity - p_quantity, updated_at = now()
        where user_id = v_user and symbol = p_symbol and side = 'long';
    end if;

    update public.vt_portfolios
      set cash_balance = cash_balance + (v_gross - v_fee), updated_at = now()
      where user_id = v_user;

    insert into public.vt_trades (user_id, symbol, side, action, quantity, price, fee, realized_pnl)
    values (v_user, p_symbol, 'long', 'sell', p_quantity, v_price, v_fee, v_realized)
    returning * into v_trade;
  end if;

  return v_trade;
end;
$$;

grant execute on function public.vt_has_finnhub_key() to authenticated;
grant execute on function public.vt_get_or_create_portfolio() to authenticated;
grant execute on function public.vt_reset_portfolio() to authenticated;
grant execute on function public.vt_place_order(text, text, integer) to authenticated;
grant execute on function public.vt_market_is_open() to authenticated, anon;
