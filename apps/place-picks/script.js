// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'placePicks:places:v1';

// AppSync.store() のインスタンス。起動時に初期化される。
let store = null;

// app-sync.js が読み込めなかったときの保険。localStorage だけで動き、同期はしない。
// app-sync と同じキー・同じエンベロープ形式で書くので、次に正常に読み込めた
// 起動でそのまま拾われ、クラウドへ上がる。
async function openStore(slug, key, opts) {
  try { if (window.AppSync) return await window.AppSync.store(slug, key, opts); } catch (e) { console.error(e); }
  const o = opts || {}, k = 'appdata:' + slug + ':' + key;
  const read = function (s) { try { return JSON.parse(localStorage.getItem(s)); } catch (e) { return null; } };
  const cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  const env = read(k);
  let c = env && 'd' in env ? env.d : ((o.legacyKey && read(o.legacyKey)) ?? o.default ?? null);
  return {
    get: function () { return cp(c); },
    set: function (v) {
      c = cp(v);
      try { localStorage.setItem(k, JSON.stringify({ v: 1, av: o.version || 1, t: Date.now(), o: null, d: c })); } catch (e) {}
      return Promise.resolve();
    },
    subscribe: function () { return function () {}; },
    flush: function () { return Promise.resolve(); },
    status: function () { return { online: false, syncing: false, lastSyncedAt: null, error: null }; }
  };
}

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて savePlaces() してよい。
function getPlaces() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function savePlaces(places) {
  if (!store) return;
  store.set(places).catch(function (e) {
    console.error('Place Picks: 保存に失敗しました', e);
  });
}

const placeForm = document.getElementById('place-form');
const nameInput = document.getElementById('place-name');
const recommenderInput = document.getElementById('place-recommender');
const noteInput = document.getElementById('place-note');
const formError = document.getElementById('form-error');
const placeList = document.getElementById('place-list');
const emptyState = document.getElementById('empty-state');

function renderPlaces() {
  const places = getPlaces();

  placeList.innerHTML = '';

  if (places.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  for (const place of places) {
    const li = document.createElement('li');
    li.className = 'place-entry' + (place.visited ? ' is-visited' : '');

    const top = document.createElement('div');
    top.className = 'place-top';

    const nameEl = document.createElement('div');
    nameEl.className = 'place-name';
    nameEl.textContent = place.name;
    top.appendChild(nameEl);

    if (place.visited) {
      const badge = document.createElement('span');
      badge.className = 'visited-badge';
      badge.textContent = 'Visited';
      top.appendChild(badge);
    }

    li.appendChild(top);

    if (place.recommendedBy) {
      const metaEl = document.createElement('div');
      metaEl.className = 'place-meta';
      metaEl.textContent = `Recommended by ${place.recommendedBy}`;
      li.appendChild(metaEl);
    }

    if (place.note) {
      const noteEl = document.createElement('div');
      noteEl.className = 'place-note';
      noteEl.textContent = place.note;
      li.appendChild(noteEl);
    }

    const actions = document.createElement('div');
    actions.className = 'place-actions';

    const visitBtn = document.createElement('button');
    visitBtn.className = 'visit-btn';
    visitBtn.textContent = place.visited ? 'Mark as not visited' : 'Mark as visited';
    visitBtn.addEventListener('click', () => {
      toggleVisited(place.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'place-delete';
    deleteBtn.setAttribute('aria-label', `Delete ${place.name}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const remaining = getPlaces().filter((p) => p.id !== place.id);
      savePlaces(remaining);
      renderPlaces();
    });

    actions.appendChild(visitBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);

    placeList.appendChild(li);
  }
}

function toggleVisited(placeId) {
  const places = getPlaces();
  const place = places.find((p) => p.id === placeId);
  if (!place) return;
  place.visited = !place.visited;
  savePlaces(places);
  renderPlaces();
}

placeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const name = nameInput.value.trim();
  if (!name) {
    formError.textContent = 'Please enter a place name.';
    return;
  }

  const places = getPlaces();
  places.push({
    id: crypto.randomUUID(),
    name,
    recommendedBy: recommenderInput.value.trim(),
    note: noteInput.value.trim(),
    visited: false,
  });
  savePlaces(places);

  placeForm.reset();
  renderPlaces();
});

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('place-picks', 'places', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderPlaces(); });
  renderPlaces();
})();
