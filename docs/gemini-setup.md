# Gemini AI のセットアップ手順

CobbleWorks の AI 機能（いまは「AI検索」）を動かすための、1回だけやる作業。
コードはすでにリポジトリに入っているので、ここに書いてあるのは **Supabase 側の設定だけ**。

---

## 全体像

```
ブラウザ                    Supabase                        Google
────────                  ──────────                      ────────
index.html
  └ ai.js  ──POST──►  Edge Function「gemini-ai」 ──►  Gemini API
                          ├ 回数チェック（ai_usage）
                          ├ キャッシュ確認（ai_search_cache）
                          └ GEMINI_API_KEY を持っている
```

**Gemini APIキーはブラウザに一切送られない。** Edge Function の中だけに存在する。

---

## 手順 1. Gemini APIキーを取る（無料・クレカ不要）

1. https://aistudio.google.com/apikey を開く
2. Googleアカウントでログイン
3. 「Create API key」を押す
4. 表示された文字列（`AIza...` で始まる長い文字）をコピーしておく

この時点ではまだどこにも貼らない。次の手順3で使う。

---

## 手順 2. テーブルを作る

1. Supabase ダッシュボード → 左メニュー **SQL Editor**
2. `supabase/migrations/0033_ai_usage.sql` の中身を全部コピーして貼り付け
3. **Run** を押す

これで `ai_usage`（利用回数）と `ai_search_cache`（検索結果の使い回し）ができる。
どちらも **RLSポリシーを作っていない** ので、ブラウザからは読み書きできない。
触れるのは Edge Function だけ。

---

## 手順 3. Edge Function を作る

1. Supabase ダッシュボード → 左メニュー **Edge Functions**
2. **Deploy a new function** →「Via Editor」
3. 関数名に `gemini-ai` と入力（**この名前でないと ai.js から呼べない**）
4. エディタの中身を全部消し、`supabase/functions/gemini-ai/index.ts` の中身を貼り付け
5. **Deploy** を押す

### ⚠ 手順 3-b. 「Verify JWT」を OFF にする（ここが一番ハマりやすい）

Edge Function は初期状態だと「ログイン済みの人しか呼べない」設定になっている。
このままだと **未ログインの人が AI検索を押した瞬間に 401 エラー**になる。

1. `gemini-ai` の詳細画面 → **Settings**（または Details 内の設定欄）
2. **Verify JWT with legacy secret**（表示名は「Enforce JWT Verification」のこともある）を **OFF**
3. 保存

ログインしているかどうかの判定は、関数の中で自前でやっている（`auth.getUser`）ので、
ここを OFF にしても「ログイン済みは1日20回・未ログインは1日3回」の区別はちゃんと効く。

---

## 手順 4. APIキーを登録する

1. Supabase ダッシュボード → **Project Settings** → **Edge Functions** → **Secrets**
   （または Edge Functions 画面の「Secrets」タブ）
2. **Add new secret**
   - Name: `GEMINI_API_KEY`
   - Value: 手順1でコピーしたキー
3. 保存

`SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` は Supabase が自動で入れてくれるので、
登録するのはこの1つだけ。

---

## 手順 5. 動作確認

1. https://8w4jgy4rp5-commits.github.io/App-Sharing-/ を開く（キャッシュが残っていたら Ctrl+F5）
2. 検索欄に日本語で「旅行の持ち物を忘れたくない」と入れる
3. **🤖 AIに探してもらう** を押す
4. 数秒で「AIが選んだアプリ」に Packing List などが出れば成功

うまくいかないときは、ブラウザの開発者ツール（F12）→ Console と Network を見る。

| 症状 | 原因と対処 |
|---|---|
| 401 が返る | 手順 3-b の Verify JWT が OFF になっていない |
| `missing_gemini_key` | 手順4のシークレット名が `GEMINI_API_KEY` になっているか確認 |
| `gemini_error` で status 404 | モデル名が古い。`index.ts` の `GEMINI_MODEL` を AI Studio で確認できる現行モデル名に変える |
| `gemini_error` で status 429 | Gemini 側の無料枠の上限。しばらく待つ |
| `limit_reached` | 想定どおりの動作（1日の回数を使い切った）。テスト中に戻したいときは SQL Editor で `delete from ai_usage;` |
| 何も起きない | Console に `AI is not defined` が出ていないか。出ていたら `ai.js` の読み込み忘れ |

---

## 数字を変えたいとき

`supabase/functions/gemini-ai/index.ts` の先頭にまとまっている。
書き換えたら Edge Function を再Deployする。

```ts
const LIMIT_ANON = 3;     // 未ログイン: 1人1日あたり
const LIMIT_USER = 20;    // ログイン済み: 1人1日あたり
const LIMIT_GLOBAL = 500; // 全員合計: 1日あたり（無料枠を守る最終ライン）
```

---

## 今どれくらい使われているかを見る

SQL Editor で:

```sql
-- 日ごとの合計
select day, sum(used_count) as total, count(*) as people
from ai_usage group by day order by day desc;

-- キャッシュがどれだけ効いているか（行数 = Geminiを呼ばずに済んだ検索文の種類）
select count(*) from ai_search_cache;
```

---

## AI機能を増やすときの作り方

1. `index.ts` に `handleXxx()` を足し、`task` 名で分岐させる
2. **プロンプトは必ず `index.ts` の中に書く**（フロントから指示文を受け取らない）。
   自由な指示文を通すと、共有キーが「無料の汎用チャット」として使われてしまう
3. `ai.js` に呼び出し用の関数を1つ足す
4. AIが返した文字列は必ず `textContent` で画面に入れる（HTMLとして解釈させない）。
   IDやURLなど「実体」に関わるものは、AIの出力ではなく必ずDBの値を使う
