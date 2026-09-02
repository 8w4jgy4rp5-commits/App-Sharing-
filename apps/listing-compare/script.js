// ===========================
// Listing Compare
// 内見候補の部屋を数件だけ登録しておき、家賃・場所・メモを横並びの表で見比べるアプリ。
// タブを行き来しなくても、同じ項目を左右で比べられるようにするのが目的。
// ===========================

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

const MAX_NAME = 60;
const MAX_LOCATION = 60;
const MAX_LINK = 300;
const MAX_NOTES = 300;
const MAX_RENT = 1000000000;

// 画面の状態
let editingId = null;     // 編集中の物件 id (null なら新規追加)
let armedDeleteId = null; // 「もう一度押すと削除」状態の物件
let armedTimer = null;
let toastTimer = null;

// -----------------------
// 要素
// -----------------------
const form = document.getElementById('listing-form');
const nameInput = document.getElementById('f-name');
const rentInput = document.getElementById('f-rent');
const locationInput = document.getElementById('f-location');
const linkInput = document.getElementById('f-link');
const notesInput = document.getElementById('f-notes');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit');
const formHeading = document.getElementById('form-heading-text');
const emptyState = document.getElementById('empty-state');
const tableWrap = document.getElementById('table-wrap');
const table = document.getElementById('compare-table');
const scrollHint = document.getElementById('scroll-hint');
const countEl = document.getElementById('count');
const toast = document.getElementById('toast');

// 入力欄とエラー表示のひも付け
const FIELDS = [
  { input: nameInput, error: document.getElementById('e-name'), hint: 'h-name', errorId: 'e-name' },
  { input: rentInput, error: document.getElementById('e-rent'), hint: 'h-rent', errorId: 'e-rent' },
  { input: locationInput, error: document.getElementById('e-location'), hint: 'h-location', errorId: 'e-location' },
  { input: linkInput, error: document.getElementById('e-link'), hint: 'h-link', errorId: 'e-link' },
  { input: notesInput, error: document.getElementById('e-notes'), hint: 'h-notes', errorId: 'e-notes' }
];

// -----------------------
// データ
// -----------------------

function getItems() {
  if (!store) return [];
  const items = store.get();
  return Array.isArray(items) ? items : [];
}

function saveItems(items) {
  if (!store) return;
  store.set(items).catch(function (e) {
    console.error('Listing Compare: 保存に失敗しました', e);
  });
}

function makeId() {
  return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// -----------------------
// 入力チェック
// -----------------------

function clearErrors() {
  FIELDS.forEach(function (f) {
    f.error.hidden = true;
    f.error.textContent = '';
    f.input.removeAttribute('aria-invalid');
    f.input.setAttribute('aria-describedby', f.hint);
  });
}

function showError(field, message) {
  field.error.textContent = message;
  field.error.hidden = false;
  field.input.setAttribute('aria-invalid', 'true');
  field.input.setAttribute('aria-describedby', field.hint + ' ' + field.errorId);
}

// "85,000" のような入力も受け取り、数値または null / 'invalid' を返す。
function parseRent(raw) {
  const text = raw.replace(/[,\s]/g, '');
  if (text === '') return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return 'invalid';
  const value = Number(text);
  if (!isFinite(value)) return 'invalid';
  return value;
}

// スキームが無ければ https:// を補い、http/https 以外は弾く。
function normalizeLink(raw) {
  if (raw === '') return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : 'https://' + raw;
  let url;
  try {
    url = new URL(withScheme);
  } catch (e) {
    return 'invalid';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'invalid';
  if (!url.hostname || url.hostname.indexOf('.') === -1) return 'invalid';
  return url.href;
}

// 表示前にもう一度スキームを確認する（保存済みデータが壊れていた場合の保険）。
function isSafeLink(value) {
  if (typeof value !== 'string' || value === '') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// -----------------------
// フォーム
// -----------------------

function resetForm() {
  editingId = null;
  form.reset();
  clearErrors();
  formHeading.textContent = 'Add a listing';
  submitBtn.textContent = 'Add listing';
  cancelBtn.hidden = true;
}

function startEdit(item) {
  editingId = item.id;
  nameInput.value = item.name || '';
  rentInput.value = item.rent == null ? '' : String(item.rent);
  locationInput.value = item.location || '';
  linkInput.value = item.link || '';
  notesInput.value = item.notes || '';
  clearErrors();
  formHeading.textContent = 'Edit listing';
  submitBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  nameInput.focus();
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearErrors();

  const items = getItems();
  const name = nameInput.value.trim();
  const rawRent = rentInput.value.trim();
  const location = locationInput.value.trim();
  const rawLink = linkInput.value.trim();
  const notes = notesInput.value.trim();

  let firstBad = null;

  if (name === '') {
    showError(FIELDS[0], 'Give this listing a name so you can tell the columns apart.');
    firstBad = firstBad || FIELDS[0];
  } else if (name.length > MAX_NAME) {
    showError(FIELDS[0], 'Keep the name to ' + MAX_NAME + ' characters or fewer.');
    firstBad = firstBad || FIELDS[0];
  } else {
    const clash = items.some(function (item) {
      return item.id !== editingId && (item.name || '').trim().toLowerCase() === name.toLowerCase();
    });
    if (clash) {
      showError(FIELDS[0], 'You already have a listing with that name.');
      firstBad = firstBad || FIELDS[0];
    }
  }

  const rent = parseRent(rawRent);
  if (rent === 'invalid') {
    showError(FIELDS[1], 'Numbers only, like 85000. Leave it empty if you do not know yet.');
    firstBad = firstBad || FIELDS[1];
  } else if (rent !== null && rent > MAX_RENT) {
    showError(FIELDS[1], 'That rent looks too large. Check the number.');
    firstBad = firstBad || FIELDS[1];
  }

  if (location.length > MAX_LOCATION) {
    showError(FIELDS[2], 'Keep the location to ' + MAX_LOCATION + ' characters or fewer.');
    firstBad = firstBad || FIELDS[2];
  }

  const link = normalizeLink(rawLink);
  if (link === 'invalid') {
    showError(FIELDS[3], 'That does not look like a web address. Try something like example.com/rooms/123.');
    firstBad = firstBad || FIELDS[3];
  } else if (link.length > MAX_LINK) {
    showError(FIELDS[3], 'That address is too long to save.');
    firstBad = firstBad || FIELDS[3];
  }

  if (notes.length > MAX_NOTES) {
    showError(FIELDS[4], 'Keep the notes to ' + MAX_NOTES + ' characters or fewer.');
    firstBad = firstBad || FIELDS[4];
  }

  if (firstBad) {
    firstBad.input.focus();
    return;
  }

  const values = {
    name: name,
    rent: rent === null ? null : rent,
    location: location,
    link: link,
    notes: notes
  };

  if (editingId) {
    const index = items.findIndex(function (item) { return item.id === editingId; });
    if (index === -1) {
      resetForm();
      renderAll();
      showToast('That listing is no longer here.');
      return;
    }
    items[index] = Object.assign({}, items[index], values);
    saveItems(items);
    resetForm();
    renderAll();
    showToast('Listing updated.');
    return;
  }

  values.id = makeId();
  values.createdAt = Date.now();
  items.push(values);
  saveItems(items);
  resetForm();
  renderAll();
  showToast('Listing added.');
  // 追加した列（右端）が見えるところまで表を寄せる
  tableWrap.scrollLeft = tableWrap.scrollWidth;
});

cancelBtn.addEventListener('click', function () {
  resetForm();
  nameInput.focus();
});

// -----------------------
// 削除（2回押しで確定）
// -----------------------

function armDelete(id) {
  armedDeleteId = id;
  if (armedTimer) clearTimeout(armedTimer);
  armedTimer = setTimeout(function () {
    armedDeleteId = null;
    renderAll();
  }, 4000);
  renderAll();
}

function removeListing(id) {
  const items = getItems().filter(function (item) { return item.id !== id; });
  saveItems(items);
  armedDeleteId = null;
  if (armedTimer) clearTimeout(armedTimer);
  if (editingId === id) resetForm();
  renderAll();
  showToast('Listing removed.');
}

// -----------------------
// 表示
// -----------------------

function formatRent(value) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function blankCell(text) {
  const span = document.createElement('span');
  span.className = 'blank';
  span.textContent = text;
  return span;
}

function makeRow(label) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.scope = 'row';
  th.className = 'rowhead';
  th.textContent = label;
  tr.appendChild(th);
  return tr;
}

function buildTable(items) {
  table.textContent = '';

  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = 'Your saved listings, one column each.';
  table.appendChild(caption);

  // 一番安い家賃を探す（未入力は対象外）
  let lowest = null;
  items.forEach(function (item) {
    if (typeof item.rent === 'number' && (lowest === null || item.rent < lowest)) lowest = item.rent;
  });
  const lowestCount = lowest === null
    ? 0
    : items.filter(function (item) { return item.rent === lowest; }).length;

  // 見出しの行
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('td');
  corner.className = 'rowhead';
  headRow.appendChild(corner);

  items.forEach(function (item) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.className = 'col-head';
    const name = document.createElement('span');
    name.className = 'col-name';
    name.textContent = item.name;
    th.appendChild(name);
    if (lowest !== null && item.rent === lowest && lowestCount === 1) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Lowest rent';
      th.appendChild(badge);
    }
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // 家賃
  const rentRow = makeRow('Rent');
  items.forEach(function (item) {
    const td = document.createElement('td');
    if (typeof item.rent === 'number') {
      if (lowest !== null && item.rent === lowest && lowestCount === 1) td.className = 'is-lowest';
      const value = document.createElement('span');
      value.className = 'rent-value';
      value.textContent = formatRent(item.rent);
      const per = document.createElement('span');
      per.className = 'rent-per';
      per.textContent = ' / month';
      td.appendChild(value);
      td.appendChild(per);
    } else {
      td.appendChild(blankCell('Not filled in'));
    }
    rentRow.appendChild(td);
  });
  tbody.appendChild(rentRow);

  // 場所
  const locationRow = makeRow('Location');
  items.forEach(function (item) {
    const td = document.createElement('td');
    if (item.location) td.textContent = item.location;
    else td.appendChild(blankCell('Not filled in'));
    locationRow.appendChild(td);
  });
  tbody.appendChild(locationRow);

  // リンク
  const linkRow = makeRow('Link');
  items.forEach(function (item) {
    const td = document.createElement('td');
    if (isSafeLink(item.link)) {
      const a = document.createElement('a');
      a.className = 'listing-link';
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Open listing';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = ' for ' + item.name;
      a.appendChild(sr);
      td.appendChild(a);
    } else {
      td.appendChild(blankCell('No link'));
    }
    linkRow.appendChild(td);
  });
  tbody.appendChild(linkRow);

  // メモ
  const notesRow = makeRow('Notes');
  items.forEach(function (item) {
    const td = document.createElement('td');
    td.className = 'notes-cell';
    if (item.notes) td.textContent = item.notes;
    else td.appendChild(blankCell('Nothing written down yet'));
    notesRow.appendChild(td);
  });
  tbody.appendChild(notesRow);

  // 操作ボタン
  const actionRow = makeRow('');
  items.forEach(function (item) {
    const td = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'cell-actions';

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn-small';
    edit.textContent = 'Edit';
    const editSr = document.createElement('span');
    editSr.className = 'sr-only';
    editSr.textContent = ' ' + item.name;
    edit.appendChild(editSr);
    edit.addEventListener('click', function () { startEdit(item); });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-small';
    const armed = armedDeleteId === item.id;
    if (armed) {
      del.classList.add('is-armed');
      del.textContent = 'Press again';
    } else {
      del.textContent = 'Remove';
    }
    const delSr = document.createElement('span');
    delSr.className = 'sr-only';
    delSr.textContent = armed ? ' to remove ' + item.name + ' for good' : ' ' + item.name;
    del.appendChild(delSr);
    del.addEventListener('click', function () {
      if (armedDeleteId === item.id) removeListing(item.id);
      else armDelete(item.id);
    });

    wrap.appendChild(edit);
    wrap.appendChild(del);
    td.appendChild(wrap);
    actionRow.appendChild(td);
  });
  tbody.appendChild(actionRow);

  table.appendChild(tbody);
}

// 保存のたびに呼ぶ、唯一の再描画の入口。
function renderAll() {
  const items = getItems();

  if (items.length === 0) {
    emptyState.hidden = false;
    tableWrap.hidden = true;
    scrollHint.hidden = true;
    countEl.textContent = '';
    table.textContent = '';
    return;
  }

  emptyState.hidden = true;
  tableWrap.hidden = false;
  countEl.textContent = items.length === 1 ? '1 listing' : items.length + ' listings side by side';
  buildTable(items);
  updateScrollHint();
}

// 表が実際に画面からはみ出しているときだけ「横にスワイプ」と出す。
function updateScrollHint() {
  if (tableWrap.hidden) {
    scrollHint.hidden = true;
    return;
  }
  scrollHint.hidden = tableWrap.scrollWidth <= tableWrap.clientWidth + 1;
}

window.addEventListener('resize', updateScrollHint);

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
}

// -----------------------
// 起動
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  // データ層を先に用意する（読み込み途中の画面で操作させない）
  store = await openStore('listing-compare', 'listings', { default: [] });

  store.subscribe(function () { renderAll(); });
  renderAll();
});
