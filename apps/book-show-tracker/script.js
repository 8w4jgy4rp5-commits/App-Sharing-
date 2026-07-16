// ===========================
// Book & Show Tracker - Logic
// ===========================

const STORAGE_KEY = 'bookShowTracker:items:v1';

// Reads all items from localStorage; returns [] if missing or corrupted
function getItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let typeFilter = 'all';
let statusFilter = 'all';

const itemForm = document.getElementById('itemForm');
const itemTitleInput = document.getElementById('itemTitle');
const itemTypeSelect = document.getElementById('itemType');
const itemNotesInput = document.getElementById('itemNotes');
const itemList = document.getElementById('itemList');
const listCount = document.getElementById('listCount');

itemForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = itemTitleInput.value.trim();
  if (!title) return;

  const items = getItems();
  items.unshift({
    id: crypto.randomUUID(),
    title,
    type: itemTypeSelect.value,
    notes: itemNotesInput.value.trim(),
    status: 'want',
    learnings: '',
    rating: 0,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  });
  saveItems(items);

  itemForm.reset();
  render();
});

document.querySelectorAll('#type-filter-section .filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    typeFilter = btn.dataset.typeFilter;
    document.querySelectorAll('#type-filter-section .filter-btn').forEach((b) =>
      b.classList.toggle('active', b === btn)
    );
    render();
  });
});

document.querySelectorAll('#status-filter-section .filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    statusFilter = btn.dataset.statusFilter;
    document.querySelectorAll('#status-filter-section .filter-btn').forEach((b) =>
      b.classList.toggle('active', b === btn)
    );
    render();
  });
});

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toggleStatus(id) {
  const items = getItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;

  if (item.status === 'want') {
    item.status = 'finished';
    item.finishedAt = new Date().toISOString();
  } else {
    item.status = 'want';
    item.finishedAt = null;
  }
  saveItems(items);
  render();
}

function saveLearnings(id, value) {
  const items = getItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.learnings = value.trim();
  saveItems(items);
}

function setRating(id, rating) {
  const items = getItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.rating = rating;
  saveItems(items);
  render();
}

function deleteItem(id) {
  const items = getItems().filter((i) => i.id !== id);
  saveItems(items);
  render();
}

function buildCard(item) {
  const card = document.createElement('div');
  card.className = `item-card type-${item.type} status-${item.status}`;

  // Header: type badge + title, status toggle button
  const header = document.createElement('div');
  header.className = 'card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'card-title-group';

  const typeBadge = document.createElement('span');
  typeBadge.className = `type-badge type-${item.type}`;
  typeBadge.textContent = item.type === 'book' ? 'Book' : 'Show';

  const title = document.createElement('span');
  title.className = item.status === 'finished' ? 'card-title finished' : 'card-title';
  title.textContent = item.title;

  titleGroup.append(typeBadge, title);

  const statusBtn = document.createElement('button');
  statusBtn.type = 'button';
  statusBtn.className = `status-badge status-${item.status}`;
  statusBtn.textContent = item.status === 'want' ? 'Want to' : 'Finished ✓';
  statusBtn.setAttribute('aria-label', item.status === 'want' ? 'Mark as finished' : 'Mark as want to');
  statusBtn.addEventListener('click', () => toggleStatus(item.id));

  header.append(titleGroup, statusBtn);
  card.appendChild(header);

  // Notes (optional, shown if present)
  if (item.notes) {
    const notesLabel = document.createElement('p');
    notesLabel.className = 'card-label';
    notesLabel.textContent = 'Notes';
    const notesText = document.createElement('p');
    notesText.className = 'card-text';
    notesText.textContent = item.notes;
    card.append(notesLabel, notesText);
  }

  // Learnings (only shown once finished)
  if (item.status === 'finished') {
    const learningsLabel = document.createElement('p');
    learningsLabel.className = 'card-label';
    learningsLabel.textContent = 'What I learned';

    const learningsInput = document.createElement('textarea');
    learningsInput.className = 'learnings-input';
    learningsInput.placeholder = 'Any takeaways worth remembering? (optional)';
    learningsInput.value = item.learnings;
    learningsInput.setAttribute('aria-label', `Learnings for ${item.title}`);
    learningsInput.addEventListener('change', () => saveLearnings(item.id, learningsInput.value));

    card.append(learningsLabel, learningsInput);

    const ratingLabel = document.createElement('p');
    ratingLabel.className = 'card-label';
    ratingLabel.textContent = 'Rating';

    const ratingRow = document.createElement('div');
    ratingRow.className = 'rating-row';
    const rating = item.rating || 0;
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'star-btn';
      star.textContent = i <= rating ? '★' : '☆';
      star.setAttribute('aria-label', `Rate ${i} star${i > 1 ? 's' : ''}`);
      star.addEventListener('click', () => setRating(item.id, i));
      ratingRow.appendChild(star);
    }

    card.append(ratingLabel, ratingRow);
  }

  // Footer: date + delete button
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const dateText = document.createElement('p');
  dateText.className = 'card-date';
  dateText.textContent = item.status === 'finished'
    ? `Finished ${formatDate(item.finishedAt)}`
    : `Added ${formatDate(item.createdAt)}`;

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', `Delete ${item.title}`);
  deleteBtn.addEventListener('click', () => deleteItem(item.id));

  footer.append(dateText, deleteBtn);
  card.appendChild(footer);

  return card;
}

function render() {
  const allItems = getItems();
  const filtered = allItems.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  itemList.innerHTML = '';

  if (allItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = "Nothing here yet. Add a book or show you'd like to check out!";
    itemList.appendChild(empty);
  } else if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No items match this filter.';
    itemList.appendChild(empty);
  } else {
    filtered.forEach((item) => itemList.appendChild(buildCard(item)));
  }

  listCount.textContent = `(${filtered.length})`;
}

render();
