# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 直近の作業 (2026-08-03時点)

- ログイン共有 vs ミニアプリlocalStorageの矛盾を解消する同期の仕組みを実装（第1弾）
  - `supabase/migrations/0015_user_app_data.sql` — 汎用の`user_app_data(owner_id, app_slug, key, value jsonb)`テーブル + RLS
  - `app-sync.js`（リポジトリ直下、共通ヘルパー） — ログイン済みなら裏でクラウドと同期、未ログインなら何もしない設計
  - パイロットアプリ: `apps/daily-todo/` に組み込み済み（`getTasks`/`saveTasks`は同期のまま、`initSync()`で起動時にクラウド取得+再描画、初回は「アップロードしますか？」確認）
  - 0015のマイグレーションは実行済み。Claude in Chromeで実際のアカウント・実データを使い実地検証も完了
  - **検証中に発見・修正したバグ**: `app-sync.js`で`const AppSync = ...`としていたため、`window.AppSync`の存在チェックが常にfalseになりpush/pullが一度も発火していなかった。`window.AppSync = ...`に修正済み（コミット済み・デプロイ確認済み）
  - push（タスク追加→クラウド反映）・pull（ローカル空の状態でページを開く→クラウドから復元）とも実機で動作確認済み
  - 保留事項: 初回アップロード確認に`window.confirm()`を使用。ブロッキングな点が気になれば画面内バナーへの置き換えを検討（急ぎではない）
- (2026-08-02以前) Book Snap機能追加・不具合修正、リクエスト一覧ページネーション、シードデータtypo修正

## 現在のミニアプリ一覧 (apps/)

book-show-tracker, book-snap, company-watchlist, daily-summary, daily-todo,
daily-wins, fan-activity-tracker, flashcards-en, flashcards-es,
forgetful-tracker, free-trial-tracker, habit-tracker, idea-notebook,
memory-diary, message-writer, micro-stretch, news-feed, pet-health-log,
place-picks, qr-generator, reading-streak, reference-report-organizer,
restock-planner, route-notes, screen-time-tracker, shift-calendar,
simple-budget, stock-checker, unit-converter, virtual-trader,
virtual-trader-jp, what-to-cook

## 次にやること

**根本課題**: プラットフォーム層(リクエスト掲示板・アプリ一覧)はSupabaseログインで共有化されているが、
個々のミニアプリ(Daily Wins, Habit Trackerなど)は今もlocalStorageのみで端末ごと。
「ログインしているのにアプリのデータは同期されない」という矛盾がある。

**方向性**（段階的に進める。一気に全アプリ移行はしない）:
1. ✅ 汎用の同期の仕組み（`user_app_data`テーブル + `app-sync.js`）を作成済み
2. ✅ パイロット完了: `daily-todo`で実装・マイグレーション適用・実機検証まで完了
   - 次にやること: もう1〜2個（候補: Daily Wins, Habit Tracker）に展開
3. 問題なければ他のアプリにも順次展開

理由: 今(アプリ約30個)のうちに直す方が、100個に増えてから直すよりコストが低い。
ただし複数端末での実需要はまだ検証されていないため、一気に全部やる理由はない。

## 追記ルール

- 新しいセッションを始めたら、まずこのファイルを読んで状況を把握する
- 作業が一区切りついたら「直近の作業」を更新し、必要なら「次にやること」も更新
- 内容が増えすぎたら古い履歴は削って要点だけ残す（git logに詳細は残るため）
