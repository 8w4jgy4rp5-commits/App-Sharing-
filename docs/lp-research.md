# LP共通構成リサーチ（CobbleWorks LP制作の下調べ）

作成: 2026-08-29 / ブランチ `claude/cobbre-works-lp-upcfog`

CobbleWorks のランディングページ（LP）を作る前に、他の人が作っている LP を約50件調べて
「どのページにも共通して入っているもの」を洗い出した記録。

---

## 0. 調査方法と、正直な制約

**制約**: このセッションからの外部サイトへの直接アクセスは、組織のネットワークポリシーで
GitHub 以外がほぼ全部ブロックされていた（linear.app / stripe.com / producthunt.com /
land-book.com などすべて `EGRESS_BLOCKED`）。そのため「ブラウザで50サイト開いて見る」は
できていない。代わりに2つの経路で集めた。

| 経路 | 件数 | 何を見たか | 確度 |
|---|---|---|---|
| A. ソース直読み | 20 | LPのHTML/コンポーネントを GitHub から取得し、セクションの並び順を採取 | 高（実物のコード） |
| B. 公開teardown経由 | 30 | 構成を解説した記事・調査を通して確認 | 中（他人の記述） |

さらに背景として、開発者向けLP 100件超を分析した Evil Martians の調査と、
Lapa Ninja のコミュニティ系LP 640件のカテゴリを参照した。

**A の20件でセクション並びが完全に取れたのは18件**（Vite / Vitest はヒーローのみ取得）。
以下の出現率はこの **18件** を母数にしている。少ない母数なので「傾向」として扱うこと。

---

## 1. 出現率（ソース直読み18件）

| セクション | 出現 | 率 | メモ |
|---|---|---|---|
| ヒーロー（見出し＋CTA） | 18/18 | 100% | 例外なし |
| 機能・特徴の一覧 | 18/18 | 100% | ほぼカードグリッド |
| フッター | 18/18 | 100% | 共通レイアウト側にあるものを含む |
| 信頼バンド（ロゴ／スポンサー／数字） | 10/18 | 56% | ヒーロー直下が最多 |
| 利用者の声・事例 | 10/18 | 56% | |
| 最後のCTAブロック | 9/18 | 50% | |
| 料金 | 3/18 | 17% | OSS・無料が多い母数のため低い |
| FAQ | 2/18 | 11% | 同上 |
| 使い方3ステップ | 1/18 | 6% | ただし B（teardown側）では定番 |

**母数の偏りに注意**: A は開発者向けOSSサイトとLPテンプレートに寄っている。
「料金」「FAQ」「3ステップ」が低いのは、無料・開発者向けが多いからで、
一般向けサービスのLPでは B 側の資料どおり standard に入る。

---

## 2. 共通骨格（50件をまとめた「型」）

上から順に、これが最大公約数。

1. **ヘッダー** — ロゴ ＋ リンク3〜5本 ＋ CTAボタン1つ。リンクは5本以下が定石
2. **ヒーロー** — 中央寄せ・大きな見出し・その真下にビジュアル、が圧倒的多数
   - 見出しは10語以内、サブコピーは25語以内
   - **主CTAは1つだけ**。副CTAは色を落として添える
   - ビジュアルは「実物のスクリーンショット / 動くデモ」。抽象イラストより成績が良い
   - 最初の3秒で「自分に関係あるか」に答える
3. **信頼バンド** — ロゴ列 or 数字（GitHubスター・利用者数・受賞）。個人向けツールは数字型が多い
4. **課題 → 解決** — 機能の前に、まず相手の困りごとを言語化する
5. **機能グリッド** — カード3〜6枚。1枚＝1つの価値
6. **使い方3ステップ** — 見出しは2〜4語。アイコン＋1文
7. **実物の見せ場** — スクショ・動画・埋め込みデモ・作例ギャラリー
8. **利用者の声** — 引用・事例・コミュニティ
9. **FAQ** — 最後の不安をつぶす
10. **最後のCTA** — FAQの直後。**1番目のCTAと同じ言葉を使わず、言い換える**
11. **フッター** — サイトマップ、規約、SNS、リポジトリ

---

## 3. 細かい共通ルール

- CTAは1か所ではなく **スクロール深度に合わせて繰り返す**（ヒーロー → 各説得ブロックの後 → FAQの後）
- CTA文言は動詞で始める（`Get` / `Start` / `Join` / `Try`）。`Sign up` のような一般語は弱い
- CTAボタンのすぐ下の1行が仕事をする（例: "No credit card required"）
- ナビは5本以下。長いLPはスティッキーヘッダーが有効
- モバイル前提（LPの流入の多数がモバイル）
- 実績ゼロのときの社会的証明の代替: 作った人の経歴 / ベータ利用者の声 / 公開リポジトリ /
  待機リスト人数 / 「新しいこと」を正直に書く。**偽の証言は絶対に作らない**

---

## 4. CobbleWorks に当てはめると

### 効く点
- **その場で触れるのが最大の武器**。「実物を触らせる」が最も効くパターンで、
  CobbleWorks は登録不要・無料でミニアプリ41個がすぐ動く。ヒーローに実物を置ける
- **既存の3ステップがすでに型に合っている**。`index.html` のヒーローにある
  Request → Build → Shelf は、そのまま「使い方3ステップ」として通用する
- **数字は出せる**: ミニアプリ41個 / 登録不要 / ソース公開

### 弱点と対処
- **二面性**: 「困っている人」と「作る人」の2種類に同時に語りかける必要がある。
  ヒーローでは片方に絞り、もう片方は専用ブロックで受けるのが定石
- **利用者の声がまだ無い**: 証言の代わりに「リクエスト実物」「アプリのスクショ」「星評価」
  「GitHubリポジトリ」を証拠として置く
- **料金セクションは不要**（課金が無い）。代わりに「ずっと無料・登録不要」を1行で明示

### 構造上の論点（次に決めること）
現在の `index.html` は「ホーム兼アプリ置き場」で、LPではない。
- 案A: `lp.html` を新設し、`index.html` はそのまま
- 案B: `index.html` をLP化し、一覧機能は `apps.html` に寄せる

---

## 5. 参照した50件

### A. ソース直読み（20件）

| # | 対象 | 種別 | 採取したセクション並び |
|---|---|---|---|
| 1 | astro.build | フレームワーク | Hero → Intro → Islands → Integrations → Features → Ecosystem → Agencies → 最終CTA → Sponsors |
| 2 | svelte.dev | フレームワーク | Hero → 声 → 企業ロゴ → 動画 → コミュニティ → 支援者 → Footer |
| 3 | nuxt.com | フレームワーク | Hero → ロゴ → 機能 → 声 → 財団 → 数字 → モジュール → デプロイ → 貢献者 → 実例 → スポンサー |
| 4 | tailwindcss.com | ツール | Header → Hero → Partners → Why → Explainer → Build Anything → Tailwind UI → Footer |
| 5 | Astro Starlight | ドキュメント | Hero（CTA2つ）→ 機能カード4 → 声 → 提供元 |
| 6 | Tauri | ツール | Hero＋CTA → プロジェクト作成 → 機能カード4 → スポンサー |
| 7 | UnoCSS | ツール | Hero（CTA4つ）→ 機能カード12 |
| 8 | Docusaurus | ツール | 告知バー → Hero（CTA2つ）→ 機能6 → 動画 → ツイート → 声 |
| 9 | Vite | ツール | Hero「Next Generation Frontend Tooling」（以降は取得不可） |
| 10 | Vitest | ツール | Hero「Next Generation testing framework」（以降は取得不可） |
| 11 | cruip / Simple Light | LPテンプレ | Hero → 業種別 → 機能 → 大きな声 → CTA |
| 12 | cruip / Open React Template | LPテンプレ | Hero → ワークフロー → 機能 → 声 → CTA |
| 13 | leoMirandaa / shadcn-landing-page | LPテンプレ | Nav → Hero → スポンサー → About → **使い方** → 機能 → サービス → CTA → 声 → チーム → 料金 → 購読 → FAQ → Footer |
| 14 | nobruf / shadcn-landing-page | LPテンプレ | Hero → スポンサー → メリット → 機能 → サービス → 声 → チーム → コミュニティ → 料金 → 問合せ → FAQ → Footer |
| 15 | astroship | LPテンプレ | Hero → 機能 → ロゴ → CTA |
| 16 | Blazity / next-saas-starter | LPテンプレ | Hero → パートナー → 説明2枚 → CTA → 機能ギャラリー → 機能 → 声 → ブログ |
| 17 | ixartz / Next-JS Landing | LPテンプレ | Hero → スポンサー → 縦積み機能 → CTAバナー → Footer |
| 18 | tailwindtoolbox / Landing-Page | LPテンプレ | Nav → Hero → 機能 → サービス → 料金 → CTA → Footer |
| 19 | StartBootstrap / landing-page | LPテンプレ | Nav → Hero（入力欄付き）→ 機能アイコン → 実物ショーケース → 声 → CTA → Footer |
| 20 | landy-react-template | LPテンプレ | Hero → 中央ブロック → About → Mission → Product → 問合せ |

### B. 公開teardown・調査経由（30件）

Linear / Notion / Stripe / Vercel / Supabase / Framer / Arc / Superhuman / Raycast /
Salesforce / Amplitude / Zendesk / Forest Admin / Snappr / Norma / Carrd / Gumroad /
Product Hunt / Ko-fi / Buy Me a Coffee / Substack / Patreon / Circle / Skool /
Mighty Networks / Bubble / Glide / Softr / Bootstrap / Figma

これらは記事側の記述に基づく（自分でページを開いて確認したものではない）。

### 背景に使った調査

- Evil Martians「開発者向けLP 100件超の分析」— ヒーローは中央寄せが圧倒的、
  個人向けツールは企業ロゴではなく数字（GitHubスター等）で信頼を作る
- Lapa Ninja コミュニティ系LP 640件 / 開発ツール系 228件のカテゴリ

---

## 6. 出典

- https://www.involve.me/blog/landing-page-structure
- https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025
- https://www.markepear.dev/examples/landing-page
- https://saaslandingpage.com/articles/10-brilliant-how-it-works-page-examples/
- https://onepagelove.com/no-social-proof
- https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages
- https://cxl.com/blog/use-navigation-landing-pages-data-driven-consideration/
- https://www.lapa.ninja/category/community/
- https://anagrams.jp/blog/landing-page-composition/
- https://stock-sun.com/column/lp-configuration/
