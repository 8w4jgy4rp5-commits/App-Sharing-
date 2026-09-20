# 押し通知のセットアップ手順

リクエストを出した人に「あなたのリクエストがアプリになりました」を、
**CobbleWorksを閉じていても**スマホに届ける機能。

コードはすでにリポジトリに入っているので、ここに書いてあるのは **1回だけやる Supabase 側の作業** だけ。
**新しいサービスへの登録も、鍵の発行も、ドメインの購入も不要**（Forgetful Tracker で使っている鍵をそのまま使う）。

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
      │  pushed_at = null
      │
      │  ← pg_cron が1分おきに叩く（0042）
      ▼
Edge Function「notification-push」
      │
      ├ push_subscriptions からその人の端末を全部引く
      └ web-push で送信 ──► 相手のスマホに通知（アプリが閉じていても鳴る）
      │
      └ 届いたら pushed_at を埋める（二度鳴らさないため）
```

**通知の記録場所は notifications テーブルだけ。** 押し通知はそこから「配るだけ」の役。

---

## 手順 1. DBに土台を作る

Supabase ダッシュボードの **SQL Editor** で
`supabase/migrations/0041_push_subscriptions.sql` の中身を貼って実行する。

やっていること:

- `push_subscriptions` … 通知の宛先（端末×ブラウザごとに1行）
- `save_push_subscription()` … 宛先を登録する関数
- `notifications.pushed_at` … この通知を配ったか
- `profiles.locale` … 何語で通知を書くか
- **今までに溜まっていた通知を全部「配信済み」にする**
  （これをしないと、動かした瞬間に過去分がまとめて鳴る）

> オン/オフ用の列はあえて作っていない。**購読行があれば送る、無ければ送らない**。
> 設定列と購読行を二重に持つと、必ずどちらかとズレるため。

## 手順 2. Edge Function を配置する

```bash
supabase functions deploy notification-push
```

鍵（`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`）は
Forgetful Tracker のときに登録済みなので、**何もしなくてよい**。
念のため確認するなら:

```bash
supabase secrets list
```

## 手順 3. 自分で通知をオンにする

デプロイしたサイトを開いて、プロフィールページの **⋯ → 「リクエストがアプリになったら通知する」** をオンにする。
ブラウザが「通知を許可しますか？」と聞いてくるので許可する。

確認:

```sql
select user_id, left(endpoint, 40) as endpoint, created_at
from push_subscriptions;
```

1行入っていれば成功。

## 手順 4. 手で1回叩いて、鳴るか確かめる

cron を入れる前に確認する。`<PROJECT_REF>` と `<SERVICE_ROLE_KEY>` は
Supabase の **Project Settings → API** から取る。

```bash
curl -X POST \
  "https://<PROJECT_REF>.supabase.co/functions/v1/notification-push" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

返ってくる JSON の読み方:

| 返り値 | 意味 |
|---|---|
| `{"sent":0,"total":0}` | 配る相手がいなかった（未配信の通知がゼロ）。正常 |
| `{"sent":1,...}` | 1件配った。スマホが鳴るはず |
| `"skipped"` が増える | 通知をオンにしていない人。配らずに済ませた |
| `"removed"` が増える | 期限切れの宛先を掃除した（正常動作） |
| `errors` に文字列 | 送信が断られた。中に理由が入っている |

**テストの作り方**: 別アカウントでリクエストを出し、本アカウントでそのリクエストに
紐づけてミニアプリを登録すると、`notifications` に1行できる。
（自分のリクエストに自分で作った場合はトリガーが通知を作らない仕様）

## 手順 5. 1分おきの自動実行を入れる

`supabase/migrations/0042_notification_push_cron.sql` の
`<YOUR_PROJECT_REF>` と `<YOUR_SERVICE_ROLE_KEY>` を実際の値に置き換えてから、
SQL Editor で実行する。

止めたくなったら:

```sql
select cron.unschedule('cobbleworks-send-notification-push');
```

うまくいかないときは、cronが叩いた記録を見る:

```sql
select created, status_code, content
from net._http_response
order by created desc
limit 10;
```

---

## iPhone について（重要）

**iPhone / iPad は「ホーム画面に追加」しないと通知が使えません。** Appleの仕様で回避できません。

| 端末 | 必要な操作 |
|---|---|
| Android / PC | ボタンを押して「許可」だけ |
| iPhone / iPad | 共有ボタン → ホーム画面に追加 → **そのアイコンから開いて**許可 |

初めて来た人をここで諦めさせないため、`push.js` は
**iPhoneで未インストールの人にはボタンを出さず、追加の手順を番号付きで表示する**ようにしてある
（`buildIosInstallNote`）。押せないボタンは見せない。

## 気をつけること

- **通知を聞くタイミングは、必ずユーザーが押した直後だけ。**
  ページを開いた瞬間に聞くとほぼ拒否され、**ブラウザは一度拒否されると二度と聞けない**
  （ユーザーが設定画面から戻すしかない）。今は「リクエスト送信の直後」「Inboxの案内バー」
  「プロフィールのチェック」の3箇所だけで、どれもユーザーの操作が起点になっている。
- **同じ通知を二度鳴らさない**のは `pushed_at` 1本で守っている。
  手でこの列を null に戻すと、もう一度鳴る。
- 配信に失敗した通知は次の1分後に再試行されるが、**7日経つと諦める**（`MAX_AGE_DAYS`）。
- 通知の文面は `supabase/functions/notification-push/index.ts` の `COPY` に5言語ぶん。
  サイト内の文言（`script.js`）とは別物なので、直すときは両方見る。
- メール通知も一度作ったが、独自ドメインが必要なうえ迷惑メール扱いされやすく、
  「1つのプラットフォームで完結する」という方針にも合わないため取りやめた。
  コードは git 履歴に残っている（コミット `お知らせメール:` で始まるもの）。
