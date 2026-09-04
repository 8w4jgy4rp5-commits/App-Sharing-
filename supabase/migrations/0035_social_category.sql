-- 8つ目のカテゴリ「Social & Events(集まり・イベント)」を追加する。
--
-- なぜ:
--   0020 で決めた7カテゴリは、どれも「自分ひとりで使う道具」を前提にしていた。
--   Bring List(持ち寄りの分担をリンクで共有)や Family Schedule のように
--   「人と予定や分担を合わせる」アプリの置き場所がなく、
--   仕方なく lifestyle(暮らし・趣味)に入れていた。
--
-- やること:
--   1. category の許可リストに 'social' を足す(0020 の CHECK 制約を貼り替える)
--   2. すでにある Family Schedule を social に移す
--
-- 既定値は 'lifestyle' のまま変えない。分類に迷った行の受け皿は今までどおり。

alter table public.mini_apps drop constraint if exists mini_apps_category_check;

alter table public.mini_apps add constraint mini_apps_category_check
  check (category in (
    'productivity', 'health', 'finance', 'learning',
    'travel', 'lifestyle', 'social', 'tools'
  ));

-- 既存アプリの引っ越し。名前で拾うので、無ければ何も起きない。
update public.mini_apps set category = 'social' where name = 'Family Schedule';
