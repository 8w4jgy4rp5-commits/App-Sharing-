-- Phase: ミニアプリを7つの固定カテゴリで分類できるようにする
-- 目的: トップページのMini Apps一覧が増えすぎて、初めて来た人がどこから見ればいいか
-- わからないという声への対応。カテゴリで絞り込めるようにする。

alter table public.mini_apps add column if not exists category text;

-- 既存アプリを名前ベースで振り分ける（新規投稿分は今後appForm側でcategoryを必須指定する）
update public.mini_apps set category = 'finance' where name in (
  'Company Watchlist', 'Stock Price Checker', 'Fan-Activity-Tracker', 'Restock Planner',
  'Simple-Budget', 'Company News Feed', 'Free Trial Tracker', 'Virtual Trader', 'Virtual Trader JP'
);

update public.mini_apps set category = 'productivity' where name in (
  'Daily to Do', 'Forgetful Tracker', 'Shift Calendar', 'Habit Tracker', 'Daily Wins'
);

update public.mini_apps set category = 'health' where name in (
  'Micro-Stretch', 'Pet Health Log', 'Screen Time Tracker'
);

update public.mini_apps set category = 'learning' where name in (
  'Reference-Report-Organizer', 'Spanish-Flashcards', 'English-Flashcard', 'Read Streak'
);

update public.mini_apps set category = 'travel' where name in (
  'Route Notes', 'Place Picks', 'Travel Planner'
);

update public.mini_apps set category = 'lifestyle' where name in (
  'Daily-Summary', 'Book & Show Tracker', 'Idea Notebook', 'What to Cook',
  'Memory Diary', 'Book Snap', 'Song Catcher'
);

update public.mini_apps set category = 'tools' where name in (
  'QR Creator', 'Message Writer', 'Unit-Converter'
);

-- 上のどれにも当てはまらなかった行（今後新しく手動でSupabaseに入った行など）は lifestyle にしておく
update public.mini_apps set category = 'lifestyle' where category is null;

alter table public.mini_apps alter column category set default 'lifestyle';

alter table public.mini_apps add constraint mini_apps_category_check
  check (category in ('productivity', 'health', 'finance', 'learning', 'travel', 'lifestyle', 'tools'));

alter table public.mini_apps alter column category set not null;
