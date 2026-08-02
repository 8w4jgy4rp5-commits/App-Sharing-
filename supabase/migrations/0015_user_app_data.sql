-- 個別ミニアプリのデータをクラウド同期するための汎用テーブル。
-- app-sync.js（共通ヘルパー）がこのテーブルを読み書きする。
-- ミニアプリごとに専用テーブルを作らず、app_slug + key で区別する汎用スキーマにしている。

create table if not exists public.user_app_data (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  app_slug text not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, app_slug, key)
);

alter table public.user_app_data enable row level security;

create policy "Users can view their own app data"
  on public.user_app_data for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can insert their own app data"
  on public.user_app_data for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own app data"
  on public.user_app_data for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete their own app data"
  on public.user_app_data for delete
  to authenticated
  using (owner_id = auth.uid());
