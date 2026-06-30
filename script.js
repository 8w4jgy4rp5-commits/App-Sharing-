// ===========================
// Mini App Platform - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const WANTED_KEY = 'wantedCounts';
const APPS_STORAGE_KEY = 'miniApps';

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', function () {
  renderRequests();
  populateRequestDropdown(); // アプリフォームのドロップダウンを更新する
  renderApps();
});

// =====================
// リクエスト関連
// =====================

// フォームの送信イベントを監視する
document.getElementById('requestForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const request = {
    id: Date.now(),
    targetUsers: document.getElementById('targetUsers').value,
    problem: document.getElementById('problem').value,
    currentWorkaround: document.getElementById('currentWorkaround').value,
    desiredFeatures: document.getElementById('desiredFeatures').value,
    createdAt: new Date().toLocaleDateString('en-US')
  };

  saveRequest(request);
  renderRequests();
  populateRequestDropdown(); // リクエストが増えたらドロップダウンも更新する
  this.reset();
});

// リクエストをlocalStorageに保存する
function saveRequest(request) {
  const requests = getRequests();
  requests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// localStorageからリクエスト一覧を取得する
function getRequests() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// リクエスト一覧を画面に描画する
function renderRequests() {
  const requests = getRequests();
  const list = document.getElementById('requestsList');

  list.innerHTML = '';

  if (requests.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No requests yet. Be the first to submit one!';
    list.appendChild(empty);
    return;
  }

  const sorted = [...requests].reverse();

  sorted.forEach(function (request) {
    const card = createCard(request);
    list.appendChild(card);
  });
}

// リクエストカードのHTML要素を組み立てる
function createCard(request) {
  const card = document.createElement('div');
  card.className = 'request-card';

  const users = document.createElement('p');
  users.className = 'card-users';
  users.textContent = 'For: ' + request.targetUsers;

  const problemLabel = document.createElement('p');
  problemLabel.className = 'card-label';
  problemLabel.textContent = 'Problem';

  const problemText = document.createElement('p');
  problemText.className = 'card-text';
  problemText.textContent = request.problem;

  const workaroundLabel = document.createElement('p');
  workaroundLabel.className = 'card-label';
  workaroundLabel.textContent = 'Current workaround';

  const workaroundText = document.createElement('p');
  workaroundText.className = 'card-text';
  workaroundText.textContent = request.currentWorkaround;

  const featuresLabel = document.createElement('p');
  featuresLabel.className = 'card-label';
  featuresLabel.textContent = 'Desired features';

  const featuresText = document.createElement('p');
  featuresText.className = 'card-text';
  featuresText.textContent = request.desiredFeatures;

  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = 'Posted on ' + request.createdAt;

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

  wantArea.appendChild(wantBtn);
  wantArea.appendChild(wantCount);

  card.appendChild(users);
  card.appendChild(problemLabel);
  card.appendChild(problemText);
  card.appendChild(workaroundLabel);
  card.appendChild(workaroundText);
  card.appendChild(featuresLabel);
  card.appendChild(featuresText);
  card.appendChild(date);
  card.appendChild(wantArea);

  return card;
}

// wantedCountsをlocalStorageから取得する
function getWantedCounts() {
  const data = localStorage.getItem(WANTED_KEY);
  return data ? JSON.parse(data) : {};
}

// 特定リクエストのカウントを取得する
function getWantedCount(id) {
  const counts = getWantedCounts();
  return counts[id] || 0;
}

// カウントを1増やしてlocalStorageに保存する
function incrementWantedCount(id) {
  const counts = getWantedCounts();
  counts[id] = (counts[id] || 0) + 1;
  localStorage.setItem(WANTED_KEY, JSON.stringify(counts));
}

// =====================
// ミニアプリ関連
// =====================

// アプリフォームの「Built for request」ドロップダウンをリクエスト一覧で埋める
function populateRequestDropdown() {
  const select = document.getElementById('builtForRequest');
  const requests = getRequests();

  // 一度リセットしてから追加する
  select.innerHTML = '<option value="">— Not linked to a request —</option>';

  requests.forEach(function (request) {
    const option = document.createElement('option');
    option.value = request.id;
    // 表示テキスト：対象ユーザー + 困りごとの先頭40文字
    const preview = request.problem.length > 40
      ? request.problem.slice(0, 40) + '...'
      : request.problem;
    option.textContent = request.targetUsers + ' — ' + preview;
    select.appendChild(option);
  });
}

// アプリフォームの送信イベントを監視する
document.getElementById('appForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const app = {
    id: Date.now(),
    name: document.getElementById('appName').value,
    description: document.getElementById('appDescription').value,
    url: document.getElementById('appUrl').value,
    targetUsers: document.getElementById('appTargetUsers').value,
    // 選択されていなければ null にする
    builtForRequestId: document.getElementById('builtForRequest').value || null,
    createdAt: new Date().toLocaleDateString('en-US')
  };

  saveApp(app);
  renderApps();
  this.reset();
  populateRequestDropdown(); // フォームリセット後にドロップダウンを再設定する
});

// アプリをlocalStorageに保存する
function saveApp(app) {
  const apps = getApps();
  apps.push(app);
  localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
}

// localStorageからアプリ一覧を取得する
function getApps() {
  const data = localStorage.getItem(APPS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// アプリ一覧を画面に描画する
function renderApps() {
  const apps = getApps();
  const list = document.getElementById('appsList');

  list.innerHTML = '';

  if (apps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No mini apps yet. Build one for a request above!';
    list.appendChild(empty);
    return;
  }

  const sorted = [...apps].reverse();

  sorted.forEach(function (app) {
    const card = createAppCard(app);
    list.appendChild(card);
  });
}

// アプリカードのHTML要素を組み立てる
function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';

  // --- アプリ名（外部リンク） ---
  const nameLink = document.createElement('a');
  nameLink.href = app.url;
  nameLink.target = '_blank';
  nameLink.rel = 'noopener noreferrer'; // 外部リンクのセキュリティ対策
  nameLink.className = 'app-name';
  nameLink.textContent = app.name + ' ↗';

  // --- 説明 ---
  const description = document.createElement('p');
  description.className = 'card-text app-description';
  description.textContent = app.description;

  // --- Target users ---
  const usersLabel = document.createElement('p');
  usersLabel.className = 'card-label';
  usersLabel.textContent = 'Target users';

  const usersText = document.createElement('p');
  usersText.className = 'card-text';
  usersText.textContent = app.targetUsers;

  // --- Built for request（紐づいたリクエストを表示） ---
  if (app.builtForRequestId) {
    const requests = getRequests();
    const linked = requests.find(function (r) {
      return String(r.id) === String(app.builtForRequestId);
    });

    if (linked) {
      const requestLabel = document.createElement('p');
      requestLabel.className = 'card-label';
      requestLabel.textContent = 'Built for request';

      const requestText = document.createElement('p');
      requestText.className = 'card-text app-request-text';
      requestText.textContent = linked.targetUsers + ' — ' + linked.problem;

      card.appendChild(nameLink);
      card.appendChild(description);
      card.appendChild(usersLabel);
      card.appendChild(usersText);
      card.appendChild(requestLabel);
      card.appendChild(requestText);
    } else {
      card.appendChild(nameLink);
      card.appendChild(description);
      card.appendChild(usersLabel);
      card.appendChild(usersText);
    }
  } else {
    card.appendChild(nameLink);
    card.appendChild(description);
    card.appendChild(usersLabel);
    card.appendChild(usersText);
  }

  // --- 投稿日 ---
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = 'Posted on ' + app.createdAt;
  card.appendChild(date);

  return card;
}
