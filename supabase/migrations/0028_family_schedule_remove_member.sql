-- Family Schedule: 他のメンバーを外せるようにする。
-- 従来は自分自身の行しか削除できなかった(退出のみ)ため、本人がLeaveボタンを
-- 押さずにいなくなった場合、他のメンバーには外す手段がなかった。
-- アプリ全体の「メンバーなら誰でも編集・削除できる」方針に合わせ、
-- 同じ家族グループのメンバーなら誰でも他のメンバーを外せるようにする。

drop policy if exists "Users can leave a group" on public.family_members;

create policy "Members can remove themselves or a fellow member"
  on public.family_members for delete
  to authenticated
  using (public.is_family_member(group_id, auth.uid()));
