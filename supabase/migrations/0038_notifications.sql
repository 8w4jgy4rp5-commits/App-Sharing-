-- お知らせ（Inbox）の土台。
--
-- 解決したい問題: 自分が出したリクエストに対してミニアプリが登録されても、
-- 本人にそれを伝える手段が無く、たまたま見に来たときにしか気づけない。
--
-- 設計メモ:
--   * 通知の「文章」はここに保存しない。CobbleWorksは5言語対応なので、
--     文章を保存すると投稿時の言語で固定されてしまう。
--     代わりに type と関連IDだけを持ち、表示側（notifications.js）が
--     その時の言語で文章を組み立てる。
--   * 配信チャネル（アプリ内 / メール / Web Push）は後から足せるように、
--     このテーブルを唯一の通知の記録場所にしておく。
--     メール通知（Phase 2）も、ここに入った行を読んで送るだけになる。

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- 通知を受け取る人
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 通知の種類。今は 'app_built' だけ。将来 'request_claimed' などを足す
  type text not null,
  -- 関連する行（表示に使う。消えたら通知も消える）
  request_id uuid references public.requests(id) on delete cascade,
  mini_app_id uuid references public.mini_apps(id) on delete cascade,
  -- 通知のきっかけを作った人（アプリを作った人）。退会しても通知は残す
  actor_id uuid references public.profiles(id) on delete set null,
  -- 未読ならnull、既読なら読んだ時刻
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Inboxは「自分宛てを新しい順」でしか読まないので、その形の索引を張る
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- 未読バッジは全ページで毎回数えるため、未読だけの小さい索引を別に持つ
create index if not exists notifications_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- 同じミニアプリで二重に通知しないための保険。
-- （投稿後にリクエストの紐づけを付け外しすると、トリガーが再び走りうる）
create unique index if not exists notifications_unique_app_built_idx
  on public.notifications (user_id, type, mini_app_id)
  where mini_app_id is not null;

alter table public.notifications enable row level security;

-- 通知は本人だけのもの。誰にでも見える requests / mini_apps とは扱いが違う
create policy "Users can read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- 既読にする（read_atを埋める）ため
create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 要らない通知を消せるように
create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- INSERTのポリシーはわざと作らない。
-- 通知を作れるのは下のトリガー（security definer）だけにして、
-- 他人に好きな通知を送りつけられないようにする。


-- ミニアプリがリクエストに紐づいたとき、そのリクエスト主に通知を1件作る
create or replace function public.notify_request_owner_on_app()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  req_owner uuid;
begin
  -- どのリクエストにも紐づいていないアプリは、誰にも知らせようがない
  if new.built_for_request_id is null then
    return new;
  end if;

  -- 編集時は、紐づけ先が実際に変わったときだけ通知する
  -- （名前や説明を直しただけで通知が飛ばないように）
  if TG_OP = 'UPDATE'
     and old.built_for_request_id is not distinct from new.built_for_request_id then
    return new;
  end if;

  select owner_id into req_owner
  from public.requests
  where id = new.built_for_request_id;

  -- リクエスト主がいない（種データ）か、自分のリクエストに自分で作った場合は通知しない
  if req_owner is null or req_owner = new.owner_id then
    return new;
  end if;

  insert into public.notifications (user_id, type, request_id, mini_app_id, actor_id)
  values (req_owner, 'app_built', new.built_for_request_id, new.id, new.owner_id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists mini_apps_notify_request_owner_insert on public.mini_apps;
create trigger mini_apps_notify_request_owner_insert
  after insert on public.mini_apps
  for each row
  execute function public.notify_request_owner_on_app();

drop trigger if exists mini_apps_notify_request_owner_update on public.mini_apps;
create trigger mini_apps_notify_request_owner_update
  after update on public.mini_apps
  for each row
  execute function public.notify_request_owner_on_app();
