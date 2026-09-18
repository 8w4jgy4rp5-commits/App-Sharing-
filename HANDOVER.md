# 引き継ぎメモ

別の AI コーディングツール（Codex など）にこのプロジェクトを引き継ぐための現状まとめ。
2026-09-18 時点。

## 最初に読む順番

1. `AGENTS.md` — 守ってほしいルール（Codex はこれを自動で読む）
2. `PROGRESS.md` — 「なぜそう作ったか」の記録。**このプロジェクトの記憶そのもの**
3. このファイル — 全体像と、環境側で別途必要な設定

## これは何のプロジェクトか

CobbleWorks。「困りごと → リクエスト → ミニアプリ」という考え方の、小さなアプリを集めた
プラットフォーム。ビルド工程はなく、素の HTML / CSS / JavaScript だけで動く。

- **プラットフォーム直下**（`index.html` / `requests.html` / `matching.html` /
  `profile.html` / `apps.html`）— リクエストとミニアプリを掲示する板。
  アプリの登録はユーザーがフォームに手入力する方式で、`apps/` を自動で走査はしない
- **`apps/{app-slug}/`** — ミニアプリ本体。46 個。それぞれ独立した1ページ

## 共通で使っているファイル（リポジトリ直下）

| ファイル | 役割 |
|---|---|
| `app-sync.js` | ミニアプリのデータを Supabase と同期する共通ヘルパー。**2世代の API が同居している**ので、触る前に必ずファイル冒頭のコメントを読むこと |
| `auth.js` | Supabase Auth（Google ログイン） |
| `ai.js` | ブラウザから AI 機能を呼ぶための共通処理 |
| `app-icons.js` | トップのアプリ一覧に出すアイコン。キーは `apps/` のフォルダ名 |
| `supabase-config.js` | Supabase の URL と publishable キー。**公開前提のキーなので平文で正しい**（詳細は `AGENTS.md`） |
| `tokens.css` | 配色・余白などのデザイントークン（Terracotta & Cream） |
| `app-footer.css` | ミニアプリ末尾の「CobbleWorks へ戻る」リンク。`tools/seo.js` が各アプリに読み込ませる |

- `supabase/functions/` — Edge Functions 5個（AI、プッシュ通知、株価プロキシ）
- `supabase/migrations/` — DB スキーマ
- `test/` — `node test/run.js` で走る簡易テスト
- `tools/seo.js` — 各アプリの HTML に共通タグを差し込むスクリプト

## ミニアプリ 46 個

book-show-tracker / book-snap / bring-list / company-watchlist-jp /
company-watchlist-us / daily-summary / daily-todo / daily-wins / ecosystem-puzzle /
family-schedule / fan-activity-tracker / flashcards-en / flashcards-es /
forgetful-tracker / free-trial-tracker / habit-tracker / idea-notebook /
investment-report / listing-compare / memory-diary / message-writer / micro-stretch /
news-feed / packing-list / pet-health-log / place-picks / qr-generator /
reading-streak / reference-report-organizer / resolution-checkin / restock-planner /
route-notes / screen-time-tracker / shift-calendar / shopping-list / simple-budget /
song-catcher / stock-checker / team-shift / thread-composer / travel-planner /
unit-converter / virtual-trader / virtual-trader-jp / what-to-cook / work-notes

## 引き継ぎ時点で未完了の作業

- **Ecosystem Puzzle のスプライト化（2026-09-09）** — コードは完成し、座標の数値検証も
  済んでいるが、**ユーザーによる実プレイ確認がまだ**。移行後に不具合が出たときの
  切り分けが難しくなるので、先に確認するのが望ましい
- `stock-checker` のクイックピックに未上場企業の `NON-IPO` が出てしまう件（小さい）
- AppSync は「まるごと置き換え」方式。2台で同時に編集すると片方が消える。
  項目単位のマージは、実際に困ってから着手でよい

## リポジトリに入っていないもの（移行先で別途必要）

- **`apps/ecosystem-puzzle/img/ref/`** — `.gitignore` で除外。生き物の絵の元データ
  （`parts-sheet.jpg`、`fox-ear-unused.png`）で、**作業した PC の中にしかない**。
  絵を作り直すときに必要なので、別途バックアップしておくこと
- **Supabase 側の設定** — RLS のポリシー、Edge Functions の環境変数、Google ログインの設定
- **claude.ai 側の個人スキル** — `article-analysis`、`research-prompt-template` など。
  git に入っていないので、必要なら手動でコピーする
- **hooks** — git の状態をチェックする仕組みなど。移行先では別の形になる

## 引き継げないもの

- 過去の会話履歴
- `PROGRESS.md` に書き残していない判断

つまり、**書いてあるものだけが引き継げる**。作業が一区切りついたら `PROGRESS.md` に
追記する習慣を、移行先でも続けること。

## スキルについて

同じスキルが2か所にある。

- `.claude/skills/` — Claude Code が読む
- `.agents/skills/` — Codex が読む

**中身は同一のミラー。**片方だけ直すと2つのツールの挙動がずれていくので、
スキルを変更したら両方に反映すること。
