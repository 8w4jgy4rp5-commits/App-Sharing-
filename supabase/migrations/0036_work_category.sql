-- 9つ目のカテゴリ「Work & Team(仕事・チーム)」を追加する。
--
-- なぜ:
--   0020 の7カテゴリも 0035 の social も、「自分の暮らし」を前提にしていた。
--   Work Notes(仕事の学びを溜める)、Work Message Writer(断りづらい連絡の下書き)、
--   Team Shift Board(チーム全員の週シフトを組む)のように
--   「職場で使う・チームで使う」アプリの置き場所がなく、
--   productivity(習慣・タスク管理)に紛れて見つけにくくなっていた。
--
-- やること:
--   1. category の許可リストに 'work' を足す(0035 の CHECK 制約を貼り替える)
--   2. すでにある職場向けアプリを work に移す
--
-- 既定値は 'lifestyle' のまま変えない。分類に迷った行の受け皿は今までどおり。

alter table public.mini_apps drop constraint if exists mini_apps_category_check;

alter table public.mini_apps add constraint mini_apps_category_check
  check (category in (
    'productivity', 'health', 'finance', 'learning',
    'travel', 'lifestyle', 'social', 'work', 'tools'
  ));

-- 既存アプリの引っ越し。名前で拾うので、無ければ何も起きない。
update public.mini_apps set category = 'work'
  where name in ('Work Notes', 'Work Message Writer');
