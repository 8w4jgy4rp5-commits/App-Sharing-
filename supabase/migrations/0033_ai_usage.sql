-- AI機能（Gemini）の土台。
--
-- 目的:
--   1) 共有のGemini APIキーを守るため、「誰が・何日に・何回使ったか」を数える
--   2) 同じ検索文への回答を使い回して、無料枠の消費を減らす
--
-- セキュリティの考え方:
--   この2つのテーブルにはRLSポリシーを1つも作らない。
--   Supabaseでは「RLS有効 + ポリシー無し」= 誰も読み書きできない状態になるため、
--   ブラウザ側のanonキーからは一切触れない。
--   Edge Function が service_role キーで動くときだけ RLS を迂回して読み書きできる。

-- 利用回数。actor_key は「ログイン済み: user:<uuid>」「未ログイン: ip:<ハッシュ>」。
-- IPアドレスそのものは保存せず、ハッシュ化した文字列だけを持つ。
create table if not exists public.ai_usage (
  actor_key  text    not null,
  day        date    not null,
  used_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (actor_key, day)
);

create index if not exists ai_usage_day_idx on public.ai_usage (day);

-- 検索結果のキャッシュ。同じ検索文なら Gemini を呼ばずにここから返す。
create table if not exists public.ai_search_cache (
  query_key  text primary key,
  result     jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ai_usage        enable row level security;
alter table public.ai_search_cache enable row level security;

-- 回数を「確認して1つ増やす」までを1回のSQLで行う関数。
-- 確認と加算を別々にやると、同時に叩かれたときに上限をすり抜けられるため、
-- ここでまとめて行い、行ロック（for update）で二重加算を防ぐ。
create or replace function public.ai_usage_bump(
  p_actor_key    text,
  p_limit        integer,
  p_global_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day    date := (now() at time zone 'utc')::date;
  v_used   integer;
  v_global integer;
begin
  -- 古い記録は残しておく意味がないので、ついでに掃除する
  delete from public.ai_usage where day < v_day - 7;
  delete from public.ai_search_cache where created_at < now() - interval '30 days';

  -- 全体の1日上限（万一の暴走から無料枠を守る最終ライン）
  select coalesce(sum(used_count), 0) into v_global
    from public.ai_usage where day = v_day;

  if v_global >= p_global_limit then
    return jsonb_build_object('allowed', false, 'reason', 'global_limit');
  end if;

  insert into public.ai_usage (actor_key, day, used_count)
  values (p_actor_key, v_day, 0)
  on conflict (actor_key, day) do nothing;

  select used_count into v_used
    from public.ai_usage
   where actor_key = p_actor_key and day = v_day
   for update;

  if v_used >= p_limit then
    return jsonb_build_object('allowed', false, 'reason', 'actor_limit',
                              'used', v_used, 'limit', p_limit);
  end if;

  update public.ai_usage
     set used_count = used_count + 1, updated_at = now()
   where actor_key = p_actor_key and day = v_day;

  return jsonb_build_object('allowed', true, 'used', v_used + 1, 'limit', p_limit);
end;
$$;

-- ブラウザ側（anon / authenticated）からは呼べないようにする。
-- 呼んでよいのは Edge Function（service_role）だけ。
revoke all on function public.ai_usage_bump(text, integer, integer) from public;
revoke all on function public.ai_usage_bump(text, integer, integer) from anon;
revoke all on function public.ai_usage_bump(text, integer, integer) from authenticated;
grant execute on function public.ai_usage_bump(text, integer, integer) to service_role;
