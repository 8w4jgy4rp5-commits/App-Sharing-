// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'habitTracker:habits:v1';

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

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveHabits() してよい。
function getHabits() {
  if (!store) return [];
  const habits = store.get();
  return Array.isArray(habits) ? habits : [];
}

function saveHabits(habits) {
  if (!store) return;
  store.set(habits).catch(function (e) {
    console.error('Habit Tracker: 保存に失敗しました', e);
  });
}

function dateToLocalString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayString() {
  return dateToLocalString(new Date());
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateToLocalString(d);
}

const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const formError = document.getElementById('form-error');
const habitList = document.getElementById('habit-list');
const emptyState = document.getElementById('empty-state');

function renderHabits() {
  const habits = getHabits();
  const today = todayString();

  habitList.innerHTML = '';

  if (habits.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  for (const habit of habits) {
    const li = document.createElement('li');
    li.className = 'habit-entry';

    const info = document.createElement('div');
    info.className = 'habit-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'habit-name';
    nameEl.textContent = habit.name;

    const streakEl = document.createElement('div');
    streakEl.className = 'habit-streak';
    streakEl.innerHTML =
      '<svg class="habit-streak-flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c1.5 1.5 2 3.3 2 5a8 8 0 1 1-13-6.2C8.5 6.5 11 5 12 2Z" fill="currentColor"/></svg>';
    const streakText = document.createElement('span');
    streakText.textContent = `${habit.streak} day${habit.streak === 1 ? '' : 's'} streak`;
    streakEl.appendChild(streakText);

    info.appendChild(nameEl);
    info.appendChild(streakEl);

    const actions = document.createElement('div');
    actions.className = 'habit-actions';

    const checkedInToday = habit.lastCheckedDate === today;
    const checkinBtn = document.createElement('button');
    checkinBtn.className = 'checkin-btn';
    checkinBtn.textContent = checkedInToday ? 'Checked in today' : 'Check in';
    checkinBtn.disabled = checkedInToday;
    checkinBtn.addEventListener('click', () => {
      checkIn(habit.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'habit-delete';
    deleteBtn.setAttribute('aria-label', `Delete habit ${habit.name}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const remaining = getHabits().filter((h) => h.id !== habit.id);
      saveHabits(remaining);
      renderHabits();
    });

    actions.appendChild(checkinBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(actions);
    habitList.appendChild(li);
  }
}

function checkIn(habitId) {
  const habits = getHabits();
  const today = todayString();
  const yesterday = yesterdayString();

  const habit = habits.find((h) => h.id === habitId);
  if (!habit || habit.lastCheckedDate === today) return;

  habit.streak = habit.lastCheckedDate === yesterday ? habit.streak + 1 : 1;
  habit.lastCheckedDate = today;

  saveHabits(habits);
  renderHabits();
}

habitForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const name = habitNameInput.value.trim();
  if (!name) {
    formError.textContent = 'Please enter a habit name.';
    return;
  }

  const habits = getHabits();
  habits.push({ id: crypto.randomUUID(), name, streak: 0, lastCheckedDate: null });
  saveHabits(habits);

  habitNameInput.value = '';
  renderHabits();
});

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('habit-tracker', 'habits', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderHabits(); });
  renderHabits();
})();
