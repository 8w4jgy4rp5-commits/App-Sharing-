-- Phase 6: requests/mini_apps のユーザー入力文章を多言語表示できるように、
-- 日本語・スペイン語の翻訳列を追加する（nullable。未翻訳なら英語にフォールバック表示する）。
-- mini_apps.name（アプリ名）はブランド名として扱い、翻訳列を作らない。

alter table public.requests
  add column if not exists problem_ja text,
  add column if not exists problem_es text,
  add column if not exists desired_features_ja text,
  add column if not exists desired_features_es text,
  add column if not exists target_users_ja text,
  add column if not exists target_users_es text,
  add column if not exists current_workaround_ja text,
  add column if not exists current_workaround_es text;

alter table public.mini_apps
  add column if not exists description_ja text,
  add column if not exists description_es text,
  add column if not exists target_users_ja text,
  add column if not exists target_users_es text;
