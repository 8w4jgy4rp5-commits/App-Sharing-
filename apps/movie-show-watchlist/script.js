// ===========================
// Movie & Show Watchlist - script
// One unified list of movies and shows, each either "want to watch" or "watched".
// ===========================

const MAX_TITLE = 120;
const MAX_SOURCE = 60;

// Labels shown on the small badge in each row.
const TYPE_LABELS = {
  movie: 'Movie',
  tv: 'TV Show',
  other: 'Other'
};

let store = null;
let currentFilter = 'all'; // 'all' | 'want' | 'watched'
let searchTerm = '';
let toastTimer = null;

// DOM handles, filled in on DOMContentLoaded.
let form, titleInput, titleError, typeInput, sourceInput;
let searchInput, listEl, emptyEl, toastEl, tabButtons;
let countAllEl, countWantEl, countWatchedEl;

// Fallback for when app-sync.js fails to load. localStorage only, no sync.
// Writes the same key in the same envelope format, so the next healthy load
// picks it up and uploads it. Copy as-is; don't trim it.
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

// -----------------------
// Data
// -----------------------

function getItems() {
  if (!store) return [];
  const items = store.get();
  return Array.isArray(items) ? items : [];
}

function saveItems(items) {
  if (!store) return;
  store.set(items).catch(function (e) {
    console.error('Movie & Show Watchlist: 保存に失敗しました', e);
  });
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'w-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// -----------------------
// Filtering
// -----------------------

function matchesFilter(item) {
  if (currentFilter === 'want') return item.status !== 'watched';
  if (currentFilter === 'watched') return item.status === 'watched';
  return true;
}

function matchesSearch(item) {
  if (!searchTerm) return true;
  const haystack = ((item.title || '') + ' ' + (item.source || '')).toLowerCase();
  return haystack.indexOf(searchTerm) !== -1;
}

// Newest first, but anything already watched sinks below the unwatched ones.
function sortItems(items) {
  return items.slice().sort(function (a, b) {
    const aDone = a.status === 'watched' ? 1 : 0;
    const bDone = b.status === 'watched' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
}

// -----------------------
// Rendering
// -----------------------

function buildRow(item) {
  const li = document.createElement('li');
  li.className = 'item' + (item.status === 'watched' ? ' is-done' : '');

  const tick = document.createElement('button');
  tick.type = 'button';
  tick.className = 'tick' + (item.status === 'watched' ? ' is-done' : '');
  tick.textContent = '✓';
  tick.dataset.action = 'toggle';
  tick.dataset.id = item.id;
  tick.setAttribute('aria-pressed', item.status === 'watched' ? 'true' : 'false');
  tick.setAttribute(
    'aria-label',
    item.status === 'watched'
      ? 'Move "' + item.title + '" back to want to watch'
      : 'Mark "' + item.title + '" as watched'
  );

  const body = document.createElement('div');
  body.className = 'item-body';

  const title = document.createElement('div');
  title.className = 'item-title';
  title.textContent = item.title;

  const meta = document.createElement('div');
  meta.className = 'item-meta';

  const kind = document.createElement('span');
  kind.className = 'kind';
  kind.textContent = TYPE_LABELS[item.type] || TYPE_LABELS.other;
  meta.appendChild(kind);

  const source = document.createElement('span');
  source.textContent = item.source
    ? item.source
    : (item.status === 'watched' ? 'Watched' : 'Want to watch');
  meta.appendChild(source);

  body.appendChild(title);
  body.appendChild(meta);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = '×';
  del.dataset.action = 'delete';
  del.dataset.id = item.id;
  del.setAttribute('aria-label', 'Remove "' + item.title + '" from the list');

  li.appendChild(tick);
  li.appendChild(body);
  li.appendChild(del);
  return li;
}

function emptyMessage(total) {
  if (total === 0) {
    return 'Nothing here yet. Add the first movie or show you want to watch using the form above.';
  }
  if (searchTerm) return 'No titles match your search.';
  if (currentFilter === 'want') return 'Nothing left to watch. Everything on your list is done.';
  if (currentFilter === 'watched') return 'Nothing marked as watched yet. Tap the tick on a row once you have seen it.';
  return 'Nothing to show.';
}

function render() {
  const items = getItems();

  // counts always describe the whole list, not the current filter
  const watched = items.filter(function (i) { return i.status === 'watched'; }).length;
  countAllEl.textContent = String(items.length);
  countWantEl.textContent = String(items.length - watched);
  countWatchedEl.textContent = String(watched);

  const visible = sortItems(items.filter(function (i) {
    return matchesFilter(i) && matchesSearch(i);
  }));

  listEl.textContent = '';
  visible.forEach(function (item) {
    listEl.appendChild(buildRow(item));
  });

  const nothing = visible.length === 0;
  emptyEl.hidden = !nothing;
  if (nothing) emptyEl.textContent = emptyMessage(items.length);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.hidden = true;
  }, 2200);
}

// -----------------------
// Actions
// -----------------------

function showTitleError(message) {
  titleError.textContent = message;
  titleError.hidden = false;
  titleInput.setAttribute('aria-invalid', 'true');
}

function clearTitleError() {
  titleError.textContent = '';
  titleError.hidden = true;
  titleInput.removeAttribute('aria-invalid');
}

function handleAdd(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const source = sourceInput.value.trim();

  if (!title) {
    showTitleError('Please enter a title.');
    titleInput.focus();
    return;
  }
  if (title.length > MAX_TITLE) {
    showTitleError('Please keep the title under ' + MAX_TITLE + ' characters.');
    titleInput.focus();
    return;
  }

  const items = getItems();
  const duplicate = items.some(function (i) {
    return (i.title || '').toLowerCase() === title.toLowerCase();
  });
  if (duplicate) {
    showTitleError('"' + title + '" is already on your list.');
    titleInput.focus();
    return;
  }

  clearTitleError();

  items.push({
    id: makeId(),
    title: title,
    type: typeInput.value || 'other',
    source: source.slice(0, MAX_SOURCE),
    status: 'want',
    addedAt: Date.now(),
    watchedAt: null
  });

  saveItems(items);
  render();

  form.reset();
  titleInput.focus();
  showToast('Added to your watchlist.');
}

function toggleWatched(id) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;

  const nowWatched = item.status !== 'watched';
  item.status = nowWatched ? 'watched' : 'want';
  item.watchedAt = nowWatched ? Date.now() : null;

  saveItems(items);
  render();
  showToast(nowWatched ? 'Marked as watched.' : 'Moved back to want to watch.');
}

function deleteItem(id) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  if (!window.confirm('Remove "' + item.title + '" from your watchlist?')) return;

  saveItems(items.filter(function (i) { return i.id !== id; }));
  render();
  showToast('Removed.');
}

function setFilter(filter) {
  currentFilter = filter;
  tabButtons.forEach(function (btn) {
    const on = btn.dataset.filter === filter;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  render();
}

// -----------------------
// Start up
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  form = document.getElementById('addForm');
  titleInput = document.getElementById('titleInput');
  titleError = document.getElementById('titleError');
  typeInput = document.getElementById('typeInput');
  sourceInput = document.getElementById('sourceInput');
  searchInput = document.getElementById('searchInput');
  listEl = document.getElementById('list');
  emptyEl = document.getElementById('emptyState');
  toastEl = document.getElementById('toast');
  countAllEl = document.getElementById('countAll');
  countWantEl = document.getElementById('countWant');
  countWatchedEl = document.getElementById('countWatched');
  tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab'));

  form.addEventListener('submit', handleAdd);
  titleInput.addEventListener('input', clearTitleError);

  searchInput.addEventListener('input', function () {
    searchTerm = searchInput.value.trim().toLowerCase();
    render();
  });

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setFilter(btn.dataset.filter);
    });
  });

  // one listener for the whole list, so rows added later are covered too
  listEl.addEventListener('click', function (event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'toggle') toggleWatched(btn.dataset.id);
    else if (btn.dataset.action === 'delete') deleteItem(btn.dataset.id);
  });

  // data layer first — don't let the user act on a half-loaded screen
  store = await openStore('movie-show-watchlist', 'items', { default: [] });

  store.subscribe(function () { render(); });
  render();
});
