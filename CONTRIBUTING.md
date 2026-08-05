# CobbleWorksにミニアプリを投稿する

[🇬🇧 English version below](#contributing-a-mini-app-to-cobbleworks)

## CobbleWorksとは

CobbleWorksは「困りごと → リクエスト → ミニアプリ」というループでできているサイトです。

1. 誰かが日常の小さな困りごとを「リクエスト」として投稿する
2. 誰かがそのリクエストに応える、小さくて使い切りやすいミニアプリを作る
3. 作られたミニアプリはリクエストに紐づいた形でディレクトリに並び、誰でも自由に使える

このガイドは、3番目の「作る」を担いたい人のためのものです。

## このガイドの対象

- Claude Codeなど、AIとの対話でコードを書く「バイブコーディング」をする人
- 従来のエンジニアでなくても、AIに頼みながら小さなアプリを1つ作ってみたい人

コードのルールを全部覚える必要はありません。このリポジトリには`.claude/skills/`という設定が入っていて、Claude Codeを開くだけで、そのAIが自動的にCobbleWorksの作法（ファイルの置き場所・デザイン・セキュリティのルールなど）に沿って一緒に作ってくれます。

## 必要なもの

- GitHubアカウント
- Claude Code（または同等のAIコーディングツール）

## 手順

1. **リクエストを選ぶ**
   [Requests一覧](requests.html) を開き、まだミニアプリが作られていない、気になるリクエストを1つ選ぶ。

2. **リポジトリをFork & Clone**
   このリポジトリを自分のGitHubアカウントにForkし、手元にCloneする。

3. **Claude Codeを開いて頼む**
   Cloneしたフォルダで Claude Code を起動し、たとえばこんなふうに頼むだけでよい。

   > 「〇〇というリクエストのためのミニアプリを作りたいです。リクエストの内容は『（リクエスト本文をここに貼る）』です。」

   `.claude/skills/`のガイドに沿って、Claude が `apps/{app-slug}/`（`index.html` / `style.css` / `script.js`）を一緒に作ってくれます。

4. **動作確認**
   `apps/{app-slug}/index.html` をブラウザで開き、コンソールにエラーが出ていないか、実際に使えるかを確認する。

5. **Pull Requestを出す**
   Forkしたリポジトリから、本体のリポジトリへPull Requestを送る。

## 提出後の流れ

1. メンテナー（サイトのオーナー）がPull Requestを確認し、問題なければマージする
2. マージされたら、CobbleWorksのトップページで「ミニアプリを投稿する」フォームから登録する
   - 手順1で選んだリクエストのページに戻り、「Build this」ボタンを押すと、そのリクエストが自動で選択された状態でフォームが開く
   - アプリ名・説明・URL（マージ後の公開ページのURL）を入力して投稿する

## 守ってほしいこと（最低限）

- アプリのUIは英語で書く（サイト全体のルール）
- 個人情報や機微なデータをlocalStorageに保存しない
- 外部サイトへのスクレイピングなど、勝手な外部通信を追加しない
- 最初のバージョンは小さく作る（機能を盛りすぎない）

これらは`.claude/skills/platform-rules`にも書かれているので、Claude Codeが自動的に守ってくれるはずです。

## 作った人の名前について

投稿したミニアプリには、あなたのプロフィール名が「作った人」として表示されます。リクエストページにも「このリクエストに応えたアプリ」として並ぶので、誰が何を解決したかが分かる形になっています。

---

# Contributing a Mini App to CobbleWorks

[🇯🇵 日本語版は上にあります](#cobbleworksにミニアプリを投稿する)

## What is CobbleWorks?

CobbleWorks runs on one loop: **Problem → Request → Mini App**.

1. Someone posts a small everyday problem as a "Request."
2. Someone else builds a small, focused mini app that answers that request.
3. The mini app is listed alongside the request in the directory, free for anyone to use.

This guide is for the third step: building.

## Who this guide is for

- Anyone who "vibe codes" with an AI assistant like Claude Code
- You don't need to be a traditional engineer — you just need to want to build one small app with AI help

You don't need to memorize the project's conventions. This repo ships with `.claude/skills/` — once you open Claude Code in this repo, it will automatically follow CobbleWorks' conventions (file layout, design, security rules) as it builds with you.

## What you need

- A GitHub account
- Claude Code (or an equivalent AI coding tool)

## Steps

1. **Pick a request**
   Open the [Requests page](requests.html) and pick one that doesn't have a mini app yet.

2. **Fork & clone this repo**
   Fork this repository to your own GitHub account and clone it locally.

3. **Ask Claude Code to build it**
   Open Claude Code in the cloned folder and ask something like:

   > "I want to build a mini app for this request: '(paste the request text here)'."

   Guided by `.claude/skills/`, Claude will help you create `apps/{app-slug}/` (`index.html` / `style.css` / `script.js`).

4. **Test it**
   Open `apps/{app-slug}/index.html` in a browser. Check there are no console errors and the main flow works.

5. **Open a pull request**
   Send a pull request from your fork back to this repository.

## After you submit

1. The maintainer reviews and merges your pull request.
2. Once merged, go back to the request's page and click **"Build this"** — it opens the "Submit a Mini App" form on the home page with that request pre-selected.
3. Fill in the app name, description, and the URL of your merged, live app, then submit.

## Minimum expectations

- App UI must be in English (a site-wide rule)
- Don't store personal or sensitive data in localStorage
- Don't add scraping or outside network calls on your own
- Keep the first version small — resist adding extra features

These are also documented in `.claude/skills/platform-rules`, so Claude Code should follow them automatically.

## About credit

Your submitted mini app will show your profile name as its builder, and it will appear on the original request's page as "built for this request" — so it's clear who solved what.
