# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 投資リサーチ (2026-08-18)

- シクリカル・バリュー分析(米国トラック運送)+ データセンター起点の水関連の調査を実施。
  結果は **`docs/research/2026-08-18-cyclical-trucking-water.md`** に保存(本ファイルは開発状況用のため分離)。
  - トラック運送: 運賃は上昇(6月スポット +43% YoY)だが**需要ではなく供給収縮主導**の回復。株価は先回り済みで
    Citi が ODFL を Sell に格下げ。出遅れているのは WERN(調整営業利益率3%=谷)/KNX/SNDR/ARCB
  - 水: 「水を持つ層(TPL/PCYO/水道公益)」「水を処理する層(ECL/XYL/VLTO/ERII)」
    「熱を運ぶ層(VRT/Modine/水インフラ各社)」の3層に分けて整理。本命は
    **CoolIT を$4.75Bで買収した Ecolab** と、PER21-22倍まで調整した Xylem
  - 注意点として「液冷=水消費増」は短絡で、価値は水量ではなく水処理サービス側に寄る点を記載
- 「今落ちている業界」と、その中の株価1万円以下の5社を調査 →
  **`docs/research/2026-08-19-falling-sectors-under-10000yen.md`**(USD/JPY 159.63で1万円=約$62.6)
  - 落ちている業界: 半導体/AI関連(SMH -9.5%、1兆ドル消失)、AI電力IPP、消費関連(年初来ワースト)、
    日本の建設、公益、米オフィス不動産
  - 使った指標: **「株価の下落」×「利益の方向」の2x2** で落ち方を4分類
    (①センチメント下落 ②構造的下落 ③過熱の調整 ④個別要因)
  - 5社: 1803清水建設(①・利益+91.8%なのに急落=最有力) / NKEナイキ(②・1年-50%、中国-20%)
    / 3436 SUMCO(③・今日-7%だが1年+178.9%で赤字) / 9064ヤマトHD(④・4期連続赤字)
    / 9509北海道電力(④・ラピダス+DCで120万kW需要だが泊原発は2027年8月以降)
- 日本版シクリカルの調査を追加(`2026-08-18-cyclical-trucking-water.md`の1-B章)。
  「米国トラック運送=供給収縮による回復初期」に相当する日本のセクターは **ゼネコン**。
  職人不足+2024年問題で採算改善・過去最高益なのに高値から-35〜42%、PER9〜12倍、
  アナリスト目標+32〜56%(鹿島1812はStrong Buyで+56.4%)。物流(9075/9076)は構造は米国より強い
  (規制で供給が戻れない)が株価は上がり切っており、鉄鋼・化学・海運はまだ谷、工作機械は回復済み
- 続けてメタトレンド5分野(データセンター/電力/水/メタバース/フィジカルAI)を日米で調査。
  結果は **`docs/research/2026-08-18-metatrend-5-themes-us-japan.md`**。
  - 信憑性ランキング: **1位 電力**(20年PPAという契約書が既にある・物理的に代替不可) > 2位 DC本体 >
    3位 水 > 4位 フィジカルAI(期待が3-5年先行) > **5位 メタバース(実質終了、スマートグラスに形を変えて生存)**
  - バリュー株: 米 **D**(PER19.9倍・Data Center Alley)/FIX/XYL/TER、
    日 **9508 九州電力**(PER6.45倍)・**9503 関西電力**(PBR0.74倍)/1969 高砂熱学/1980 ダイダン/6370 栗田工業
  - 最大リスクはAI capexバブル(capex/売上34%=ITバブル期の2倍、循環取引、GPU減価償却)。
    これが崩れると1〜4位が同時に下げるが、電力だけは既存需要が下支えする、という論理で電力を1位にした

## 直近の作業 (2026-08-10時点)

- プラットフォーム機能: いいねバッジ + Mini Apps一覧の並び替えタブを追加。push・commit済み。
  - 新規テーブル `likes`(`supabase/migrations/0025_likes.sql`・**未実行**)。1ユーザー1アプリ1いいね
    - 番号は当初0023→0024→0025と、リモート側で先に追加された`family_schedule`関連マイグレーションと
      衝突するたびに振り直した。次にマイグレーションを追加する人は`ls supabase/migrations/`で最新番号を確認すること
  - 合計いいね数でバッジ判定: 銅5・銀20・金50(しきい値は仮、ユーザーの希望で後で調整予定)
  - 並び替えタブ New/Trending/Viral/Popular を、ヒーローの下・検索欄の上(main-columnの先頭)に配置
    - Trending = 直近7日のいいね数順、Viral = 元になったリクエストの「欲しい」数順(want数ランキング)、
      Popular = 合計いいね数順。Viralは「want数上位から生まれたアプリのランキング」方式を選択
      (「一定数を超えたら特別枠」案は不採用、後で調整可)
  - ローカル静的サーバーで画面表示・タブ切り替えのコンソールエラー無しを確認済み
  - **未完了(ユーザー側の手作業が必要)**: `0025_likes.sql`をSupabaseのSQL Editorで実行するまで、
    いいねボタンを押しても保存されない(UI自体はエラーなく動く)

## 標準ルール追記: ミニアプリには最初から使い方ガイドを入れる (2026-08-09)

以前ユーザーから「ミニアプリ作成時は最初に使い方ガイドを用意する」という依頼があったが、
実際にはCLAUDE.md/スキルのどこにも記録されておらず反映されていなかった。
`mini-app-builder`(Planning Checklist・Definition of Done)と`ui-guidelines`
(Standard Features Checklist)に、「最初のバージョンから使い方ガイドを入れる」ルールとして
追記済み。今後のミニアプリ作成では最初から使い方ガイド(`<details>`等の簡単なもので可)を入れること。

## 直近の作業 (2026-08-09時点)

- Family Scheduleの本番デプロイ後にユーザーが実機で発見した2つの不具合を修正
  (`supabase/migrations/0024_family_schedule_fix_rls_recursion.sql`):
  1. **無限再帰エラー**: `family_members`のSELECTポリシーが自分自身を参照するサブクエリを
     直接書いていたため、Postgresが無限ループとして検知しエラーになっていた
     (家族データに触れる画面全部が500エラー)。`is_family_member()`という
     SECURITY DEFINER関数に切り出して解消(自己参照型メンバーシップテーブルの定番の回避策)。
  2. **グループ作成が失敗する**: 作成直後、まだ自分がメンバー登録されていない一瞬に
     「今作ったグループを読み返す」処理をしていたため、メンバー限定のSELECTポリシーに
     弾かれていた。`script.js`側でグループIDをクライアント側生成に変え、読み返し処理を廃止して解消。
  - 今回はローカルのPostgres 16で、実際に`authenticated`ロール+RLS有効の状態で
    2ユーザーによる作成→招待コード検索→参加→一覧表示→退会までの一連の問い合わせを
    シミュレートして確認してから修正・プッシュした(前回はCREATE POLICYが構文的に通るかしか
    確認できておらず、実行時にしか起きないこの手のRLSバグを見逃していた反省から)。
- カレンダー機能を追加(ユーザーからの追加リクエスト)
  - `family_items`に`category`列(work/private)を追加(`0026_family_schedule_category.sql`。
    いいね機能側と番号が衝突したため0025→0026に振り直し済み)。
    予定/やること追加フォームにWork/Privateのトグルを追加
  - 一覧の上に月表示のミニカレンダーを追加。表示範囲は今月〜3か月先のみ(前後には移動不可)。
    その日にWork予定があれば赤、Privateのみなら緑、なければ白。マス目内に予定タイトルを
    短く表示(複数件は1件目+件数)。タップすると中央にモーダルが開き、その日の予定/やることを
    一覧と同じカード形式で表示(Edit/Deleteもモーダル内から可能)
  - Family Schedule自体にも「How to use」の使い方ガイド(`<details>`)を追加(上記の新ルール反映)
  - Playwright(モックデータ)で月移動の範囲制限・日付タップ→モーダル表示・色分け・
    モバイル幅を確認済み

## 直近の作業 (2026-08-08時点)

- 新規ミニアプリ「Family Schedule」(`apps/family-schedule/`)を追加。
  リクエスト「自分の予定を家族との間で共有できず、狂うことがある」への対応で、
  家族グループ内で予定(日付・時間)とやること/連絡事項を1つの共有リストとして
  追加・編集・削除できるアプリ(1画面構成、種類はSchedule/To-doのバッジで区別)。
  - ログイン必須(Google)。**localStorageは使わず、複数ユーザー間の本物の共有**が必要なため
    新規テーブル群(`supabase/migrations/0023_family_schedule.sql`・**未実行**):
    `family_groups`(家族グループ+招待コード)、`family_members`(参加者+ニックネーム、
    1ユーザー1グループまでをunique制約で担保)、`family_items`(予定/やること)、
    `family_push_subscriptions`(プッシュ購読)
  - 参加フローは事故防止の2段階方式: 招待コード(8桁ランダム英数字、紛らわしい文字除外)を
    入力しただけでは参加確定させず、`find_family_group_by_code`(security definer関数)で
    グループ名+既存メンバー名を見せてから本人が確定する
  - 本格プッシュ通知: 家族の誰かが新規追加すると、DBトリガー(`notify_family_item_added`,
    pg_net経由)が`family-schedule-push` Edge Function(`supabase/functions/family-schedule-push/`)を
    即時呼び出し、他の全メンバーへWeb Push送信(forgetful-trackerと違いcronではなく追加の瞬間に反応)。
    VAPIDキーはプロジェクト共通Secretなのでforgetful-tracker分を流用でき、追加登録は不要
  - リアルタイム同期(`family_items`をsupabase_realtimeに追加)で、開いている家族の画面にも即反映
  - ローカル静的サーバー+Playwright(Supabaseをモックしたテストハーネスで一時的に検証、
    コミット対象外)で、画面表示・予定/やること切り替え・編集/キャンセル・完了チェック・
    招待コードコピーまで動作確認済み
    - 検証中に発見・修正したCSSバグ: `.form-group`が`display:flex`を指定していたため、
      ブラウザ標準の`[hidden]{display:none}`より詳細度で上回ってしまい、
      予定/やること切り替え時の時間欄が`hidden`にしても実際には隠れない不具合があった。
      `style.css`冒頭に`[hidden]{display:none !important;}`を追加して解消
  - **未完了(ユーザー側の手作業が必要、他アプリと同じ運用)**:
    `0023_family_schedule.sql`をSupabaseのSQL Editorで実行(実行前に`<YOUR_PROJECT_REF>`・
    `<YOUR_SERVICE_ROLE_KEY>`を置換)、`family-schedule-push` Edge Functionのデプロイ。
    これが終わるまでプッシュ通知は届かない(アプリ自体・リアルタイム同期・招待コード参加は
    マイグレーション実行後すぐ使える)
  - Googleログインでの実アカウント往復・実際のプッシュ通知受信は未検証
    (デプロイ後、実アカウントでの確認が必要)

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
daily-wins, fan-activity-tracker, family-schedule, flashcards-en, flashcards-es,
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
