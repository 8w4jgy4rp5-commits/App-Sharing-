-- Family Schedule: 家族グループで予定・やることを共有するための新規テーブル群。
-- 招待コード(合言葉)を知っている人だけが参加できるが、コード入力だけでは
-- 参加を確定させず、グループ名・既存メンバー名を見せてから参加する2段階の
-- 仕組みにしている(コードの偶然の一致や打ち間違いで別の家族に紛れ込む事故を防ぐため)。

create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.family_groups enable row level security;

create policy "Members can view their family group"
  on public.family_groups for select
  to authenticated
  using (
    exists (
      select 1 from public.family_members fm
      where fm.group_id = family_groups.id and fm.user_id = auth.uid()
    )
  );

create policy "Any signed-in user can create a family group"
  on public.family_groups for insert
  to authenticated
  with check (created_by = auth.uid());

create table if not exists public.family_members (
  group_id uuid not null references public.family_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  nickname text not null,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id),
  unique (user_id) -- MVPでは1人につき家族グループは1つまで
);

alter table public.family_members enable row level security;

create policy "Members can view fellow members of their group"
  on public.family_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.family_members fm2
      where fm2.group_id = family_members.group_id and fm2.user_id = auth.uid()
    )
  );

create policy "Users can join a group as themselves"
  on public.family_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own nickname"
  on public.family_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can leave a group"
  on public.family_members for delete
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.family_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  item_type text not null check (item_type in ('event', 'todo')),
  title text not null,
  memo text,
  item_date date,
  item_time text,
  assignee_nickname text,
  done boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_by_nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_items enable row level security;

create policy "Members can view their group's items"
  on public.family_items for select
  to authenticated
  using (
    exists (
      select 1 from public.family_members fm
      where fm.group_id = family_items.group_id and fm.user_id = auth.uid()
    )
  );

create policy "Members can add items to their group"
  on public.family_items for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.family_members fm
      where fm.group_id = family_items.group_id and fm.user_id = auth.uid()
    )
  );

create policy "Members can edit their group's items"
  on public.family_items for update
  to authenticated
  using (
    exists (
      select 1 from public.family_members fm
      where fm.group_id = family_items.group_id and fm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.group_id = family_items.group_id and fm.user_id = auth.uid()
    )
  );

create policy "Members can delete their group's items"
  on public.family_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.family_members fm
      where fm.group_id = family_items.group_id and fm.user_id = auth.uid()
    )
  );

create index if not exists family_items_group_date_idx
  on public.family_items (group_id, item_date);

-- リアルタイム更新用(家族の誰かが画面を開いている間、追加/編集/削除が即反映されるように)
alter publication supabase_realtime add table public.family_items;

-- 招待コードから家族名・既存メンバーのニックネームだけを見せるための関数。
-- family_groups/family_membersのselectポリシーはメンバー限定のままにしつつ、
-- 「参加する前に、本当にこの家族かどうか確認する」プレビュー用途だけ、
-- この関数(security definer = RLSを迂回)経由で許可する。
create or replace function public.find_family_group_by_code(code text)
returns table (id uuid, name text, member_nicknames text[])
language sql
security definer
set search_path = public
as $$
  select g.id, g.name,
    coalesce(
      array_agg(m.nickname order by m.joined_at) filter (where m.nickname is not null),
      '{}'
    )
  from public.family_groups g
  left join public.family_members m on m.group_id = g.id
  where g.invite_code = code
  group by g.id, g.name
  limit 1;
$$;

grant execute on function public.find_family_group_by_code(text) to authenticated;

-- プッシュ通知の購読情報。1ユーザーにつき家族グループは1つまでのMVPなので、
-- user_idを主キーにしている(forgetful-trackerのdevice_id単位とは違い、
-- こちらはログイン必須のためユーザー単位で管理する)。
create table if not exists public.family_push_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  group_id uuid not null references public.family_groups(id) on delete cascade,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.family_push_subscriptions enable row level security;

create policy "Users can manage their own push subscription"
  on public.family_push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 新しい予定/やることが追加された瞬間に、family-schedule-push Edge Functionを
-- 呼び出して他のメンバーにプッシュ通知を送る。forgetful-trackerのcron方式(1分おきに
-- 「時刻の来たreminder」を探しに行く)と違い、こちらは「追加された瞬間」に反応させたい
-- ので、DBトリガー+pg_netで直接呼び出す方式にしている。
--
-- 実行前に、以下の2箇所を実際の値に置き換えてから実行してください:
--   <YOUR_PROJECT_REF>        : SupabaseプロジェクトURLの一部 (xyumhzecqhpzzzzylbwn)
--   <YOUR_SERVICE_ROLE_KEY>   : Project Settings > API > service_role key
-- (VAPIDキーはプロジェクト共通のSecretなので、forgetful-tracker-push用に登録済みなら
--  family-schedule-push用に別途登録し直す必要はありません)

create extension if not exists pg_net;

create or replace function public.notify_family_item_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/family-schedule-push',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'group_id', new.group_id,
      'item_type', new.item_type,
      'title', new.title,
      'item_date', new.item_date,
      'created_by', new.created_by,
      'created_by_nickname', new.created_by_nickname
    )
  );
  return new;
end;
$$;

create trigger family_items_notify_on_insert
  after insert on public.family_items
  for each row
  execute function public.notify_family_item_added();
