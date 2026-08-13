// ===========================
// Simple Budget - script
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'simpleBudget:records:v1';

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
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// i18n (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Simple Budget',
    titlePart1: 'Simple',
    titlePart2: 'Budget',
    subtitle: 'Log the total from each receipt in a couple of taps.',
    amountLabel: 'Amount',
    amountPlaceholder: 'e.g. 1280',
    categoryLabel: 'Category',
    categoryOptional: 'Optional — tap to select',
    categoryGroupLabel: 'Category (optional)',
    catFood: 'Food',
    catDaily: 'Daily Goods',
    catSocial: 'Social',
    catOther: 'Other',
    addBtn: 'Add',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    weekdaySun: 'Sun',
    weekdayMon: 'Mon',
    weekdayTue: 'Tue',
    weekdayWed: 'Wed',
    weekdayThu: 'Thu',
    weekdayFri: 'Fri',
    weekdaySat: 'Sat',
    totalLabel: 'total',
    emptyState: 'No records yet. Add your first receipt above!',
    editRecordTitle: 'Edit record',
    saveBtn: 'Save',
    deleteBtn: 'Delete',
    cancelBtn: 'Cancel',
    confirmDelete: 'Delete this record?',
    localeTag: 'en-US',
    editRecordTitleWithDate: function (dateLabel) { return 'Edit record — ' + dateLabel; },
    daySpentAria: function (dateLabel, amountLabel) { return dateLabel + ', ' + amountLabel + ' spent'; },
    dayNoSpendingAria: function (dateLabel) { return dateLabel + ', no spending'; },
    editRecordAria: function (amountLabel) { return 'Edit record: ' + amountLabel; },
  },
  ja: {
    title: 'シンプル家計簿',
    titlePart1: 'シンプル',
    titlePart2: '家計簿',
    subtitle: 'レシートの合計を数タップで記録できます。',
    amountLabel: '金額',
    amountPlaceholder: '例: 1280',
    categoryLabel: 'カテゴリー',
    categoryOptional: '任意 — タップして選択',
    categoryGroupLabel: 'カテゴリー（任意）',
    catFood: '食費',
    catDaily: '日用品',
    catSocial: '交際費',
    catOther: 'その他',
    addBtn: '追加',
    prevMonth: '前の月',
    nextMonth: '次の月',
    weekdaySun: '日',
    weekdayMon: '月',
    weekdayTue: '火',
    weekdayWed: '水',
    weekdayThu: '木',
    weekdayFri: '金',
    weekdaySat: '土',
    totalLabel: '合計',
    emptyState: 'まだ記録がありません。上からレシートを追加しましょう！',
    editRecordTitle: '記録を編集',
    saveBtn: '保存',
    deleteBtn: '削除',
    cancelBtn: 'キャンセル',
    confirmDelete: 'この記録を削除しますか？',
    localeTag: 'ja-JP',
    editRecordTitleWithDate: function (dateLabel) { return '記録を編集 — ' + dateLabel; },
    daySpentAria: function (dateLabel, amountLabel) { return dateLabel + '、' + amountLabel + '使用'; },
    dayNoSpendingAria: function (dateLabel) { return dateLabel + '、支出なし'; },
    editRecordAria: function (amountLabel) { return '記録を編集: ' + amountLabel; },
  },
  es: {
    title: 'Presupuesto Simple',
    titlePart1: 'Presupuesto',
    titlePart2: 'Simple',
    subtitle: 'Registra el total de cada recibo en un par de toques.',
    amountLabel: 'Importe',
    amountPlaceholder: 'ej. 1280',
    categoryLabel: 'Categoría',
    categoryOptional: 'Opcional — toca para elegir',
    categoryGroupLabel: 'Categoría (opcional)',
    catFood: 'Comida',
    catDaily: 'Artículos diarios',
    catSocial: 'Social',
    catOther: 'Otro',
    addBtn: 'Añadir',
    prevMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    weekdaySun: 'Dom',
    weekdayMon: 'Lun',
    weekdayTue: 'Mar',
    weekdayWed: 'Mié',
    weekdayThu: 'Jue',
    weekdayFri: 'Vie',
    weekdaySat: 'Sáb',
    totalLabel: 'total',
    emptyState: 'Aún no hay registros. ¡Añade tu primer recibo arriba!',
    editRecordTitle: 'Editar registro',
    saveBtn: 'Guardar',
    deleteBtn: 'Eliminar',
    cancelBtn: 'Cancelar',
    confirmDelete: '¿Eliminar este registro?',
    localeTag: 'es-ES',
    editRecordTitleWithDate: function (dateLabel) { return 'Editar registro — ' + dateLabel; },
    daySpentAria: function (dateLabel, amountLabel) { return dateLabel + ', ' + amountLabel + ' gastado'; },
    dayNoSpendingAria: function (dateLabel) { return dateLabel + ', sin gastos'; },
    editRecordAria: function (amountLabel) { return 'Editar registro: ' + amountLabel; },
  },
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const t = STRINGS[getLang()];

function applyStaticTranslations() {
  document.documentElement.setAttribute('lang', getLang());
  document.title = t.title;

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria-label');
    if (t[key]) el.setAttribute('aria-label', t[key]);
  });
}

const CATEGORY_LABELS = {
  food: t.catFood,
  daily: t.catDaily,
  social: t.catSocial,
  other: t.catOther
};

let viewYear;
let viewMonth; // 0-indexed, matches JS Date
let editingId = null;
let editTriggerEl = null; // the record-row button that opened the modal, to restore focus on close
let addCategoryPicker;
let editCategoryPicker;

// -----------------------
// Date helpers
// -----------------------

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function todayStr() {
  return formatDate(new Date());
}

function monthKey(year, month) {
  return year + '-' + String(month + 1).padStart(2, '0');
}

function formatMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(t.localeTag, { year: 'numeric', month: 'long' });
}

function formatDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(t.localeTag, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
  return '¥' + Math.round(amount).toLocaleString(t.localeTag);
}

// -----------------------
// localStorage read/write
// -----------------------

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveRecords() してよい。
function getRecords() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveRecords(records) {
  if (!store) return;
  store.set(records).catch(function (e) {
    console.error('Simple Budget: 保存に失敗しました', e);
  });
}

// -----------------------
// Category pill picker (shared by add form and edit modal)
// -----------------------

function initCategoryPicker(container) {
  let selected = null;
  const buttons = Array.from(container.querySelectorAll('.pill-btn'));

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const cat = btn.dataset.category;
      selected = (selected === cat) ? null : cat;
      buttons.forEach(function (b) {
        const isSelected = b.dataset.category === selected;
        b.classList.toggle('selected', isSelected);
        b.setAttribute('aria-pressed', String(isSelected));
      });
    });
  });

  return {
    get: function () { return selected; },
    set: function (cat) {
      selected = cat;
      buttons.forEach(function (b) {
        const isSelected = b.dataset.category === cat;
        b.classList.toggle('selected', isSelected);
        b.setAttribute('aria-pressed', String(isSelected));
      });
    }
  };
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  // データ層の準備ができるまで描画も操作もさせない
  store = await openStore('simple-budget', 'records', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderAll(); });

  applyStaticTranslations();

  const today = new Date();
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();

  addCategoryPicker = initCategoryPicker(document.getElementById('addCategoryPills'));
  editCategoryPicker = initCategoryPicker(document.getElementById('editCategoryPills'));

  document.getElementById('addForm').addEventListener('submit', handleAddRecord);
  document.getElementById('prevMonthBtn').addEventListener('click', function () { shiftMonth(-1); });
  document.getElementById('nextMonthBtn').addEventListener('click', function () { shiftMonth(1); });

  document.getElementById('editForm').addEventListener('submit', handleSaveEdit);
  document.getElementById('deleteRecordBtn').addEventListener('click', handleDeleteRecord);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', function (e) {
    if (e.target === this) closeEditModal();
  });
  document.addEventListener('keydown', handleModalKeydown);

  renderAll();
});

function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  } else if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderAll();
}

// -----------------------
// Add
// -----------------------

function handleAddRecord(e) {
  e.preventDefault();

  const amountInput = document.getElementById('amountInput');
  const amount = Math.round(parseFloat(amountInput.value));
  if (!amount || amount <= 0) return;

  const record = {
    id: Date.now(),
    date: todayStr(),
    amount: amount,
    category: addCategoryPicker.get()
  };

  const records = getRecords();
  records.push(record);
  saveRecords(records);

  this.reset();
  addCategoryPicker.set(null);

  // Jump back to the current month so the new record is immediately visible.
  const today = new Date();
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();

  renderAll();
}

// -----------------------
// Edit / Delete
// -----------------------

function openEditModal(record, triggerEl) {
  editingId = record.id;
  editTriggerEl = triggerEl || null;
  document.getElementById('editModalTitle').textContent = t.editRecordTitleWithDate(formatDayLabel(record.date));
  document.getElementById('editAmountInput').value = record.amount;
  editCategoryPicker.set(record.category);
  document.getElementById('editModal').hidden = false;
  document.getElementById('editAmountInput').focus();
}

function closeEditModal() {
  editingId = null;
  document.getElementById('editModal').hidden = true;
  if (editTriggerEl && editTriggerEl.isConnected) {
    editTriggerEl.focus();
  }
  editTriggerEl = null;
}

// Returns the currently visible, enabled focusable elements inside the modal
function getModalFocusable() {
  const card = document.querySelector('#editModal .modal-card');
  const all = card.querySelectorAll('button, input');
  return Array.from(all).filter(function (el) {
    return !el.disabled && el.offsetParent !== null;
  });
}

// Keeps Tab/Shift+Tab cycling within the modal's controls, and Escape closes it
function handleModalKeydown(e) {
  if (document.getElementById('editModal').hidden) return;

  if (e.key === 'Escape') {
    closeEditModal();
    return;
  }

  if (e.key !== 'Tab') return;

  const focusable = getModalFocusable();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function handleSaveEdit(e) {
  e.preventDefault();

  const amountInput = document.getElementById('editAmountInput');
  const amount = Math.round(parseFloat(amountInput.value));
  if (!amount || amount <= 0) return;

  const records = getRecords();
  const record = records.find(function (r) { return r.id === editingId; });
  if (!record) return;

  record.amount = amount;
  record.category = editCategoryPicker.get();
  saveRecords(records);

  closeEditModal();
  renderAll();
}

function handleDeleteRecord() {
  if (!confirm(t.confirmDelete)) return;

  const records = getRecords().filter(function (r) { return r.id !== editingId; });
  saveRecords(records);

  closeEditModal();
  renderAll();
}

// -----------------------
// Render
// -----------------------

function renderAll() {
  document.getElementById('monthLabel').textContent = formatMonthLabel(viewYear, viewMonth);

  const records = getRecords();
  const key = monthKey(viewYear, viewMonth);
  const monthRecords = records.filter(function (r) { return typeof r.date === 'string' && r.date.slice(0, 7) === key; });

  const total = monthRecords.reduce(function (sum, r) { return sum + (Number(r.amount) || 0); }, 0);
  document.getElementById('monthTotal').textContent = formatCurrency(total);

  const dailyTotals = {};
  monthRecords.forEach(function (r) {
    dailyTotals[r.date] = (dailyTotals[r.date] || 0) + (Number(r.amount) || 0);
  });

  renderCalendar(dailyTotals);
  renderRecordsList(monthRecords);
}

function renderCalendar(dailyTotals) {
  const todayKey = todayStr();
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const gridStart = new Date(viewYear, viewMonth, 1 - firstOfMonth.getDay());

  const grid = document.getElementById('calendarGrid');
  grid.replaceChildren();

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const dateKey = formatDate(cellDate);
    const isCurrentMonth = cellDate.getMonth() === viewMonth;
    const dayTotal = dailyTotals[dateKey] || 0;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-cell';

    const numEl = document.createElement('span');
    numEl.className = 'day-num';
    numEl.textContent = String(cellDate.getDate());
    btn.appendChild(numEl);

    if (!isCurrentMonth) {
      btn.classList.add('day-muted');
      btn.disabled = true;
    } else if (dayTotal > 0) {
      btn.classList.add('day-has-spending');
      const amountEl = document.createElement('span');
      amountEl.className = 'day-amount';
      amountEl.textContent = formatCurrency(dayTotal);
      btn.appendChild(amountEl);
      btn.setAttribute('aria-label', t.daySpentAria(formatDayLabel(dateKey), formatCurrency(dayTotal)));
      btn.addEventListener('click', function () { scrollToDayGroup(dateKey); });
    } else {
      btn.disabled = true;
      btn.setAttribute('aria-label', t.dayNoSpendingAria(formatDayLabel(dateKey)));
    }

    if (isCurrentMonth && dateKey === todayKey) {
      btn.classList.add('day-today');
    }

    grid.appendChild(btn);
  }
}

function scrollToDayGroup(dateKey) {
  const group = document.getElementById('day-group-' + dateKey);
  if (!group) return;
  group.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const heading = group.querySelector('.day-heading');
  if (heading) heading.focus();
}

function renderRecordsList(monthRecords) {
  const list = document.getElementById('recordsList');
  const emptyState = document.getElementById('emptyState');
  list.innerHTML = '';

  if (monthRecords.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const dates = Array.from(new Set(monthRecords.map(function (r) { return r.date; })))
    .sort(function (a, b) { return b.localeCompare(a); });

  dates.forEach(function (date) {
    const dayRecords = monthRecords
      .filter(function (r) { return r.date === date; })
      .sort(function (a, b) { return b.id - a.id; });

    list.appendChild(createDayGroup(date, dayRecords));
  });
}

function createDayGroup(date, dayRecords) {
  const group = document.createElement('div');
  group.className = 'day-group';
  group.id = 'day-group-' + date;

  const heading = document.createElement('h3');
  heading.className = 'day-heading';
  heading.textContent = formatDayLabel(date);
  heading.tabIndex = -1;
  group.appendChild(heading);

  dayRecords.forEach(function (record) {
    group.appendChild(createRecordRow(record));
  });

  return group;
}

function createRecordRow(record) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'record-row';
  row.setAttribute('aria-label', t.editRecordAria(formatCurrency(record.amount)));
  row.addEventListener('click', function () { openEditModal(record, row); });

  const amount = document.createElement('span');
  amount.className = 'record-amount';
  amount.textContent = formatCurrency(record.amount);
  row.appendChild(amount);

  if (record.category && CATEGORY_LABELS[record.category]) {
    const badge = document.createElement('span');
    badge.className = 'record-badge cat-' + record.category;
    badge.textContent = CATEGORY_LABELS[record.category];
    row.appendChild(badge);
  }

  return row;
}
