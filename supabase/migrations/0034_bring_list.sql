-- Bring List: 持ち寄りの分担リストを「リンクを知っている人だけ」で共有するためのテーブル。
--
-- ねらい:
--   飲み会や持ち寄りに来る人全員に Google ログインを求めるのは現実的でないので、
--   ログイン不要(anon ロール)で読み書きできるようにする。
--
-- ここが肝:
--   anon キーはソースに書いてある公開キーなので、`using (true)` で開けると
--   「誰でも全員のリストを一覧できる」状態になり、参加者の名前まで漏れる。
--   そこでリストごとに秘密の合言葉(token)を持たせ、
--   リクエストヘッダ `x-list-token` に一致する行だけ読み書きできるようにする。
--   アプリ側は URL の #k=... で受け取った合言葉をこのヘッダに載せて送る。
--
-- 割り切り:
--   リンクを知っている人は誰でも編集できる(ログインが無いので本人確認ができない)。
--   アプリのUIにもその旨を明記してある。

create table if not exists public.bring_lists (
  id uuid primary key default gen_random_uuid(),
  -- 合言葉。アプリが 32 文字以上のランダム文字列を作って入れる
  token text not null check (length(token) between 20 and 100),
  event text not null default '' check (length(event) <= 70),
  created_at timestamptz not null default now()
);

create table if not exists public.bring_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.bring_lists(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  note text not null default '' check (length(note) <= 80),
  -- 担当者は「名前を打っただけ」の文字列。アカウントではない
  claimed_by text check (claimed_by is null or length(claimed_by) between 1 and 30),
  sort_key bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists bring_list_items_list_id_idx
  on public.bring_list_items (list_id, sort_key);

-- リクエストヘッダから合言葉を取り出す。付いていなければ null。
create or replace function public.bring_list_token()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(current_setting('request.headers', true)::json ->> 'x-list-token', ''),
    ''
  );
$$;

-- 明細行のポリシーから使う。security definer にして、
-- 親テーブル側のポリシーを二重に評価しない(再帰を避ける)。
create or replace function public.bring_list_allowed(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bring_lists l
    where l.id = p_list_id
      and l.token = public.bring_list_token()
  );
$$;

grant execute on function public.bring_list_token() to anon, authenticated;
grant execute on function public.bring_list_allowed(uuid) to anon, authenticated;

grant select, insert, update, delete on public.bring_lists to anon, authenticated;
grant select, insert, update, delete on public.bring_list_items to anon, authenticated;

alter table public.bring_lists enable row level security;
alter table public.bring_list_items enable row level security;

-- 新しいリストは誰でも作れる(作った人が合言葉を決める)。
create policy "Anyone can start a list"
  on public.bring_lists for insert
  to anon, authenticated
  with check (true);

create policy "Read a list with its token"
  on public.bring_lists for select
  to anon, authenticated
  using (token = public.bring_list_token());

create policy "Update a list with its token"
  on public.bring_lists for update
  to anon, authenticated
  using (token = public.bring_list_token())
  with check (token = public.bring_list_token());

create policy "Delete a list with its token"
  on public.bring_lists for delete
  to anon, authenticated
  using (token = public.bring_list_token());

create policy "Read items with the list token"
  on public.bring_list_items for select
  to anon, authenticated
  using (public.bring_list_allowed(list_id));

create policy "Add items with the list token"
  on public.bring_list_items for insert
  to anon, authenticated
  with check (public.bring_list_allowed(list_id));

create policy "Change items with the list token"
  on public.bring_list_items for update
  to anon, authenticated
  using (public.bring_list_allowed(list_id))
  with check (public.bring_list_allowed(list_id));

create policy "Remove items with the list token"
  on public.bring_list_items for delete
  to anon, authenticated
  using (public.bring_list_allowed(list_id));

-- 1リスト60件まで。いたずらで無限に増やされても被害を小さくするため。
create or replace function public.bring_list_item_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.bring_list_items where list_id = new.list_id) >= 60 then
    raise exception 'This list already has 60 things on it.';
  end if;
  return new;
end;
$$;

drop trigger if exists bring_list_item_limit on public.bring_list_items;
create trigger bring_list_item_limit
  before insert on public.bring_list_items
  for each row execute function public.bring_list_item_limit();
