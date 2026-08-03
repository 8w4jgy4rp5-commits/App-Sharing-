const ENTRIES_KEY = 'songCatcher:entries:v1';

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

const addForm = document.getElementById('add-form');
const songInput = document.getElementById('song-input');
const formError = document.getElementById('form-error');
const entryList = document.getElementById('entry-list');
const emptyState = document.getElementById('empty-state');

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderEntries() {
  const entries = getEntries();

  entryList.innerHTML = '';

  if (entries.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const sorted = [...entries].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  for (const entry of sorted) {
    const li = document.createElement('li');
    li.className = 'entry-card' + (entry.done ? ' is-done' : '');

    const top = document.createElement('div');
    top.className = 'entry-top';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'entry-check';
    checkbox.checked = entry.done;
    checkbox.setAttribute('aria-label', entry.done ? 'Mark as not done' : 'Mark as done');
    checkbox.addEventListener('change', () => {
      toggleDone(entry.id);
    });
    top.appendChild(checkbox);

    const body = document.createElement('div');
    body.className = 'entry-body';

    const textEl = document.createElement('div');
    textEl.className = 'entry-text';
    textEl.textContent = entry.text;
    body.appendChild(textEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'entry-meta';
    metaEl.textContent = formatDate(entry.createdAt);
    body.appendChild(metaEl);

    top.appendChild(body);

    if (entry.done) {
      const badge = document.createElement('span');
      badge.className = 'done-badge';
      badge.textContent = 'Done';
      top.appendChild(badge);
    }

    li.appendChild(top);

    const actions = document.createElement('div');
    actions.className = 'entry-actions';

    const searchLink = document.createElement('a');
    searchLink.className = 'search-link';
    searchLink.href = `https://www.google.com/search?q=${encodeURIComponent(entry.text)}`;
    searchLink.target = '_blank';
    searchLink.rel = 'noopener noreferrer';
    searchLink.textContent = 'Search';
    actions.appendChild(searchLink);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'entry-delete';
    deleteBtn.setAttribute('aria-label', 'Delete entry');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const remaining = getEntries().filter((e) => e.id !== entry.id);
      saveEntries(remaining);
      renderEntries();
    });
    actions.appendChild(deleteBtn);

    li.appendChild(actions);
    entryList.appendChild(li);
  }
}

function toggleDone(entryId) {
  const entries = getEntries();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return;
  entry.done = !entry.done;
  saveEntries(entries);
  renderEntries();
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const text = songInput.value.trim();
  if (!text) {
    formError.textContent = 'Please enter something before saving.';
    return;
  }

  const entries = getEntries();
  entries.push({
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
    done: false,
  });
  saveEntries(entries);

  addForm.reset();
  songInput.focus();
  renderEntries();
});

renderEntries();
