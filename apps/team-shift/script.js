// ===========================================================
// Team Shift Board
// チームメンバー全員のシフトを1画面で組むアプリ。
//
// データは AppSync.store() 経由で保存する。ログインしていれば
// 自分の端末間で同期され、していなければブラウザのlocalStorageだけ。
// 保存キーは appdata:team-shift:board。
// ===========================================================

// ---------- AppSync の保険 ----------
// app-sync.js が読み込めなかったときは localStorage だけで動かす。
// 同じキー・同じ形で書くので、次に正常に読み込めた起動でそのまま拾われる。
async function openStore(slug, key, opts) {
  try {
    if (window.AppSync) return await window.AppSync.store(slug, key, opts);
  } catch (e) {
    console.error(e);
  }
  const o = opts || {};
  const k = 'appdata:' + slug + ':' + key;
  const read = function (s) {
    try { return JSON.parse(localStorage.getItem(s)); } catch (e) { return null; }
  };
  const cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  const env = read(k);
  let c = env && 'd' in env ? env.d : (o.default ?? null);
  return {
    get: function () { return cp(c); },
    set: function (v) {
      c = cp(v);
      try {
        localStorage.setItem(k, JSON.stringify({ v: 1, av: o.version || 1, t: Date.now(), o: null, d: c }));
      } catch (e) {}
      return Promise.resolve();
    },
    subscribe: function () { return function () {}; },
    flush: function () { return Promise.resolve(); },
    status: function () { return { online: false, syncing: false, lastSyncedAt: null, error: null }; }
  };
}

// ---------- 定数 ----------

const SHIFT_TYPES = {
  morning: { label: 'Morning', start: '07:00', end: '15:00' },
  day: { label: 'Day', start: '09:00', end: '17:00' },
  night: { label: 'Night', start: '15:00', end: '23:00' },
  off: { label: 'Off' }
};

// 曜日・月名は自前で持つ。端末の言語設定に関係なく英語で出すため。
const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// カレンダーのマスに並べる点は最大6個まで。それ以上は「+」でまとめる。
const MAX_DOTS = 6;

const MAX_MEMBERS = 20;
const MAX_NAME = 24;
const MAX_ROLE = 20;

// ---------- 状態 ----------

let store = null;
let data = { members: [], shifts: {} };

let weekStart = mondayOf(new Date()); // 表示中の週の月曜(Date)
let selectedKey = isoOf(new Date()); // 選択中の日 'YYYY-MM-DD'

let view = 'week'; // 'week' か 'month'。カード上部のタブで切り替える
let monthAnchor = firstOfMonth(new Date()); // 表示中の月の1日(Date)

let editing = null; // { memberId, dateKey } 編集中のセル
let editType = null; // モーダルで選択中のシフト種別
let lastFocused = null; // モーダルを開いた元のボタン
let armedRemoveId = null; // 「もう一度押すと削除」状態のメンバー
let armedTimer = null;
let toastTimer = null;

// ---------- 要素 ----------

const el = {
  weekLabel: document.getElementById('weekLabel'),
  prevWeek: document.getElementById('prevWeekBtn'),
  nextWeek: document.getElementById('nextWeekBtn'),
  thisWeek: document.getElementById('thisWeekBtn'),
  dayStrip: document.getElementById('dayStrip'),
  weekTab: document.getElementById('weekTab'),
  monthTab: document.getElementById('monthTab'),
  weekPane: document.getElementById('weekPane'),
  monthPane: document.getElementById('monthPane'),
  monthLabel: document.getElementById('monthLabel'),
  prevMonth: document.getElementById('prevMonthBtn'),
  nextMonth: document.getElementById('nextMonthBtn'),
  thisMonth: document.getElementById('thisMonthBtn'),
  monthGrid: document.getElementById('monthGrid'),
  dayHeading: document.getElementById('dayHeading'),
  dayCount: document.getElementById('dayCount'),
  emptyState: document.getElementById('emptyState'),
  rosterTable: document.getElementById('rosterTable'),
  rosterBody: document.getElementById('rosterBody'),
  copyWeek: document.getElementById('copyWeekBtn'),
  teamCount: document.getElementById('teamCount'),
  memberList: document.getElementById('memberList'),
  memberForm: document.getElementById('memberForm'),
  nameInput: document.getElementById('nameInput'),
  nameProblem: document.getElementById('nameProblem'),
  roleInput: document.getElementById('roleInput'),
  roleProblem: document.getElementById('roleProblem'),
  modal: document.getElementById('shiftModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalDate: document.getElementById('modalDate'),
  typeButtons: Array.prototype.slice.call(document.querySelectorAll('.type-btn')),
  timeFields: document.getElementById('timeFields'),
  startInput: document.getElementById('startInput'),
  endInput: document.getElementById('endInput'),
  timeProblem: document.getElementById('timeProblem'),
  overnightNote: document.getElementById('overnightNote'),
  saveShift: document.getElementById('saveShiftBtn'),
  clearShift: document.getElementById('clearShiftBtn'),
  closeModal: document.getElementById('closeModalBtn'),
  toast: document.getElementById('toast')
};

// ---------- 日付ユーティリティ ----------

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

// Date -> 'YYYY-MM-DD'(その端末のローカル日付。UTCずれを避けるため自前で作る)
function isoOf(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function parseIso(s) {
  const parts = String(s).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// その日を含む週の月曜日
function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 月曜=0
  x.setDate(x.getDate() - dow);
  return x;
}

// その月の1日
function firstOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// 'Wed 9 Sep'
function shortDate(d) {
  return DOW_SHORT[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()];
}

// 'Wednesday 9 Sep'
function longDate(d) {
  return DOW_LONG[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()];
}

// ---------- データの取り出し ----------

function entryFor(dateKey, memberId) {
  const day = data.shifts[dateKey];
  return day ? day[memberId] || null : null;
}

// その日の「働く人」の数(Off と未設定は数えない)
function workingCount(dateKey) {
  const day = data.shifts[dateKey];
  if (!day) return 0;
  let n = 0;
  for (let i = 0; i < data.members.length; i++) {
    const e = day[data.members[i].id];
    if (e && e.type !== 'off') n++;
  }
  return n;
}

// その日の出勤を種別ごとに数える(Off と未設定は数えない)
function typeCounts(dateKey) {
  const out = { morning: 0, day: 0, night: 0 };
  const day = data.shifts[dateKey];
  if (!day) return out;
  data.members.forEach(function (m) {
    const e = day[m.id];
    if (e && out[e.type] !== undefined) out[e.type]++;
  });
  return out;
}

function save() {
  if (store) store.set(data);
}

// 保存されたデータが壊れていても落ちないように形を整える
function normalize(raw) {
  const out = { members: [], shifts: {} };
  if (!raw || typeof raw !== 'object') return out;

  if (Array.isArray(raw.members)) {
    raw.members.forEach(function (m) {
      if (!m || typeof m !== 'object') return;
      const id = typeof m.id === 'string' ? m.id : null;
      const name = typeof m.name === 'string' ? m.name.trim() : '';
      if (!id || !name) return;
      out.members.push({
        id: id,
        name: name.slice(0, MAX_NAME),
        role: typeof m.role === 'string' ? m.role.trim().slice(0, MAX_ROLE) : ''
      });
    });
  }

  if (raw.shifts && typeof raw.shifts === 'object') {
    Object.keys(raw.shifts).forEach(function (dateKey) {
      const day = raw.shifts[dateKey];
      if (!day || typeof day !== 'object') return;
      const cleanDay = {};
      Object.keys(day).forEach(function (memberId) {
        const e = day[memberId];
        if (!e || typeof e !== 'object') return;
        if (!SHIFT_TYPES[e.type]) return;
        cleanDay[memberId] =
          e.type === 'off'
            ? { type: 'off' }
            : { type: e.type, start: String(e.start || ''), end: String(e.end || '') };
      });
      if (Object.keys(cleanDay).length) out.shifts[dateKey] = cleanDay;
    });
  }

  return out;
}

// ---------- 描画 ----------

function render() {
  renderTabs();
  renderWeek();
  renderMonth();
  renderRoster();
  renderMembers();
}

function renderTabs() {
  const onWeek = view === 'week';
  el.weekTab.classList.toggle('is-on', onWeek);
  el.monthTab.classList.toggle('is-on', !onWeek);
  el.weekTab.setAttribute('aria-selected', onWeek ? 'true' : 'false');
  el.monthTab.setAttribute('aria-selected', onWeek ? 'false' : 'true');
  el.weekPane.hidden = !onWeek;
  el.monthPane.hidden = onWeek;
}

function renderMonth() {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  el.monthLabel.textContent = MONTH_LONG[month] + ' ' + year;

  const now = new Date();
  el.thisMonth.hidden = year === now.getFullYear() && month === now.getMonth();

  const todayKey = isoOf(now);
  const gridStart = mondayOf(new Date(year, month, 1));
  // 月末を含む週まで敷き詰める(35マスか42マス)
  const lastDay = new Date(year, month + 1, 0);
  const cells = Math.round((mondayOf(lastDay) - gridStart) / 86400000) + 7;

  el.monthGrid.textContent = '';
  for (let i = 0; i < cells; i++) {
    const d = addDays(gridStart, i);
    const key = isoOf(d);
    const inMonth = d.getMonth() === month;
    const counts = typeCounts(key);
    const total = counts.morning + counts.day + counts.night;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mday';
    if (!inMonth) btn.classList.add('other');
    if (key === todayKey) btn.classList.add('today');
    if (key === selectedKey) btn.classList.add('selected');
    if (data.members.length > 0 && total === 0) btn.classList.add('gap');
    btn.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      longDate(d) + ', ' + (total === 1 ? '1 person on duty' : total + ' people on duty')
    );

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(d.getDate());
    btn.appendChild(num);

    btn.appendChild(buildDots(counts, total));

    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    cnt.textContent = String(total);
    btn.appendChild(cnt);

    btn.addEventListener('click', function () {
      selectedKey = key;
      weekStart = mondayOf(d); // 週タブに戻ったときも同じ日を見ている状態にする
      if (!inMonth) monthAnchor = firstOfMonth(d);
      render();
    });

    el.monthGrid.appendChild(btn);
  }
}

// 出勤者を色の点で並べる。多すぎるときは点を減らして「+」を足す。
function buildDots(counts, total) {
  const wrap = document.createElement('span');
  wrap.className = 'dots';

  const over = total > MAX_DOTS;
  let left = over ? MAX_DOTS - 1 : total;

  // 点を削るときも種別が消えないよう、朝→昼→夜と順ぐりに1つずつ置く
  const rest = { morning: counts.morning, day: counts.day, night: counts.night };
  while (left > 0) {
    let placed = false;
    ['morning', 'day', 'night'].forEach(function (type) {
      if (left <= 0 || rest[type] <= 0) return;
      const dot = document.createElement('i');
      dot.className = 'dot d-' + type;
      wrap.appendChild(dot);
      rest[type]--;
      left--;
      placed = true;
    });
    if (!placed) break;
  }

  if (over) {
    const plus = document.createElement('span');
    plus.className = 'plus';
    plus.textContent = '+';
    wrap.appendChild(plus);
  }
  return wrap;
}

function renderWeek() {
  const end = addDays(weekStart, 6);
  el.weekLabel.textContent = shortDate(weekStart) + ' – ' + shortDate(end);

  const todayKey = isoOf(new Date());
  const thisMonday = isoOf(mondayOf(new Date()));
  el.thisWeek.hidden = isoOf(weekStart) === thisMonday;

  el.dayStrip.textContent = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const key = isoOf(d);
    const count = workingCount(key);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day';
    if (key === selectedKey) btn.classList.add('selected');
    if (key === todayKey) btn.classList.add('today');
    if (data.members.length > 0 && count === 0) btn.classList.add('gap');
    btn.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      longDate(d) + ', ' + (count === 1 ? '1 person on duty' : count + ' people on duty')
    );

    const dow = document.createElement('span');
    dow.className = 'dow';
    dow.textContent = DOW_SHORT[i];

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(d.getDate());

    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    cnt.textContent = String(count);

    btn.appendChild(dow);
    btn.appendChild(num);
    btn.appendChild(cnt);
    btn.addEventListener('click', function () {
      selectedKey = key;
      render();
    });

    el.dayStrip.appendChild(btn);
  }
}

function renderRoster() {
  const d = parseIso(selectedKey);
  el.dayHeading.textContent = longDate(d);

  const hasMembers = data.members.length > 0;
  el.emptyState.hidden = hasMembers;
  el.rosterTable.hidden = !hasMembers;
  el.copyWeek.disabled = !hasMembers;

  if (!hasMembers) {
    el.dayCount.textContent = '';
    el.dayCount.classList.remove('gap');
    el.rosterBody.textContent = '';
    return;
  }

  const count = workingCount(selectedKey);
  el.dayCount.textContent =
    count === 0 ? 'Nobody on duty' : count + ' of ' + data.members.length + ' on duty';
  el.dayCount.classList.toggle('gap', count === 0);

  el.rosterBody.textContent = '';
  data.members.forEach(function (m) {
    const tr = document.createElement('tr');

    const who = document.createElement('td');
    who.className = 'who';
    who.appendChild(document.createTextNode(m.name));
    if (m.role) {
      const small = document.createElement('small');
      small.textContent = m.role;
      who.appendChild(small);
    }

    const act = document.createElement('td');
    act.className = 'act';
    act.appendChild(buildChip(m, selectedKey));

    tr.appendChild(who);
    tr.appendChild(act);
    el.rosterBody.appendChild(tr);
  });
}

function buildChip(member, dateKey) {
  const entry = entryFor(dateKey, member.id);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip ' + (entry ? 'c-' + entry.type : 'c-none');

  let label;
  if (!entry) {
    label = 'Not set';
  } else if (entry.type === 'off') {
    label = 'Off';
  } else {
    label = SHIFT_TYPES[entry.type].label;
  }
  btn.appendChild(document.createTextNode(label));

  if (entry && entry.type !== 'off') {
    const small = document.createElement('small');
    small.textContent = entry.start + ' – ' + entry.end;
    btn.appendChild(small);
  }

  btn.setAttribute(
    'aria-label',
    'Set shift for ' + member.name + ' on ' + longDate(parseIso(dateKey)) + '. Currently ' + label + '.'
  );
  btn.addEventListener('click', function () {
    openModal(member, dateKey, btn);
  });
  return btn;
}

function renderMembers() {
  el.teamCount.textContent =
    data.members.length === 0
      ? 'Nobody added yet'
      : data.members.length + (data.members.length === 1 ? ' member' : ' members');

  el.memberList.textContent = '';
  data.members.forEach(function (m) {
    const li = document.createElement('li');

    const name = document.createElement('span');
    name.className = 'm-name';
    name.appendChild(document.createTextNode(m.name));
    if (m.role) {
      const small = document.createElement('small');
      small.textContent = m.role;
      name.appendChild(small);
    }

    const armed = armedRemoveId === m.id;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'removebtn' + (armed ? ' armed' : '');
    rm.textContent = armed ? 'Press again' : 'Remove';
    rm.setAttribute('aria-label', armed ? 'Press again to remove ' + m.name : 'Remove ' + m.name);
    rm.addEventListener('click', function () {
      onRemoveMember(m.id);
    });

    li.appendChild(name);
    li.appendChild(rm);
    el.memberList.appendChild(li);
  });
}

// ---------- メンバーの追加・削除 ----------

function showProblem(node, message) {
  node.textContent = message;
  node.hidden = false;
}

function clearProblem(node) {
  node.textContent = '';
  node.hidden = true;
}

el.memberForm.addEventListener('submit', function (event) {
  event.preventDefault();
  clearProblem(el.nameProblem);
  clearProblem(el.roleProblem);

  const name = el.nameInput.value.trim();
  const role = el.roleInput.value.trim();

  if (!name) {
    showProblem(el.nameProblem, 'Type a name first.');
    el.nameInput.focus();
    return;
  }
  if (name.length > MAX_NAME) {
    showProblem(el.nameProblem, 'Keep the name under ' + MAX_NAME + ' characters.');
    el.nameInput.focus();
    return;
  }
  const taken = data.members.some(function (m) {
    return m.name.toLowerCase() === name.toLowerCase();
  });
  if (taken) {
    showProblem(el.nameProblem, name + ' is already on the team. Add a role to tell them apart.');
    el.nameInput.focus();
    return;
  }
  if (data.members.length >= MAX_MEMBERS) {
    showProblem(el.nameProblem, 'This board holds up to ' + MAX_MEMBERS + ' people.');
    return;
  }
  if (role.length > MAX_ROLE) {
    showProblem(el.roleProblem, 'Keep the role under ' + MAX_ROLE + ' characters.');
    el.roleInput.focus();
    return;
  }

  data.members.push({ id: newId(), name: name, role: role });
  save();
  el.nameInput.value = '';
  el.roleInput.value = '';
  render();
  el.nameInput.focus();
  toast(name + ' added to the team.');
});

el.nameInput.addEventListener('input', function () {
  clearProblem(el.nameProblem);
});
el.roleInput.addEventListener('input', function () {
  clearProblem(el.roleProblem);
});

function newId() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// 1回目の押下で「Press again」、2回目で本当に削除する
function onRemoveMember(id) {
  if (armedRemoveId !== id) {
    armedRemoveId = id;
    clearTimeout(armedTimer);
    armedTimer = setTimeout(function () {
      armedRemoveId = null;
      renderMembers();
    }, 4000);
    renderMembers();
    return;
  }

  clearTimeout(armedTimer);
  armedRemoveId = null;

  const member = data.members.find(function (m) {
    return m.id === id;
  });
  data.members = data.members.filter(function (m) {
    return m.id !== id;
  });
  // その人のシフトも全部消す
  Object.keys(data.shifts).forEach(function (dateKey) {
    delete data.shifts[dateKey][id];
    if (!Object.keys(data.shifts[dateKey]).length) delete data.shifts[dateKey];
  });
  save();
  render();
  if (member) toast(member.name + ' removed.');
}

// ---------- 週/月タブ ----------

function setView(next) {
  view = next;
  // 月に切り替えたときは、いま選んでいる日の月を出す
  if (next === 'month') monthAnchor = firstOfMonth(parseIso(selectedKey));
  render();
}

el.weekTab.addEventListener('click', function () {
  setView('week');
});
el.monthTab.addEventListener('click', function () {
  setView('month');
});

// ---------- 月の移動 ----------

el.prevMonth.addEventListener('click', function () {
  monthAnchor = addMonths(monthAnchor, -1);
  renderMonth();
});
el.nextMonth.addEventListener('click', function () {
  monthAnchor = addMonths(monthAnchor, 1);
  renderMonth();
});
el.thisMonth.addEventListener('click', function () {
  monthAnchor = firstOfMonth(new Date());
  renderMonth();
});

// ---------- 週の移動 ----------

el.prevWeek.addEventListener('click', function () {
  moveWeek(-7);
});
el.nextWeek.addEventListener('click', function () {
  moveWeek(7);
});
el.thisWeek.addEventListener('click', function () {
  weekStart = mondayOf(new Date());
  selectedKey = isoOf(new Date());
  render();
});

function moveWeek(days) {
  // 選択している曜日は保ったまま、週だけずらす
  const offset = Math.round((parseIso(selectedKey) - weekStart) / 86400000);
  weekStart = addDays(weekStart, days);
  selectedKey = isoOf(addDays(weekStart, offset));
  render();
}

// ---------- シフト編集モーダル ----------

function openModal(member, dateKey, sourceButton) {
  editing = { memberId: member.id, dateKey: dateKey };
  lastFocused = sourceButton || null;

  el.modalTitle.textContent = member.name + (member.role ? ' · ' + member.role : '');
  el.modalDate.textContent = longDate(parseIso(dateKey));

  const entry = entryFor(dateKey, member.id);
  editType = entry ? entry.type : null;
  el.startInput.value = entry && entry.type !== 'off' ? entry.start : '';
  el.endInput.value = entry && entry.type !== 'off' ? entry.end : '';

  clearProblem(el.timeProblem);
  syncModal();

  el.modal.hidden = false;
  const first = el.typeButtons[0];
  if (first) first.focus();
}

function closeModal() {
  el.modal.hidden = true;
  editing = null;
  editType = null;
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}

// 選択中の種別に合わせてボタンの見た目・時刻欄・保存ボタンを揃える
function syncModal() {
  el.typeButtons.forEach(function (b) {
    b.setAttribute('aria-pressed', b.dataset.type === editType ? 'true' : 'false');
  });

  const working = editType && editType !== 'off';
  el.timeFields.hidden = !working;

  const start = el.startInput.value;
  const end = el.endInput.value;
  el.overnightNote.hidden = !(working && start && end && end < start);

  el.saveShift.disabled = !editType || (working && (!start || !end || start === end));
}

el.typeButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const type = btn.dataset.type;
    if (type !== 'off' && type !== editType) {
      // 種別を変えたら、その種別の標準時刻を入れておく(そのあと自由に直せる)
      el.startInput.value = SHIFT_TYPES[type].start;
      el.endInput.value = SHIFT_TYPES[type].end;
    }
    editType = type;
    clearProblem(el.timeProblem);
    syncModal();
  });
});

el.startInput.addEventListener('input', function () {
  clearProblem(el.timeProblem);
  syncModal();
});
el.endInput.addEventListener('input', function () {
  clearProblem(el.timeProblem);
  syncModal();
});

el.saveShift.addEventListener('click', function () {
  if (!editing || !editType) return;

  let entry;
  if (editType === 'off') {
    entry = { type: 'off' };
  } else {
    const start = el.startInput.value;
    const end = el.endInput.value;
    if (!start || !end) {
      showProblem(el.timeProblem, 'Fill in both the start and the end time.');
      return;
    }
    if (start === end) {
      showProblem(el.timeProblem, 'The start and end times cannot be the same.');
      return;
    }
    entry = { type: editType, start: start, end: end };
  }

  if (!data.shifts[editing.dateKey]) data.shifts[editing.dateKey] = {};
  data.shifts[editing.dateKey][editing.memberId] = entry;
  save();
  closeModal();
  render();
});

el.clearShift.addEventListener('click', function () {
  if (!editing) return;
  const day = data.shifts[editing.dateKey];
  if (day) {
    delete day[editing.memberId];
    if (!Object.keys(day).length) delete data.shifts[editing.dateKey];
    save();
  }
  closeModal();
  render();
});

el.closeModal.addEventListener('click', closeModal);

el.modal.addEventListener('click', function (event) {
  if (event.target === el.modal) closeModal();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !el.modal.hidden) closeModal();
});

// ---------- 週をテキストにしてコピー ----------

el.copyWeek.addEventListener('click', function () {
  const text = weekAsText();
  copyText(text).then(
    function () {
      toast('Week copied. Paste it into your group chat.');
    },
    function () {
      toast('Could not copy automatically. Select the text and copy it by hand.');
    }
  );
});

function weekAsText() {
  const lines = [];
  lines.push('Team Shift - ' + shortDate(weekStart) + ' to ' + shortDate(addDays(weekStart, 6)));

  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const key = isoOf(d);
    const count = workingCount(key);

    lines.push('');
    lines.push(shortDate(d) + ' (' + (count === 0 ? 'nobody on' : count + ' on') + ')');

    let any = false;
    data.members.forEach(function (m) {
      const e = entryFor(key, m.id);
      if (!e) return;
      any = true;
      const who = m.name + (m.role ? ' (' + m.role + ')' : '');
      lines.push(
        '  ' + who + ' - ' + (e.type === 'off' ? 'Off' : SHIFT_TYPES[e.type].label + ' ' + e.start + '-' + e.end)
      );
    });
    if (!any) lines.push('  nothing set yet');
  }

  return lines.join('\n');
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    } catch (e) {
      reject(e);
    }
  });
}

// ---------- トースト ----------

function toast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    el.toast.hidden = true;
  }, 2600);
}

// ---------- 起動 ----------

(async function () {
  store = await openStore('team-shift', 'board', {
    default: { members: [], shifts: {} },
    version: 1
  });

  data = normalize(store.get());
  render();

  store.subscribe(function (value) {
    // 他の端末・他のタブで変わったとき
    data = normalize(value);
    if (!el.modal.hidden) closeModal();
    render();
  });
})();
