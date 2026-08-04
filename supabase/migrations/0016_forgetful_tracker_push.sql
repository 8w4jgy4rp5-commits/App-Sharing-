-- Forgetful Tracker: アプリを閉じていても届く本物のプッシュ通知用テーブル。
-- このミニアプリはログイン不要のため、ユーザーではなく端末ごとのdevice_id
-- (クライアントが生成するランダムUUID)で区別する。
-- device_idは推測不能なUUIDであることを前提にanonロールへ書き込みを許可する。
-- selectポリシーはあえて作らない(vt_finnhub_keysと同様、書き込み専用にして
-- 他人のdevice_idを知らなくても全件走査で読めてしまう事態を防ぐ)。
-- 読み出しはEdge Function側のservice_roleのみが行う(RLSの影響を受けない)。

create table if not exists public.forgetful_tracker_subscriptions (
  device_id uuid primary key,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.forgetful_tracker_subscriptions enable row level security;

create policy "Anon can register a device subscription"
  on public.forgetful_tracker_subscriptions for insert
  to anon
  with check (true);

create policy "Anon can refresh a device subscription"
  on public.forgetful_tracker_subscriptions for update
  to anon
  using (true)
  with check (true);

create policy "Anon can remove a device subscription"
  on public.forgetful_tracker_subscriptions for delete
  to anon
  using (true);

create table if not exists public.forgetful_tracker_reminders (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  item_id text not null,
  title text not null,
  body text not null,
  notify_at timestamptz not null,
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (device_id, item_id)
);

alter table public.forgetful_tracker_reminders enable row level security;

create policy "Anon can register a reminder"
  on public.forgetful_tracker_reminders for insert
  to anon
  with check (true);

create policy "Anon can update a reminder"
  on public.forgetful_tracker_reminders for update
  to anon
  using (true)
  with check (true);

create policy "Anon can remove a reminder"
  on public.forgetful_tracker_reminders for delete
  to anon
  using (true);

-- cronジョブが「時刻の来た未通知reminder」を探すためのインデックス
create index if not exists forgetful_tracker_reminders_due_idx
  on public.forgetful_tracker_reminders (notify_at)
  where not notified;
