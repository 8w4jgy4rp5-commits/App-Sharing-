-- Phase 4: 「I want this」「星評価」を1人1回に限定する共有テーブル

create table if not exists public.wants (
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table if not exists public.ratings (
  app_id uuid not null references public.mini_apps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (app_id, user_id)
);

alter table public.wants enable row level security;
alter table public.ratings enable row level security;

create policy "Wants are viewable by everyone"
  on public.wants for select
  using (true);

create policy "Users can want a request"
  on public.wants for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove their own want"
  on public.wants for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Users can rate an app"
  on public.ratings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can change their own rating"
  on public.ratings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can remove their own rating"
  on public.ratings for delete
  to authenticated
  using (user_id = auth.uid());
