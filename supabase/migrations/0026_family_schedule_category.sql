-- Family Schedule: カレンダー表示用に、予定/やることをWork(仕事)/Private(プライベート)に
-- 分類する列を追加する。カレンダーの日付マスの色分け(Work=赤、Private=緑)に使う。
-- 既存の行はデフォルト値'private'が自動的に入る。

alter table public.family_items
  add column if not exists category text not null default 'private'
  check (category in ('work', 'private'));
