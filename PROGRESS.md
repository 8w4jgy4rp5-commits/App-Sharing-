# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 直近の作業 (2026-08-09時点・続き)

- 前回セッションで積み残しだった「水インフラ×AI需要」テーマ10銘柄スクリーニングの続き。今回のセッション(スマホアプリチェッカー環境)ではirbank.net・kabutan.jpへの直接アクセスが実際に可能になったことを確認(前回の`EGRESS_BLOCKED`は解消)。ただしWebFetchツール自体はirbank.netに403で弾かれる(ボット判定)ため、Bashの`curl`(ブラウザUA指定)で回避する方式を採用
- 5組・2社ずつのサブエージェントを並行実行し、10銘柄すべての5期PL・現在PER/PBR・自己資本比率・CF方向性を一次データで取り直した。主な発見:
  - **野村マイクロ・荏原製作所**: 前回の売上高・営業利益が実際の1/10スケールで誤表示されていた(単位誤り)。正しい規模に修正
  - **日阪製作所**: 前回「営業利益」としていた数値列は実は経常利益の系列だった取り違えを修正
  - **栗田工業**: FY26/3に不採算の米国子会社(精密洗浄事業)を譲渡・非継続事業に区分。継続事業ベースに組み替えた結果PERが24.5倍→18.56倍に是正
  - **高砂熱学工業・三機工業**: 一次データでPER/PBRを確定(三機工業は前回「非掲載」だったのが解消)。高砂熱学工業は旧PER18.0倍→13.46倍とTier Aの中で最割安な水準に是正
  - **巴工業**: 公式IR・製品ページを確認した結果、「データセンター冷却塔メーカー」というテーマ株的な説明の裏付けが一切見つからず、事実誤認の疑いが強いと判断。ピックアップの優先順位を最下位グループに変更
  - **メタウォーター**: 2026年にNTTが約2%出資しAIによる点検自動化の実証実験を開始という新情報を確認したが、「AI需要を取り込む」話ではなく「AIで自社運営を効率化する」話のためテーマとの関連は薄いまま
  - **前澤工業(6489→575A)**: 前澤ホールディングスへの統合直後で財務データがirbank上でもまだ未整備であることを確認。統合相手の前澤化成工業も伝統的水インフラ企業でAI関連なし
- アーティファクトを同じURLで更新: https://claude.ai/code/artifact/cdccf78f-8f55-4971-92fc-5ccc554264b8
- 別ブランチ(`claude/business-cycle-value-screening-xfr7ys`)にあった`cycle-value-screen`スキルと前回の作業記録を、fast-forwardマージで本セッションの作業ブランチに取り込み済み

## 直近の作業 (2026-08-09時点)

- 投資リサーチ用の新しいClaude Codeスキル `.claude/skills/cycle-value-screen/` を追加。ユーザーから渡された「景気循環×バリュー株スクリーニング」のタスクルーティング・テンプレート（複数モデルへの振り分け設計）を、このセッションには複数モデルの動的振り分け機能がないため、「機械的な取得(マクロ指標・PER/PBR等の数値・需給・機関投資家動向)は直接WebSearchや軽量サブエージェント」「景気局面判定・最終統合はメインの会話で必ず自分でやる」という形に翻訳して作成（invest-checkスキルと同じ構成）
- **お試し実行1（鉄鋼セクター）**: 日本製鉄・JFE HD・神戸製鋼所で業種レベルのお試しスクリーニングを実施。マクロ指標(CI一致指数・日銀短観)は実際には拡張局面が継続中で、ユーザーの当初の想定「不況局面で仕込む」とは食い違うことが判明したため、その旨を正直に回答した
- **お試し実行2（水インフラ×AI需要テーマ）**: ユーザーの着眼「AI需要に対する水インフラ企業の勃興（まだ市場で相対的に見られていないテーマ）」を受けて10銘柄を分析:
  - 栗田工業(6370)・オルガノ(6368)・野村マイクロ・サイエンス(6254)・荏原製作所(6361)・高砂熱学工業(1969)・三機工業(1961)・巴工業(6309)・日阪製作所(6247 ※ユーザー指定の6404は誤りで正しくは6247)・メタウォーター(9551)・前澤工業(6489 ※2026/5/28上場廃止、前澤ホールディングス575Aへ統合)
  - サブエージェント5件（2社ずつ）で並行して各社の直近5期PL/BS/CFとテーマ関連度を収集
  - dataviz・artifact-designスキルに沿って、個社別5期PL推移チャート・シクリカル度比較(売上高YoY増減レンジ)・PER×PBR散布図を含むHTMLアーティファクトを作成・公開
  - テーマ関連度でTier A(受注・業績で裏付けあり: 高砂熱学工業・三機工業・オルガノ・栗田工業・野村マイクロ・荏原製作所) / Tier B(割安だが裏付け未確認: 巴工業・日阪製作所) / Tier C(AI関連は薄い伝統的水インフラ: メタウォーター・前澤工業)に分類し、優先順位付きでピックアップを提示
  - アーティファクトURL: https://claude.ai/code/artifact/cdccf78f-8f55-4971-92fc-5ccc554264b8
- **判明した制約（重要）**: このクラウド環境ではWebFetchが財務データサイト(irbank.net/kabutan.jp/各社IR等)へのアクセスをすべてブロックしており(`EGRESS_BLOCKED`)、上記の財務データは全てWebSearchのスニペットからの再構成になっている。このため一部年度で欠測、PER/PBR等で情報源間の不一致が発生した(アーティファクト内・本文中に個別に注記済み)
  - ユーザーが対応として、クラウド環境「スマホアプリチェッカー」のNetwork access設定をTrusted→Customに変更し、`irbank.net`/`kabutan.jp`/`minkabu.jp`を許可ドメインに追加・保存済み
  - ただし**変更後も同一セッション内ではまだ`EGRESS_BLOCKED`のまま**だった（`https://irbank.net/6370/per`への疎通テストで確認）。ネットワークポリシーの変更は新しいセッションから反映される見込みだが未確認のまま、ユーザーは新しい会話を開始する流れになった
- **次のセッションでやること**:
  1. まずWebFetchでirbank.net等に直接アクセスできるか確認する（例: `https://irbank.net/6370/per`で疎通テスト）
  2. アクセスできるようになっていたら、上記10銘柄（水インフラ×AI需要テーマ）の5期PL/BS/CFを一次データで取り直し、上記アーティファクトの数値精度を上げる（欠測箇所・情報源不一致箇所の解消）。アーティファクトは同じファイルパスで再公開すれば同一URLのまま更新できる
  3. まだブロックされている場合は、新しいセッションが本当に「スマホアプリチェッカー」環境で起動しているか（別のデフォルト環境になっていないか）をユーザーに確認する

## 直近の作業 (2026-08-06時点・続き4)

- トップページのMini Apps一覧に**20件ごとのページ送り**（Prev/Next、リクエスト一覧と同じUI）を追加。検索語やカテゴリを変えたときだけ1ページ目に戻る（`script.js`: `MINI_APPS_PAGE_SIZE`/`appsPage`/`createAppsPaginationControls`）
- **「Your Apps」をトップページから独立した`profile.html`に移動**し、Xのプロフィールのような見た目（アバター＋自己紹介＋その下にPortfolio＝ミニアプリ一覧）にリニューアル
  - ヘッダーのアバター＋ハンドルをタップすると、その場でモーダルを開く動作から`profile.html`への遷移に変更（`auth.js`の`editProfileBtn`クリックハンドラ）
  - `profile.html`右下の「⋯」ボタンから、既存の設定モーダル（ハンドル・アバター・自己紹介・言語）を開けるようにした
  - 自己紹介文(bio)を新設: `supabase/migrations/0021_profiles_bio.sql`（`profiles.bio`列を追加）を追加。**未実行（ユーザー側でSupabaseのSQL Editorで実行するまでは自己紹介文が保存されない）**。モーダルのUI・保存処理（`auth.js`の`saveProfile`）・表示（`script.js`の`renderProfilePage`）は実装済み
  - 5言語（en/ja/es/zh/hi）に新しい文言を追加（bio関連、profile.html関連、Portfolio見出し）
  - ローカルの静的サーバー＋Claude in Chromeで、ページ送り・プロフィールカード表示（アバターのフォールバック含む）・設定モーダルへの導線を実機確認済み（本番のGoogleログインでの往復は未確認）

## 直近の作業 (2026-08-06時点・続き3)

- 5番目の言語として**ヒンディー語(`hi`)**を追加(`en`→`ja`→`es`→`zh`の次)。`script.js`の`STRINGS`に157キー全て翻訳して追加、`getLang()`に`hi`を有効な値として追加、`index.html`/`requests.html`の言語選択`<select>`に「हिन्दी」を追加。en/ja/es/zh/hi全て157キーで完全一致(漏れ0件)を確認済み。
  - ついでに`auth.js`の`getLanguage()`にあった既存バグを修正: `zh`が有効な値として認識されておらず、言語設定が`zh`のユーザーがプロフィールモーダルを開くと言語`<select>`が実際のページ言語と食い違って「en」表示に戻ってしまっていた。`zh`・`hi`両方を有効な値として認識するよう修正。

## 直近の作業 (2026-08-06時点)

- プラットフォーム多言語化の壁打ち: ミニアプリ(`apps/`配下)は対象外にして、プラットフォームroot(`index.html`/`requests.html`/`script.js`)だけを多言語対応の範囲とする方針に決定。理由: アプリ数が増えても対応言語×アプリ数で作業が加速しないようにするため。
- 4番目の言語として**中国語(簡体字, `zh`)**を追加(`en`→`ja`→`es`の次)。`script.js`の`STRINGS`に157キー全て翻訳して追加、`getLang()`に`zh`を有効な値として追加、`index.html`/`requests.html`の言語選択`<select>`に「中文」を追加。en/ja/es/zh全て157キーで完全一致(漏れ0件)を確認済み。
  - 作業中に、並行して進んでいた別の変更(カテゴリ機能: `appCategoryLabel`等10キー)で`STRINGS`が147→157キーに増えているのを検知し、`zh`にもその10キーを追加して整合を取った。
- 次の言語候補: フランス語/ポルトガル語(ブラジル)など(翻訳データ追加だけで済むLatin文字圏から)。アラビア語等RTL言語は追加のCSS対応(レイアウト反転)が必要なため後回し推奨、という結論あり。
- コミット/プッシュは未実施(ユーザー確認待ち)。

## 直近の作業 (2026-08-06時点・続き)

- 「アプリを開いたときに数が多すぎてどこから見ればいいかわからない」というレビューへの対応として、トップページのMini Apps一覧にカテゴリ絞り込みと検索サジェストを追加
  - `supabase/migrations/0020_mini_app_categories.sql`（新規・**未実行**）: `mini_apps`に`category`列を追加し、7つの固定カテゴリ（productivity/health/finance/learning/travel/lifestyle/tools）に分類。既存34アプリは名前ベースでSQL側に振り分け済み。**ユーザー側でSupabaseのSQL Editorから実行するまでは全アプリがカテゴリ未設定＝フォールバックのlifestyle扱いになる**（これまでのマイグレーションと同じ運用）
  - トップページ`#apps-list-section`にカテゴリチップ（All＋7カテゴリ）を追加。押すとそのカテゴリのアプリだけに絞り込まれる（検索語との併用も可）
  - ミニアプリ投稿フォームに「Category」必須項目を追加（新規投稿・編集どちらも対応）
  - 検索欄に入力するたびに、関連度の高いミニアプリを最大5件だけドロップダウンで提案する機能を追加（Googleのサジェストのようなもの）。名前・説明・対象ユーザー・カテゴリ名を対象に、同義語グループも考慮してスコアリング
    - 実装中に気づいた不具合: 既存の`wordsAreRelated`（タイポ許容のレーベンシュタイン距離）をそのまま使うと、6文字同士で距離2まで許容されるため"travel"と"trader"のような無関係な単語まで一致扱いになってしまった。アプリのサジェストでは`appWordMatches`という別関数を用意し、完全一致・部分一致・同義語グループのみで判定するよう修正（リクエストの「もしかして」提案の方は元のタイポ許容のままで変更なし）
  - ローカルの静的サーバー＋Claude in Chromeで、カテゴリ絞り込み・検索サジェスト・投稿フォームの表示を実機確認済み
  - **未完了（ユーザー側の手作業が必要）**: `0020_mini_app_categories.sql`をSupabaseのSQL Editorで実行するまでは、カテゴリ絞り込みが実質機能しない（全アプリがLife & Hobbiesに集約される）

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
