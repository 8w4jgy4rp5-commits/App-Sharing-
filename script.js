// ===========================
// Mini App Platform - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const WANTED_KEY = 'wantedCounts';
const APPS_STORAGE_KEY = 'miniApps';
const RATINGS_KEY = 'appRatings'; // アプリ評価の保存キー

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', function () {
  renderRequests();
  populateRequestDropdown();
  renderApps();

  // 検索欄への入力をリアルタイムで監視する
  document.getElementById('searchInput').addEventListener('input', function () {
    const query = this.value.trim();
    renderRequests(query);
    renderApps(query);
  });
});

// =====================
// リクエスト関連
// =====================

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
  populateRequestDropdown();
  this.reset();
});

function saveRequest(request) {
  const requests = getRequests();
  requests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function getRequests() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
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
  const requestWords = new Set(tokenize([
    request.targetUsers,
    request.problem,
    request.currentWorkaround,
    request.desiredFeatures
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
    requests = requests.filter(function (r) {
      return (
        r.targetUsers.toLowerCase().includes(q) ||
        r.problem.toLowerCase().includes(q) ||
        r.currentWorkaround.toLowerCase().includes(q) ||
        r.desiredFeatures.toLowerCase().includes(q)
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

  wantArea.appendChild(wantBtn);
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

  card.appendChild(users);
  card.appendChild(problemLabel);
  card.appendChild(problemText);
  card.appendChild(workaroundLabel);
  card.appendChild(workaroundText);
  card.appendChild(featuresLabel);
  card.appendChild(featuresText);
  card.appendChild(date);
  card.appendChild(wantArea);
  card.appendChild(appsArea);
  card.appendChild(relatedArea);

  return card;
}

function getWantedCounts() {
  const data = localStorage.getItem(WANTED_KEY);
  return data ? JSON.parse(data) : {};
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
  const requests = getRequests();

  select.innerHTML = '<option value="">— Not linked to a request —</option>';

  requests.forEach(function (request) {
    const option = document.createElement('option');
    option.value = request.id;
    const preview = request.problem.length > 40
      ? request.problem.slice(0, 40) + '...'
      : request.problem;
    option.textContent = request.targetUsers + ' — ' + preview;
    select.appendChild(option);
  });
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
    name: document.getElementById('appName').value,
    description: document.getElementById('appDescription').value,
    url: appUrl,
    targetUsers: document.getElementById('appTargetUsers').value,
    builtForRequestId: document.getElementById('builtForRequest').value || null,
    createdAt: new Date().toLocaleDateString('en-US')
  };

  saveApp(app);
  renderApps();
  this.reset();
  populateRequestDropdown();
});

function saveApp(app) {
  const apps = getApps();
  apps.push(app);
  localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
}

function getApps() {
  const data = localStorage.getItem(APPS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function renderApps(query) {
  let apps = getApps();
  const list = document.getElementById('appsList');

  list.innerHTML = '';

  if (query) {
    const q = query.toLowerCase();
    apps = apps.filter(function (app) {
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.targetUsers.toLowerCase().includes(q)
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
      requestText.textContent = linked.targetUsers + ' — ' + linked.problem;

      card.appendChild(requestLabel);
      card.appendChild(requestText);
    }
  }

  // 投稿日
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = 'Posted on ' + app.createdAt;

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
  const data = localStorage.getItem(RATINGS_KEY);
  return data ? JSON.parse(data) : {};
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

    // ホバー時：カーソルの位置まで星を光らせる
    star.addEventListener('mouseenter', (function (rating) {
      return function () {
        const btns = clickableStars.querySelectorAll('.star-btn');
        btns.forEach(function (btn, idx) {
          btn.textContent = idx < rating ? '★' : '☆';
        });
      };
    })(i));

    // ホバーが外れたら元に戻す
    star.addEventListener('mouseleave', function () {
      clickableStars.querySelectorAll('.star-btn').forEach(function (btn) {
        btn.textContent = '☆';
      });
    });

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
