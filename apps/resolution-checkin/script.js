// ===========================
// Resolution Check-in
// 目標(resolution)を数個だけ書いておき、月が変わったら見直しを促すアプリ。
// 進捗はスライダーで0〜100%、チェックインのたびに履歴が1行増える。
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

const MAX_TITLE = 80;
const MAX_WHY = 140;
const MAX_NOTE = 200;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// 画面の状態
let data = { items: [], lastCheckIn: null };
let checkInMode = false;   // チェックイン中かどうか
let draftNotes = {};       // チェックイン中に入力したメモ (id -> string)
let armedDeleteId = null;  // 「もう一度押すと削除」状態の目標
let toastTimer = null;

// -----------------------
// 要素
// -----------------------
const banner = document.getElementById('banner');
const bannerTitle = document.getElementById('banner-title');
const bannerSub = document.getElementById('banner-sub');
const startBtn = document.getElementById('start-checkin');
const checkinBar = document.getElementById('checkin-bar');
const checkinMonthEl = document.getElementById('checkin-month');
const finishBtn = document.getElementById('finish-checkin');
const cancelBtn = document.getElementById('cancel-checkin');
const form = document.getElementById('add-form');
const titleInput = document.getElementById('title');
const whyInput = document.getElementById('why');
const titleError = document.getElementById('title-error');
const listEl = document.getElementById('list');
const summaryEl = document.getElementById('summary');
const emptyState = document.getElementById('empty-state');
const toastEl = document.getElementById('toast');

// -----------------------
// 小さな道具
// -----------------------

function newId() {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// 0〜100 を 10 刻みに丸める
function clampProgress(value) {
  const n = Number(value);
  if (!isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n / 10) * 10));
}

function monthKeyOf(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function isMonthKey(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function monthLabel(key) {
  if (!isMonthKey(key)) return '';
  const parts = key.split('-');
  return MONTH_NAMES[Number(parts[1]) - 1] + ' ' + parts[0];
}

function shortMonthLabel(key) {
  if (!isMonthKey(key)) return '';
  const parts = key.split('-');
  return MONTH_NAMES[Number(parts[1]) - 1].slice(0, 3) + ' ' + parts[0];
}

function nextMonthKey(key) {
  const parts = key.split('-');
  let year = Number(parts[0]);
  let month = Number(parts[1]) + 1;
  if (month > 12) { month = 1; year += 1; }
  return year + '-' + String(month).padStart(2, '0');
}

// key 同士が何か月離れているか
function monthsApart(a, b) {
  const pa = a.split('-');
  const pb = b.split('-');
  return (Number(pb[0]) - Number(pa[0])) * 12 + (Number(pb[1]) - Number(pa[1]));
}

function currentMonth() {
  return monthKeyOf(new Date());
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
}

// -----------------------
// 保存データの読み書き
// -----------------------

// 壊れたデータ・古いデータが来てもページが落ちないように整える
function normalise(raw) {
  const out = { items: [], lastCheckIn: null };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  if (isMonthKey(raw.lastCheckIn)) out.lastCheckIn = raw.lastCheckIn;

  const items = Array.isArray(raw.items) ? raw.items : [];
  items.forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    if (!title) return;
    out.items.push({
      id: typeof item.id === 'string' && item.id ? item.id : newId(),
      title: title.slice(0, MAX_TITLE),
      why: typeof item.why === 'string' ? item.why.trim().slice(0, MAX_WHY) : '',
      progress: clampProgress(item.progress),
      done: item.done === true,
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      history: normaliseHistory(item.history)
    });
  });
  return out;
}

function normaliseHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  raw.forEach(function (entry) {
    if (!entry || typeof entry !== 'object') return;
    if (!isMonthKey(entry.month)) return;
    out.push({
      month: entry.month,
      progress: clampProgress(entry.progress),
      note: typeof entry.note === 'string' ? entry.note.trim().slice(0, MAX_NOTE) : ''
    });
  });
  return out;
}

function save() {
  if (!store) return;
  store.set(data);
}

function findItem(id) {
  for (let i = 0; i < data.items.length; i++) {
    if (data.items[i].id === id) return data.items[i];
  }
  return null;
}

function activeItems() {
  return data.items.filter(function (item) { return !item.done; });
}

// -----------------------
// 描画
// -----------------------

function render() {
  renderBanner();
  renderCheckinBar();
  renderList();
  renderSummary();

  // 「もう一度押すと削除」の途中なら、そのボタンに戻しておく
  if (armedDeleteId) {
    const btn = listEl.querySelector('[data-action="delete"][data-id="' + armedDeleteId + '"]');
    if (btn) btn.focus();
  }
}

function renderBanner() {
  const active = activeItems();
  if (active.length === 0) {
    banner.hidden = true;
    return;
  }

  const month = currentMonth();
  banner.hidden = false;

  if (data.lastCheckIn === month) {
    banner.classList.add('is-done');
    bannerTitle.textContent = 'You checked in for ' + monthLabel(month) + '.';
    bannerSub.textContent =
      'Next check-in opens in ' + monthLabel(nextMonthKey(month)) +
      '. You can still move any bar below whenever you like.';
    return;
  }

  banner.classList.remove('is-done');
  bannerTitle.textContent = 'Time for your ' + monthLabel(month) + ' check-in.';
  if (data.lastCheckIn) {
    const gap = monthsApart(data.lastCheckIn, month);
    bannerSub.textContent =
      'Last check-in: ' + monthLabel(data.lastCheckIn) +
      ' (' + gap + (gap === 1 ? ' month' : ' months') + ' ago).';
  } else {
    bannerSub.textContent = 'You have not checked in yet. It takes about a minute.';
  }
}

function renderCheckinBar() {
  checkinBar.hidden = !checkInMode;
  if (checkInMode) checkinMonthEl.textContent = monthLabel(currentMonth());
}

function renderSummary() {
  const active = activeItems();
  const doneCount = data.items.length - active.length;

  if (data.items.length === 0) {
    summaryEl.textContent = '';
    return;
  }

  const parts = [];
  parts.push(active.length + ' active');
  if (active.length > 0) {
    let total = 0;
    active.forEach(function (item) { total += item.progress; });
    parts.push('average ' + Math.round(total / active.length) + '%');
  }
  if (doneCount > 0) parts.push(doneCount + ' done');
  summaryEl.textContent = parts.join(' · ');
}

function renderList() {
  listEl.textContent = '';

  const sorted = data.items.slice().sort(function (a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.createdAt - b.createdAt;
  });

  sorted.forEach(function (item) {
    listEl.appendChild(buildCard(item));
  });

  emptyState.hidden = data.items.length > 0;
}

function buildCard(item) {
  const li = el('li', 'res-card' + (item.done ? ' is-done' : ''));
  li.dataset.id = item.id;
  li.style.setProperty('--bar', barColour(item));

  // 見出し
  const head = el('div', 'res-head');
  head.appendChild(el('h3', 'res-title', item.title));
  if (item.done) head.appendChild(el('span', 'res-badge', 'Done'));
  li.appendChild(head);

  if (item.why) li.appendChild(el('p', 'res-why', item.why));

  // 進捗
  const progress = el('div', 'res-progress');
  if (item.done) {
    const track = el('div', 'res-static-bar');
    const fill = el('span');
    fill.style.width = item.progress + '%';
    track.appendChild(fill);
    progress.appendChild(track);
  } else {
    const label = el('label', 'sr-only', 'Progress for ' + item.title);
    label.setAttribute('for', 'range-' + item.id);
    progress.appendChild(label);

    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'res-range';
    range.id = 'range-' + item.id;
    range.min = '0';
    range.max = '100';
    range.step = '10';
    range.value = String(item.progress);
    range.dataset.id = item.id;
    range.style.setProperty('--pct', item.progress + '%');
    progress.appendChild(range);
  }
  const pct = el('output', 'res-pct', item.progress + '%');
  if (!item.done) pct.setAttribute('for', 'range-' + item.id);
  progress.appendChild(pct);
  li.appendChild(progress);

  // チェックイン中だけ出るメモ欄
  if (checkInMode && !item.done) {
    const noteWrap = el('div', 'res-note');
    const noteLabel = el('label', null, 'Note for ' + monthLabel(currentMonth()) + ' (optional)');
    noteLabel.setAttribute('for', 'note-' + item.id);
    const note = document.createElement('input');
    note.type = 'text';
    note.id = 'note-' + item.id;
    note.maxLength = MAX_NOTE;
    note.autocomplete = 'off';
    note.placeholder = 'e.g. Slow month, but I kept two runs a week';
    note.value = draftNotes[item.id] || '';
    note.dataset.id = item.id;
    note.dataset.role = 'note';
    noteWrap.appendChild(noteLabel);
    noteWrap.appendChild(note);
    li.appendChild(noteWrap);
  }

  // 履歴
  if (item.history.length > 0) {
    const details = el('details', 'res-history');
    details.appendChild(el('summary', null, 'Check-in history (' + item.history.length + ')'));
    const historyList = el('ul', 'history-list');
    item.history.slice().reverse().forEach(function (entry) {
      const row = el('li');
      row.appendChild(el('span', 'history-month', shortMonthLabel(entry.month)));
      row.appendChild(el('span', 'history-pct', entry.progress + '%'));
      row.appendChild(el('span', 'history-note', entry.note || '—'));
      historyList.appendChild(row);
    });
    details.appendChild(historyList);
    li.appendChild(details);
  }

  // 操作
  const actions = el('div', 'res-actions');
  actions.appendChild(
    actionButton(item.id, 'toggle', item.done ? 'Reopen' : 'Mark as done', 'btn-quiet')
  );
  const armed = armedDeleteId === item.id;
  actions.appendChild(
    actionButton(
      item.id,
      'delete',
      armed ? 'Tap again to delete' : 'Delete',
      'btn-quiet danger' + (armed ? ' armed' : '')
    )
  );
  if (armed) actions.appendChild(actionButton(item.id, 'cancel-delete', 'Keep it', 'btn-quiet'));
  li.appendChild(actions);

  return li;
}

function actionButton(id, action, label, className) {
  const btn = el('button', className, label);
  btn.type = 'button';
  btn.dataset.id = id;
  btn.dataset.action = action;
  return btn;
}

function barColour(item) {
  if (item.done || item.progress >= 100) return 'var(--success)';
  return 'var(--accent)';
}

// -----------------------
// 目標を追加する
// -----------------------

form.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!store) return;

  const title = titleInput.value.trim();
  if (!title) {
    showTitleError('Write what you want to work on.');
    return;
  }
  if (title.length > MAX_TITLE) {
    showTitleError('Keep it under ' + MAX_TITLE + ' characters.');
    return;
  }

  clearTitleError();
  data.items.push({
    id: newId(),
    title: title,
    why: whyInput.value.trim().slice(0, MAX_WHY),
    progress: 0,
    done: false,
    createdAt: Date.now(),
    history: []
  });
  save();
  form.reset();
  titleInput.focus();
  render();
});

titleInput.addEventListener('input', function () {
  if (titleInput.value.trim()) clearTitleError();
});

function showTitleError(message) {
  titleError.textContent = message;
  titleInput.classList.add('invalid');
  titleInput.setAttribute('aria-invalid', 'true');
  titleInput.focus();
}

function clearTitleError() {
  titleError.textContent = '';
  titleInput.classList.remove('invalid');
  titleInput.removeAttribute('aria-invalid');
}

// -----------------------
// リストの操作
// -----------------------

// スライダーとメモは、再描画せずにその場だけ更新する
// (再描画するとドラッグ中のつまみからフォーカスが外れてしまうため)
listEl.addEventListener('input', function (event) {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  if (target.dataset.role === 'note') {
    draftNotes[id] = target.value;
    return;
  }

  if (target.classList.contains('res-range')) {
    const item = findItem(id);
    if (!item) return;
    item.progress = clampProgress(target.value);
    target.style.setProperty('--pct', item.progress + '%');

    const card = target.closest('.res-card');
    if (card) {
      card.style.setProperty('--bar', barColour(item));
      const pct = card.querySelector('.res-pct');
      if (pct) pct.textContent = item.progress + '%';
    }
    renderSummary();
    save();
  }
});

listEl.addEventListener('click', function (event) {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const item = findItem(id);
  if (!item) return;

  if (btn.dataset.action === 'toggle') {
    armedDeleteId = null;
    item.done = !item.done;
    save();
    render();
    toast(item.done ? 'Marked as done.' : 'Back on the list.');
    return;
  }

  if (btn.dataset.action === 'cancel-delete') {
    armedDeleteId = null;
    render();
    return;
  }

  if (btn.dataset.action === 'delete') {
    // 1回目は「本当に？」、2回目で削除する(ダイアログを出さない)
    if (armedDeleteId !== id) {
      armedDeleteId = id;
      render();
      return;
    }
    armedDeleteId = null;
    data.items = data.items.filter(function (other) { return other.id !== id; });
    delete draftNotes[id];
    save();
    render();
    toast('Resolution deleted.');
  }
});

// -----------------------
// 月イチのチェックイン
// -----------------------

startBtn.addEventListener('click', function () {
  checkInMode = true;
  draftNotes = {};
  armedDeleteId = null;
  render();
  checkinBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

cancelBtn.addEventListener('click', function () {
  checkInMode = false;
  draftNotes = {};
  render();
});

finishBtn.addEventListener('click', function () {
  const month = currentMonth();
  const active = activeItems();

  active.forEach(function (item) {
    const note = (draftNotes[item.id] || '').trim().slice(0, MAX_NOTE);
    // 同じ月に2回目を回したら上書きする
    const existing = item.history.filter(function (entry) { return entry.month === month; })[0];
    if (existing) {
      existing.progress = item.progress;
      existing.note = note;
    } else {
      item.history.push({ month: month, progress: item.progress, note: note });
    }
  });

  data.lastCheckIn = month;
  checkInMode = false;
  draftNotes = {};
  save();
  render();
  toast(monthLabel(month) + ' check-in saved.');
  banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// -----------------------
// 起動
// -----------------------

(async function () {
  store = await openStore('resolution-checkin', 'data', {
    default: { items: [], lastCheckIn: null },
    version: 1
  });

  data = normalise(store.get());

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function (value) {
    data = normalise(value);
    render();
  });

  render();
})();
