// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'songCatcher:entries:v1';

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

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveEntries() してよい。
function getEntries() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveEntries(entries) {
  if (!store) return;
  store.set(entries).catch(function (e) {
    console.error('Song Catcher: 保存に失敗しました', e);
  });
}

const addForm = document.getElementById('add-form');
const songInput = document.getElementById('song-input');
const formError = document.getElementById('form-error');
const entryList = document.getElementById('entry-list');
const emptyState = document.getElementById('empty-state');

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderEntries() {
  const entries = getEntries();

  entryList.innerHTML = '';

  if (entries.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const sorted = [...entries].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  for (const entry of sorted) {
    const li = document.createElement('li');
    li.className = 'entry-card' + (entry.done ? ' is-done' : '');

    const top = document.createElement('div');
    top.className = 'entry-top';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'entry-check';
    checkbox.checked = entry.done;
    checkbox.setAttribute('aria-label', entry.done ? 'Mark as not done' : 'Mark as done');
    checkbox.addEventListener('change', () => {
      toggleDone(entry.id);
    });
    top.appendChild(checkbox);

    const body = document.createElement('div');
    body.className = 'entry-body';

    const textEl = document.createElement('div');
    textEl.className = 'entry-text';
    textEl.textContent = entry.text;
    body.appendChild(textEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'entry-meta';
    metaEl.textContent = formatDate(entry.createdAt);
    body.appendChild(metaEl);

    top.appendChild(body);

    if (entry.done) {
      const badge = document.createElement('span');
      badge.className = 'done-badge';
      badge.textContent = 'Done';
      top.appendChild(badge);
    }

    li.appendChild(top);

    const actions = document.createElement('div');
    actions.className = 'entry-actions';

    const searchLink = document.createElement('a');
    searchLink.className = 'search-link';
    searchLink.href = `https://www.google.com/search?q=${encodeURIComponent(entry.text)}`;
    searchLink.target = '_blank';
    searchLink.rel = 'noopener noreferrer';
    searchLink.textContent = 'Search';
    actions.appendChild(searchLink);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'entry-delete';
    deleteBtn.setAttribute('aria-label', 'Delete entry');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const remaining = getEntries().filter((e) => e.id !== entry.id);
      saveEntries(remaining);
      renderEntries();
    });
    actions.appendChild(deleteBtn);

    li.appendChild(actions);
    entryList.appendChild(li);
  }
}

function toggleDone(entryId) {
  const entries = getEntries();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return;
  entry.done = !entry.done;
  saveEntries(entries);
  renderEntries();
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const text = songInput.value.trim();
  if (!text) {
    formError.textContent = 'Please enter something before saving.';
    return;
  }

  const entries = getEntries();
  entries.push({
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
    done: false,
  });
  saveEntries(entries);

  addForm.reset();
  songInput.focus();
  renderEntries();
});

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('song-catcher', 'entries', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderEntries(); });
  renderEntries();
})();
