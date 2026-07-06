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
