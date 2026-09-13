# お知らせメールのセットアップ手順

リクエストを出した人に「あなたのリクエストがアプリになりました」とメールで届ける機能。
コードはすでにリポジトリに入っているので、ここに書いてあるのは **1回だけやる外部設定** だけ。

---

## 全体像

```
誰かがアプリを登録
      │
      ▼
mini_apps に INSERT
      │  ← DBトリガー（0038）
      ▼
notifications に1行できる ──────────► サイト内 Inbox（もう動いている）
      │  emailed_at = null
      │
      │  ← pg_cron が5分おきに叩く（0040）
      ▼
Edge Function「notification-email」 ──► Brevo ──► 相手のメール受信箱
      │
      └ 送れたら emailed_at を埋める（二度送らないため）
```

**通知の記録場所は notifications テーブルだけ。** メールはそこから「配るだけ」の役。
あとで Web Push を足すときも、同じ行を読む形で並べられる。

メールアドレスは Google ログインのときに `auth.users.email` に入っているので、
リクエストフォームにメール欄を足す必要はない。

---

## 手順 1. Brevo に登録して「送信元アドレス」を認証する（無料）

独自ドメインが無くても、**今持っているメールアドレスを送信元にできる**のが Brevo を選んだ理由。
無料枠は 1日300通まで。CobbleWorks の規模ならまず超えない。

1. https://www.brevo.com/ でアカウントを作る
2. 左メニューの **Senders, Domains & Dedicated IPs** → **Senders** タブ
3. **Add a sender** を押し、差出人名（例: `CobbleWorks`）と自分のメールアドレスを入れる
4. そのアドレスに確認メールが届くので、中のリンクを押す
5. 一覧の状態が緑（verified）になれば完了

> ここで認証したアドレスが、届いたメールの「差出人」として表示される。

## 手順 2. APIキーを取る

1. 右上のアカウントメニュー → **SMTP & API**
2. **API Keys** タブ → **Generate a new API key**
3. 名前は `cobbleworks` など。表示されたキーをコピーしておく（**この画面でしか見られない**）

## 手順 3. Supabase にキーを預ける

キーをコードに書くとGitHubに公開されてしまうので、Supabase 側に隠して置く。

```bash
supabase secrets set BREVO_API_KEY=xkeysib-ここにコピーしたキー
supabase secrets set BREVO_SENDER_EMAIL=手順1で認証したアドレス
supabase secrets set BREVO_SENDER_NAME=CobbleWorks
```

（Supabase ダッシュボードの **Edge Functions → Secrets** から手で入れてもよい）

## 手順 4. DBに列を足す

**先に `0038` を実行すること。** `0039` は `notifications` テーブルに列を足す内容なので、
テーブルを作る `0038` が済んでいないと
`ERROR: 42P01: relation "public.notifications" does not exist` で落ちる。

Supabase ダッシュボードの **SQL Editor** で、この順に中身を貼って実行する:

1. `supabase/migrations/0038_notifications.sql` … `notifications` テーブルを作る
2. `supabase/migrations/0039_notification_emails.sql` … 列を足す（下の説明はこちら）

どちらも `if not exists` で書いてあるので、すでに実行済みでももう一度流して問題ない。
実行済みか分からないときは `docs/check-schema.sql` を貼ると、足りていないものが一覧で出る。

やっていること:

- `notifications.emailed_at` … このお知らせをメールで送ったか
- `profiles.email_notifications` … メールで知らせてよいか（既定オン）
- `profiles.locale` … 何語でメールを書くか
- **今までに溜まっていたお知らせを全部「送信済み」にする**
  （これをしないと、動かした瞬間に過去分がまとめて飛んでしまう）

## 手順 5. Edge Function を配置する

```bash
supabase functions deploy notification-email
```

## 手順 6. 先に手で1回叩いて、届くか確かめる

cron を入れる前に、自分で確認する。`<PROJECT_REF>` と `<SERVICE_ROLE_KEY>` は
Supabase の **Project Settings → API** から取る。

```bash
curl -X POST \
  "https://<PROJECT_REF>.supabase.co/functions/v1/notification-email" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

返ってくる JSON の読み方:

| 返り値 | 意味 |
|---|---|
| `{"sent":0,"total":0}` | 送る相手がいなかった（未送信のお知らせがゼロ）。正常 |
| `{"sent":1,...}` | 1通送った |
| `"skipped"` が増える | メール通知オフの人／退会済みの人。送らずに済ませた |
| `errors` に文字列 | Brevo が断った。中に理由（401なら鍵違い、400なら送信元未認証など）が入っている |

**テストの作り方**: 別アカウントでリクエストを出し、本アカウントでそのリクエストに
紐づけてミニアプリを登録すると、`notifications` に1行できる。
（自分のリクエストに自分で作った場合はトリガーが通知を作らない仕様）

## 手順 7. 5分おきの自動実行を入れる

`supabase/migrations/0040_notification_email_cron.sql` の
`<YOUR_PROJECT_REF>` と `<YOUR_SERVICE_ROLE_KEY>` を実際の値に置き換えてから、
SQL Editor で実行する。

止めたくなったら:

```sql
select cron.unschedule('cobbleworks-send-notification-emails');
```

送った記録は `net._http_response` に残るので、うまくいかないときはここを見る:

```sql
select created, status_code, content
from net._http_response
order by created desc
limit 10;
```

---

## 受け取る側の操作

プロフィールページの **⋯ → 「リクエストがアプリになったらメールで知らせる」** で、
いつでもオフにできる。オフにしてもサイト内の Inbox には残る。
メール本文の下にも、この設定ページへのリンクを必ず入れてある
（止め方が書いていないメールは迷惑メール扱いされやすいため）。

## 気をつけること

- **同じお知らせを二度送らない**のは `emailed_at` 1本で守っている。
  手でこの列を null に戻すと、その人にもう一度届く。
- 送信に失敗した通知は次の5分後に再試行されるが、**7日経つと諦める**
  （`MAX_AGE_DAYS`）。何日も前の「できました」が突然届くのを防ぐため。
- メール文面は `supabase/functions/notification-email/index.ts` の `COPY` に5言語ぶん置いてある。
  サイト内の文言（`script.js`）とは別物なので、直すときは両方見る。
