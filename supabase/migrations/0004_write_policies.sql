-- Phase 3: 書き込み系RLSポリシー、管理者権限、owner_idの参照先調整

-- 管理者フラグ（tenさん本人だけがtrueになる想定。全ユーザーには見せないサーバー側だけの仕組み）
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- owner_idの参照先をauth.usersからprofilesに変更する。
-- こうすることで、一覧を取得するときに「作者のhandle」をjoinで一緒に取れるようになる
-- （profiles.idは元々auth.users.idと同じ値なので、参照先を変えても実質的な意味は変わらない）。
alter table public.requests drop constraint if exists requests_owner_id_fkey;
alter table public.requests add constraint requests_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete set null;

alter table public.mini_apps drop constraint if exists mini_apps_owner_id_fkey;
alter table public.mini_apps add constraint mini_apps_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete set null;

-- requests: ログインユーザーは自分のowner_idでのみ投稿でき、自分の投稿だけ編集・削除できる
create policy "Users can insert their own requests"
  on public.requests for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own requests"
  on public.requests for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete their own requests"
  on public.requests for delete
  to authenticated
  using (owner_id = auth.uid());

-- mini_apps: 同様
create policy "Users can insert their own mini apps"
  on public.mini_apps for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own mini apps"
  on public.mini_apps for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete their own mini apps"
  on public.mini_apps for delete
  to authenticated
  using (owner_id = auth.uid());

-- 管理者（is_admin=true）は、誰の投稿でも編集・削除できる。
-- 過去に作者名の入力がバラバラだった既存データを、あとから一つのアカウントで管理できるようにするための救済措置。
create policy "Admins can update any request"
  on public.requests for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "Admins can delete any request"
  on public.requests for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "Admins can update any mini app"
  on public.mini_apps for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "Admins can delete any mini app"
  on public.mini_apps for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
