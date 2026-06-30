// ===========================
// Mini App Platform - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const WANTED_KEY = 'wantedCounts'; // 「欲しい」カウントの保存キー

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', function () {
  renderRequests();
});

// フォームの送信イベントを監視する
document.getElementById('requestForm').addEventListener('submit', function (e) {
  // ページのリロードを防ぐ
  e.preventDefault();

  // 入力値をオブジェクトにまとめる
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

  // 新しい順に並べる
  const sorted = [...requests].reverse();

  sorted.forEach(function (request) {
    const card = createCard(request);
    list.appendChild(card);
  });
}

// カードのHTML要素を組み立てる
function createCard(request) {
  const card = document.createElement('div');
  card.className = 'request-card';

  // --- For ---
  const users = document.createElement('p');
  users.className = 'card-users';
  users.textContent = 'For: ' + request.targetUsers;

  // --- Problem ---
  const problemLabel = document.createElement('p');
  problemLabel.className = 'card-label';
  problemLabel.textContent = 'Problem';

  const problemText = document.createElement('p');
  problemText.className = 'card-text';
  problemText.textContent = request.problem;

  // --- Current workaround ---
  const workaroundLabel = document.createElement('p');
  workaroundLabel.className = 'card-label';
  workaroundLabel.textContent = 'Current workaround';

  const workaroundText = document.createElement('p');
  workaroundText.className = 'card-text';
  workaroundText.textContent = request.currentWorkaround;

  // --- Desired features ---
  const featuresLabel = document.createElement('p');
  featuresLabel.className = 'card-label';
  featuresLabel.textContent = 'Desired features';

  const featuresText = document.createElement('p');
  featuresText.className = 'card-text';
  featuresText.textContent = request.desiredFeatures;

  // --- 投稿日 ---
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = 'Posted on ' + request.createdAt;

  // --- I want this too ボタンエリア ---
  const wantArea = document.createElement('div');
  wantArea.className = 'card-want-area';

  const wantBtn = document.createElement('button');
  wantBtn.type = 'button';
  wantBtn.className = 'want-btn';
  wantBtn.textContent = '⭐ I want this too';

  // ボタンを押したときにカウントを増やして再描画する
  wantBtn.addEventListener('click', function () {
    incrementWantedCount(request.id);
    renderRequests();
  });

  // カウント表示
  const wantCount = document.createElement('p');
  wantCount.className = 'want-count';
  const count = getWantedCount(request.id);

  if (count === 1) {
    wantCount.textContent = '⭐ 1 person wants this';
  } else if (count > 1) {
    wantCount.textContent = '⭐ ' + count + ' people want this';
  }
  // 0件のときは何も表示しない

  wantArea.appendChild(wantBtn);
  wantArea.appendChild(wantCount);

  // カードに各要素を追加する
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

// wantedCounts をlocalStorageから取得する
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
