const GOAL_KEY = 'screenTimeTracker:goal:v1';
const ENTRIES_KEY = 'screenTimeTracker:entries:v1';

// AppSync.store() のインスタンス。起動時に初期化される。
// 目標値は端末ごとの設定ではなく本人が決めた値なので、記録と同じく同期する。
let goalStore = null;
let entriesStore = null;

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

// 中身の検証は残す。別デバイスや旧バージョンが書いた値も同じ経路を通るため。
function getGoal() {
  if (!goalStore) return null;
  const v = goalStore.get();
  return typeof v === 'number' && v > 0 ? v : null;
}

function saveGoal(totalMinutes) {
  if (!goalStore) return;
  goalStore.set(totalMinutes).catch(function (e) {
    console.error('Screen Time Tracker: 保存に失敗しました', e);
  });
}

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveEntries() してよい。
function getEntries() {
  if (!entriesStore) return [];
  const v = entriesStore.get();
  return Array.isArray(v) ? v : [];
}

function saveEntries(entries) {
  if (!entriesStore) return;
  entriesStore.set(entries).catch(function (e) {
    console.error('Screen Time Tracker: 保存に失敗しました', e);
  });
}

function formatMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseHoursMinutes(hoursInput, minutesInput) {
  const h = parseInt(hoursInput.value, 10);
  const m = parseInt(minutesInput.value, 10);
  const hours = Number.isFinite(h) && h >= 0 ? h : 0;
  const minutes = Number.isFinite(m) && m >= 0 ? m : 0;
  return hours * 60 + minutes;
}

const goalForm = document.getElementById('goal-form');
const goalHoursInput = document.getElementById('goal-hours');
const goalMinutesInput = document.getElementById('goal-minutes');
const goalDisplay = document.getElementById('goal-display');

const entryForm = document.getElementById('entry-form');
const entryDateInput = document.getElementById('entry-date');
const entryHoursInput = document.getElementById('entry-hours');
const entryMinutesInput = document.getElementById('entry-minutes');
const formError = document.getElementById('form-error');

const summaryCard = document.getElementById('summary-card');
const summaryText = document.getElementById('summary-text');
const logList = document.getElementById('log-list');
const emptyState = document.getElementById('empty-state');

function renderGoal() {
  const goal = getGoal();
  if (goal === null) {
    goalDisplay.textContent = 'No goal set yet.';
    return;
  }
  goalDisplay.textContent = `Current goal: ${formatMinutes(goal)} / day`;
  goalHoursInput.value = Math.floor(goal / 60) || '';
  goalMinutesInput.value = goal % 60 || '';
}

function renderSummary(entries, goal) {
  if (entries.length === 0) {
    summaryCard.hidden = true;
    return;
  }
  summaryCard.hidden = false;
  if (goal === null) {
    summaryText.textContent = `${entries.length} day${entries.length === 1 ? '' : 's'} logged. Set a goal to see your achievement rate.`;
    return;
  }
  const metCount = entries.filter((e) => e.minutes <= goal).length;
  const rate = Math.round((metCount / entries.length) * 100);
  summaryText.textContent = `Met your goal on ${metCount} of ${entries.length} logged days (${rate}%).`;
}

function renderEntries() {
  const entries = getEntries();
  const goal = getGoal();

  logList.innerHTML = '';

  if (entries.length === 0) {
    emptyState.hidden = false;
    renderSummary(entries, goal);
    return;
  }
  emptyState.hidden = true;

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  for (const entry of sorted) {
    const li = document.createElement('li');
    li.className = 'log-entry';

    const left = document.createElement('div');
    const dateEl = document.createElement('div');
    dateEl.className = 'log-entry-date';
    dateEl.textContent = formatDate(entry.date);
    const timeEl = document.createElement('div');
    timeEl.className = 'log-entry-time';
    timeEl.textContent = formatMinutes(entry.minutes);
    left.appendChild(dateEl);
    left.appendChild(timeEl);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '8px';

    if (goal !== null) {
      const diff = entry.minutes - goal;
      const badge = document.createElement('span');
      badge.className = `log-entry-diff ${diff > 0 ? 'over' : 'under'}`;
      badge.textContent = diff > 0 ? `+${formatMinutes(diff)} over` : diff < 0 ? `-${formatMinutes(-diff)} under` : 'on goal';
      right.appendChild(badge);
      li.classList.add(diff > 0 ? 'over-goal' : 'under-goal');
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'log-entry-delete';
    deleteBtn.setAttribute('aria-label', `Delete log for ${formatDate(entry.date)}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const remaining = getEntries().filter((e) => e.id !== entry.id);
      saveEntries(remaining);
      renderEntries();
    });
    right.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(right);
    logList.appendChild(li);
  }

  renderSummary(entries, goal);
}

goalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const totalMinutes = parseHoursMinutes(goalHoursInput, goalMinutesInput);
  if (totalMinutes <= 0) return;
  saveGoal(totalMinutes);
  renderGoal();
  renderEntries();
});

entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const date = entryDateInput.value;
  if (!date) {
    formError.textContent = 'Please choose a date.';
    return;
  }

  const totalMinutes = parseHoursMinutes(entryHoursInput, entryMinutesInput);
  if (totalMinutes <= 0) {
    formError.textContent = 'Please enter a screen time greater than 0.';
    return;
  }

  const entries = getEntries().filter((e2) => e2.date !== date);
  entries.push({ id: crypto.randomUUID(), date, minutes: totalMinutes });
  saveEntries(entries);

  entryHoursInput.value = '';
  entryMinutesInput.value = '';
  renderEntries();
});

entryDateInput.valueAsDate = new Date();

// データ層の準備ができてから描画する
(async function () {
  goalStore = await openStore('screen-time-tracker', 'goal', {
    default: null,
    legacyKey: GOAL_KEY
  });
  entriesStore = await openStore('screen-time-tracker', 'entries', {
    default: [],
    legacyKey: ENTRIES_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  goalStore.subscribe(function () { renderGoal(); });
  entriesStore.subscribe(function () { renderEntries(); });

  renderGoal();
  renderEntries();
})();
