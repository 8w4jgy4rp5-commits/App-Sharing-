-- ミニアプリへのコメントを、これまでのlocalStorage(ブラウザごと)からSupabaseに移す。
-- 目的: アプリの持ち主が、実際にコメントを書いた相手に届く形で返信できるようにするため
-- (localStorageのままだと投稿者のブラウザにしか残らず、返信しても本人に絶対届かなかった)。
--
-- 通常のコメントは今まで通りログイン不要・匿名OK(author_nameは自由記述、user_idはNULL可)。
-- 返信(reply_to_idを指定する投稿)だけは、そのアプリのowner_idと一致するログイン中ユーザーのみ許可する。

create table if not exists public.app_comments (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.mini_apps(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text,
  text text not null,
  reply_to_id uuid references public.app_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.app_comments for select
  using (true);

create policy "Anyone can post a comment; only the app owner can reply"
  on public.app_comments for insert
  to anon, authenticated
  with check (
    (
      reply_to_id is null
      and (user_id is null or user_id = auth.uid())
    )
    or (
      reply_to_id is not null
      and user_id = auth.uid()
      and exists (
        select 1 from public.mini_apps m
        where m.id = app_comments.app_id and m.owner_id = auth.uid()
      )
    )
  );

create policy "Users can delete their own comment"
  on public.app_comments for delete
  to authenticated
  using (user_id = auth.uid());

-- 管理者は誰のコメントでも削除できる(requests/mini_appsと同じ方針)
create policy "Admins can delete any comment"
  on public.app_comments for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create index if not exists app_comments_app_id_idx on public.app_comments (app_id);
