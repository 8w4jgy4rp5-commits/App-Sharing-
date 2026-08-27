-- リクエストに対する「こういう機能はどう？」というアイデアコメント。
-- 目的: ミニアプリが作られる**前**に、作る人と欲しい人が仕様をすり合わせられるようにするため。
-- (app_comments は「完成したアプリへの感想」なので、作る前の提案を置く場所が無かった)
--
-- app_comments とほぼ同じ形だが、宛先が mini_apps ではなく requests。
-- 違いは1点だけ: 匿名投稿を許さず、ログイン必須にしている。
-- 誰の提案かが分かった方が、リクエストを出した人が反応しやすいため。

create table if not exists public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.request_comments enable row level security;

create policy "Request comments are viewable by everyone"
  on public.request_comments for select
  using (true);

create policy "Signed-in users can post an idea"
  on public.request_comments for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own idea"
  on public.request_comments for delete
  to authenticated
  using (user_id = auth.uid());

-- 管理者は誰の投稿でも削除できる(requests / mini_apps / app_comments と同じ方針)
create policy "Admins can delete any idea"
  on public.request_comments for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create index if not exists request_comments_request_id_idx on public.request_comments (request_id);
