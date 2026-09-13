-- お知らせのメール配信（Phase 2）の土台。
--
-- 解決したい問題: 0038で作ったInboxは「サイトに来た人」にしか届かない。
-- リクエストを出した人の多くは、アプリが出来たあとサイトに戻ってこない。
--
-- 設計メモ:
--   * 通知そのもの（誰に・何が起きたか）は notifications テーブルが唯一の記録場所。
--     ここでは「その1行をメールでも送ったか」を emailed_at で覚えるだけにする。
--     Web Pushを足すときも、同じ形で pushed_at を足せばよい。
--   * メールアドレスは auth.users.email に既にある（Googleログインで取得済み）ので、
--     リクエスト側に別途メール欄を作る必要はない。
--   * 文章の言語は profiles.locale を見る。今まで言語は端末のlocalStorageにしか
--     無く、サーバー側からは分からなかったため、ここで保存先を用意する。

-- 「このお知らせをメールで送った時刻」。nullなら未送信
alter table public.notifications
  add column if not exists emailed_at timestamptz;

-- 送信対象を探すクエリ専用の索引。未送信は常にごく少数なので部分索引にする
create index if not exists notifications_unemailed_idx
  on public.notifications (created_at)
  where emailed_at is null;

-- この機能を入れる前から溜まっていたお知らせは、送信済み扱いにする。
-- そうしないと、cronを動かした瞬間に過去分がまとめて飛んでしまう
update public.notifications
  set emailed_at = now()
  where emailed_at is null;

-- メールで知らせてよいか。既定はオン（オフにしてもInboxには残る）
alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

-- メール本文の言語。nullなら英語で送る
alter table public.profiles
  add column if not exists locale text;

-- 想定外の値が入るとメール文面の組み立てが壊れるので、対応5言語だけに絞る
alter table public.profiles
  drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check
  check (locale is null or locale in ('en', 'ja', 'es', 'zh', 'hi'));
