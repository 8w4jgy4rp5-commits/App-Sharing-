// ===========================
// Shift Calendar - script
// ===========================

const STORAGE_KEY = 'shiftCalendar:shifts:v2';
const LEGACY_STORAGE_KEY = 'shiftCalendar:shifts:v1';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// The month currently shown (always day 1, to avoid setMonth() rollover bugs)
let currentViewDate = startOfMonth(new Date());

// Date key of the cell currently open in the edit modal
let selectedDateKey = null;

// Status currently selected inside the open modal ("work" | "off" | null)
let modalStatus = null;

// The day-cell button that opened the modal, so focus can return to it on close
let triggerCell = null;

// -----------------------
// Date helpers
// -----------------------

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDisplayDate(date) {
  return MONTH_NAMES_SHORT[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function todayDate() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

// -----------------------
// localStorage read/write
// -----------------------

// Normalizes one stored entry into { status, start, end, memo }.
// Accepts legacy plain-string entries ("work"/"off") for safety.
// Returns undefined if the entry is unusable.
function normalizeEntry(value) {
  if (typeof value === 'string') {
    if (value === 'work' || value === 'off') {
      return { status: value, start: null, end: null, memo: '' };
    }
    return undefined;
  }
  if (value && typeof value === 'object') {
    if (value.status !== 'work' && value.status !== 'off') return undefined;
    return {
      status: value.status,
      start: typeof value.start === 'string' ? value.start : null,
      end: typeof value.end === 'string' ? value.end : null,
      memo: typeof value.memo === 'string' ? value.memo : ''
    };
  }
  return undefined;
}

function getShifts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const shifts = {};
    Object.keys(parsed).forEach(function (key) {
      const entry = normalizeEntry(parsed[key]);
      if (entry) shifts[key] = entry;
    });
    return shifts;
  } catch {
    return {};
  }
}

function saveShifts(shifts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
}

// One-time migration from the old string-based v1 format, so shifts
// entered before the time-of-day feature aren't lost.
function migrateLegacyShifts() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) return;
  try {
    const parsed = JSON.parse(legacyRaw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    const migrated = {};
    Object.keys(parsed).forEach(function (key) {
      const entry = normalizeEntry(parsed[key]);
      if (entry) migrated[key] = entry;
    });
    saveShifts(migrated);
  } catch {
    // ignore corrupt legacy data
  }
}

// -----------------------
// Next shift lookup
// -----------------------

// Finds the earliest date key (today or later) whose status is "work"
function findNextShiftKey(shifts, todayKey) {
  let next = null;
  Object.keys(shifts).forEach(function (key) {
    if (shifts[key].status === 'work' && key >= todayKey && (next === null || key < next)) {
      next = key;
    }
  });
  return next;
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  migrateLegacyShifts();
  render();

  document.getElementById('prevMonthBtn').addEventListener('click', function () {
    currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
    render();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', function () {
    currentViewDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
    render();
  });

  document.getElementById('statusWorkBtn').addEventListener('click', function () {
    setModalStatus('work');
  });
  document.getElementById('statusOffBtn').addEventListener('click', function () {
    setModalStatus('off');
  });
  document.getElementById('saveShiftBtn').addEventListener('click', handleSave);
  document.getElementById('clearShiftBtn').addEventListener('click', handleClear);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);

  const scrim = document.getElementById('shiftModal');
  scrim.addEventListener('click', function (e) {
    if (e.target === scrim) closeModal();
  });
  document.addEventListener('keydown', handleModalKeydown);
});

// -----------------------
// Rendering
// -----------------------

function render() {
  const shifts = getShifts();
  const today = todayDate();
  const todayKey = formatDateKey(today);

  document.getElementById('emptyState').hidden = Object.keys(shifts).length > 0;

  renderNextShiftText(shifts, todayKey);
  renderCalendar(shifts, today, todayKey);
}

function formatTimeRange(entry) {
  if (!entry.start && !entry.end) return '';
  return ' · ' + (entry.start || '?') + '–' + (entry.end || '?');
}

function renderNextShiftText(shifts, todayKey) {
  const nextKey = findNextShiftKey(shifts, todayKey);
  const el = document.getElementById('nextShiftText');
  if (nextKey) {
    const entry = shifts[nextKey];
    const [y, m, d] = nextKey.split('-').map(Number);
    el.textContent = 'Next shift: ' + formatDisplayDate(new Date(y, m - 1, d)) + formatTimeRange(entry);
  } else {
    el.textContent = 'No upcoming shifts scheduled.';
  }
}

// For a work day, previews the start time; otherwise previews the memo.
// Falls back to memo if a work day has no start time set.
function getPreviewText(entry) {
  if (!entry) return null;
  if (entry.status === 'work' && entry.start) return entry.start;
  if (entry.memo) return entry.memo;
  return null;
}

function renderCalendar(shifts, today, todayKey) {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  document.getElementById('monthLabel').textContent = MONTH_NAMES[month] + ' ' + year;

  const nextKey = findNextShiftKey(shifts, todayKey);

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

  const grid = document.getElementById('calendarGrid');
  grid.replaceChildren();

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const key = formatDateKey(cellDate);
    const isCurrentMonth = cellDate.getMonth() === month;
    const isPast = key < todayKey;
    const isToday = key === todayKey;
    const isNext = key === nextKey;
    const entry = shifts[key];

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
    } else if (isPast) {
      btn.classList.add('day-past');
      btn.disabled = true;
    } else {
      if (entry && entry.status === 'work') btn.classList.add('day-work');
      if (entry && entry.status === 'off') btn.classList.add('day-off');

      const previewText = getPreviewText(entry);
      if (previewText) {
        const previewEl = document.createElement('span');
        previewEl.className = 'day-preview';
        previewEl.textContent = previewText;
        btn.appendChild(previewEl);
      }
      // Memo exists but is hidden behind the time preview (work day with both) — flag it with a dot.
      if (entry && entry.memo && previewText !== entry.memo) {
        btn.classList.add('day-has-memo');
      }

      btn.addEventListener('click', function () {
        openModal(key, cellDate, btn);
      });
    }

    if (isCurrentMonth && !isPast && isNext) {
      btn.classList.add('day-next');
    }
    if (isToday) {
      btn.classList.add('day-today');
    }

    grid.appendChild(btn);
  }
}

// -----------------------
// Modal
// -----------------------

function setModalStatus(status) {
  modalStatus = status;
  document.getElementById('statusWorkBtn').classList.toggle('active', status === 'work');
  document.getElementById('statusOffBtn').classList.toggle('active', status === 'off');
  document.getElementById('timeFields').hidden = status !== 'work';
  document.getElementById('saveShiftBtn').disabled = !status;
}

function openModal(key, date, triggerEl) {
  selectedDateKey = key;
  triggerCell = triggerEl || null;

  const entry = getShifts()[key];
  document.getElementById('modalDateLabel').textContent = formatDisplayDate(date);
  document.getElementById('startTimeInput').value = entry && entry.start ? entry.start : '';
  document.getElementById('endTimeInput').value = entry && entry.end ? entry.end : '';
  document.getElementById('memoInput').value = entry && entry.memo ? entry.memo : '';
  setModalStatus(entry ? entry.status : null);

  document.getElementById('shiftModal').hidden = false;
  document.getElementById('statusWorkBtn').focus();
}

function closeModal() {
  selectedDateKey = null;
  modalStatus = null;
  document.getElementById('shiftModal').hidden = true;
  if (triggerCell && triggerCell.isConnected) {
    triggerCell.focus();
  }
  triggerCell = null;
}

// Returns the currently visible, enabled focusable elements inside the modal
function getModalFocusable() {
  const card = document.querySelector('#shiftModal .modal-card');
  const all = card.querySelectorAll('button, input, textarea');
  return Array.from(all).filter(function (el) {
    return !el.disabled && el.offsetParent !== null;
  });
}

// Keeps Tab/Shift+Tab cycling within the modal's controls while it is open
function handleModalKeydown(e) {
  if (document.getElementById('shiftModal').hidden) return;

  if (e.key === 'Escape') {
    closeModal();
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

function handleSave() {
  if (!selectedDateKey || !modalStatus) return;

  const shifts = getShifts();
  const entry = { status: modalStatus, start: null, end: null, memo: '' };
  if (modalStatus === 'work') {
    const start = document.getElementById('startTimeInput').value;
    const end = document.getElementById('endTimeInput').value;
    entry.start = start || null;
    entry.end = end || null;
  }
  entry.memo = document.getElementById('memoInput').value.trim();
  shifts[selectedDateKey] = entry;
  saveShifts(shifts);
  closeModal();
  render();
}

function handleClear() {
  if (!selectedDateKey) return;
  const shifts = getShifts();
  delete shifts[selectedDateKey];
  saveShifts(shifts);
  closeModal();
  render();
}
