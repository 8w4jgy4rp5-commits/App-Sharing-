-- Phase 1: requests / mini_apps テーブルと、閲覧を全員に許可するRLSポリシー
-- 書き込み（INSERT/UPDATE/DELETE）のポリシーはPhase 3でowner_idと一緒に追加する。
-- このマイグレーションではSELECTだけを許可し、書き込みは誰もできない状態にしておく。

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  problem text not null,
  desired_features text not null,
  target_users text,
  current_workaround text,
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.mini_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  url text not null,
  target_users text,
  built_for_request_id uuid references public.requests(id),
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;
alter table public.mini_apps enable row level security;

create policy "Requests are viewable by everyone"
  on public.requests for select
  using (true);

create policy "Mini apps are viewable by everyone"
  on public.mini_apps for select
  using (true);
