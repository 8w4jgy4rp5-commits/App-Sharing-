const GOAL_KEY = 'screenTimeTracker:goal:v1';
const ENTRIES_KEY = 'screenTimeTracker:entries:v1';

function getGoal() {
  const raw = localStorage.getItem(GOAL_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveGoal(totalMinutes) {
  localStorage.setItem(GOAL_KEY, JSON.stringify(totalMinutes));
}

function getEntries() {
  const raw = localStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
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
renderGoal();
renderEntries();
