-- Phase 2: profiles テーブル、新規ユーザー作成時の自動生成トリガー、RLS

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  avatar_url text,
  handle_set boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 新規サインアップ時、仮のhandle（user_xxxxxxxx）でprofiles行を自動生成する。
-- 本人が選んだ正式なhandleは、初回ログイン時のオンボーディングでUPDATEする
-- （handle_setがfalseの間はオンボーディング未完了とみなす）。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, handle, avatar_url)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
