const WINS_KEY = 'dailyWins:wins:v1';

function getWins() {
  const raw = localStorage.getItem(WINS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWins(wins) {
  localStorage.setItem(WINS_KEY, JSON.stringify(wins));
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

function dayLabel(dateStr) {
  if (dateStr === todayString()) return 'Today';
  if (dateStr === yesterdayString()) return 'Yesterday';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const winForm = document.getElementById('win-form');
const winTextInput = document.getElementById('win-text');
const formError = document.getElementById('form-error');
const todayBadge = document.getElementById('today-badge');
const winGroups = document.getElementById('win-groups');
const emptyState = document.getElementById('empty-state');
const confettiBurst = document.getElementById('confetti-burst');

let lastAddedId = null;

function triggerConfetti() {
  confettiBurst.classList.remove('is-active');
  void confettiBurst.offsetWidth;
  confettiBurst.classList.add('is-active');
}

function renderWins() {
  const wins = getWins();

  winGroups.innerHTML = '';

  const todayCount = wins.filter((w) => dateToLocalString(new Date(w.createdAt)) === todayString()).length;
  if (todayCount > 0) {
    todayBadge.hidden = false;
    todayBadge.textContent = `${todayCount} win${todayCount === 1 ? '' : 's'} today`;
  } else {
    todayBadge.hidden = true;
  }

  if (wins.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const groups = new Map();
  for (const win of wins) {
    const dateStr = dateToLocalString(new Date(win.createdAt));
    if (!groups.has(dateStr)) groups.set(dateStr, []);
    groups.get(dateStr).push(win);
  }

  const sortedDates = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

  for (const dateStr of sortedDates) {
    const groupEl = document.createElement('div');
    groupEl.className = 'day-group';

    const heading = document.createElement('h3');
    heading.className = 'day-heading';
    heading.textContent = dayLabel(dateStr);
    groupEl.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'win-list';

    const entries = groups.get(dateStr).slice().reverse();
    for (const win of entries) {
      const li = document.createElement('li');
      li.className = 'win-entry' + (win.id === lastAddedId ? ' is-new' : '');

      const textEl = document.createElement('span');
      textEl.className = 'win-text';
      textEl.textContent = win.text;

      const meta = document.createElement('div');
      meta.className = 'win-meta';

      const timeEl = document.createElement('span');
      timeEl.className = 'win-time';
      timeEl.textContent = formatTime(win.createdAt);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'win-delete';
      deleteBtn.setAttribute('aria-label', 'Delete win');
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', () => {
        const remaining = getWins().filter((w) => w.id !== win.id);
        saveWins(remaining);
        renderWins();
      });

      meta.appendChild(timeEl);
      meta.appendChild(deleteBtn);

      li.appendChild(textEl);
      li.appendChild(meta);
      list.appendChild(li);
    }

    groupEl.appendChild(list);
    winGroups.appendChild(groupEl);
  }
}

winForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const text = winTextInput.value.trim();
  if (!text) {
    formError.textContent = 'Please enter what went well.';
    return;
  }

  const wins = getWins();
  const newWin = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
  wins.push(newWin);
  saveWins(wins);

  winForm.reset();
  lastAddedId = newWin.id;
  renderWins();
  lastAddedId = null;
  triggerConfetti();
});

renderWins();
