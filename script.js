// ===========================
// CobbleWorks - スクリプト
// ===========================

// localStorageのキー名
const STORAGE_KEY = 'requests';
const WANTED_KEY = 'wantedCounts';
const APPS_STORAGE_KEY = 'miniApps';
const RATINGS_KEY = 'appRatings'; // アプリ評価の保存キー
const COMMENTS_KEY = 'appComments'; // アプリへのコメントの保存キー
const RECENT_APPS_KEY = 'recentAppViews'; // 「最近使ったアプリ」の保存キー（このブラウザだけの記録）

const POSTER_NAME_KEY = 'posterName'; // 投稿者名（毎回入力しなくて済むように覚えておく）

let editingAppId = null; // 編集中のミニアプリのID（新規投稿中はnull）

// Supabaseから読み込んだ一覧をここに保持する（Phase 1：読み取りのみSupabase化）
let cachedRequests = [];
let cachedApps = [];

// requests / mini_apps をSupabaseから取得し、cachedRequests / cachedAppsを更新する
async function loadSharedData() {
  const { data: requestRows, error: requestError } = await supabaseClient
    .from('requests')
    .select('*')
    .order('created_at', { ascending: true });

  if (requestError) {
    console.error('Failed to load requests from Supabase:', requestError.message);
    cachedRequests = [];
  } else {
    cachedRequests = (requestRows || []).map(function (row) {
      return {
        id: row.id,
        problem: row.problem,
        desiredFeatures: row.desired_features,
        targetUsers: row.target_users,
        currentWorkaround: row.current_workaround,
        createdAt: new Date(row.created_at).toLocaleDateString('en-US'),
        ownerId: row.owner_id
      };
    });
  }

  const { data: appRows, error: appError } = await supabaseClient
    .from('mini_apps')
    .select('*')
    .order('created_at', { ascending: true });

  if (appError) {
    console.error('Failed to load mini apps from Supabase:', appError.message);
    cachedApps = [];
  } else {
    cachedApps = (appRows || []).map(function (row) {
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        url: row.url,
        targetUsers: row.target_users,
        builtForRequestId: row.built_for_request_id,
        createdAt: new Date(row.created_at).toLocaleDateString('en-US'),
        ownerId: row.owner_id
      };
    });
  }
}

// ===========================
// あいまい検索（"Maybe you're looking for..."）
// ===========================

// 意味が近い言葉のグループ。ここに配列を足せば同義語を追加できる。
const SYNONYM_GROUPS = [
  ['shift', 'schedule', 'roster'],
  ['log', 'track', 'record', 'note'],
  ['reminder', 'remind', 'notify', 'notification', 'alert'],
  ['money', 'budget', 'expense', 'expenses', 'spending', 'cost'],
  ['sleep', 'rest', 'nap', 'break'],
  ['medication', 'medicine', 'prescription', 'drug', 'dosage'],
  ['patient', 'care'],
  ['training', 'study', 'learning', 'education', 'course'],
  ['coworker', 'colleague', 'staff', 'team'],
  ['deadline', 'due'],
  ['checklist', 'list', 'todo'],
  ['health', 'wellness', 'wellbeing'],
  ['stress', 'anxiety', 'mental'],
  ['overtime', 'hours', 'pay', 'salary', 'income'],
  ['swap', 'exchange', 'change'],
  ['parking', 'car'],
  ['transfer', 'move', 'relocation'],
  ['incident', 'report'],
  ['feelings', 'emotion', 'mood'],
];

// 単語 → 同義語グループ番号 の対応表（毎回配列を全探索しなくて済むようにする）
const SYNONYM_LOOKUP = {};
SYNONYM_GROUPS.forEach(function (group, index) {
  group.forEach(function (word) {
    SYNONYM_LOOKUP[word] = index;
  });
});

// レーベンシュタイン距離：2つの単語の違い（入れ替え・追加・削除が何回必要か）を数える
function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix.push([i]);
  }
  for (let j = 0; j < cols; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 置き換え
          matrix[i][j - 1] + 1, // 追加
          matrix[i - 1][j] + 1 // 削除
        );
      }
    }
  }
  return matrix[rows - 1][cols - 1];
}

// 2つの単語が「関連している」と言えるかどうかを判定する
function wordsAreRelated(wordA, wordB) {
  if (wordA === wordB) return true;

  // 片方がもう片方を含む場合（例: shift / shifts、schedule / scheduling）
  if (wordA.length >= 4 && wordB.length >= 4 && (wordA.includes(wordB) || wordB.includes(wordA))) {
    return true;
  }

  // 同義語リストで同じグループに入っている場合
  if (SYNONYM_LOOKUP[wordA] !== undefined && SYNONYM_LOOKUP[wordA] === SYNONYM_LOOKUP[wordB]) {
    return true;
  }

  // スペルがかなり近い場合（短い単語ほど厳しく判定する）
  const maxDistance = wordA.length <= 4 || wordB.length <= 4 ? 1 : 2;
  return levenshteinDistance(wordA, wordB) <= maxDistance;
}

// テキストを検索用の単語配列に分解する（2文字以下のノイズ単語は除く）
function toSearchWords(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(function (word) { return word.length >= 3; });
}

// クエリの単語のうち、リクエストの単語と関連するものがいくつあるかをスコアにする
function fuzzyMatchScore(request, queryWords) {
  const requestWords = toSearchWords(
    [request.problem, request.desiredFeatures, request.targetUsers, request.currentWorkaround].join(' ')
  );

  let matchedCount = 0;
  queryWords.forEach(function (qWord) {
    const hasMatch = requestWords.some(function (rWord) { return wordsAreRelated(qWord, rWord); });
    if (hasMatch) matchedCount++;
  });

  return matchedCount;
}

// 完全一致で0件だったときに、関連度が高い順にリクエストを提案する（最大5件）
function findFuzzySuggestions(query) {
  const queryWords = toSearchWords(query);
  if (queryWords.length === 0) return [];

  return getRequests()
    .map(function (request) { return { request: request, score: fuzzyMatchScore(request, queryWords) }; })
    .filter(function (entry) { return entry.score > 0; })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, 5)
    .map(function (entry) { return entry.request; });
}

// ページ読み込み完了後に一覧を表示する
document.addEventListener('DOMContentLoaded', async function () {
  // トップページの検索欄から遷移してきた場合、URLのqパラメータを検索欄に反映する
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const searchField = document.getElementById('searchInput');
  if (searchField && initialQuery) {
    searchField.value = initialQuery;
  }

  // 一覧を描画する前に、Supabaseからrequests/mini_appsを読み込んでおく
  await loadSharedData();

  renderRequests(initialQuery);
  populateRequestDropdown();
  renderApps(initialQuery);
  renderYourApps();
  renderRecentApps();
  renderPopularApps();

  const cancelAppEditBtn = document.getElementById('cancelAppEditBtn');
  if (cancelAppEditBtn) cancelAppEditBtn.addEventListener('click', cancelEditApp);

  // 「Build this」で別ページから遷移してきた場合、そのリクエストを選択状態にする
  const builtForId = urlParams.get('builtFor');
  const builtForSelect = document.getElementById('builtForRequest');
  if (builtForId && builtForSelect) {
    builtForSelect.value = builtForId;
    const appFormSection = document.getElementById('app-form-section');
    if (appFormSection) appFormSection.scrollIntoView({ behavior: 'smooth' });
    const appNameInput = document.getElementById('appName');
    if (appNameInput) appNameInput.focus({ preventScroll: true });
    showToast('Request selected below — fill in the mini app details');
  }

  // 名前欄は毎回空欄にしておく（同じ端末を複数人で使うため、前回の名前は自動入力しない）
  // 覚えている名前はrenderYourApps()の「自分のアプリ」判定にのみ使う

  // 検索欄への入力をリアルタイムで監視する（そのページに無い一覧は関数側で何もしない）
  if (searchField) {
    searchField.addEventListener('input', function () {
      const query = this.value.trim();
      renderRequests(query);
      renderApps(query);
    });
  }

  // タイポ自動修正を、自由入力の欄に付ける
  ['problem', 'desiredFeatures', 'appName', 'appDescription', 'appTargetUsers'].forEach(function (id) {
    enableAutoCorrect(document.getElementById(id));
  });

  // エクスポート／インポート（トップページのみ）
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportData);
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', function () {
      importFile.click();
    });
    importFile.addEventListener('change', function () {
      if (this.files.length > 0) {
        importData(this.files[0]);
        this.value = ''; // 同じファイルをもう一度選べるようにリセット
      }
    });
  }
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

// requestFormはリクエストページにしか無いので、存在するときだけ登録する
const requestFormEl = document.getElementById('requestForm');
if (requestFormEl) requestFormEl.addEventListener('submit', function (e) {
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
  showToast('Request posted!');
});

function saveRequest(request) {
  const requests = getRequests();
  requests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function getRequests() {
  // コピーを返す。参照をそのまま返すと、saveRequest等の一時的な操作が
  // Supabaseから読み込んだキャッシュ自体を書き換えてしまうため。
  return cachedRequests.slice();
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
  if (!list) return; // このページにリクエスト一覧が無ければ何もしない

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
      ? 'No exact matches found. Can\'t find what you need? Submit a request.'
      : 'No requests yet. Be the first to submit one!';
    list.appendChild(empty);

    // 完全一致が0件のときは、関連しそうなリクエストを提案する
    if (query) {
      const suggestions = findFuzzySuggestions(query);
      if (suggestions.length > 0) {
        const heading = document.createElement('h3');
        heading.className = 'suggestions-heading';
        heading.textContent = 'Maybe you\'re looking for...';
        list.appendChild(heading);

        suggestions.forEach(function (request) {
          list.appendChild(createCard(request));
        });
      }
    }
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
      const searchField = document.getElementById('searchInput');
      renderRequests(searchField ? searchField.value.trim() : '');
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
    const searchField = document.getElementById('searchInput');
    renderRequests(searchField ? searchField.value.trim() : '');
  });

  const wantCount = document.createElement('p');
  wantCount.className = 'want-count';
  const count = getWantedCount(request.id);
  if (count === 1) {
    wantCount.textContent = '⭐ 1 person wants this';
  } else if (count > 1) {
    wantCount.textContent = '⭐ ' + count + ' people want this';
  }

  // Build this ボタン：トップページのミニアプリ投稿フォームへ移動し、このリクエストを自動選択する
  const buildBtn = document.createElement('button');
  buildBtn.type = 'button';
  buildBtn.className = 'build-btn';
  buildBtn.textContent = '🔨 Build this';
  buildBtn.addEventListener('click', function () {
    window.location.href = 'index.html?builtFor=' + encodeURIComponent(request.id);
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
      appLink.addEventListener('click', function () {
        recordAppView(app.id);
        renderRecentApps();
      });
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
  if (!select) return; // このページにミニアプリ投稿フォームが無ければ何もしない
  const searchInput = document.getElementById('requestSearch');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const previous = select.value; // 再構築で選択が消えないように覚えておく

  // 検索欄に文字があれば、problemに含まれるものだけに絞り込む
  const requests = getRequests().filter(function (request) {
    if (!query) return true;
    const problem = typeof request.problem === 'string' ? request.problem.toLowerCase() : '';
    return problem.indexOf(query) !== -1;
  });

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

// 検索欄に入力するたびにリストを絞り込む（requestSearchが無いページでは何もしない）
const requestSearchEl = document.getElementById('requestSearch');
if (requestSearchEl) requestSearchEl.addEventListener('input', function () {
  populateRequestDropdown();
});

// appFormはトップページにしか無いので、存在するときだけ登録する
const appFormEl = document.getElementById('appForm');
if (appFormEl) appFormEl.addEventListener('submit', function (e) {
  e.preventDefault();

  const appUrl = document.getElementById('appUrl').value;
  if (!isSafeUrl(appUrl)) {
    alert('Please enter a valid http:// or https:// URL.');
    return;
  }

  const name = document.getElementById('appName').value.trim();
  const description = document.getElementById('appDescription').value.trim();
  const targetUsers = document.getElementById('appTargetUsers').value.trim();
  const postedBy = document.getElementById('appAuthor').value.trim();

  // 空白だけの入力はrequired属性をすり抜けるので、trim後にチェックする
  if (!name || !description || !targetUsers) {
    showToast('Please fill in all fields');
    return;
  }

  const fields = {
    name: name,
    description: description,
    url: appUrl,
    targetUsers: targetUsers,
    builtForRequestId: document.getElementById('builtForRequest').value || null,
    postedBy: postedBy
  };

  if (editingAppId) {
    updateApp(editingAppId, fields);
    showToast('Mini app updated!');
  } else {
    saveApp(Object.assign({ id: Date.now(), createdAt: new Date().toLocaleDateString('en-US') }, fields));
    showToast('Mini app shared!');
  }

  rememberPosterName(postedBy);
  cancelEditApp(); // 編集モードを終了し、フォームを新規投稿用にリセットする
  renderApps();
  renderYourApps();
  populateRequestDropdown();
});

function saveApp(app) {
  const apps = getApps();
  apps.push(app);
  localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
}

// 既存のミニアプリを部分更新する（idが一致するものだけ）
function updateApp(id, fields) {
  const apps = getApps();
  const app = apps.find(function (a) { return String(a.id) === String(id); });
  if (!app) return;
  Object.assign(app, fields);
  localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
}

// ミニアプリを削除する
function deleteApp(id) {
  const apps = getApps().filter(function (a) { return String(a.id) !== String(id); });
  localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
}

// フォームに既存のアプリの内容を読み込み、編集モードにする
function editApp(app) {
  editingAppId = app.id;

  document.getElementById('appName').value = app.name || '';
  document.getElementById('appDescription').value = app.description || '';
  document.getElementById('appUrl').value = app.url || '';
  document.getElementById('appTargetUsers').value = app.targetUsers || '';
  document.getElementById('builtForRequest').value = app.builtForRequestId || '';
  document.getElementById('appAuthor').value = app.postedBy || '';

  document.getElementById('appFormTitle').textContent = 'Edit Mini App';
  document.getElementById('appSubmitBtn').textContent = 'Save changes';
  document.getElementById('cancelAppEditBtn').hidden = false;

  document.getElementById('app-form-section').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('appName').focus();
}

// 編集モードを終了し、投稿フォームを新規投稿用に戻す
function cancelEditApp() {
  editingAppId = null;
  document.getElementById('appForm').reset();
  document.getElementById('appFormTitle').textContent = 'Submit a Mini App';
  document.getElementById('appSubmitBtn').textContent = 'Submit a mini app';
  document.getElementById('cancelAppEditBtn').hidden = true;
}

function getApps() {
  // コピーを返す理由はgetRequests()と同じ（キャッシュを誤って書き換えないため）
  return cachedApps.slice();
}

function renderApps(query) {
  let apps = getApps();
  const list = document.getElementById('appsList');
  if (!list) return; // このページにミニアプリ一覧が無ければ何もしない

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

// 「Your Apps」：この端末で覚えている投稿者名と一致する（または投稿者名が未入力の）アプリだけを表示する。
// ログイン機能が無いため、これは所有権の保証ではなく目印程度のもの。
function renderYourApps() {
  const list = document.getElementById('yourAppsList');
  if (!list) return;

  list.innerHTML = '';

  const savedName = (localStorage.getItem(POSTER_NAME_KEY) || '').trim().toLowerCase();
  const yourApps = getApps().filter(function (app) {
    const postedBy = (app.postedBy || '').trim().toLowerCase();
    return !postedBy || (savedName && postedBy === savedName);
  });

  if (yourApps.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Apps you submit will show up here so you can edit or remove them later.';
    list.appendChild(empty);
    return;
  }

  [...yourApps].reverse().forEach(function (app) {
    list.appendChild(createAppCard(app, { editable: true }));
  });
}

// アプリ名から見分けやすい頭文字バッジを作る（色は名前から決まる固定色）
const APP_AVATAR_COLORS = ['app-avatar-c0', 'app-avatar-c1', 'app-avatar-c2', 'app-avatar-c3'];

function createAppAvatar(name, small) {
  const avatar = document.createElement('div');
  avatar.className = 'app-avatar' + (small ? ' app-avatar--sm' : '');
  avatar.setAttribute('aria-hidden', 'true'); // 名前はリンク側で読み上げられるため重複させない

  const safeName = typeof name === 'string' ? name.trim() : '';
  avatar.textContent = safeName ? safeName.charAt(0).toUpperCase() : '?';

  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash + safeName.charCodeAt(i)) % APP_AVATAR_COLORS.length;
  }
  avatar.classList.add(APP_AVATAR_COLORS[hash]);

  return avatar;
}

function createAppCard(app, options) {
  const editable = !!(options && options.editable);

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
  nameLink.addEventListener('click', function () {
    recordAppView(app.id);
    renderRecentApps();
  });

  // 頭文字バッジ＋アプリ名を横並びにする
  const nameRow = document.createElement('div');
  nameRow.className = 'app-card-header';
  nameRow.appendChild(createAppAvatar(app.name));
  nameRow.appendChild(nameLink);

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

  card.appendChild(nameRow);
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

  // コメントエリア（作者へのフィードバック）
  const commentsArea = createCommentsSection(app.id);

  card.appendChild(date);
  card.appendChild(ratingArea);
  card.appendChild(commentsArea);

  // 「Your Apps」内のカードだけ、編集・削除ボタンを付ける
  if (editable) {
    const actions = document.createElement('div');
    actions.className = 'card-edit-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'map-btn map-btn--secondary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function () { editApp(app); });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '🗑';
    deleteBtn.setAttribute('aria-label', 'Delete ' + app.name);
    deleteBtn.title = 'Delete this app';
    deleteBtn.addEventListener('click', function () {
      if (confirm('Delete "' + app.name + '"? This cannot be undone.')) {
        deleteApp(app.id);
        if (editingAppId === app.id) cancelEditApp();
        renderApps();
        renderYourApps();
        renderRecentApps();
        renderPopularApps();
        showToast('Mini app deleted');
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
  }

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

  // 平均に応じて星を部分的に塗りつぶす（四捨五入せず、段階的に表示する）
  const percent = count > 0 ? Math.max(0, Math.min(100, (average / 5) * 100)) : 0;

  const averageStars = document.createElement('span');
  averageStars.className = 'average-stars';
  averageStars.setAttribute('role', 'img');
  averageStars.setAttribute('aria-label', average.toFixed(1) + ' out of 5 stars');

  const starsBack = document.createElement('span');
  starsBack.className = 'stars-back';
  starsBack.setAttribute('aria-hidden', 'true');
  starsBack.textContent = '★★★★★';

  const starsFront = document.createElement('span');
  starsFront.className = 'stars-front';
  starsFront.setAttribute('aria-hidden', 'true');
  starsFront.style.width = percent + '%';
  starsFront.textContent = '★★★★★';

  averageStars.appendChild(starsBack);
  averageStars.appendChild(starsFront);

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
        renderYourApps();
        renderPopularApps();
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
// コメント関連（作者へのフィードバック）
// =====================

// localStorageから全アプリ分のコメントを取得する
function getAllComments() {
  try {
    const data = localStorage.getItem(COMMENTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

// 特定アプリのコメント一覧を取得する
function getComments(appId) {
  return getAllComments()[String(appId)] || [];
}

// コメントを追加してlocalStorageに保存する
function addComment(appId, comment) {
  const all = getAllComments();
  const key = String(appId);
  if (!all[key]) all[key] = [];
  all[key].push(comment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
}

// コメント欄（折りたたみ式）を組み立てる関数
function createCommentsSection(appId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'comments-area';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'comments-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('div');
  panel.className = 'comments-panel';
  panel.hidden = true;

  const list = document.createElement('div');
  list.className = 'comments-list';

  // コメント数を見出しボタンに反映する
  function updateToggleLabel() {
    const count = getComments(appId).length;
    toggleBtn.textContent = '💬 Comments (' + count + ')';
  }

  // コメント一覧を再描画する
  function renderList() {
    list.innerHTML = '';
    const comments = getComments(appId);

    if (comments.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'comments-empty';
      empty.textContent = 'No comments yet. Be the first to leave feedback!';
      list.appendChild(empty);
      return;
    }

    comments.forEach(function (comment) {
      const item = document.createElement('div');
      item.className = 'comment-item';

      const text = document.createElement('p');
      text.className = 'comment-text';
      text.textContent = comment.text;

      const meta = document.createElement('p');
      meta.className = 'comment-meta';
      meta.textContent = (comment.author ? comment.author : 'Anonymous') + ' · ' + comment.createdAt;

      item.appendChild(text);
      item.appendChild(meta);
      list.appendChild(item);
    });
  }

  // コメント投稿フォーム
  const form = document.createElement('form');
  form.className = 'comment-form';

  const textInput = document.createElement('textarea');
  textInput.placeholder = 'Share feedback with the creator...';
  textInput.maxLength = 500;
  textInput.setAttribute('aria-label', 'Comment');

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Your name (optional)';
  nameInput.maxLength = 30;

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'map-btn map-btn--secondary';
  submitBtn.textContent = 'Post comment';

  form.appendChild(textInput);
  form.appendChild(nameInput);
  form.appendChild(submitBtn);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) {
      showToast('Please write a comment first');
      return;
    }

    addComment(appId, {
      id: Date.now(),
      text: text,
      author: nameInput.value.trim(),
      createdAt: new Date().toLocaleDateString('en-US')
    });

    form.reset();
    renderList();
    updateToggleLabel();
    showToast('Comment posted!');
  });

  toggleBtn.addEventListener('click', function () {
    panel.hidden = !panel.hidden;
    toggleBtn.setAttribute('aria-expanded', String(!panel.hidden));
  });

  panel.appendChild(list);
  panel.appendChild(form);

  renderList();
  updateToggleLabel();

  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(panel);

  return wrapper;
}

// =====================
// サイドバー（最近使ったアプリ／人気のアプリ）
// =====================

// 最近開いたアプリの記録を全部取得する（新しい順）
function getRecentAppViews() {
  try {
    const data = localStorage.getItem(RECENT_APPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// アプリを開いたことを記録する（同じアプリは最新の1件だけ残す）
function recordAppView(id) {
  let views = getRecentAppViews().filter(function (v) {
    return String(v.id) !== String(id);
  });
  views.unshift({ id: id, viewedAt: Date.now() });
  views = views.slice(0, 10); // 直近10件だけ覚えておけば十分
  localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(views));
}

// サイドバーの1行（アプリ名リンク＋任意のメタ情報）を組み立てる
function createSidebarAppLink(app, average, count) {
  const row = document.createElement('div');
  row.className = 'sidebar-app-row';

  const left = document.createElement('div');
  left.className = 'sidebar-app-left';

  const link = document.createElement('a');
  if (isSafeUrl(app.url)) {
    link.href = app.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  link.className = 'sidebar-app-link';
  link.textContent = app.name + ' ↗';
  link.addEventListener('click', function () {
    recordAppView(app.id);
    renderRecentApps();
  });

  left.appendChild(createAppAvatar(app.name, true));
  left.appendChild(link);
  row.appendChild(left);

  if (typeof average === 'number' && count) {
    const meta = document.createElement('span');
    meta.className = 'sidebar-app-meta';
    meta.textContent = '★ ' + average.toFixed(1) + ' (' + count + ')';
    row.appendChild(meta);
  }

  return row;
}

// 「Recently Used」欄を描画する
function renderRecentApps() {
  const list = document.getElementById('recentAppsList');
  if (!list) return; // このページにサイドバーが無ければ何もしない

  list.innerHTML = '';

  const apps = getApps();
  const recentApps = getRecentAppViews()
    .map(function (view) {
      return apps.find(function (app) { return String(app.id) === String(view.id); });
    })
    .filter(Boolean) // 削除済みのアプリは除く
    .slice(0, 5);

  if (recentApps.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'sidebar-empty';
    empty.textContent = 'Apps you open will show up here.';
    list.appendChild(empty);
    return;
  }

  recentApps.forEach(function (app) {
    list.appendChild(createSidebarAppLink(app));
  });
}

// 「Popular Apps」欄を描画する（★評価の件数が多い順、同数なら平均点が高い順）
function renderPopularApps() {
  const list = document.getElementById('popularAppsList');
  if (!list) return; // このページにサイドバーが無ければ何もしない

  list.innerHTML = '';

  const popularApps = getApps()
    .map(function (app) {
      const ratings = getRatings(app.id);
      const count = ratings.length;
      const average = count > 0
        ? ratings.reduce(function (sum, r) { return sum + r; }, 0) / count
        : 0;
      return { app: app, count: count, average: average };
    })
    .filter(function (entry) { return entry.count > 0; })
    .sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return b.average - a.average;
    })
    .slice(0, 5);

  if (popularApps.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No ratings yet. Rate an app below to help others find popular picks!';
    list.appendChild(empty);
    return;
  }

  popularApps.forEach(function (entry) {
    list.appendChild(createSidebarAppLink(entry.app, entry.average, entry.count));
  });
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
    appRatings: getAllRatings(),
    appComments: getAllComments()
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

    // コメント：同じIDのコメントがまだ無ければアプリごとに追加する
    if (data.appComments && typeof data.appComments === 'object' && !Array.isArray(data.appComments)) {
      const allComments = getAllComments();
      Object.keys(data.appComments).forEach(function (appId) {
        if (!Array.isArray(data.appComments[appId])) return;
        if (!allComments[appId]) allComments[appId] = [];
        const existingIds = allComments[appId].map(function (c) { return String(c.id); });
        data.appComments[appId].forEach(function (c) {
          if (c && c.id != null && typeof c.text === 'string' && existingIds.indexOf(String(c.id)) === -1) {
            allComments[appId].push(c);
          }
        });
      });
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    }

    renderRequests();
    renderApps();
    renderYourApps();
    renderPopularApps();
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
