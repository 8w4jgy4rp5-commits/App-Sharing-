# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 直近の作業 (2026-08-15時点・続き) — アプリ一覧に専用アイコンを追加

一覧のバッジがアプリ名の頭文字1文字(`name.charAt(0)`)だけで味気ない、という指摘への対応。
`apps/` にある **36アプリ全部**に線画アイコンを描き起こした。

- 新規 **`app-icons.js`**(リポジトリ直下): 「スラッグ → SVG + 色」の対応表 + `window.getAppIcon(url)`
- `script.js` の `createAppAvatar(name, small, url)` に第3引数 `url` を追加。
  登録URL(`.../apps/idea-notebook/`)からスラッグを取り出して表を引き、
  **見つからなければ従来の頭文字にフォールバック**(外部URLの投稿でも壊れない)
- `index.html` / `profile.html` / `requests.html` に `app-icons.js` の読み込みを追加
- `style.css` に `.app-avatar svg`(20px)と `.app-avatar--sm svg`(15px)を追加

**Supabaseのスキーマ変更は不要**にした(`mini_apps` に列を足していない)。
0020や0025のように「SQL未実行だと機能しない」状態を作らないための判断。
プッシュすればそのまま反映される。

色は既存の4色(`app-avatar-c0`〜`c3`)を内容で割り当て:
c0テラコッタ=生活・記録 / c1緑=お金 / c2黄=学習・健康 / c3濃茶=道具。
`company-watchlist-jp`と`-us`のように対になるアプリは**同じ絵で色だけ変える**。

- 旧名で登録が残っている `apps/company-watchlist/` は US版のアイコンにエイリアス済み
- `forgetful-tracker` は `.../forgetful-tracker/index.html` の形で登録されているので、
  末尾が `index.html` でも引けるようにしてある
- テスト追加: `test/app-icons.test.js`(8件)。
  **`apps/` を実際に readdir して、アイコン未登録のアプリが無いかを検査**しているので、
  今後アプリを足したら `app-icons.js` にも足さないとテストが落ちる
- 検証: 全463テスト green。実際の `index.html` をヘッドレスChromeで読み込み、
  `createAppAvatar()` を呼んで34px版・24px版の描画と、外部URLでの頭文字フォールバックを目視確認

## 直近の作業 (2026-08-15時点) — Idea Notebook のスマホ対応

ユーザー報告「アイデアノートブックがスマホに対応していない」への対応。
`apps/idea-notebook/style.css` のみ変更(HTML・JSは無変更)。

実際に375px幅でレンダリングして測ったところ、**はみ出しはしていない**が以下が問題だった:

| 箇所 | 修正前 | 修正後 |
|---|---|---|
| `.idea-title` | 幅147px(3行に折り返す) | 300px(1〜2行) |
| `.status-select` | 高さ30px・文字12px | 44px・16px |
| `.idea-delete` | 26×26px | 44×44px |
| `.note-form textarea` | 文字14px | 16px |

- **iOSでは文字が16px未満のフォーム部品をタップすると画面が自動で拡大される**。
  これが「スマホで使いにくい」の主犯だったので、タップ対象は16px以上に統一
- カード上部は `flex-wrap` でタイトルを1行目に丸ごと置き、ステータス+✕を2行目へ送る方式に変更
- `@media (max-width: 479px)` のブロックを新設(既存の `min-width: 480px` と対になる形)。
  768px幅での実測値が変更前と完全に一致することを確認済み = **デスクトップの見た目は不変**
- 検証: 320/375/414/768px の4幅で iframe に実際に読み込み、各要素のサイズ・フォント・
  はみ出し(`getBoundingClientRect().right > clientWidth`)を測定。はみ出し0件

### 検証環境のメモ(次回のため)

この環境では npm が塞がれていて playwright を入れられないが、
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` は使える。
`--headless --screenshot --window-size` だけだと**レイアウト幅が375pxにならず**、
横に切れただけの偽の「崩れ」が映るので注意。
**幅375pxのiframeに読み込んだページを撮る**のが正しい確認方法。
CSSはプロファイル(`--user-data-dir`)にキャッシュされるので、CSSを直したら
プロファイルを作り直さないと変更が反映されない(1回ハマった)。

## 直近の作業 (2026-08-14時点) — 同期(AppSync)移行が一巡

### 1. 残っていた全アプリを `AppSync.store()` へ移行(commit `ebfe3d5`)

- 移行したアプリ: `flashcards-es` / `forgetful-tracker` / `company-watchlist-jp` / `company-watchlist-us`
- 手順はどれも同じ。お手本は `apps/flashcards-en/script.js`(先頭の `openStore()` フォールバック、
  `getCards()`/`saveCards()`、末尾の async IIFE)。`index.html` に supabase-js →
  supabase-config.js → app-sync.js → script.js の順でタグを追加する
- **同期しないもの**(意図的にlocalStorageのまま): APIキー、`LANG_KEY`(言語設定)、
  `forgetful-tracker` の `DEVICE_ID_KEY`(端末固有の値なので同期させると壊れる)

### 2. アプリ間でlocalStorageキーを共有していた箇所の解消

`company-watchlist-us` のキーは `companyWatchlist` で、**`news-feed` と `stock-checker` が
それを直接読んで**クイックピックを表示していた。US版を移行するとデータの置き場所が変わるため、
2アプリも同じstoreを**読み取り専用**で開く方式に変更(`set()` は呼ばない)。
`window.addEventListener('storage', ...)` は `store.subscribe()` に置き換え済み。

```js
watchlistStore = await openStore('company-watchlist-us', 'companies', {
  default: [], legacyKey: LEGACY_WATCHLIST_KEY   // 'companyWatchlist'
});
```

副産物として、従来「同じブラウザの別タブ」でしか反映されなかったのが
**別端末の変更でも反映される**ようになった。

### 3. app-sync.js で見つけた2つのデータ破壊バグを修正(commit `0f6fcc8`, `4a82563`)

「PCとスマホでウォッチリストの中身が違う」というユーザー報告の調査中に発見。
どちらも**クラウドの正しいデータが消える**バグ。

1. **旧キー移行の時刻が `Date.now()` だった** → 2台目に残っていた古いデータが必ず
   「クラウドより新しい」と判定され、クラウドを上書きしていた。**`0`(最古)に変更**
   - 同時に `makeEnvelope` の `t: t || Date.now()` を `typeof t === 'number'` 判定に修正。
     `0` は falsy なので、これを直さないと上の修正が無効化されていた(ハマりどころ)
2. **`o: null`(持ち主不明)のローカルデータがクラウドに勝っていた** → `isForeign()` は
   「別の**既知の**所有者」しか弾かず、`o === null` は素通りしていた。ログイン済みで保存すると
   必ず `o` が入るので、`o === null` は「未ログイン中に作られたデータ」か「旧キー由来」を意味する。
   **クラウドに行がある限りローカルを破棄**するよう変更(ユーザー判断: クラウド優先、退避はしない)
   - クラウドに行が無ければこの分岐に入らないので、初回移行やログイン前に貯めたデータは
     従来どおりアップロードされる

### 4. 検証済みのこと / 未検証のこと

**検証済み(実機)**:
- `sync-test.html` で `o: null` + 最新時刻のローカルデータを人工的に仕込んで再現テスト。
  ローカルが破棄されクラウドが採用されること、クラウドが無傷であることを確認
- PC側は旧キーからの移行→クラウドへのアップロードが実際に成功している

**追加で検証済み(2026-08-14、本番GitHub Pages・ログイン状態のPCブラウザ)**:
移行した5アプリを実際に操作し、**クラウド行(`user_app_data`)を直接読んで**ローカルと一致するか確認した。
5アプリともコンソールエラー0件。

| アプリ | 確認内容 | 結果 |
|---|---|---|
| `flashcards-es` | カード追加→削除 | クラウド 5→6→5件、`t`も更新。ローカルと完全一致 |
| `company-watchlist-jp` | 会社追加→再読込→削除 | 0→1→0件。再読込後もstoreから正しく描画 |
| `forgetful-tracker` | アイテム追加→削除 | 0→1→0件。`deviceId`が同期されていないことも確認(意図どおり) |
| `news-feed` | ウォッチリストのクイックピック | US版13社すべて表示。読み取り専用storeが機能 |
| `stock-checker` | 同上 | ティッカーのある7銘柄を表示 |

**未検証 / 残っている気になる点**:
- `stock-checker` のクイックピックに **`NON-IPO`** というティッカーが出ている。
  未上場企業のティッカー欄にプレースホルダとして入っている値で、押しても株価は引けない
  (コードの不具合ではなくデータ側の問題)

### 5. データの手当て

ウォッチリストのクラウド行を **13社**(元の12社 + Veolia)に統合済み。
Veolia は名前のみで業種・ティッカー・メモが空なので、アプリ側から編集が必要
(ティッカーが空のうちは `stock-checker` のクイックピックには出ない)。

### 6. 残っている設計上の制約(既知・ユーザー了承済み)

同期は**リストまるごとを新しい方で置き換える**方式(whole-document last-write-wins)。
項目ごとの統合はしないので、2台で同時に別々の編集をすると片方は必ず消える。
今回は「時刻勝ちのままでOK」というユーザー判断。項目単位のマージが必要になったら別途対応。

### 参考: 調査に使った手口

localStorageの中身をアプリを動かさずに覗きたいときは、同じオリジンの**存在しないURL**
(例: `https://8w4jgy4rp5-commits.github.io/App-Sharing-/__inspect_no_such_page__`)を開けば、
アプリのコードを実行せずにlocalStorageだけ読める。ただしGitHubの404ページはCSPで外部通信が
禁止されているので、Supabaseへ問い合わせたいときはトップページ(`/`)を使う
(トップは supabase-config.js を読むが AppSync は使わないので、アプリのstoreに触れない)。

- 公開URL: `https://8w4jgy4rp5-commits.github.io/App-Sharing-/`
- テーブル `user_app_data` の列名は `value`(`data` ではない)

## 直近の作業 (2026-08-10時点・続き3)

- Family Scheduleに「現在のメンバー一覧」+「他のメンバーを外す」機能を追加(ユーザー報告:
  テスト用に入れたアカウントがLeaveボタンを押さないまま残ってしまい、それまでは本人しか
  自分を退出させられず、他の人には外す手段が無かった)。
  - `0028_family_schedule_remove_member.sql`: `family_members`のDELETEポリシーを
    「本人のみ」から「同じ家族グループのメンバーなら誰でも」に変更(アプリ全体の
    「メンバーは誰でも編集・削除できる」方針に合わせる。ユーザーに確認の上で決定)
  - 家族バナーの下に全メンバーをchip表示。自分以外には✕ボタンで削除可能(確認ダイアログあり)
  - ローカルPostgresで、実際に別ユーザーが対象ユーザーを削除→即座に対象ユーザー側から
    グループが見えなくなることまで確認済み。Playwrightで自分のchipには✕が出ないこと、
    削除後に一覧から消えることも確認済み

## 直近の作業 (2026-08-10時点・続き2)

- Family Scheduleのカレンダー、予定がかぶっている日の見せ方を改善(ユーザーからのフィードバック)。
  従来は「セル全体を1色で塗って+Nだけ」だったのを、日付ごとに項目を上下に積んだ色帯(最大3件、
  それ以上は「+N more」)に変更。各帯にはWork/Privateの色に加えて開始〜終了時刻(分かれば)+
  タイトルを短く表示。モーダルを開けば帯に収まりきらない分も含め全件見られる。
  Playwright(4件重複する日を含むモックデータ)でデスクトップ・モバイル双方の見た目を確認済み。

## 直近の作業 (2026-08-10時点・続き)

- Family Scheduleの予定(Schedule)に終了時刻も指定できるように変更(`0027_family_schedule_end_time.sql`、
  `family_items.item_end_time`列を追加)。フォームは「Start time」「End time」の2つに分割し、
  終了時刻が開始時刻以前ならアラートで保存を止める。一覧・カレンダーのモーダルでは
  「14:00–18:00」のように範囲表示。To-do選択時は今まで通り時間欄自体を隠す。
  Playwrightで表示・編集時の値復元・バリデーション・To-do切り替え時の非表示を確認済み。

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

## 直近の作業 (2026-08-10時点・続き)

- 「Company Watchlist」を米国株版・日本株版に分割
  - `apps/company-watchlist` → `apps/company-watchlist-us` にリネーム（`git mv`）。中身は米国株ティッカー検索(Twelve Data)付きのまま、タイトルに🇺🇸/「US」を追加し、財務系アプリ向けの免責文言(disclaimer)を新規追加(platform-rulesのルールに準拠、旧アプリには無かったもの)
  - 新規: `apps/company-watchlist-jp/`(日本株版)
    - 銘柄コード欄は「証券コード」の手入力のみ(自動検索APIは付けない方針。無料・キー不要の日本株検索APIが見つからなかったため)
    - カードの「株価を確認」リンクは外部のYahoo!ファイナンスへ直接リンク(`https://finance.yahoo.co.jp/quote/{コード}.T`)、stock-checkerアプリとは非連携
    - localStorageキーは`company-watchlist-jp:companies:v1`(platform-rules記載の命名規則に準拠。US版は既存ユーザーのデータを壊さないよう`companyWatchlist`のまま維持)
    - バッジ配色を赤系にして米国版(緑)と視覚的に区別
  - `claude.miniapp`・`stock-checker`のintegrations参照を更新。Supabase側の登録URLは`supabase/migrations/0026_rename_company_watchlist_us.sql`に記録(0014と同様)
  - Claude in Chromeでローカルサーバー経由の実地確認: 追加・インライン編集・ステータス切替・Check price遷移までコンソールエラー無しで確認済み

## 直近の作業 (2026-08-11時点)

- Company Watchlist分割の仕上げ。Claude in Chromeで実サイト(devcobbleアカウントでログイン済み)を操作して対応
  - Requests掲示板に「日本株のウォッチリストも作りたい」というリクエストを投稿
  - 「Submit a Mini App」フォームからCompany Watchlist — Japanを掲示板に登録し、上記リクエストに紐付け(Built for request)
  - 旧「Company Watchlist」カードは、SupabaseのSQL Editorではなく**サイト自体のEdit UI**(各カードの「Edit」ボタン、devcobble=is_adminなら誰でも使える)から名前を「Company Watchlist — US」・URLを`apps/company-watchlist-us/`に修正。スキーマ変更を伴わない既存データの修正はこちらの方が簡単(SQL不要)

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

book-show-tracker, book-snap, company-watchlist-jp, company-watchlist-us, daily-summary, daily-todo,
daily-wins, fan-activity-tracker, family-schedule, flashcards-en, flashcards-es,
forgetful-tracker, free-trial-tracker, habit-tracker, idea-notebook,
memory-diary, message-writer, micro-stretch, news-feed, pet-health-log,
place-picks, qr-generator, reading-streak, reference-report-organizer,
restock-planner, route-notes, screen-time-tracker, shift-calendar,
simple-budget, stock-checker, travel-planner, unit-converter, virtual-trader,
virtual-trader-jp, what-to-cook

## 次にやること

**根本課題(2026-08-14時点でコード上は解消)**: プラットフォーム層はSupabaseログインで共有化
されているのに、ミニアプリはlocalStorageのみで端末ごと、という矛盾があった。

1. ✅ 汎用の同期の仕組み(`user_app_data`テーブル + `app-sync.js`)を作成
2. ✅ パイロット(`daily-todo` → `daily-wins`/`habit-tracker`)
3. ✅ 全アプリへ展開完了(2026-08-14)

### 移行状況の内訳(全36アプリ)

- **AppSync移行済み: 28**
- **最初からSupabase直結(移行対象外): 4** — `book-snap`, `family-schedule`,
  `virtual-trader`, `virtual-trader-jp`
- **同期すべきデータを持たない: 3** — `qr-generator`, `unit-converter`, `message-writer`
  (言語設定とAPIキーのみ)
- **対象外: 1** — `fan-activity-tracker`(ビルド済みバンドル + IndexedDB の別構成)

### 残タスク(優先順)

1. ✅ スマホでの実機確認(完了)
2. ✅ 移行した5アプリのブラウザ実機確認(完了。上の表を参照)
3. ✅ Veolia の詳細(業種・ティッカー・メモ)をアプリから入力(完了)
4. (小)未上場企業のティッカー欄に入っている `NON-IPO` の扱い。
   `stock-checker` のクイックピックに出てしまうので、空にするか検討
5. (任意)項目単位のマージ。今は「まるごと置き換え」方式なので、
   2台同時編集で片方が消える。実際に困ってから着手でよい

**同期(AppSync)移行は、ここで一区切り。** 実機確認まで含めて完了した状態。

## 追記ルール

- 新しいセッションを始めたら、まずこのファイルを読んで状況を把握する
- 作業が一区切りついたら「直近の作業」を更新し、必要なら「次にやること」も更新
- 内容が増えすぎたら古い履歴は削って要点だけ残す（git logに詳細は残るため）
