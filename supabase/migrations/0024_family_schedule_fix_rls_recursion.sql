-- Family Schedule: 「infinite recursion detected in policy for relation
-- "family_members"」を修正する。
--
-- 原因: 0023で作った"Members can view fellow members of their group"ポリシーが、
-- family_members自身を参照するサブクエリをUSING句に直接書いていた。
-- family_membersに対する問い合わせが起きるたびに、このポリシーの評価の中で
-- またfamily_membersへの問い合わせが発生し、そのポリシー評価がまた…と
-- 無限に再帰してしまい、Postgresがエラーで止めていた
-- (family_groups/family_itemsなど、family_membersを参照している他のテーブルの
-- ポリシーも、間接的にこの再帰を踏んでいた)。
--
-- 対処: 「このグループのメンバーかどうか」の判定を、SECURITY DEFINER関数
-- (is_family_member)に切り出す。SECURITY DEFINER関数はテーブル所有者の権限で
-- 実行されるため、関数の中でfamily_membersを読むときにRLSポリシー自体は
-- 再評価されず、再帰が止まる(Supabaseで「チームメンバー」的な自己参照テーブルに
-- RLSを書くときの定番の回避策)。

create or replace function public.is_family_member(check_group_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.group_id = check_group_id and fm.user_id = check_user_id
  );
$$;

grant execute on function public.is_family_member(uuid, uuid) to authenticated;

drop policy if exists "Members can view fellow members of their group" on public.family_members;
create policy "Members can view fellow members of their group"
  on public.family_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_family_member(group_id, auth.uid())
  );

drop policy if exists "Members can view their family group" on public.family_groups;
create policy "Members can view their family group"
  on public.family_groups for select
  to authenticated
  using (public.is_family_member(id, auth.uid()));

drop policy if exists "Members can view their group's items" on public.family_items;
create policy "Members can view their group's items"
  on public.family_items for select
  to authenticated
  using (public.is_family_member(group_id, auth.uid()));

drop policy if exists "Members can add items to their group" on public.family_items;
create policy "Members can add items to their group"
  on public.family_items for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_family_member(group_id, auth.uid())
  );

drop policy if exists "Members can edit their group's items" on public.family_items;
create policy "Members can edit their group's items"
  on public.family_items for update
  to authenticated
  using (public.is_family_member(group_id, auth.uid()))
  with check (public.is_family_member(group_id, auth.uid()));

drop policy if exists "Members can delete their group's items" on public.family_items;
create policy "Members can delete their group's items"
  on public.family_items for delete
  to authenticated
  using (public.is_family_member(group_id, auth.uid()));
