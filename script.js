// ===========================
// Mini App Platform - スクリプト
// ===========================

// localStorageに保存するときのキー名
const STORAGE_KEY = 'requests';

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', function () {
  renderRequests();
});

// フォームの送信イベントを監視する
document.getElementById('requestForm').addEventListener('submit', function (e) {
  // ページのリロードを防ぐ（フォームのデフォルト動作を止める）
  e.preventDefault();

  // 入力値をオブジェクトにまとめる
  const request = {
    id: Date.now(), // ユニークなIDとして現在時刻（ミリ秒）を使う
    targetUsers: document.getElementById('targetUsers').value,
    problem: document.getElementById('problem').value,
    currentWorkaround: document.getElementById('currentWorkaround').value,
    desiredFeatures: document.getElementById('desiredFeatures').value,
    createdAt: new Date().toLocaleDateString('en-US')
  };

  // localStorageに保存する
  saveRequest(request);

  // 一覧を再描画する
  renderRequests();

  // フォームの入力内容をリセットする
  this.reset();
});

// リクエストをlocalStorageに追加保存する関数
function saveRequest(request) {
  const requests = getRequests();
  requests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// localStorageからリクエスト一覧を取得する関数
function getRequests() {
  const data = localStorage.getItem(STORAGE_KEY);
  // データがなければ空の配列を返す
  return data ? JSON.parse(data) : [];
}

// リクエスト一覧を画面に描画する関数
function renderRequests() {
  const requests = getRequests();
  const list = document.getElementById('requestsList');

  // 一覧エリアをリセットしてから描画する
  list.innerHTML = '';

  // リクエストが0件のとき
  if (requests.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No requests yet. Be the first to submit one!';
    list.appendChild(empty);
    return;
  }

  // 新しい順（最新が上）に並べる
  const sorted = [...requests].reverse();

  sorted.forEach(function (request) {
    const card = createCard(request);
    list.appendChild(card);
  });
}

// カードのHTML要素を組み立てる関数
function createCard(request) {
  const card = document.createElement('div');
  card.className = 'request-card';

  // --- For（誰のためか） ---
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

  // カードに各要素を追加する
  card.appendChild(users);
  card.appendChild(problemLabel);
  card.appendChild(problemText);
  card.appendChild(workaroundLabel);
  card.appendChild(workaroundText);
  card.appendChild(featuresLabel);
  card.appendChild(featuresText);
  card.appendChild(date);

  return card;
}
