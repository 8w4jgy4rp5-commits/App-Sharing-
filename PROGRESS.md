# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 直近の作業 (2026-09-01時点・続き) — ヒーローのピルを削除(PC・スマホ共通)

ユーザー指摘「一番上がごちゃごちゃなのは同じ枠を使っているから。free forever などは
"こんな機能もありますよ" ということなので、ボタンと同じにしない方がいい」への対応。

### 原因

`.lp-pills li` が `border-radius: pill` + `border: 1px solid var(--map-accent-line)` +
`background: var(--map-accent-tint)` で、**すぐ上の `.lp-btn--sec`(See what people asked for)と
まったく同じ形・同じ枠線の色**だった。スマホでは丸い枠が縦に5個並び、
**どれが押せるボタンでどれがただの説明なのか区別が付かない**状態だった。

### 判断: 見た目を変えるのではなく、ピルごと削除した

枠なし1行・点つき・緑の✓リストの3案を実際に描画して見比べたうえで、ユーザーが削除を選択。
**3つとも別の場所に同じ内容が残るので、情報は失われない。**

| 消したピル | 残っている場所 |
|---|---|
| Free forever | 見出し下の本文「tiny **free** web apps」/ FAQ「Is it actually free?」 |
| Works offline | すぐ下の `.lp-band`「✓ Keeps working offline」 |
| Open source | すぐ下の `.lp-band`「✓ Every line of source is public」 |

- `index.html` の `<ul class="lp-pills">` と `style.css` の `.lp-pills` / `.lp-pills li` を削除
- ボタンと注釈の間隔はマージンの相殺で16pxになり、詰まらない
- 結果: ヒーローの丸い枠が5個→2個(本物のボタンだけ)。
  スマホでは「41 mini apps on the shelf」の帯が1画面目に入るようになった
- 一覧に着くまで 5.3画面 → 5.2画面 / PCは 4.1画面のまま。横スクロールなし・JSエラーなし・463件green

**緑の✓リスト案(案C)を避けた理由**: すぐ下の `.lp-band` が既に緑の✓リストなので、
✓が2回続いて逆にくどくなる。

## 直近の作業 (2026-09-01時点) — スマホのLPが長すぎ・ごちゃごちゃなのを整理

ユーザー報告「携帯版が詰め込みすぎでごちゃごちゃ」への対応。**スマホ幅(639px以下)だけ**変更し、
PCの見た目は完全に据え置き(1280pxで全要素の位置・サイズが変更前と一致することを実測で確認済み)。

### 測って分かった原因(390px幅)

| | 変更前 |
|---|---|
| アプリ一覧(`#board`)に着くまで | **縦7.1画面** |
| ページ全体 | 縦10画面 |
| LPのブロック | 8個・1個あたり550〜890px = ほぼ1画面に1ブロック |

1. **同じ話が何度も出る**。特にGoogleログインの説明はページ内に**5か所**あった
   (ヒーローの注釈 / How it worksのlead / 機能カード / FAQ / Two ways inの注釈)
2. PCで横3列のカードが、スマホでは全部縦に積まれる(棚6枚で862px = 1画面ぶん)
3. **右の`THE BOARD`の帯が本文に重なっていた**(実測: 帯 x=353〜382px / カード右端 370px)

### やったこと(`@media (max-width: 639px)` を新設)

隠したものは**すべて別の場所に同じ内容があるもの**だけ。新しい情報は消していない。

| 対象 | 変更 | 理由 |
|---|---|---|
| ヒーローの見本カード(`.lp-demo`) | 隠す | 下の「On the shelf」で本物のアプリが見られる |
| `.lp-quotes` | 3つ→1つ | 「Open right now」に実際のリクエストが出る |
| `.lp-feats` | 4枚→2枚 | 後ろ2枚(データの置き場所・アカウント)はFAQに同じ答えがある |
| `.lp-shelf` | 6つ→4つ | 「Browse all」ボタンで全部見られる |
| Googleログインの説明 | 5か所→2か所 | `.lp-lead--signin` と `.lp-final .lp-fine` を隠す |
| FAQ | 折りたたみ | 下記 |
| 右の目印 | 縦帯→丸い↓ボタン | 重なりの解消 |

- **FAQを`<dl>`から`<details>`に変えた**。HTMLでは`open`を付けてあるので、
  **JSが動かなくてもPCと同じ全開状態**になる。`initLpFaq()`がスマホ幅のときだけ`open`を外す。
  `matchMedia`の`change`を見ているので、画面回転で幅の境目をまたいだときだけ入れ直す
- 標準の三角マーカーは消し、スマホでは右端に`+` / `−`を出す。
  閉じているときは答えのborder-bottomが消えるので、区切り線をsummary側に付け替えている
- 右の目印は`bottom: 106px`(下タブバー92pxの上)の46px丸ボタンに。
  縦書きの文字は読み上げ用に残して画面からだけ消した(`clip-path`)。
  `.lp-rail--gone`のtransformも上書きしないと消えなくなるので直してある

### 結果と検証

- **一覧に着くまで 7.1画面 → 5.3画面**(全体10画面 → 8.2画面)
- 帯の重なり解消(丸ボタンは下タブバーの上・bottom 738px < タブバー上端 752px)
- 390px / 1280px どちらも横スクロールなし、コンソールエラー0件
- **PC 1280pxは変更前と完全一致**(`<details>`の箱4個が増えただけで、既存要素は全て同じ座標)
- `node test/run.js` 463件green

### 残っている課題

- 提案時に「4.3画面まで縮む」と伝えたが、実際は**5.3画面**。見積もりに案B側の項目
  (3ステップの説明文とセクションのleadを全部消す)が混ざっていた
- 一番長いブロックは「How it works」(823px)と「Two ways in」(648px)。
  これ以上縮めるなら、どちらかのブロックを丸ごと削る判断が要る
- LPの文言は英語のみのまま(`data-i18n`が入っていない)。多言語化は未着手

## 直近の作業 (2026-08-31時点) — AI検索の見た目を直した

**原因**: `style.css` の `@media (max-width: 860px)` に閉じ括弧 `}` が無く、AI検索のCSSが
まるごとそのメディアクエリの中に入ってしまっていた。つまり **PCではAI検索のCSSが1行も効いていなかった**。
括弧を閉じたうえで、見た目を作り直した。

- AI検索バーをカード化（きらめきマーク＋見出し＋説明＋塗りつぶしボタン）。他のカードと同じ見た目に統一
- 結果は1件ずつカードにし、**アプリ一覧と同じ色付きアイコンタイル**（`createAppAvatar`）を表示
- 各結果に「これかも？」「こちらも？」バッジを追加（1件目だけ濃い色）。en/ja/es/zh/hi の5言語対応
- 追加した翻訳キー: `aiSearchTitle` / `aiMaybeThis` / `aiMaybeThisToo`

## 直近の作業 (2026-08-31時点) — LPを本番公開した(master にマージ済み)

モックを実装に落として、**`index.html` の上半分をランディングにした**。下にスクロールすると
今までの実画面(検索・投稿フォーム・一覧)がそのまま出る。**master にマージ済み＝本番反映済み。**

### 置き場所の判断

案A(index.html に足す)を採用。ただし**既存のヒーローは残さず差し替えた**。
古いヒーローの Request/Build/Shelf は、LPの「3ステップ」とまったく同じ話なので、
両方置くと同じ説明が2回出てしまうため。マスコットと「See how it works」ボタンは
新しい3ステップの中に移した。

### 動的にしたところ(3か所)

**どれも「読み込み前・失敗時はHTMLに書いてある内容が残る」作りにしてある。**
初見の人に 0 を見せないため。

| 場所 | 実データ | 取れなかったとき |
|---|---|---|
| 棚のアプリ6つ | `cachedApps` をいいね順→新着順。アイコンは `app-icons.js` | HTMLの6つがそのまま出る |
| アプリ数 | `cachedApps.length` | 41のまま(0のときは書き換えない) |
| まだ作られていないリクエスト3件 | アプリが作られておらず、claim も付いていないもの。実投稿を見本データより先に出す | **セクションごと隠す** |

セキュリティは既存の作法に合わせた。アプリ名・リクエスト本文は**ユーザー投稿なので textContent**
(innerHTML は使わない)、URLは `isSafeUrl()` を通すので `javascript:` のアプリは棚に出ない。
実際に `<script>` や `<img onerror>` を混ぜたデータで、要素が作られないことを確認済み。

### 画面右の目印

「下に実画面がある」と分かるように、右端に縦書きの `THE BOARD ↓` を固定表示。
押すと実画面まで飛ぶ。実画面が画面の半分より上に来たら消える。
スマホでは下タブバーと重ならない位置(縦中央)に出るのを確認済み。

### ついでに直した: 使い方ガイドが勝手に開く問題

初回訪問だと `if (!hasSeenGuide()) openGuide();` でモーダルが自動的に開いていた。
トップが小さいヒーローだった頃は成立していたが、**LPが説明そのものになった今は、
初見の人がLPを読む前にモーダルで覆われてしまう**。自動オープンだけやめた。
ボタンからは今までどおり開ける。読まれなくなった `hasSeenGuide` /
`markGuideSeen` / `GUIDE_SEEN_KEY` は削除。

### 確認したこと

ローカル(`python -m http.server`)＋Chromiumで実際に開いて確認:

- 初回訪問でガイドが開かない
- 横スクロールが出ない(PC 1280px / スマホ 390px)
- 目印が下タブバーに重ならない
- コンソールエラー0件

### 残っている課題

- **LPの文言は英語のみ**。サイトは5言語対応だが、LP部分に `data-i18n` を入れていないので、
  日本語などに切り替えている人にはここだけ英語で出る。次にやるならここ
- ヒーロー右のPacking Listの見本と、困りごとの3つの引用は**固定文言**(実データではない)

## 直近の作業 (2026-08-30時点) — LPモック第3稿 + X投稿用スクショ

第2稿から、**アイコンを本物に統一**して、**注釈なしのLP単体ページ**を別に作った。

- 注釈つき(設計記録): https://claude.ai/code/artifact/34d32971-6af7-4bb1-bc6e-5c94d7fc2b97
- **注釈なし(共有・スクショ用)**: https://claude.ai/code/artifact/79e3b9a8-9c50-4657-b526-0bf3b6dba324

### ロゴを本物に差し替えた

第2稿までロゴを「C」の四角バッジで自作してしまっていた。本物は `index.html` の
`.logo-mark` にあるインラインSVGで、**2×2の角丸四角(右上と左下は opacity 0.85)を
テラコッタの丸バッジに白抜き**。これに統一した。

3ステップの横には、本番のヒーローと同じ `mascot.png` を置いた。
ミニアプリのアイコンは第2稿の時点で `app-icons.js` の実データを使っている。

### 注釈なしのLP単体ページを新設

X用に画像を切り出したいので、解説の列が入らない版が必要だった。
`mascot.png` は data URI で埋め込んである(Artifactは外部画像を読めないため)。

### スクショの撮り方(次回も同じ手順で撮れる)

このリモート環境には Chromium と Playwright が入っている。ただし
**playwright はグローバル導入なので、作業フォルダに node_modules のシンボリックリンクが要る**:

```
ln -sfn /opt/node22/lib/node_modules/playwright      node_modules/playwright
ln -sfn /opt/node22/lib/node_modules/playwright-core node_modules/playwright-core
```

撮ったもの:

| ファイル | 用途 | サイズ |
|---|---|---|
| `lp-x-hero.png` | X投稿用。ヘッダー〜信頼バンドで切る | 3200×1582 (2倍) |
| `lp-full.png` | 全体 | 1280px幅 (等倍) |
| `lp-mobile.png` | スマホ幅 | 430px幅 (等倍) |

**注意**: チャットへのファイル添付は1MB前後で 400 エラーになる。
全体図は2倍で撮ると1.1MBを超えて弾かれたので、**等倍で撮り直した**。
X向けのヒーローだけは2倍のままでも通った。

### 未決(据え置き)

LPをどこに置くか。**案A**: `index.html` をLP化し一覧は `apps.html` へ /
**案B**: `lp.html` を新設して `index.html` は触らない。

## 直近の作業 (2026-08-30時点) — LPモック第2稿

第1稿(調査どおりに11セクション並べたもの)に、以下4点を反映して作り直した。
モック: https://claude.ai/code/artifact/34d32971-6af7-4bb1-bc6e-5c94d7fc2b97

### 1. Googleログインの扱いを正しく書いた

第1稿は「No sign-up / 0 accounts required」と書いてしまっていたが、**実装と違う**。
`auth.js` / `script.js` を確認したところ、正しくは:

- **ログイン不要**: ミニアプリを開く・使う、リクエストや一覧を見る
- **Googleログイン必須**: リクエスト投稿 / アプリ投稿 / 星評価 / コメント / アイデア投稿 /
  制作宣言(claim) / 投票 / プロフィール

**匿名だと悪用されうる**ため必須にしている、という理由をLP本文にも書いた。
機能グリッドの1枚を「Real accounts behind every post」にして、
制約ではなく**荒れないための仕組み**として出している。

### 2. ゼロになる数字を全部消した

「0 accounts required」「¥0」、まだ付いていない星評価、アイデア件数バッジを削除。
**初見の人にゼロを見せると逆に信用されない**ため。
本当の数字である **41アプリ**だけ残し、信頼バンドはチェック印の事実
(Nothing to install / Keeps working offline / Every line of source is public)に置き換えた。

### 3. ミニアプリ一覧にアイコンを入れた

文字だけの一覧をやめ、`app-icons.js` の**実物のSVG**とタイル色(c0〜c3)をそのまま使用。
掲載は Restock Planner / Shopping List / Habit Tracker / Packing List / Reading Streak /
QR Generator の6つ。

### 4. 参考LPのニュアンスを反映

ユーザーから3枚(LeapRank / BatchEdits / Signed Reviews)の提示あり。
**明るいオレンジ系(1・2枚目)寄り**で、CobbleWorksのテラコッタ＋クリームはそのまま維持。
真似たのは色ではなく作り方:

- 見出しを**セリフ体(Fraunces想定)**にし、**後半の一文だけアクセント色**
- 点付きの小見出し(`● SMALL PROBLEMS, SMALL APPS`)
- 2ボタン＋その下の**小さなピル**(Free forever / Works offline / Open source)
- 3ステップに 01/02/03 の番号
- 最後のCTAだけ淡いテラコッタの帯

実装するなら Google Fonts の読み込みが1本増える(本文の Nunito はそのまま)。

### 未決(第1稿から持ち越し)

LPをどこに置くか。**案A**: `index.html` をLP化し一覧は `apps.html` へ /
**案B**: `lp.html` を新設して `index.html` は触らない。

## 直近の作業 (2026-08-29時点) — LP制作の下調べ(他LP50件の共通点)

CobbleWorksのLPを作る前段として、他の人が作っているLPを50件調べ、`docs/lp-research.md` に保存。
レポートページ: https://claude.ai/code/artifact/de353b95-0b1d-4bc1-a525-7fffbf1ee17f

- **注意**: claude.ai/code の実行環境からは**外部サイトをブラウザで開けない**
  (GitHub以外がネットワークポリシーで遮断)。そのため 20件はGitHub上の公開ソースを
  直読みしてセクション並びを採取、30件は公開teardown記事経由。確度の違いは文書内に明記した
- 共通骨格11段(ヘッダー → ヒーロー → 信頼バンド → 課題/解決 → 機能グリッド → 使い方3ステップ
  → 実物の見せ場 → 声 → FAQ → 最後のCTA → フッター)
- CobbleWorksへの当てはめ: 最大の武器は「登録不要でその場で触れる」。
  既存ヒーローの Request → Build → Shelf はそのまま「使い方3ステップ」として使える。
  声が無いので、証言の代わりに実リクエスト・スクショ・星評価・リポジトリを証拠に置く
- **未決**: LPを `index.html` に作るか、`lp.html` を新設するか
## 直近の作業 (2026-08-31時点) — Gemini APIによるAI検索の土台

競合分析で「検索が不便」という課題が出たため、検索にAIを入れた。

### 分かっていた原因（AI以前の問題）

- `renderApps()` の絞り込みは「文字がそのまま含まれるか」だけ（意味を見ていない）
- `toSearchWords()` が `a-z0-9` 以外を全部区切り文字として捨てるため、
  日本語で検索すると単語が0個になり、サジェストが必ず0件になっていた
- アプリ名・説明は英語ルールなので、日本語話者は英語で打たないと辿り着けなかった

### 入れたもの

**AIの土台（今後のAI機能はすべてこの上に乗せる）**

- `supabase/migrations/0033_ai_usage.sql` — 利用回数 `ai_usage` と結果キャッシュ
  `ai_search_cache`。どちらもRLSポリシーを作らない = ブラウザからは触れない。
  回数の確認と加算は `ai_usage_bump()` で一括（同時アクセスで上限をすり抜けないため）
- `supabase/functions/gemini-ai/index.ts` — Gemini中継。キーもプロンプトもここだけに置く。
  未ログイン1日3回 / ログイン済み1日20回 / 全体1日500回。同じ検索文はキャッシュから返す
  （回数を消費しない）。未ログインの識別はIPのハッシュ（IP自体は保存しない）
- `ai.js` — フロント共通の呼び出し係。`AI.searchApps(query)` で使う

**AI検索（1つ目の機能）**

- `index.html` の検索欄の下に「🤖 AIに探してもらう」ボタンと結果パネル
- Geminiにはアプリ一覧を**番号付き**で渡し、返事も番号でもらう。
  存在しないアプリをでっち上げられても番号の範囲外として捨てられる。
  画面に出す名前とURLは必ずDBの値を使う
- 0件のときは「リクエストとして投稿する」へ誘導
- 文言は5言語（en/ja/es/zh/hi）ぶん追加

**キーワード検索の修正（AIなし・追加コストなし）**

- `toSearchWords()` が日本語・中国語・韓国語を2文字ずつ（bigram）に切り出すように変更。
  「持ち物」→「持ち」「ち物」。漢字1文字の検索も `appWordMatches()` で拾う
- `renderApps()` は完全一致で0件のとき、単語ベースの関連度で拾い直すようにした

### 残っていること

**Supabase側の設定がまだ。`docs/gemini-setup.md` の手順1〜5を実行しないと動かない。**
特に手順3-b（Edge Functionの「Verify JWT」をOFFにする）を飛ばすと、
未ログインの人が401になる。

## 直近の作業 (2026-08-29時点) — 新アプリ `packing-list` / `shopping-list` を追加

### `apps/shopping-list/`(41個目) — 買うものリスト

`packing-list` と同じ作りの買い物版。売り場別(野菜・肉・乳製品・パン・常温・冷凍・
飲みもの・日用品・その他)に並べて、カゴに入れたらチェック。

- 進捗バー「X of Y in the basket」
- 「Remove bought」= 買ったものだけリストから削除(チェック済みが1つ以上あるときだけ表示)。
  買えなかったものは残るので、次の買い物にそのまま使える
- 空のときは「Add everyday basics」で定番13項目を投入
- 保存は `AppSync`(slug `shopping-list` / key `items`、レガシー `shoppingList:items:v1`)
- アクセントはグリーン(#2E9E54)、タイトル下線はレシートを切り取ったギザギザ

### `apps/packing-list/`(40個目) — 旅行の持ち物リスト

CobbleWorksのリクエスト「旅行に何を持っていくか毎回忘れる / シンプルな持ち物チェックリストが
ほしい」への回答として `apps/packing-list/` を新規作成(40個目のアプリ)。

- カテゴリ別(書類・お金・電子機器・衣類・洗面用具・健康・その他)のチェックリスト
- 進捗バー「X of Y packed」、全部詰め終わると緑になる
- データが空のときは、スーツケースのイラスト +「Add starter essentials」で定番16項目を一括投入
- 帰宅後は「Uncheck all」で同じリストを次の旅行にそのまま再利用できる
- 保存は `AppSync`(slug `packing-list` / key `items`、レガシーキー `packingList:items:v1`)
- en / ja / es 対応、Webフォントなし(システムフォント)、アプリ内に「How to use」あり
- `app-icons.js` にスーツケースのアイコンを追加し、`tools/seo.js` を実行してメタ情報を同期

既存の `travel-planner` は旅程(日程・宿・移動・費用)側なので、持ち物側はこちらで分担。

## 以前の作業 (2026-08-28時点) — アクセス解析を全ミニアプリにも入れた

「自分のアプリに何人来たか知りたい」という話から。Search Consoleは**検索経由の数字しか出ない**
(直リンクやSNS経由は映らない)ので、アクセス解析が別途必要、という整理をした上での対応。

### 分かったこと

**Cloudflare Web Analyticsは、すでに導入済みだった。** ただし
`index.html` / `requests.html` / `profile.html` / `matching.html` の**4ページだけ**で、
**39個のミニアプリには1つも入っていなかった**。つまり「アプリが何回開かれたか」という
一番知りたい部分がまるごと計測漏れになっていた。

### 対応: `tools/seo.js` がタグを管理するようにした

- `CLOUDFLARE_ANALYTICS_TOKEN` 定数(現在 `cb00dbf3...`)を1か所に置き、
  **39アプリ + プラットフォーム4ページ + `apps.html` = 44ページ**に配る
- **空文字にすると全ページから消える**(やめたくなったらトークンを消して再実行するだけ)
- 手でコピペされていたCloudflare純正のタグ(`<!-- Cloudflare Web Analytics -->`)は
  **スクリプトが引き取って置き換える**。同じビーコンが2本読み込まれないようにするため
- 44ページすべてでビーコンがちょうど1個ずつ、を自動チェック済み

トークンは公開前提の値(ページのソースに出る)なので、リポジトリに置いて問題ない。
Cookieを使わない方式なので同意バナーも不要。

### ついでに直した: 初回挿入だけ字下げがずれる

生成ブロックを**新しく挿入するとき**だけ字下げが2文字多くなり、次の実行で戻る、という
往復が起きていた(既存ファイルは既に落ち着いていたので気づきにくかった)。
挿入時も閉じタグ前の空白ごと置き換えるよう修正。
**新規アプリを作って試し、1回目と2回目の出力が完全に一致することを確認済み。**

### 注意点

- JavaScriptで計測する方式なので、広告ブロッカーを使っている人は数に入らない(実際より少なく出る)
- ミニアプリから外部への通信が1本増える。オフラインでは単に読み込みに失敗するだけで、
  アプリの動作には影響しない(コンソールエラー0件を確認済み)

### 見るときの心構え(壁打ちでの結論)

いま追うべきは MAU でも MRR でもなく「**人が来たか**」「**アプリを開いたか**」の2つだけ。
CobbleWorksには課金の仕組みが無いのでMRRはそもそも存在しない。
0が並ぶ時期が続くので、**週1回だけ見る**くらいの距離感にする。

## 直近の作業 (2026-08-27時点) — リクエストへの「アイデア」コメントを追加

アプリが作られる**前**に「こういう機能はどう？」と提案できる欄を、Requests と Matching の
2か所に追加した。`app_comments`（完成したアプリへの感想）とは別テーブルで、宛先がリクエスト。

- `supabase/migrations/0032_request_comments.sql`（**要SQL実行**）
  - `request_comments` テーブル。読むのは誰でも／**投稿はログイン必須**
    （誰の提案か分かった方が、リクエストの投稿者が反応しやすいため）
  - 自分の投稿は自分で削除でき、管理者は誰のでも削除できる
- `script.js`
  - 5言語ぶんの文言、`loadRequestComments()`、`createIdeasPanel()` / `createIdeasSection()`
  - Requests: カード下部に折りたたみの「💡 Ideas (n)」
  - Matching: スワイプカードに 💡 ボタンを置き、中身は `#ideasModal` で開く
    （カード上に入力欄を置くと、左右スワイプの指の動きとぶつかるため）
- `matching.html`: `#ideasModal` を追加
- `style.css`: `.ideas-*` / `.idea-*` / `.swipe-ideas-btn` / `.swipe-card-actions`

### あわせて修正: スマホで本文が下タブバーに重なる不具合

スクロールすると、本文（カードや見出し）が画面下の固定タブバーの**上**に描かれてしまい、
タブバーが読めなくなっていた。

原因は重なり順。下タブバーは`<header>`の中にあるが、`body > header`と`body > main`は
どちらも`z-index: 1`で、値が同じときは**後ろに書かれている`main`が上**に描かれる。
`.site-nav`側の`z-index: 40`はheaderが作る重なりの箱の中だけの話なので効かなかった。
→ スマホ幅のときだけ`body > header { z-index: 40 }`にして解決。
モーダル（`.modal-scrim`は`z-index: 50`でbody直下）は、引き続きタブバーより前に出る。

**マイグレーション未実行でも壊れない**ようにしてある（テーブルが無ければアイデア0件扱い）。
ローカル(`python -m http.server`)で Requests / Matching 両方の表示を確認済み。
実際の投稿・削除の動作確認は、SQL実行後にログインした状態で行う必要がある。

## 直近の作業 (2026-08-26時点) — Matching（リクエストのスワイプ掲示板）を新設

「どのリクエストを作ればいいか探すのが面倒。Tinderみたいに1枚ずつ出てきて
`Not now` / `Making now` で決められたら面白い」という要望から、
ナビの **Mini Apps タブを Matching に置き換え**た（一覧はホームの検索・`apps.html` から行けるので重複していた）。

- **`matching.html`（新規）**: リクエストが1枚ずつカードで出る画面。ヘッダー/ログイン周りは
  requests.html と同じ部品。ページ見出しだけ3色のアンダーラインを付けている
- **操作**: カードを横にドラッグ（Pointer Events。指・マウス共通）／`Not now`・`Making now`ボタン／
  `←` `→` キー／`↩`で直前の1枚を戻す。ドラッグ量に応じて左右のスタンプが濃くなる
- **`Not now`** は端末ローカル（`cobbleworks:matching:skipped:v1`）。「もう一度配る」で全部戻せる
- **`Making now`** は**みんなに見える宣言**。新規テーブル `request_claims`
  （`supabase/migrations/0031_request_claims.sql`・**未実行**）に1人1件で入り、
  リクエスト一覧のカードに `🔨 2人が制作中` の札が出る。押した直後に
  「AI用の指示文をコピー」「完成したアプリを登録する」への導線モーダルが開く
- **山札の並び順** (`matchingScore`): まだアプリが無いものを最優先 → 欲しい人が多い順 →
  誰も手を付けていないもの → サンプルより実投稿。同点は毎回わずかにシャッフル
- 文言は en / ja / es / zh / hi の5言語すべてに追加済み
- `tools/seo.js` のナビテンプレートと sitemap 生成にも matching.html を反映（apps.html は生成物）

### 検証

ローカルサーバ＋Chromeで、カードの表示・ドラッグ追従・スタンプの濃さ・しきい値未満で元に戻る挙動・
`Not now`／`←`／`↩`・未ログインで`Making now`を押したときのトースト・
残り枚数カウンタを実際に確認した。`request_claims`未作成でもエラーを握りつぶして
「宣言ゼロ」として動くことも確認済み（実行後に🔨の札が出る）。

### 未完了（ユーザー側の手作業が必要）

`supabase/migrations/0031_request_claims.sql` をSupabaseのSQL Editorで実行するまで、
`Making now` は押しても宣言が保存されない（カードは進み、コピー用モーダルは出る）。

## 過去の作業 (2026-08-25時点) — 全ページ共通ナビと「使い方ガイド」を追加

初見のユーザーが「どこを押せばリクエストに行けるか分からない」「使い方が文字だけで伝わらない」
という2点の指摘から、プラットフォーム側(index/requests/profile/apps)をまとめて改修。

- **共通ナビ `.site-nav`**: Home / Requests / Mini Apps（＋スマホのみ You）。PCはヘッダー内の
  大きめタブ、640px未満は**画面下に固定するタブバー**に切り替わる(`body`に`padding-bottom:92px`)。
  今いるページは `aria-current="page"` でアクセント色に塗る。以前の小さい `.back-link` は廃止。
  apps.html はJavaScript無しなので、`tools/seo.js` のテンプレート側に静的に埋め込んでいる
- **使い方ガイド**: ヒーロー3枚カードの下に「See how it works」ボタン。押すと画面に重なる
  モーダルで3枚のスライド（① 投稿 or 検索 → ② 誰かが作る → ③ 使って♡で保存）。
  ①②の絵は**ヒーローの既存アニメーション部品をそのまま流用**、③だけスマホ＋♡/★の新規パーツ
- 初回訪問時だけ自動で開く（`localStorage` の `cobbleworks:guideSeen:v1`）。以後はボタンから
- キーボード対応（Esc＝閉じる / ←→＝スライド送り）、背景クリックで閉じる、
  `prefers-reduced-motion` では全アニメーション停止
- 文言は en / ja / es / zh / hi の5言語すべてに追加済み

### 検証

ローカルサーバ＋Chromeで、index / requests / apps の3ページのナビ表示と現在地ハイライト、
ガイドの初回自動表示・2回目以降の抑止・3枚の送り戻し・キーボード操作を実際に確認した。
スマホ幅の下部タブバーはCSSのみで、実機での見え方は未確認。

## 過去の作業 (2026-08-24時点) — Investment Report(企業の投資用レポート)を新規追加

「企業の投資用レポートを作りたい。まず基本情報を調べて記入し、そのうえで個別のメモを打ち込んでいく」
という要望から `apps/investment-report/` を新規作成。

- **1社＝1レポート**。カードの中が上下2段：上が固定の**基本情報**(事業内容 / 主要な数字 /
  注目している理由 / 証券コード・市場・業種・URL・情報の基準日)、下が**あとから積み上げる日付つきメモ**。
  work-notes の「テーマごとに書き足す」形を、company-watchlist の企業カードに載せた作り
- メモには **Strength / Risk / Event / Idea** の4タグ。色分けして、材料がどちらに傾いているか
  一目で分かるようにした。最新1件だけ開き、それ以前は `<details>` で畳む(work-notes と同じ)
- ステータス: Watching → Candidate → Holding → Passed をバッジのクリックで巡回
- **Copy report**: 基本情報＋全メモをプレーンテキストで書き出してクリップボードへ。
  `navigator.clipboard` が使えない場合は execCommand にフォールバック
- 検索(社名・コード・業種) / ステータスで絞り込み / 書き出し・読み込み / 使い方ガイド /
  クラウド同期(`openStore('investment-report', 'reports')`、新規アプリなので `legacyKey` 無し)
- UIは en / ja / es の3言語。免責文(投資助言ではない)をヘッダ直下に固定表示
- `app-icons.js` に `investment-report`(c1 緑=お金) を登録。`tools/seo.js` の
  `DESCRIPTION_OVERRIDES` にも追加した(サブタイトルが155字を超えて「…」で切れていたため)

意図的に入れなかったもの: 株価・チャートの自動取得(APIキーが要るので stock-checker に任せる)、
財務データの自動取り込み、複数人での共有。

### 検証

ヘッドレスChromeで35項目を実操作で確認済み(空状態 → 作成 → バリデーション(社名必須・
`javascript:` URLを弾く) → メモ追加 → 2件目で折りたたみ → ステータス巡回 → 検索 → 絞り込み →
リロード後も保持 → Copy report の中身 → 編集(重複しない) → メモ削除 → レポート削除 →
社名に `<img onerror>` を入れても要素が生えない → ja表示 → 390px幅で横スクロール無し)。
`node test/run.js` 463件green、`node tools/seo.js` 実行済み(39アプリ / sitemap 42URL)。

**クラウド同期の実機確認だけ未了**: この作業環境からはSupabaseのCDNに出られない(既存アプリでも同じ)。
ログイン状態のPC⇔スマホでの同期は本番で要確認。

### 初期データ

栗田工業(6370) / Xylem(XYL) / 信越化学工業(4063) の3社を調べて、アプリの「読み込む」から
入れられるバックアップJSON(`investment-report-starter.json`)を作ってユーザーに渡した。
リポジトリには置いていない(個人の投資メモなので)。3社ともAI設備投資テーマに乗っており
分散になっていない可能性がある点を Idea メモに残してある。

## 直近の作業 (2026-08-24時点) — リクエストカードのスマホ読みやすさ改善

ユーザー報告「長文のリクエストがスマホだと見づらくて、誰も見ようと思わない」への対応。
`script.js`(`createCard`)と`style.css`のみ変更。マイグレーション0本。

原因は**困りごと本文をまるごと`.card-title`(17px / weight 800 / テラコッタ色)にしていた**こと。
1〜2行なら目を引くが、長文だと太字の色文字が8行以上続き、さらに長さの上限が無いので
1件でスマホの画面が埋まり、一覧をスクロールして探せなかった。

| | 変更 |
|---|---|
| A | 90字超(`LONG_PROBLEM_CHARS`)の困りごとは`.card-title--long`を付けて本文寄りの見た目(14px / weight 700 / `--map-ink` / 行間1.7)に。短い困りごとは従来どおり見出し |
| B | `.card-clamp`で困りごと・欲しい機能を**4行で折りたたみ**、`.card-more-btn`(「続きを読む」)で全文表示。`makeReadMoreButton()`が担当 |
| C | `@media (max-width: 479px)`で本文15px・行間1.75、カード余白22→18px(480px以上のデスクトップ表示は不変) |

- ボタンは**4行を超えている投稿にだけ出す**。高さはDOMに入るまで測れないため、
  いったん作っておいて`requestAnimationFrame`で`scrollHeight <= clientHeight + 1`なら`hidden`にする
  (このとき`card-clamp`も外す)。`[hidden]`が効くよう`.card-more-btn[hidden]{display:none}`を明示
- i18n 5言語に`readMore`/`readLess`を追加(204キーで5言語一致を確認)
- 既知の割り切り: 判定は1回だけなので、画面回転で幅が変わると
  ボタンが出たまま(押しても見た目が変わらない)になることがある。実害が小さいので放置

**検証**: 全463テストgreen。375px幅のiframeに実際の`style.css`+`script.js`の
`makeReadMoreButton`を読み込んで実測 — 長文カードのタイトルが15px/700・4行(105px)で止まり、
「続きを読む」で184pxに開く/もう一度押すと戻る、短い投稿にはボタンが出ない、
横スクロール無しを確認。スクリーンショットでも目視確認済み。

**未検証**: 実機(iPhone Safari)での表示。本番デプロイ後に要確認。

## 直近の作業 (2026-08-22時点) — シードのサンプル表記と運営コメントで「空っぽ感」を解消

初期のRedditのように架空の一般ユーザーを作って賑わいを演出したい、という相談から。
架空の一般ユーザーは作らず、**運営が運営として喋る**形（バッジ付き）で同じ効果を出す方針にした。
実ユーザーが増えた後に取り下げる必要がないため。

- `supabase/migrations/0030_seed_labels_and_official_notes.sql`（新規・**未実行**）:
  - `requests.is_seed`列を追加し、シードリクエスト100件に印を付ける。
    対象の特定は0022の`where problem = ... and owner_id = ...`をそのまま流用しているので、
    tenさんが実際に投稿したリクエストが巻き込まれることはない
  - `app_comments.is_official`列を追加。7カテゴリ×3パターン×2名義（`CobbleWorks Team` /
    `CobbleWorks Tips`）＝42通りの文面を、カテゴリ内の並び順で振り分けて全ミニアプリに2件ずつ投入。
    `where not exists`で二重投入を防いでいるので何度流しても安全
  - RLS: 0019のINSERTポリシーを貼り直し、`is_official = false`条件を追加。
    一般の投稿者が運営バッジ付きコメントを作れないようにするため。
    UPDATEを`using (false)`で明示的に塞ぐポリシーも追加（元々UPDATEポリシーは無かったが、
    将来足したときに運営コメントが書き換え可能にならないようにする保険）
- `script.js`:
  - シードリクエストは投稿者名の代わりに「CobbleWorks サンプル · 日付」と表示し、
    カード上部に「サンプル」バッジを出す。これまでは100件全部が「tenさんが共有」になっており、
    1人が100件投稿しているように見えていた
  - 運営コメントには「運営」バッジと左のアクセント線を付ける
  - i18n 5言語（en/ja/es/zh/hi）に`seedSharedBy`/`seedBadge`/`officialBadge`を追加
  - `loadComments`: `is_official`列が無い場合は列なしで再取得するフォールバックを入れた。
    マイグレーション未実行のままデプロイするとコメント欄が丸ごと見えなくなるため
- `style.css`: `.card-badge--seed` / `.comment-item--official` / `.comment-official-badge`を追加
- **順序に注意**: 先にSupabaseのSQL Editorで0030を実行してからpushするのが本来の順序。
  逆になってもフォールバックのおかげでコメント欄は壊れないが、バッジは出ない
- **未検証**: マイグレーション実行後の実際の表示（サンプルバッジ・運営コメント・件数表示）

## 直近の作業 (2026-08-20時点) — Family Scheduleの通知まわりを強化

- iOS対策: `manifest.json`追加(`display: standalone`)、`index.html`にmanifestリンク/apple-touch-icon、
  通知が使えない場合のメッセージに「iPhoneならホーム画面に追加してから開いて」という案内を追加
  (forgetful-trackerで踏んだのと同じ「ホーム画面に追加しないとiOSでWeb Pushが届かない」制約への対応)
- 編集(Save changes)時にも通知が飛ぶよう拡張: これまで`notify_family_item_added`トリガーは
  INSERT(Add)からしか呼ばれておらず、編集は通知されなかった。
  `supabase/migrations/0029_family_schedule_notify_on_update.sql`でUPDATE用トリガーを追加し、
  関数側でTG_OPを見て`action`('added'/'updated')をEdge Functionへ渡すように変更。
  `family-schedule-push`側も`action`に応じて通知文言を出し分け。
  → **ユーザー側でマイグレーション実行・Edge Function再デプロイ済み**
- 保存ボタン自体は既存の`itemFormSubmitBtn`(Add/Save changes)をそのまま利用。新規ボタンは不要だった
- **未検証**: 実機(iPhoneをホーム画面に追加した状態)でのプッシュ受信、編集時の通知受信

## 直近の作業 (2026-08-18時点) — Work Notes(業務メモ)を新規追加

「自分の業務に対する、自分だけのメモが欲しい。積み重なるほど精錬されて宝物になるもの」という
要望から `apps/work-notes/` を新規作成。壁打ちで決めた方針は以下。

- 日付ごとに並べる日誌ではなく、**テーマごとに1つのノートを持ち、そこへ気づきを書き足していく**形。
  同じテーマの学びが1か所に積み上がるので、後から読むと自分の型が見えてくる
- カードに「◯件の書き足し・最終更新◯日」を出して、育っているノートが一目で分かるようにした
- 最新の書き足しだけ開いたまま表示し、それ以前は `<details>` で畳む(縦に伸びすぎないため)

初版の機能: ノート作成 / 追記 / 追記・ノートの削除 / キーワード検索(タイトル＋本文) /
ピン留め / 使い方ガイド(画面内の折りたたみ) / バックアップの書き出し・読み込み /
クラウド同期(`AppSync.store('work-notes', 'notes')`、新規アプリなので `legacyKey` 無し)。
UIは en / ja / es の3言語(既存アプリと同じく `cobbleworks:lang:v1` を読む)。

意図的に入れなかったもの: タグ分類、本文の書き換え履歴、リマインダー通知。

### 併せて直したこと

`thread-composer` が `app-icons.js` に未登録で、`test/app-icons.test.js` が
**master時点で既に2件落ちていた**。アイコンを追加して463件すべてgreenに戻した。

### 検証

ヘッドレスChromeで実際に操作して確認済み(空状態→作成→追記→リロード後も保持→検索→
ピン留めで先頭に来る→書き出し→削除→読み込み→2回読み込んでも重複しない→ja表示→390px幅で横スクロール無し)。
`node tools/seo.js` 実行済み(38アプリ / sitemap 41URL)。

**クラウド同期の実機確認だけ未了**: この作業環境からはSupabaseのCDNに出られず、
既存アプリ(idea-notebook)でも同じエラーになる。ログイン状態のPC⇔スマホでの同期は本番で要確認。

## 直近の作業 (2026-08-16時点) — 集客の地固め(検索から見つかるようにする)

インセンティブ設計の壁打ちの結果、「そもそも見る人がいない」が根本課題という結論になり、
集客の話へ。調べたところ**集客以前に入り口が塞がっていた**ことが判明した。

### 調査で分かった穴

| 項目 | 対応前 |
|---|---|
| `sitemap.xml` / `robots.txt` | どちらも無し |
| `meta description` | トップ0件、36アプリすべて0件 |
| `index.html` のHTML内から `apps/` へのリンク | **0本** |
| アプリからCobbleWorksへ戻る導線 | **0/36本** |

**アプリ一覧はJSでSupabaseから描画しているため、素のHTMLにはアプリへのリンクが1本も無い。**
Googleは後回しでJSを実行するが、SNSのプレビュー取得や他のクローラーは実行しない。
つまり36アプリは「どこからもリンクされていない孤島」だった。検索で辿り着いても戻る道も無かった。

### 対応: `tools/seo.js`(新規)で生成する方式にした

手作業で36ファイルを触らず、**何度実行しても同じ結果になる**生成スクリプトにした。
アプリを追加したら `node tools/seo.js` を実行し直す(`mini-app-builder`のDefinition of Doneにも追記済み)。

1. 各アプリの`<head>`に `description` / `canonical` / OGP / Twitter Card を挿入。
   **説明文はアプリ自身のサブタイトルから取る**(29/36)。取れない7件と、UIの断片しか拾えない
   `qr-generator`・`unit-converter`、説明文が重複する`company-watchlist-us/jp`・`flashcards-en/es`は
   スクリプト内の `DESCRIPTION_OVERRIDES` で書き分け。**重複0件・欠落0件を自動チェック済み**
2. 各アプリの末尾に「Made on CobbleWorks」リンク(`app-footer.css`。アプリごとに配色が違うので
   `color: inherit` + `opacity` で明暗どちらのテーマにも馴染ませる。virtual-traderの青系でも確認済み)
3. **`apps.html`(新規)**: JavaScriptを一切使わず36アプリ全部へリンクする静的ページ。
   トップの「Browse all mini apps →」からも辿れる(5言語対応)
4. `sitemap.xml`(39URL) と `robots.txt`
5. `index.html` / `requests.html` に `description` と `canonical` を追加

`profile.html` は個人ページなので意図的にsitemapに入れていない。

### ハマったこと: 二重エスケープ

`<title>`から名前を読む → エスケープして書き戻す、という作りだったため、
`Book & Show Tracker` が実行のたびに `&amp;amp;amp;...` と増殖した。
**HTMLから読んだ文字列は、変化しなくなるまで実体参照を戻してから使う**よう修正
(`unescapeHtml`)。すでに壊れていたタイトルもこれで自動的に直る。2回連続実行して安定を確認済み。

### 未検証 / 次

- **実際にGoogleにインデックスされているかはここからは確認できない**。
  Google Search Console(無料)にサイトを登録して、sitemapを送信するのが次の一歩
- 説明文が50字未満のアプリが4件(`memory-diary` `micro-stretch` `news-feed` `stock-checker`)。
  アプリ側のサブタイトルを厚くすれば自動的に良くなる

### 次にやること

1. 本番デプロイ後の実機確認(ログイン状態のプロフィール、コピーの動作、実データでの表示)
2. **Google Search Consoleに登録してsitemapを送信**(ユーザー側の手作業)
3. 使われた実感を返す施策(壁打ち済み・未着手): 利用回数の記録(`app_views`)、
   プロフィールへの実績表示、作者へのフィードバック通知、コメント欄の誘い文句化
4. 案として残っているもの: Remix(既存アプリを種にする)、未対応リクエストのランキング、
   「作ります」宣言(Claim)、週替わりのお題、シェアカード

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

### アプリが出る場所すべてに展開(同日・続き)

最初はアプリカードとサイドバーだけだったので、残りの3箇所にも入れた。
チップは文字12pxと小さくタイルが載らないため、**タイル無しで線画だけ**を置き、
色は `stroke="currentColor"` で置かれた場所の文字色をそのまま使う(`createAppGlyph()` / `.app-glyph`)。

| 場所 | ページ | 見た目 |
|---|---|---|
| アプリカード | index | 34pxタイル |
| Your Apps(サイドバー) | index | 24pxタイル |
| 検索候補ドロップダウン | index | 14px線画(緑) |
| Apps built for this request | requests | 14px線画(チップの緑) |
| Maybe also relevant | requests | 14px線画(チップのテラコッタ) |

- チップは `display:inline-block` のままだとアイコンと文字の縦位置がずれるので `inline-flex` + `gap:5px` に変更
- 検索候補は `align-items:baseline` の中に置くため、アイコンだけ `align-self:center`
- 実際の `requests.html` / `index.html` に `w.eval()` でモックデータを流し込んで
  `renderRequests()` / `renderAppSuggestions()` を実行し、5箇所すべてを目視確認済み

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

## 直近の作業 (2026-08-14時点・続き) — 「アプリを作りたくなる」導線: 出口の整備

「バイブコーディングでアプリを作る人に、CobbleWorksへ出してもらうには?」という壁打ちの結論として、
**出口(提出)→お題**の順で進めることに決定。今回はその第1弾(出口)。

### 壁打ちで分かった重要なこと

- **外部URLでの提出は、実はもう技術的に可能だった**。投稿フォームのApp URLは`type="url"`で
  任意のURLを受け付け、カード側も`isSafeUrl()`を通した上で`target="_blank"`
  `rel="noopener noreferrer"`の外部リンクとして開いている。**詰まっていたのは配管ではなく案内と体裁**
- そのため今回の変更は**マイグレーション0本**(ユーザー側のSQL実行作業なし)

### 変更内容(プラットフォームroot・ユーザー承認済み)

1. **作者クレジットをカード上部に移動・強化** — 従来は最下部の`card-date`に
   「Shared by @handle · 日付」という小さい灰色テキストとして埋もれていた。
   アプリ名のすぐ下に、アバター(未設定ならハンドルの頭文字バッジ)＋「Built by @handle」を表示。
   最下部は日付だけにして重複を解消(`sharedBy`はリクエスト側でまだ使うので残してある)
   - `mini_apps`のselectに`avatar_url`を追加(`profiles!mini_apps_owner_id_fkey(handle, avatar_url)`)
2. **外部アプリだと分かるドメインチップ** — `externalHostLabel()`で自サイト内(`apps/...`)か
   別ドメインかを判定し、別サイトなら`↗ bin-day-buddy.vercel.app`のようにチップ表示(`www.`は除去)
3. **投稿フォームの上に出品ガイド** — 「Any URL works」の見出しで、Vercel/Netlify/GitHub Pages等の
   既存URLをそのまま貼れることを明示＋出品条件4項目。5言語すべてに文言追加

**注意**: `profile.html`は今のところ**ログイン中の本人のプロフィールしか表示できない**
(他人を見る`?user=`のような導線が無い)。そのため作者クレジットはリンクにしていない。
他人のプロフィールページを作るなら別途対応が必要。

### 検証方法(Playwrightが入れられない環境での代替手段)

このセッションではnpm installが403で塞がれていたため、Playwrightの代わりに
**プリインストールのChromiumを`--headless --dump-dom` / `--screenshot`で直接叩く**方式を使った。
`/tmp`のscratchpadに、リポジトリをそのまま配信しつつ`index.html`のsupabase-js CDNタグだけを
偽物に差し替えるNodeサーバーを立てて検証(本番DBには一切触れていない)。
コンソールエラーはDOMに書き出して`--dump-dom`で回収する手口が使える。

- 5言語とも187キーで完全一致(漏れ0件)
- 作者あり2件/作者なし1件、内部アプリ/外部アプリの出し分けが期待どおり
- コンソールエラー0件、横スクロール発生なし(3つの幅で`scrollWidth <= viewport`を確認)
- **未検証**: 実際のGoogleログイン往復と本番データでの表示(デプロイ後に要確認)

### 追加: 他人のプロフィール/ポートフォリオを見られるようにした

上の作者クレジットを入れた時点では`profile.html`が本人のページしか出せなかったため、
「作者名を押しても飛べない」状態だった。ユーザー指摘により対応。**こちらもマイグレーション0本**
(`profiles`は0002で既に「誰でも閲覧可」のSELECTポリシーがあり、`handle`もunique制約付き)。

- **URLは`profile.html?u=<handle>`**(ID方式ではなくハンドル方式をユーザーが選択)。
  読みやすくシェアしやすい代わりに、本人がハンドルを変更すると古いリンクは切れる。
  切れた場合は「Profile not found」の案内を出す
- `renderProfilePage()`/`renderYourApps()`が`getProfileTarget()`を見るように変更。
  `?u=`があれば`viewedProfile`(Supabaseから取得)、無ければ従来どおり`currentProfile`
- **未ログインの訪問者でも他人のプロフィールは見られる**。従来は`!currentUser`で
  丸ごと隠していたが、他人のページのときはサインイン要求を出さない
  (自分のページを未ログインで開いた場合は従来どおりサインインを促す)
- 自分のページでだけ設定(⋯)ボタンを出す。カードのEdit/Deleteは元々`ownerId`判定なので変更不要
  (ただし`canManage()`は管理者にtrueを返すので、管理者には他人のカードにも編集が出る。既存の仕様どおり)
- アプリカードの「Built by @handle」をプロフィールへのリンクに。タブのタイトルも`@handle · CobbleWorks`に変更
- `tokens.css`の`.map-btn`は`display`/`text-decoration`を持たず`<a>`に効かないため、
  `style.css`に`a.map-btn`のルールを追加(「Browse mini apps」ボタン用)

検証: `?u=vibecoder` / `?u=cobbler` / `?u=nobody` / `?u`なし の4状態を未ログインで確認。
コンソールエラー0件、横スクロールなし、5言語とも195キーで一致。
`data-i18n`で関数値のキーを参照していないことも自動チェック済み(参照すると関数のソースが画面に出てしまう)。

**未検証**: 実ログイン状態での自分のページ、実データでの表示。

### お題フェーズ: 「✨ Copy AI prompt」ボタン(完了)

リクエストカードのボタン列を **[⭐ I want this too] [✨ Copy AI prompt] [🔨 Build this]** の3つに変更。
新しい中央のボタンを押すと、そのリクエストを解くアプリを作るためのMarkdown仕様書が
クリップボードにコピーされる。**マイグレーション0本**。

- `buildRequestPrompt(request)` が仕様書を組み立てる。中身は
  困りごと本文 / 欲しい機能 / 対象ユーザー / 今の代替手段 / 「欲しい」人数(0人なら省略) /
  作り方10項目(1画面・3ファイル・英語UI・localStorageキー命名・375px優先・空状態・
  入力チェック・キーボード対応・使い方ガイド・外部通信禁止) / tokens.cssの色 /
  投稿ページへの絶対URL(`?builtFor=<リクエストID>` 付きなので、提出時にリクエストが自動選択される)
- **仕様書はサイトの表示言語に関わらず英語で生成する**。AIツールへの指示であること、
  5言語ぶんの長文を保守したくないことが理由。リクエスト本文はそのまま(投稿された言語のまま)入る
- `copyTextToClipboard()` は `navigator.clipboard` を試し、
  ダメなら textarea + `execCommand('copy')` にフォールバックする
- `.prompt-btn` はアクセント色の塗りつぶし。作り始めの入口なので3つの中で一番目立たせている

検証: 実際に生成された仕様書の全文を目視確認。ボタンのクリック経路も
ヘッドレスから`click()`して例外0件を確認。全5ページでコンソールエラー0件・横スクロールなし。
5言語とも198キーで一致。

**未検証**: 実ブラウザでのクリップボード書き込み(https＋実際のクリック操作が必要)。
デプロイ後に、実際にボタンを押して貼り付けられるか確認が必要。

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

## 直近の作業 (2026-09-02時点)

- 新しいミニアプリ **Resolution Check-in** (`apps/resolution-checkin/`) を追加
  - 元リクエスト:「目標を立てても最初の1週間で見なくなる」→ 目標リスト + 月イチの見直し
  - 目標リスト(タイトル/理由)、0〜100%のスライダー、月が変わると出るチェックインバナー、
    チェックイン履歴(月・進捗・メモ)、完了/削除(2度押し方式・ダイアログなし)
  - 保存は `AppSync.store('resolution-checkin', 'data')` の1ドキュメント
    (`{ items: [], lastCheckIn: 'YYYY-MM' }`)
  - `app-icons.js` にアイコン(カレンダー+チェック, c0)を登録
  - ローカルサーバー + Chromeで実地確認済み(追加・進捗・チェックイン・履歴・完了・削除・
    リロード後の復元・空状態、コンソールエラーなし)
  - プッシュ通知は入れていない。アプリストア申請が通ってから本格導入する方針

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
resolution-checkin, restock-planner, route-notes, screen-time-tracker, shift-calendar,
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
