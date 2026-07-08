# Mini App Platform — Source Code

A vanilla HTML/CSS/JS web app (no framework, no backend). Users post
"requests" (problems they want a mini app for) and share "mini apps"
(links to small web apps that solve them). All data is stored in the
browser's `localStorage`. Files: `index.html`, `tokens.css` (design
tokens), `style.css`, `script.js`.

This file bundles all four source files so it can be pasted into any
AI chat for review/feedback.

## index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- ページタイトル：ブラウザのタブに表示される -->
    <title>Mini App Platform</title>
    <!-- 見出し・本文用フォント（Nunito） -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
      rel="stylesheet"
    />
    <!-- デザイントークン（色・角丸・影などの変数）を先に読み込む -->
    <link rel="stylesheet" href="tokens.css" />
    <!-- CSSファイルを読み込む -->
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>

    <!-- サイトのヘッダー -->
    <header>
      <h1>Mini App Platform</h1>
      <p>Share a problem. Find a mini app. Or build one.</p>
    </header>

    <main>

      <!-- 検索欄 -->
      <section id="search-section">
        <input
          type="text"
          id="searchInput"
          placeholder="Search requests and mini apps..."
          aria-label="Search requests and mini apps"
        />
      </section>

      <!-- リクエスト投稿フォーム -->
      <section id="request-form-section">
        <h2>Submit a Request</h2>
        <form id="requestForm">

          <!-- どんな困りごとか -->
          <div class="form-group">
            <label for="problem">Problem</label>
            <small>What are you struggling with?</small>
            <textarea
              id="problem"
              placeholder="e.g. I spend too much time switching between apps to track invoices"
              required
            ></textarea>
          </div>

          <!-- あったらいいなと思うもの -->
          <div class="form-group">
            <label for="desiredFeatures">Desired features</label>
            <small>What would make it better?</small>
            <textarea
              id="desiredFeatures"
              placeholder="e.g. A simple dashboard to track all invoices in one place"
              required
            ></textarea>
          </div>

          <!-- 投稿者名（任意） -->
          <div class="form-group">
            <label for="requesterName">Your name</label>
            <small>Optional — shown as "Shared by ..."</small>
            <input
              type="text"
              id="requesterName"
              placeholder="e.g. Ken"
              maxlength="30"
            />
          </div>

          <button type="submit">Submit a request</button>

        </form>
      </section>

      <!-- リクエスト一覧（カードがここに追加される） -->
      <section id="requests-list-section">
        <h2>Requests</h2>
        <!-- カウントはブラウザ内だけの仮の数字であることを注記する -->
        <p class="local-note">* "I want this too" counts are stored locally and not shared across users.</p>
        <div id="requestsList">
          <!-- JavaScriptでカードを動的に追加する -->
        </div>
      </section>

      <!-- ミニアプリ投稿フォーム -->
      <section id="app-form-section">
        <h2>Submit a Mini App</h2>
        <form id="appForm">

          <!-- アプリ名 -->
          <div class="form-group">
            <label for="appName">Mini app name</label>
            <small>What is your app called?</small>
            <input
              type="text"
              id="appName"
              placeholder="e.g. Invoice Tracker"
              required
            />
          </div>

          <!-- 説明 -->
          <div class="form-group">
            <label for="appDescription">Description</label>
            <small>What does it do?</small>
            <textarea
              id="appDescription"
              placeholder="e.g. A simple tool to track invoices for freelancers"
              required
            ></textarea>
          </div>

          <!-- URL -->
          <div class="form-group">
            <label for="appUrl">App URL</label>
            <small>Where can people find it?</small>
            <input
              type="url"
              id="appUrl"
              placeholder="https://your-app.example.com"
              required
            />
          </div>

          <!-- 対象ユーザー -->
          <div class="form-group">
            <label for="appTargetUsers">Target users</label>
            <small>Who is this app for?</small>
            <input
              type="text"
              id="appTargetUsers"
              placeholder="e.g. Freelancers who manage multiple clients"
              required
            />
          </div>

          <!-- どのリクエストに応えたか（選択式） -->
          <div class="form-group">
            <label for="builtForRequest">Built for request</label>
            <small>Which request does this app answer? (optional)</small>
            <select id="builtForRequest">
              <option value="">— Not linked to a request —</option>
              <!-- JavaScriptでリクエスト一覧が追加される -->
            </select>
          </div>

          <!-- 投稿者名（任意） -->
          <div class="form-group">
            <label for="appAuthor">Your name</label>
            <small>Optional — shown as "Shared by ..."</small>
            <input
              type="text"
              id="appAuthor"
              placeholder="e.g. Ken"
              maxlength="30"
            />
          </div>

          <button type="submit">Submit a mini app</button>

        </form>
      </section>

      <!-- ミニアプリ一覧（カードがここに追加される） -->
      <section id="apps-list-section">
        <h2>Mini Apps</h2>
        <div id="appsList">
          <!-- JavaScriptでカードを動的に追加する -->
        </div>
      </section>

      <!-- データ共有（エクスポート／インポート） -->
      <section id="data-section">
        <h2>Share Data</h2>
        <p class="data-note">
          Data is stored only in this browser. Export it as a file and send it
          to a friend — they can import it to see your requests and mini apps.
          Importing merges with your existing data — nothing is overwritten or
          deleted.
        </p>
        <div class="data-buttons">
          <button type="button" id="exportBtn" class="map-btn map-btn--primary">
            ⬇ Export data
          </button>
          <button type="button" id="importBtn" class="map-btn map-btn--secondary">
            ⬆ Import data
          </button>
          <input
            type="file"
            id="importFile"
            accept=".json,application/json"
            hidden
          />
        </div>
      </section>

    </main>

    <!-- JavaScriptファイルを読み込む（bodyの最後に置くのが基本） -->
    <script src="script.js"></script>
  </body>
</html>
```

## tokens.css

```css
/* =====================================================================
   Mini App Platform — Design Tokens (Terracotta & Cream)
   Warm, community-first theme. Drop this in and use the CSS variables.
   Font: Nunito (400/600/700/800)
   ===================================================================== */

:root {
  /* ---- Surfaces ---- */
  --map-bg:            #FAF4EC; /* page background (warm off-white) */
  --map-card:          #FFFFFF; /* card background */
  --map-border:        #EDE2D4; /* borders / hairlines */
  --map-divider:       #F4EBDF; /* in-card divider line */

  /* ---- Text ---- */
  --map-ink:           #3D3229; /* headings & body */
  --map-text-2:        #6B5F51; /* secondary text */
  --map-muted:         #8C7F70; /* muted text */
  --map-faint:         #B5A794; /* faintest (dates, meta) */

  /* ---- Accent (terracotta) ---- */
  --map-accent:        #D9704C; /* primary accent */
  --map-accent-hover:  #C25B39; /* accent hover / chip text */
  --map-accent-tint:   #F8E4DA; /* chip / soft tint background */
  --map-accent-line:   #E8C9BB; /* outline-button border */

  /* ---- Support ---- */
  --map-success:       #2E9E54; /* app-link / success text */
  --map-success-tint:  #F0FAF3; /* success background */
  --map-success-hover: #DDF4E4; /* success hover background */
  --map-star:          #F5A623; /* rating stars */
  --map-error:         #C0392B; /* form error text */
  --map-toast-bg:      #3D3229; /* toast background */
  --map-toast-text:    #FAF4EC; /* toast text */

  /* ---- Overlays & shadows ---- */
  --map-modal-scrim:   rgba(61,50,41,0.40);
  --map-shadow-card:   0 2px 10px rgba(60,40,20,0.06);
  --map-shadow-modal:  0 24px 60px rgba(60,40,20,0.30);
  --map-focus-ring:    0 0 0 3px rgba(217,112,76,0.15);

  /* ---- Radii ---- */
  --map-radius-card:   20px;
  --map-radius-modal:  24px;
  --map-radius-logo:   12px;
  --map-radius-icon:   14px;
  --map-radius-pill:   999px; /* buttons, chips, search, tabs */

  /* ---- Typography ---- */
  --map-font:          "Nunito", sans-serif;
  --map-size-title:    26px;  /* page title,   weight 800 */
  --map-size-card:     17px;  /* card title,   weight 800 */
  --map-size-body:     14px;  /* body,         line-height 1.5 */
  --map-size-label:    11px;  /* uppercase micro-label */
  --map-label-spacing: 0.06em;
}

/* =====================================================================
   Optional ready-made component classes
   ===================================================================== */

body {
  margin: 0;
  background: var(--map-bg);
  color: var(--map-ink);
  font-family: var(--map-font);
}

.map-card {
  background: var(--map-card);
  border-radius: var(--map-radius-card);
  padding: 22px;
  box-shadow: var(--map-shadow-card);
}

.map-title      { font-size: var(--map-size-title); font-weight: 800; }
.map-card-title { font-size: var(--map-size-card);  font-weight: 800; line-height: 1.4; }
.map-body       { font-size: var(--map-size-body);  line-height: 1.5; color: var(--map-text-2); }
.map-label {
  font-size: var(--map-size-label);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: var(--map-label-spacing);
  color: var(--map-faint);
}
.map-meta { font-size: 12px; color: var(--map-faint); }

/* Chips */
.map-chip {
  display: inline-block;
  background: var(--map-accent-tint);
  color: var(--map-accent-hover);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--map-radius-pill);
}
.map-chip--success {
  background: var(--map-success-tint);
  color: var(--map-success);
}

/* Buttons */
.map-btn {
  font-family: var(--map-font);
  font-size: 14px;
  font-weight: 700;
  border-radius: var(--map-radius-pill);
  padding: 10px 18px;
  cursor: pointer;
  border: none;
}
.map-btn--primary            { background: var(--map-accent); color: #fff; }
.map-btn--primary:hover      { background: var(--map-accent-hover); }
.map-btn--secondary          { background: var(--map-card); color: var(--map-accent-hover); border: 1.5px solid var(--map-accent-line); }
.map-btn--secondary:hover    { background: var(--map-accent-tint); }

/* Inputs */
.map-input,
.map-select,
.map-textarea {
  font-family: var(--map-font);
  font-size: 15px;
  padding: 12px 16px;
  border: 1.5px solid var(--map-border);
  border-radius: 12px;
  background: var(--map-card);
  color: var(--map-ink);
  box-sizing: border-box;
}
.map-input:focus,
.map-select:focus,
.map-textarea:focus {
  outline: none;
  border-color: var(--map-accent);
  box-shadow: var(--map-focus-ring);
}
.map-input--pill { border-radius: var(--map-radius-pill); }

/* Toast */
.map-toast {
  background: var(--map-toast-bg);
  color: var(--map-toast-text);
  font-family: var(--map-font);
  font-weight: 700;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: var(--map-radius-pill);
  box-shadow: var(--map-shadow-modal);
}
```

## style.css

```css
/* ===========================
   Mini App Platform - スタイル
   暖色系（テラコッタ）デザイン
   色・角丸・影などの変数は tokens.css を参照
   =========================== */

/* 基本のbody設定 */
body {
  font-family: var(--map-font);
  padding: 40px 20px;
  box-sizing: border-box;
}

/* コンテンツの横幅を制限して中央揃えにする */
header, main {
  max-width: 680px;
  margin: 0 auto;
}

/* 検索欄 */
#search-section {
  margin-bottom: 32px;
}

#searchInput {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-family: inherit;
  border: 1.5px solid var(--map-border);
  border-radius: var(--map-radius-pill);
  box-sizing: border-box;
  background-color: var(--map-card);
  color: var(--map-ink);
}

#searchInput:focus {
  outline: none;
  border-color: var(--map-accent);
  box-shadow: var(--map-focus-ring);
}

/* ヘッダー */
header {
  margin-bottom: 40px;
}

header h1 {
  font-size: var(--map-size-title);
  font-weight: 800;
  margin-bottom: 4px;
}

header p {
  color: var(--map-text-2);
  margin: 0;
}

/* 各セクションの見出し */
h2 {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 16px;
}

/* フォームセクション */
#request-form-section {
  background: var(--map-card);
  border-radius: var(--map-radius-card);
  padding: 22px;
  margin-bottom: 40px;
  box-shadow: var(--map-shadow-card);
}

/* フォームの各グループ（ラベル＋入力欄） */
.form-group {
  margin-bottom: 20px;
}

/* ラベル */
.form-group label {
  display: block;            /* 1行で表示 */
  font-weight: 700;
  margin-bottom: 2px;
}

/* ラベル下の説明文 */
.form-group small {
  display: block;
  color: var(--map-muted);
  font-size: 13px;
  margin-bottom: 6px;
}

/* テキスト入力欄 */
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  border: 1.5px solid var(--map-border);
  border-radius: 12px;
  box-sizing: border-box;    /* paddingを幅に含める */
  background-color: var(--map-card);
  color: var(--map-ink);
}

/* 複数行入力欄の高さ */
.form-group textarea {
  height: 80px;
  resize: vertical;          /* 縦方向にだけリサイズ可能 */
}

/* 入力欄にフォーカスしたときの枠線 */
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--map-accent);
  box-shadow: var(--map-focus-ring);
}

/* 送信ボタン */
button[type="submit"] {
  background-color: var(--map-accent);
  color: #fff;
  border: none;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  border-radius: var(--map-radius-pill);
  cursor: pointer;           /* マウスをのせると手のアイコンに */
}

button[type="submit"]:hover {
  background-color: var(--map-accent-hover);
}

/* ===========================
   リクエストカード
   =========================== */

/* カード1枚のスタイル */
.request-card {
  position: relative;       /* 削除ボタンを右上に固定表示するため */
  background: var(--map-card);
  border-radius: var(--map-radius-card);
  padding: 22px;
  margin-bottom: 16px;
  box-shadow: var(--map-shadow-card);
}

/* 削除ボタン（右上） */
.delete-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 14px;
  color: var(--map-faint);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
}

.delete-btn:hover {
  color: var(--map-error);
  background-color: rgba(192,57,43,0.08);
}

/* カードタイトル（困りごと・アクセント色） */
.card-title {
  font-size: var(--map-size-card);
  font-weight: 800;
  line-height: 1.4;
  /* 白背景では--map-accentだとコントラスト不足のため、濃い方のアクセント色を使う */
  color: var(--map-accent-hover);
  margin: 0 40px 12px 0; /* 右側は削除ボタンとの重なりを避ける */
  overflow-wrap: break-word; /* 長い単語やURLでもカードからはみ出さない */
}

/* Problem / Current workaround などのラベル */
.card-label {
  font-size: var(--map-size-label);
  font-weight: 800;
  text-transform: uppercase; /* 小文字で書いても大文字で表示される */
  letter-spacing: var(--map-label-spacing);
  color: var(--map-muted);
  margin: 12px 0 2px;
}

/* ラベルの下の本文 */
.card-text {
  margin: 0;
  font-size: var(--map-size-body);
  line-height: 1.5;
  overflow-wrap: break-word; /* 長い単語やURLでもカードからはみ出さない */
}

/* 投稿日 */
.card-date {
  font-size: 12px;
  color: var(--map-faint);
  margin-top: 16px;
  margin-bottom: 0;
}

/* I want this too ボタンエリア */
.card-want-area {
  display: flex;           /* ボタンとカウントを横並びにする */
  align-items: center;
  flex-wrap: wrap;         /* 狭い画面ではボタンを折り返す */
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--map-divider); /* 上に薄い区切り線 */
}

/* Build this ボタン（ミニアプリ作成へ誘導・緑） */
.build-btn {
  background-color: var(--map-success-tint);
  color: var(--map-success);
  border: 1.5px solid transparent; /* want-btnと高さを揃えるための透明ボーダー */
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  border-radius: var(--map-radius-pill);
  cursor: pointer;
}

.build-btn:hover {
  background-color: var(--map-success-hover);
}

/* I want this too ボタン */
.want-btn {
  background-color: var(--map-card);
  color: var(--map-accent-hover);
  border: 1.5px solid var(--map-accent-line);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  border-radius: var(--map-radius-pill);
  cursor: pointer;
}

.want-btn:hover {
  background-color: var(--map-accent-tint);
}

/* カウント表示 */
.want-count {
  font-size: 14px;
  color: var(--map-text-2);
  margin: 0;
}

/* ローカルカウントの注記 */
.local-note {
  font-size: 12px;
  color: var(--map-faint);
  margin-top: 8px;
}

/* ===========================
   ミニアプリフォームセクション
   =========================== */

#app-form-section {
  background: var(--map-card);
  border-radius: var(--map-radius-card);
  padding: 22px;
  margin-bottom: 40px;
  box-shadow: var(--map-shadow-card);
}

/* selectボックス（ドロップダウン） */
.form-group select {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  border: 1.5px solid var(--map-border);
  border-radius: 12px;
  box-sizing: border-box;
  background-color: var(--map-card);
  color: var(--map-ink);
}

.form-group select:focus {
  outline: none;
  border-color: var(--map-accent);
  box-shadow: var(--map-focus-ring);
}

/* ===========================
   ミニアプリカード
   =========================== */

.app-card {
  background: var(--map-card);
  border-radius: var(--map-radius-card);
  padding: 22px;
  margin-bottom: 16px;
  box-shadow: var(--map-shadow-card);
  border-left: 4px solid var(--map-success); /* 左に緑のアクセント線（リクエストカードと区別する） */
}

/* アプリ名リンク */
.app-name {
  display: block;
  font-size: var(--map-size-card);
  font-weight: 800;
  line-height: 1.4;
  color: var(--map-success);
  text-decoration: none;
  margin-bottom: 8px;
  overflow-wrap: break-word; /* 長い単語やURLでもカードからはみ出さない */
}

.app-name:hover {
  text-decoration: underline;
}

/* アプリの説明文 */
.app-description {
  color: var(--map-text-2);
  font-size: var(--map-size-body);
  line-height: 1.5;
  margin-bottom: 12px;
}

/* Built for request の表示 */
.app-request-text {
  background-color: var(--map-success-tint);
  border-radius: 10px;
  padding: 8px 10px;
}

/* ===========================
   リクエストカード内のアプリ表示
   =========================== */

.card-linked-apps {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--map-divider);
}

/* 紐づいたアプリへのリンク（公式リンク＝緑のチップ） */
.linked-app-link {
  display: inline-block;
  background-color: var(--map-success-tint);
  color: var(--map-success);
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--map-radius-pill);
  margin-right: 8px;
  margin-top: 6px;
}

.linked-app-link:hover {
  background-color: var(--map-success-hover);
}

/* ===========================
   関連アプリの提案（吹き出し）
   =========================== */

.card-related-apps {
  margin-top: 12px;
}

/* 吹き出し本体 */
.related-bubble {
  position: relative;
  background-color: var(--map-bg);   /* ページ背景色でやわらかく馴染ませる */
  border: 1.5px dashed var(--map-border);
  border-radius: 14px;
  padding: 10px 12px;
  margin-top: 8px;
}

/* 吹き出しの三角（上に付ける） */
.related-bubble::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 16px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--map-bg);
}

.related-bubble-label {
  font-size: var(--map-size-label);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: var(--map-label-spacing);
  color: var(--map-muted);
  margin: 0 0 6px;
}

/* 提案リンクはアウトラインのチップ（＝まだ確定していない候補という見た目） */
.related-app-link {
  display: inline-block;
  background-color: var(--map-card);
  color: var(--map-accent-hover);
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--map-radius-pill);
  border: 1.5px solid var(--map-accent-line);
  margin-right: 8px;
  margin-top: 4px;
}

.related-app-link:hover {
  background-color: var(--map-accent-tint);
}

/* ===========================
   データ共有セクション
   =========================== */

#data-section {
  background: var(--map-card);
  border-radius: var(--map-radius-card);
  padding: 22px;
  margin-bottom: 40px;
  box-shadow: var(--map-shadow-card);
}

.data-note {
  font-size: var(--map-size-body);
  line-height: 1.5;
  color: var(--map-text-2);
  margin: 0 0 16px;
}

.data-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap; /* 狭い画面ではボタンを折り返す */
}

/* ===========================
   トースト（画面下の通知）
   見た目はtokens.cssの.map-toast、ここでは位置と動きだけ指定
   =========================== */

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  max-width: calc(100vw - 32px); /* 狭い画面でも画面からはみ出さない */
  box-sizing: border-box;
  text-align: center;
  animation: toast-in 0.2s ease;
}

@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

/* アニメーションを減らす設定のユーザーには動きを付けない */
@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
}

/* ===========================
   星評価
   =========================== */

.star-rating-area {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--map-divider);
}

/* 平均点の表示行 */
.star-average-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

/* 平均を示す星（金色） */
.average-stars {
  font-size: 18px;
  color: var(--map-star);
  letter-spacing: 2px;
}

/* 平均点と件数のテキスト */
.rating-info {
  font-size: 13px;
  color: var(--map-muted);
}

/* クリックして評価する行 */
.star-rate-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-label {
  font-size: 13px;
  color: var(--map-faint);
}

/* クリック可能な星ボタン */
.star-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--map-star);
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.star-btn:hover {
  transform: scale(1.2); /* ホバー時に少し大きくする */
}
```

## script.js

```js
// ===========================
// Mini App Platform - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const WANTED_KEY = 'wantedCounts';
const APPS_STORAGE_KEY = 'miniApps';
const RATINGS_KEY = 'appRatings'; // アプリ評価の保存キー

const POSTER_NAME_KEY = 'posterName'; // 投稿者名（毎回入力しなくて済むように覚えておく）

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', function () {
  renderRequests();
  populateRequestDropdown();
  renderApps();

  // 前回入力した名前があればフォームに入れておく
  const savedName = localStorage.getItem(POSTER_NAME_KEY) || '';
  document.getElementById('requesterName').value = savedName;
  document.getElementById('appAuthor').value = savedName;

  // 検索欄への入力をリアルタイムで監視する
  document.getElementById('searchInput').addEventListener('input', function () {
    const query = this.value.trim();
    renderRequests(query);
    renderApps(query);
  });

  // タイポ自動修正を、自由入力の欄に付ける
  ['problem', 'desiredFeatures', 'appName', 'appDescription', 'appTargetUsers'].forEach(function (id) {
    enableAutoCorrect(document.getElementById(id));
  });

  // エクスポート／インポート
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function () {
    if (this.files.length > 0) {
      importData(this.files[0]);
      this.value = ''; // 同じファイルをもう一度選べるようにリセット
    }
  });
});

// 投稿者名を覚えておき、次回から自動入力する
function rememberPosterName(name) {
  if (name) {
    localStorage.setItem(POSTER_NAME_KEY, name);
  }
}

// =====================
// リクエスト関連
// =====================

document.getElementById('requestForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const request = {
    id: Date.now(),
    problem: document.getElementById('problem').value.trim(),
    desiredFeatures: document.getElementById('desiredFeatures').value.trim(),
    postedBy: document.getElementById('requesterName').value.trim(),
    createdAt: new Date().toLocaleDateString('en-US')
  };

  // 空白だけの入力はrequired属性をすり抜けるので、trim後にチェックする
  if (!request.problem || !request.desiredFeatures) {
    showToast('Please fill in all fields');
    return;
  }

  saveRequest(request);
  rememberPosterName(request.postedBy);
  renderRequests();
  populateRequestDropdown();
  this.reset();
  // reset()で名前欄も消えるので入れ直す
  document.getElementById('requesterName').value = request.postedBy;
  showToast('Request posted!');
});

function saveRequest(request) {
  const requests = getRequests();
  requests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function getRequests() {
  // データが壊れていても画面全体が止まらないようにtry/catchで守る
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// リクエストを削除する
// 注意：現状はログイン機能が無いため誰でも削除できる。
// 投稿主だけが削除できるようにするには、将来的にユーザー識別の仕組みが必要。
function deleteRequest(id) {
  const requests = getRequests().filter(function (r) {
    return String(r.id) !== String(id);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

  // 紐づくI want thisカウントも一緒に削除する
  const counts = getWantedCounts();
  delete counts[id];
  localStorage.setItem(WANTED_KEY, JSON.stringify(counts));
}

// http/https以外のURL（javascript: など）をリンクとして使わないためのチェック
function isSafeUrl(url) {
  // URLが無い・文字列でないデータはリンクにしない
  if (typeof url !== 'string' || url === '') return false;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// リクエストとミニアプリの文章から、共通する単語（4文字以上）を探す
function tokenize(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(function (word) {
    return word.length >= 4;
  });
}

// 正式に紐づいていないが、内容が近そうなミニアプリを探す
function getRelatedApps(request, linkedApps) {
  // 古い投稿にしか無い項目は空文字として扱う
  const requestWords = new Set(tokenize([
    request.problem || '',
    request.desiredFeatures || '',
    request.targetUsers || '',
    request.currentWorkaround || ''
  ].join(' ')));

  const linkedIds = linkedApps.map(function (app) { return String(app.id); });

  return getApps().filter(function (app) {
    if (linkedIds.indexOf(String(app.id)) !== -1) return false;

    const appWords = tokenize([app.name, app.description, app.targetUsers].join(' '));
    const matched = new Set();
    appWords.forEach(function (word) {
      if (requestWords.has(word)) matched.add(word);
    });
    return matched.size >= 2;
  });
}

function renderRequests(query) {
  let requests = getRequests();
  const list = document.getElementById('requestsList');

  list.innerHTML = '';

  if (query) {
    const q = query.toLowerCase();
    // 古い投稿にはtargetUsers等が残っているので、無い項目は空文字として扱う
    requests = requests.filter(function (r) {
      return (
        (r.problem || '').toLowerCase().includes(q) ||
        (r.desiredFeatures || '').toLowerCase().includes(q) ||
        (r.targetUsers || '').toLowerCase().includes(q) ||
        (r.currentWorkaround || '').toLowerCase().includes(q)
      );
    });
  }

  if (requests.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = query
      ? 'No results found. Can\'t find what you need? Submit a request.'
      : 'No requests yet. Be the first to submit one!';
    list.appendChild(empty);
    return;
  }

  const sorted = [...requests].reverse();
  sorted.forEach(function (request) {
    list.appendChild(createCard(request));
  });
}

function createCard(request) {
  const card = document.createElement('div');
  card.className = 'request-card';

  // カードのタイトル（困りごとをそのまま見出しにする）
  const title = document.createElement('p');
  title.className = 'card-title';
  title.textContent = request.problem;

  const featuresLabel = document.createElement('p');
  featuresLabel.className = 'card-label';
  featuresLabel.textContent = 'Desired features';

  const featuresText = document.createElement('p');
  featuresText.className = 'card-text';
  featuresText.textContent = request.desiredFeatures;

  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = request.postedBy
    ? 'Shared by ' + request.postedBy + ' · ' + request.createdAt
    : 'Posted on ' + request.createdAt;

  // 削除ボタン（右上に表示）
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '🗑';
  deleteBtn.setAttribute('aria-label', 'Delete this request');
  deleteBtn.title = 'Delete this request';
  deleteBtn.addEventListener('click', function () {
    if (confirm('Delete this request? This cannot be undone.')) {
      deleteRequest(request.id);
      renderRequests();
      populateRequestDropdown();
      showToast('Request deleted');
    }
  });
  card.appendChild(deleteBtn);

  // I want this too ボタンエリア
  const wantArea = document.createElement('div');
  wantArea.className = 'card-want-area';

  const wantBtn = document.createElement('button');
  wantBtn.type = 'button';
  wantBtn.className = 'want-btn';
  wantBtn.textContent = '⭐ I want this too';
  wantBtn.addEventListener('click', function () {
    incrementWantedCount(request.id);
    renderRequests();
  });

  const wantCount = document.createElement('p');
  wantCount.className = 'want-count';
  const count = getWantedCount(request.id);
  if (count === 1) {
    wantCount.textContent = '⭐ 1 person wants this';
  } else if (count > 1) {
    wantCount.textContent = '⭐ ' + count + ' people want this';
  }

  // Build this ボタン：ミニアプリ投稿フォームへ誘導し、このリクエストを自動選択する
  const buildBtn = document.createElement('button');
  buildBtn.type = 'button';
  buildBtn.className = 'build-btn';
  buildBtn.textContent = '🔨 Build this';
  buildBtn.addEventListener('click', function () {
    document.getElementById('builtForRequest').value = String(request.id);
    document.getElementById('app-form-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('appName').focus({ preventScroll: true });
    showToast('Request selected in the mini app form below');
  });

  wantArea.appendChild(wantBtn);
  wantArea.appendChild(buildBtn);
  wantArea.appendChild(wantCount);

  // Apps built for this request
  const linkedApps = getApps().filter(function (app) {
    return String(app.builtForRequestId) === String(request.id);
  });

  const appsArea = document.createElement('div');
  appsArea.className = 'card-linked-apps';

  if (linkedApps.length > 0) {
    const appsLabel = document.createElement('p');
    appsLabel.className = 'card-label';
    appsLabel.textContent = 'Apps built for this request';
    appsArea.appendChild(appsLabel);

    linkedApps.forEach(function (app) {
      if (!isSafeUrl(app.url)) return;
      const appLink = document.createElement('a');
      appLink.href = app.url;
      appLink.target = '_blank';
      appLink.rel = 'noopener noreferrer';
      appLink.className = 'linked-app-link';
      appLink.textContent = app.name + ' ↗';
      appsArea.appendChild(appLink);
    });
  }

  // Maybe also relevant（正式リンクされていないが内容が近いミニアプリの提案）
  const relatedApps = getRelatedApps(request, linkedApps);
  const relatedArea = document.createElement('div');
  relatedArea.className = 'card-related-apps';

  if (relatedApps.length > 0) {
    const bubble = document.createElement('div');
    bubble.className = 'related-bubble';

    const bubbleLabel = document.createElement('p');
    bubbleLabel.className = 'related-bubble-label';
    bubbleLabel.textContent = '💡 Maybe also relevant';
    bubble.appendChild(bubbleLabel);

    relatedApps.forEach(function (app) {
      if (!isSafeUrl(app.url)) return;
      const relatedLink = document.createElement('a');
      relatedLink.href = app.url;
      relatedLink.target = '_blank';
      relatedLink.rel = 'noopener noreferrer';
      relatedLink.className = 'related-app-link';
      relatedLink.textContent = app.name + ' ↗';
      bubble.appendChild(relatedLink);
    });

    relatedArea.appendChild(bubble);
  }

  card.appendChild(title);
  card.appendChild(featuresLabel);
  card.appendChild(featuresText);

  // 昔の投稿にだけ残っている項目は、ある場合だけ表示する
  if (request.targetUsers) {
    const usersLabel = document.createElement('p');
    usersLabel.className = 'card-label';
    usersLabel.textContent = 'Target users';

    const usersText = document.createElement('p');
    usersText.className = 'card-text';
    usersText.textContent = request.targetUsers;

    card.appendChild(usersLabel);
    card.appendChild(usersText);
  }

  if (request.currentWorkaround) {
    const workaroundLabel = document.createElement('p');
    workaroundLabel.className = 'card-label';
    workaroundLabel.textContent = 'Current workaround';

    const workaroundText = document.createElement('p');
    workaroundText.className = 'card-text';
    workaroundText.textContent = request.currentWorkaround;

    card.appendChild(workaroundLabel);
    card.appendChild(workaroundText);
  }

  card.appendChild(date);
  card.appendChild(wantArea);
  card.appendChild(appsArea);
  card.appendChild(relatedArea);

  return card;
}

function getWantedCounts() {
  try {
    const data = localStorage.getItem(WANTED_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function getWantedCount(id) {
  return getWantedCounts()[id] || 0;
}

function incrementWantedCount(id) {
  const counts = getWantedCounts();
  counts[id] = (counts[id] || 0) + 1;
  localStorage.setItem(WANTED_KEY, JSON.stringify(counts));
}

// =====================
// ミニアプリ関連
// =====================

function populateRequestDropdown() {
  const select = document.getElementById('builtForRequest');
  const previous = select.value; // 再構築で選択が消えないように覚えておく
  const requests = getRequests();

  select.innerHTML = '<option value="">— Not linked to a request —</option>';

  requests.forEach(function (request) {
    const option = document.createElement('option');
    option.value = request.id;
    // インポートしたデータにproblemが無い場合に備えて文字列かどうか確認する
    const problem = typeof request.problem === 'string' ? request.problem : '';
    const preview = problem.length > 60
      ? problem.slice(0, 60) + '...'
      : problem;
    option.textContent = preview;
    select.appendChild(option);
  });

  // 以前選んでいたリクエストがまだ残っていれば選択を戻す
  const stillExists = Array.prototype.some.call(select.options, function (o) {
    return o.value === previous;
  });
  if (stillExists) {
    select.value = previous;
  }
}

document.getElementById('appForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const appUrl = document.getElementById('appUrl').value;
  if (!isSafeUrl(appUrl)) {
    alert('Please enter a valid http:// or https:// URL.');
    return;
  }

  const app = {
    id: Date.now(),
    name: document.getElementById('appName').value.trim(),
    description: document.getElementById('appDescription').value.trim(),
    url: appUrl,
    targetUsers: document.getElementById('appTargetUsers').value.trim(),
    builtForRequestId: document.getElementById('builtForRequest').value || null,
    postedBy: document.getElementById('appAuthor').value.trim(),
    createdAt: new Date().toLocaleDateString('en-US')
  };

  // 空白だけの入力はrequired属性をすり抜けるので、trim後にチェックする
  if (!app.name || !app.description || !app.targetUsers) {
    showToast('Please fill in all fields');
    return;
  }

  saveApp(app);
  rememberPosterName(app.postedBy);
  renderApps();
  renderRequests(); // リクエストカード側の「Apps built for this request」も更新する
  this.reset();
  document.getElementById('appAuthor').value = app.postedBy;
  populateRequestDropdown();
  showToast('Mini app shared!');
});

function saveApp(app) {
  const apps = getApps();
  apps.push(app);
  localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
}

function getApps() {
  try {
    const data = localStorage.getItem(APPS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function renderApps(query) {
  let apps = getApps();
  const list = document.getElementById('appsList');

  list.innerHTML = '';

  if (query) {
    const q = query.toLowerCase();
    // インポートしたデータに項目が欠けていても落ちないように空文字として扱う
    apps = apps.filter(function (app) {
      return (
        (app.name || '').toLowerCase().includes(q) ||
        (app.description || '').toLowerCase().includes(q) ||
        (app.targetUsers || '').toLowerCase().includes(q)
      );
    });
  }

  if (apps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = query
      ? 'No results found.'
      : 'No mini apps yet. Build one for a request above!';
    list.appendChild(empty);
    return;
  }

  [...apps].reverse().forEach(function (app) {
    list.appendChild(createAppCard(app));
  });
}

function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';

  // アプリ名（外部リンク）
  const nameLink = document.createElement('a');
  if (isSafeUrl(app.url)) {
    nameLink.href = app.url;
    nameLink.target = '_blank';
    nameLink.rel = 'noopener noreferrer';
  }
  nameLink.className = 'app-name';
  nameLink.textContent = app.name + ' ↗';

  // 説明
  const description = document.createElement('p');
  description.className = 'card-text app-description';
  description.textContent = app.description;

  // Target users
  const usersLabel = document.createElement('p');
  usersLabel.className = 'card-label';
  usersLabel.textContent = 'Target users';

  const usersText = document.createElement('p');
  usersText.className = 'card-text';
  usersText.textContent = app.targetUsers;

  card.appendChild(nameLink);
  card.appendChild(description);
  card.appendChild(usersLabel);
  card.appendChild(usersText);

  // Built for request
  if (app.builtForRequestId) {
    const linked = getRequests().find(function (r) {
      return String(r.id) === String(app.builtForRequestId);
    });

    if (linked) {
      const requestLabel = document.createElement('p');
      requestLabel.className = 'card-label';
      requestLabel.textContent = 'Built for request';

      const requestText = document.createElement('p');
      requestText.className = 'card-text app-request-text';
      requestText.textContent = linked.problem;

      card.appendChild(requestLabel);
      card.appendChild(requestText);
    }
  }

  // 投稿日（投稿者名があれば一緒に表示する）
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = app.postedBy
    ? 'Shared by ' + app.postedBy + ' · ' + app.createdAt
    : 'Posted on ' + app.createdAt;

  // 星評価エリア
  const ratingArea = createStarRating(app.id);

  card.appendChild(date);
  card.appendChild(ratingArea);

  return card;
}

// =====================
// 星評価関連
// =====================

// localStorageから全評価を取得する
function getAllRatings() {
  try {
    const data = localStorage.getItem(RATINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

// 特定アプリの評価一覧を取得する
function getRatings(appId) {
  return getAllRatings()[String(appId)] || [];
}

// 評価を追加してlocalStorageに保存する
function addRating(appId, rating) {
  const all = getAllRatings();
  const key = String(appId);
  if (!all[key]) all[key] = [];
  all[key].push(rating);
  localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
}

// 星評価UIを組み立てる関数
function createStarRating(appId) {
  const area = document.createElement('div');
  area.className = 'star-rating-area';

  const ratings = getRatings(appId);
  const count = ratings.length;
  const average = count > 0
    ? ratings.reduce(function (sum, r) { return sum + r; }, 0) / count
    : 0;

  // --- 平均点の表示行 ---
  const averageRow = document.createElement('div');
  averageRow.className = 'star-average-row';

  // 四捨五入した数だけ★を埋める
  const filled = Math.round(average);
  let starsText = '';
  for (let i = 1; i <= 5; i++) {
    starsText += i <= filled ? '★' : '☆';
  }

  const averageStars = document.createElement('span');
  averageStars.className = 'average-stars';
  averageStars.textContent = starsText;

  const ratingInfo = document.createElement('span');
  ratingInfo.className = 'rating-info';
  if (count === 0) {
    ratingInfo.textContent = 'No ratings yet';
  } else if (count === 1) {
    ratingInfo.textContent = average.toFixed(1) + ' (1 rating)';
  } else {
    ratingInfo.textContent = average.toFixed(1) + ' (' + count + ' ratings)';
  }

  averageRow.appendChild(averageStars);
  averageRow.appendChild(ratingInfo);

  // --- クリックして評価する行 ---
  const rateRow = document.createElement('div');
  rateRow.className = 'star-rate-row';

  const rateLabel = document.createElement('span');
  rateLabel.className = 'rate-label';
  rateLabel.textContent = 'Rate this app:';

  const clickableStars = document.createElement('span');
  clickableStars.className = 'clickable-stars';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'star-btn';
    star.textContent = '☆';
    star.setAttribute('aria-label', i + ' stars');

    // ホバー・フォーカス時：カーソル（キーボード操作）の位置まで星を光らせる
    const previewStars = (function (rating) {
      return function () {
        const btns = clickableStars.querySelectorAll('.star-btn');
        btns.forEach(function (btn, idx) {
          btn.textContent = idx < rating ? '★' : '☆';
        });
      };
    })(i);
    star.addEventListener('mouseenter', previewStars);
    star.addEventListener('focus', previewStars); // キーボード（Tab移動）でも同じ動きにする

    // ホバー・フォーカスが外れたら元に戻す
    const resetStars = function () {
      clickableStars.querySelectorAll('.star-btn').forEach(function (btn) {
        btn.textContent = '☆';
      });
    };
    star.addEventListener('mouseleave', resetStars);
    star.addEventListener('blur', resetStars);

    // クリックで評価を保存して再描画する
    star.addEventListener('click', (function (rating) {
      return function () {
        addRating(appId, rating);
        renderApps();
      };
    })(i));

    clickableStars.appendChild(star);
  }

  rateRow.appendChild(rateLabel);
  rateRow.appendChild(clickableStars);

  area.appendChild(averageRow);
  area.appendChild(rateRow);

  return area;
}

// =====================
// データ共有（エクスポート／インポート）
// =====================

// 全データをJSONファイルとしてダウンロードする
function exportData() {
  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    requests: getRequests(),
    wantedCounts: getWantedCounts(),
    miniApps: getApps(),
    appRatings: getAllRatings()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mini-app-platform-data.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

// JSONファイルを読み込んで既存データと合体する
function importData(file) {
  const reader = new FileReader();

  reader.onload = function () {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      showToast('Import failed: not a valid JSON file');
      return;
    }

    if (!data || !Array.isArray(data.requests) || !Array.isArray(data.miniApps)) {
      showToast('Import failed: unexpected file format');
      return;
    }

    // リクエスト：既に同じIDがあるものはスキップして追加する
    const requests = getRequests();
    const existingRequestIds = requests.map(function (r) { return String(r.id); });
    let addedRequests = 0;
    data.requests.forEach(function (r) {
      if (r && r.id != null && existingRequestIds.indexOf(String(r.id)) === -1) {
        requests.push(r);
        addedRequests++;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

    // ミニアプリ：同様にIDの重複を避けて追加する
    const apps = getApps();
    const existingAppIds = apps.map(function (a) { return String(a.id); });
    let addedApps = 0;
    data.miniApps.forEach(function (a) {
      if (a && a.id != null && existingAppIds.indexOf(String(a.id)) === -1) {
        apps.push(a);
        addedApps++;
      }
    });
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));

    // I want thisカウント：大きい方を採用する（同じファイルを2回読み込んでも増え続けない）
    // ※配列もtypeofは'object'になるので、Array.isArrayで除外する
    if (data.wantedCounts && typeof data.wantedCounts === 'object' && !Array.isArray(data.wantedCounts)) {
      const counts = getWantedCounts();
      Object.keys(data.wantedCounts).forEach(function (id) {
        const imported = Number(data.wantedCounts[id]) || 0;
        counts[id] = Math.max(counts[id] || 0, imported);
      });
      localStorage.setItem(WANTED_KEY, JSON.stringify(counts));
    }

    // 星評価：まだ評価が無いアプリの分だけ取り込む（二重計上を防ぐ）
    if (data.appRatings && typeof data.appRatings === 'object' && !Array.isArray(data.appRatings)) {
      const all = getAllRatings();
      Object.keys(data.appRatings).forEach(function (id) {
        if (!all[id] && Array.isArray(data.appRatings[id])) {
          all[id] = data.appRatings[id].filter(function (n) {
            return typeof n === 'number' && n >= 1 && n <= 5;
          });
        }
      });
      localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
    }

    renderRequests();
    renderApps();
    populateRequestDropdown();
    showToast('Imported ' + addedRequests + ' requests and ' + addedApps + ' apps');
  };

  reader.readAsText(file);
}

// =====================
// タイポ自動修正
// =====================

// よくあるタイポ → 正しいスペルの一覧（キーは小文字で管理する）
const TYPO_DICTIONARY = {
  teh: 'the',
  adn: 'and',
  taht: 'that',
  wiht: 'with',
  jsut: 'just',
  thier: 'their',
  recieve: 'receive',
  recieved: 'received',
  seperate: 'separate',
  seperately: 'separately',
  definately: 'definitely',
  occured: 'occurred',
  occurence: 'occurrence',
  untill: 'until',
  becuase: 'because',
  wich: 'which',
  whcih: 'which',
  shoud: 'should',
  woudl: 'would',
  coud: 'could',
  cant: "can't",
  dont: "don't",
  doesnt: "doesn't",
  wont: "won't",
  alot: 'a lot',
  aswell: 'as well',
  noone: 'no one',
  accross: 'across',
  appartment: 'apartment',
  arguement: 'argument',
  begining: 'beginning',
  beleive: 'believe',
  calender: 'calendar',
  enviroment: 'environment',
  goverment: 'government',
  independant: 'independent',
  knowlege: 'knowledge',
  maintainance: 'maintenance',
  neccessary: 'necessary',
  priviledge: 'privilege',
  reccomend: 'recommend',
  succesful: 'successful',
  tommorow: 'tomorrow',
  usualy: 'usually'
};

// 元の単語の大文字・小文字パターンを、修正後の単語にも合わせる
function matchCase(original, correction) {
  if (original === original.toUpperCase()) {
    return correction.toUpperCase();
  }
  if (original.charAt(0) === original.charAt(0).toUpperCase()) {
    return correction.charAt(0).toUpperCase() + correction.slice(1);
  }
  return correction;
}

// 入力欄に「単語を打ち終えた瞬間、タイポなら自動で直す」機能を付ける
function enableAutoCorrect(field) {
  if (!field) return;

  field.addEventListener('input', function () {
    const cursor = field.selectionStart;
    const value = field.value;

    // カーソルの直前が「単語の区切り」（空白や句読点）でなければ、まだ単語の途中
    const lastChar = value.charAt(cursor - 1);
    if (!/[\s.,!?;:]/.test(lastChar)) return;

    // 区切り文字の直前にある単語の範囲を探す
    let start = cursor - 1;
    while (start > 0 && /[A-Za-z']/.test(value.charAt(start - 1))) {
      start--;
    }
    const word = value.slice(start, cursor - 1);
    if (!word) return;

    const correction = TYPO_DICTIONARY[word.toLowerCase()];
    if (!correction) return;

    const fixed = matchCase(word, correction);
    if (fixed === word) return;

    field.value = value.slice(0, start) + fixed + value.slice(cursor - 1);

    // 置き換えた分だけカーソル位置もずらして、続けて入力できるようにする
    const newCursor = start + fixed.length + 1;
    field.setSelectionRange(newCursor, newCursor);
  });
}

// =====================
// トースト通知
// =====================

let toastTimer = null;

// 画面下に短いメッセージを表示する
function showToast(message) {
  // 前のトーストが残っていたら消す
  const old = document.querySelector('.toast');
  if (old) old.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = 'map-toast toast';
  toast.setAttribute('role', 'status'); // スクリーンリーダーにも読み上げられる
  toast.textContent = message;
  document.body.appendChild(toast);

  toastTimer = setTimeout(function () {
    toast.remove();
  }, 2500);
}
```
