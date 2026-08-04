# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 直近の作業 (2026-08-05時点)

- Forgetful Trackerの「プッシュ通知が実際に届かない」調査・修正の続き（実機検証ベース）。以下、発見した順の不具合と対応:
  1. **cron設定SQLの値に山カッコが残っていた**: ユーザーがプレースホルダー`<YOUR_PROJECT_REF>`等を置換した際、山カッコごと値に含めてしまい`https://<xyumhzecqhpzzzzylbwn>.supabase.co/...`という無効なURLになっていた。cronは「成功」と表示されるが実際はEdge Functionに一度も届いていなかった（`net._http_response`にログ0件で発覚）。ユーザーがSQL Editorで山カッコを外して再登録し解消。
  2. **Service Workerがcache-first方式だったため、新しいデプロイが端末に反映されない**: `sw.js`のバージョン番号を上げるだけでは、ブラウザ側の更新チェックのタイミングに完全依存してしまい、PC・iPhoneどちらでも「新しい内容が反映されない」現象が発生。`apps/forgetful-tracker/sw.js`を**network-first**（オンラインなら毎回サーバーへ、オフラインの時だけキャッシュにフォールバック、`fetch`に`{cache:'no-cache'}`指定）に変更し、`script.js`に新SW有効化時の自動リロード処理を追加（コミット済み: cache v7）。
  3. **本丸: RLSの設定漏れでreminders/subscriptionsへの保存(upsert)が常に403で失敗していた**: `INSERT ... ON CONFLICT DO UPDATE`はconflict対象の既存行を確認するため内部的にSELECT可視性を必要とするが、0016マイグレーションでは意図的に(vt_finnhub_keysに倣い書き込み専用にする狙いで)SELECTポリシーを作っていなかった。このため「持ち物を追加」してもクラウド側には**何も保存されていなかった**（UI上はローカル保存が成功するので気づきにくい）。`0018_forgetful_tracker_reminders_select_policy.sql`でanonへのSELECTポリシーを追加し、curlでの再現テストで403→201に直ったことを確認済み。
- **これでreminder登録・push購読登録(subscriptions)ともDBに実際に保存されることは実機で確認できた**が、それでもなお**実機でプッシュ通知自体は届いていない**（notified: trueにはなる＝Edge Functionは動いている）。
- **未解決・次のセッションでの調査ポイント**:
  - Edge Function (`forgetful-tracker-push`) のLogsタブを、実際にreminderが`notified: true`になった時刻帯で確認し、`webpush.sendNotification()`が成功しているか、何かエラーを吐いていないかを見る（ここがまだ未確認）
  - 疑わしい箇所: `supabase/functions/forgetful-tracker-push/index.ts`で`import webpush from "npm:web-push@3.6.7"`としているが、Supabase Edge Functions(Deno)上で`web-push`パッケージ(Node想定・内部でNode cryptoを使用)が正常に動作しているか未検証。Denoのnpm互換レイヤーでの既知の相性問題の可能性がある
  - 対応候補: Edge Function内で`webpush.sendNotification`の戻り値/エラーをreminderテーブルなどに書き戻す(現状はconsole.errorのみでユーザーからは見えない)、またはDeno向けのWeb Push実装に切り替える

## 直近の作業 (2026-08-04時点・続き2)

- 個人投資の「朝チェック」を壁打ちしながら、Claude Codeのスキルとして構築
  - `.claude/skills/invest-check/` — オンデマンドで呼び出す投資家向け朝チェック
    - `apps/company-watchlist` のExportボタンで出力したJSON(Downloadsフォルダの`company-watchlist-backup*.json`)を、localStorageへの橋渡しとして読む
    - マクロ指標(USD/JPY・NASDAQ・S&P500・ダウ・CNN Fear & GreedIndex)はメインセッションから直接WebSearch(トークン節約のためサブエージェントを使わない設計に変更済み)
    - 個別銘柄の競合比較・最新ニュース・見通しはサブエージェントに委譲。非上場企業(Figure AI, OpenAI, Anthropic, Whop, Nscaleなど)はデフォルトで対象外に変更(トークン消費が大きい割に日次の新規材料が少ないため)。個別に知りたい時は都度リクエストする運用
  - `apps/company-watchlist` にティッカー自動検索機能を追加(Twelve Data の`symbol_search`エンドポイント、APIキー不要・CORS許可あり)。追加フォームと既存カードのインライン編集の両方に対応
  - 検証: Claude in Chrome経由で実際のウォッチリスト(GitHub Pages公開版、実データ)を操作し、ティッカー修正・銘柄追加・削除まで実地確認済み
- **完全自動化(Supabase Edge Function + pg_cron + Gemini/Groqなど無料LLM API)を検討したが、いったん保留**
  - 課題1: company-watchlistのデータは今もlocalStorageのみ。無人のcronジョブにはブラウザもDownloadsフォルダも無いため、自動化には watchlist を Supabase 側(`user_app_data`等)に移す前提が必要
  - 課題2: Gemini/Groqの無料枠にはWeb検索機能が無く、「直近1週間で何が起きたか」という朝チェックの価値の核であるニュースの鮮度を無料では再現しづらい
  - 結論: 今は無理に自動化せず、`invest-check`スキルを都度手動で呼び出す運用を継続(数字取得も考察もそのままClaude内で完結させる)

## 直近の作業 (2026-08-04時点・続き)

- 新規ミニアプリ「Travel Planner」(`apps/travel-planner/`)を追加
  - 旅行ごと・日ごとに日付/場所/予定メモ/移動手段/費用/宿泊先/関連リンクを記録できるアプリ
  - Googleログイン必須・localStorage不使用。既存の`user_app_data`テーブル+`app-sync.js`をそのまま利用(新規マイグレーションなし、キーは`trips`で旅行配列をまるごと保存)
  - デザインはテラコッタ系トークンから離れ、青系+コンパス/パスポートスタンプ風の独自デザイン(virtual-traderと同じ方針)
  - 費用の自動合計(旅行全体+日ごと)、前日の宿泊先コピー機能、リンクURLのhttp/https検証を実装
  - ブラウザ確認で「費用欄を変更した直後に別の欄をクリックすると入力が消える」不具合を発見・修正済み(該当フィールドはDOM全体再描画ではなく差分更新に変更)
  - **未検証**: 実際のGoogleログイン→クラウド保存の往復(ローカル環境ではOAuthリダイレクトの都合でテスト不可。デプロイ後に実アカウントでの確認が必要)

## 直近の作業 (2026-08-04時点)

- Forgetful Trackerの通知を「アプリを開いている間だけのタイマー方式」から本物のWeb Pushに置き換え(リクエスト掲示板のコメント「他のアプリを使っている時に通知が来ない」への対応)
  - 追加: `supabase/migrations/0016_forgetful_tracker_push.sql`(reminders/subscriptionsテーブル、ログイン不要でdevice_id単位のRLS)
  - 追加: `supabase/migrations/0017_forgetful_tracker_push_cron.sql`(1分おきにEdge Functionを叩くpg_cron設定、project ref/service role keyは要置換)
  - 追加: `supabase/functions/forgetful-tracker-push/index.ts`(期限が来たreminderにweb-pushで送信)
  - 変更: `apps/forgetful-tracker/sw.js`(push/notificationclickイベント処理を追加)
  - 変更: `apps/forgetful-tracker/script.js`(deviceId生成、プッシュ購読、Supabaseへのreminder同期。foregroundタイマーはUI表示用のreconcileのみに縮小)
  - 変更: `apps/forgetful-tracker/index.html`(supabase-js読み込み追加)
  - **未完了(ユーザー側の手作業が必要)**: VAPID秘密鍵をEdge Functionのsecretに登録、マイグレーション実行、Edge Functionデプロイ、cron設定SQLの実行。これが終わるまでプッシュは実際には届かない

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
simple-budget, stock-checker, travel-planner, unit-converter, virtual-trader,
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
