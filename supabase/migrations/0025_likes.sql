-- いいねバッジ機能: アプリへの「いいね」を1人1回に限定する共有テーブル（wantsと同じパターン）

create table if not exists public.likes (
  app_id uuid not null references public.mini_apps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (app_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

create policy "Users can like an app"
  on public.likes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove their own like"
  on public.likes for delete
  to authenticated
  using (user_id = auth.uid());
