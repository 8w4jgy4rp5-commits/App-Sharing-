// ===========================
// Daily Summary - script
// ===========================

const STORAGE_KEY = 'dailySummary:entries:v1';
const DISPLAY_LIMIT = 30;

// -----------------------
// localStorage read/write
// -----------------------

function getEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// -----------------------
// Formatting
// -----------------------

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('writeForm').addEventListener('submit', handleWrite);
  document.getElementById('writeTabBtn').addEventListener('click', function () { setActiveTab('write'); });
  document.getElementById('reflectTabBtn').addEventListener('click', function () { setActiveTab('reflect'); });

  renderEntries();
});

// -----------------------
// Tabs (mobile only; both pages stay visible on wider screens via CSS)
// -----------------------

function setActiveTab(tab) {
  const writePage = document.getElementById('writePage');
  const reflectPage = document.getElementById('reflectPage');
  const writeTabBtn = document.getElementById('writeTabBtn');
  const reflectTabBtn = document.getElementById('reflectTabBtn');

  const isWrite = tab === 'write';
  writePage.classList.toggle('page--active', isWrite);
  reflectPage.classList.toggle('page--active', !isWrite);
  writeTabBtn.classList.toggle('active', isWrite);
  reflectTabBtn.classList.toggle('active', !isWrite);
  writeTabBtn.setAttribute('aria-selected', String(isWrite));
  reflectTabBtn.setAttribute('aria-selected', String(!isWrite));
}

// -----------------------
// Write
// -----------------------

function handleWrite(e) {
  e.preventDefault();

  const textInput = document.getElementById('entryText');
  const text = textInput.value.trim();
  if (!text) return;

  const entry = {
    id: Date.now(),
    text: text,
    createdAt: new Date().toISOString()
  };

  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);

  this.reset();
  renderEntries();
  setActiveTab('reflect');
  document.getElementById('reflectHeading').focus();
}

// -----------------------
// Render
// -----------------------

function renderEntries() {
  const entries = getEntries()
    .slice()
    .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); })
    .slice(0, DISPLAY_LIMIT);

  const list = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');
  list.innerHTML = '';

  if (entries.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  entries.forEach(function (entry) {
    list.appendChild(createEntryCard(entry));
  });
}

function createEntryCard(entry) {
  const card = document.createElement('div');
  card.className = 'entry-card';

  const date = document.createElement('p');
  date.className = 'entry-date';
  date.textContent = formatTimestamp(entry.createdAt);
  card.appendChild(date);

  const text = document.createElement('p');
  text.className = 'entry-text';
  text.textContent = entry.text;
  card.appendChild(text);

  return card;
}
