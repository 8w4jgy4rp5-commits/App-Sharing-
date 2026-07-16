// ===========================
// Reading Streak - Logic
// ===========================

const STORAGE_KEY = 'readingStreak:days:v1';

// Reads all recorded reading days ('YYYY-MM-DD' strings); returns [] if missing or corrupted
function getDays() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDays(days) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

function formatDate(date) {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function todayStr() {
  return formatDate(new Date());
}

function toggleToday() {
  const days = getDays();
  const today = todayStr();
  const index = days.indexOf(today);

  if (index === -1) {
    days.push(today);
  } else {
    days.splice(index, 1);
  }
  saveDays(days);
  render();
}

function computeCurrentStreak(daySet) {
  let streak = 0;
  const cursor = new Date();
  if (!daySet.has(todayStr())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daySet.has(formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeLongestStreak(daySet) {
  const sortedDates = [...daySet].sort();
  let longest = 0;
  let current = 0;
  let prevTime = null;

  for (const dayStr of sortedDates) {
    const time = new Date(`${dayStr}T00:00:00`).getTime();
    if (prevTime !== null && Math.round((time - prevTime) / 86400000) === 1) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prevTime = time;
  }
  return longest;
}

const todayDateEl = document.getElementById('todayDate');
const todayBtn = document.getElementById('todayBtn');
const currentStreakEl = document.getElementById('currentStreak');
const longestStreakEl = document.getElementById('longestStreak');
const historyGrid = document.getElementById('historyGrid');

todayBtn.addEventListener('click', toggleToday);

function render() {
  const days = getDays();
  const daySet = new Set(days);
  const today = todayStr();
  const readToday = daySet.has(today);

  todayDateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  todayBtn.textContent = readToday ? 'Read Today ✓ (tap to undo)' : 'Mark Today as Read';
  todayBtn.classList.toggle('done', readToday);

  currentStreakEl.textContent = computeCurrentStreak(daySet);
  longestStreakEl.textContent = computeLongestStreak(daySet);

  historyGrid.innerHTML = '';
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = formatDate(date);

    const cell = document.createElement('div');
    cell.className = 'history-cell';
    if (daySet.has(dayStr)) cell.classList.add('read');
    if (dayStr === today) cell.classList.add('is-today');
    cell.textContent = date.getDate();
    cell.setAttribute(
      'aria-label',
      `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${daySet.has(dayStr) ? 'read' : 'not read'}`
    );
    cell.title = cell.getAttribute('aria-label');

    historyGrid.appendChild(cell);
  }
}

render();
