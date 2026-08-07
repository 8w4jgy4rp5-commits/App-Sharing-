-- プロフィールページ用: profilesテーブルに自己紹介文(bio)の列を追加

alter table public.profiles add column if not exists bio text;
