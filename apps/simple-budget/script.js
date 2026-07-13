// ===========================
// Simple Budget - script
// ===========================

const STORAGE_KEY = 'simpleBudget:records:v1';

const CATEGORY_LABELS = {
  food: 'Food',
  daily: 'Daily Goods',
  social: 'Social',
  other: 'Other'
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
  return new Date(year, month, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function formatDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
  return '¥' + Math.round(amount).toLocaleString('en-US');
}

// -----------------------
// localStorage read/write
// -----------------------

function getRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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

document.addEventListener('DOMContentLoaded', function () {
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
  document.getElementById('editModalTitle').textContent = 'Edit record — ' + formatDayLabel(record.date);
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
  if (!confirm('Delete this record?')) return;

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
      btn.setAttribute('aria-label', formatDayLabel(dateKey) + ', ' + formatCurrency(dayTotal) + ' spent');
      btn.addEventListener('click', function () { scrollToDayGroup(dateKey); });
    } else {
      btn.disabled = true;
      btn.setAttribute('aria-label', formatDayLabel(dateKey) + ', no spending');
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
  row.setAttribute('aria-label', 'Edit record: ' + formatCurrency(record.amount));
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
