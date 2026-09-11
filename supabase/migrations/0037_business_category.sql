-- 10個目のカテゴリ「Business & Marketing(ビジネス・集客)」を追加する。
--
-- なぜ:
--   0036 で足した work は「職場で使う・チームで使う」アプリの置き場所だった。
--   これとは別に、「自分の商売を伸ばすための道具」という層が出てきている。
--   AI Visibility Check(自分のサイトがAIに推薦されるか診断して宣伝先を並べる)が
--   その最初の1本で、work(社内の仕事)にも tools(単機能の便利道具)にも収まらない。
--   finance は家計・投資の側なので、売上を作る側の受け皿が空いていた。
--
-- やること:
--   1. category の許可リストに 'business' を足す(0036 の CHECK 制約を貼り替える)
--
-- 既存アプリの引っ越しはしない。今 business に当てはまると言い切れるアプリが
-- まだ無く、迷った行を動かすと一覧の見え方が変わるだけで得がないため。
-- 既定値も 'lifestyle' のまま変えない。

alter table public.mini_apps drop constraint if exists mini_apps_category_check;

alter table public.mini_apps add constraint mini_apps_category_check
  check (category in (
    'productivity', 'health', 'finance', 'learning',
    'travel', 'lifestyle', 'social', 'work', 'business', 'tools'
  ));
