-- Matching（リクエストのスワイプ画面）用:
-- 「今このリクエストのミニアプリを作っている」という宣言を、みんなで共有するテーブル。
-- likes / wants と同じく「1人1件まで」の形にしてある。

create table if not exists public.request_claims (
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

alter table public.request_claims enable row level security;

create policy "Claims are viewable by everyone"
  on public.request_claims for select
  using (true);

create policy "Users can claim a request"
  on public.request_claims for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can drop their own claim"
  on public.request_claims for delete
  to authenticated
  using (user_id = auth.uid());
