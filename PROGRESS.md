# 開発状況メモ

デスクトップ・モバイル(claude.ai/code)どちらの環境でも、このファイルを読んで/更新して
作業状況を共有する。作業の区切りに追記し、commit & push すること。

## 直近の作業 (2026-08-02時点)

- Book Snap (`apps/book-snap/`) の機能追加・不具合修正が続いていた
  - 本の登録フローをキャプチャ画面に統合
  - タグ本一覧の空状態に「+ 本を追加」ボタン追加
  - 使い方ガイドを追加
  - サインイン前にシート/バーが見えてしまう不具合を修正
- リクエスト一覧にページネーション追加（30件/ページ）
- 直前のコミットで、シードされたミニアプリの名前・説明のtypo修正

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

**決定した方向性**（段階的に進める。一気に全アプリ移行はしない）:
1. 汎用の同期の仕組みを先に作る: `user_app_data(owner_id, app_slug, key, value jsonb)` のような
   汎用テーブル + 各アプリのlocalStorage読み書きヘルパーをこれと同期させる共通JSヘルパー
2. 実際に日常使っているアプリを2〜3個だけ先に乗せてみる（候補: Daily Wins, Habit Tracker）
   - 同期・複数端末での競合・既存localStorageデータの移行UI（初回に「クラウドにアップロードしますか？」）
     を実地で検証する
3. 問題なければ他のアプリにも順次展開

理由: 今(アプリ約30個)のうちに直す方が、100個に増えてから直すよりコストが低い。
ただし複数端末での実需要はまだ検証されていないため、一気に全部やる理由はない。

## 追記ルール

- 新しいセッションを始めたら、まずこのファイルを読んで状況を把握する
- 作業が一区切りついたら「直近の作業」を更新し、必要なら「次にやること」も更新
- 内容が増えすぎたら古い履歴は削って要点だけ残す（git logに詳細は残るため）
