const STORAGE_KEY = 'ideaNotebook:ideas:v1';

const STATUS_LABELS = {
  new: 'New',
  exploring: 'Exploring',
  onhold: 'On Hold',
};

function getIdeas() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const addForm = document.getElementById('add-form');
const titleInput = document.getElementById('title-input');
const descriptionInput = document.getElementById('description-input');
const errorMsg = document.getElementById('error-msg');
const searchInput = document.getElementById('search-input');
const ideaList = document.getElementById('idea-list');
const emptyState = document.getElementById('empty-state');

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.hidden = true;
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  const title = titleInput.value.trim();
  if (!title) {
    showError('Please enter a title for your idea.');
    return;
  }

  const ideas = getIdeas();
  ideas.unshift({
    id: String(Date.now()),
    title,
    description: descriptionInput.value.trim(),
    status: 'new',
    createdAt: new Date().toISOString(),
    notes: [],
  });
  saveIdeas(ideas);
  addForm.reset();
  render();
});

searchInput.addEventListener('input', render);

function buildNoteItem(note) {
  const li = document.createElement('li');
  li.className = 'note-item';

  const dateEl = document.createElement('p');
  dateEl.className = 'note-date';
  dateEl.textContent = formatDate(note.createdAt);

  const textEl = document.createElement('p');
  textEl.className = 'note-text';
  textEl.textContent = note.text;

  li.appendChild(dateEl);
  li.appendChild(textEl);
  return li;
}

function buildIdeaCard(idea) {
  const li = document.createElement('li');
  li.className = 'idea-card';

  const head = document.createElement('div');
  head.className = 'idea-head';

  const titleEl = document.createElement('h3');
  titleEl.className = 'idea-title';
  titleEl.textContent = idea.title;

  const statusSelect = document.createElement('select');
  statusSelect.className = `status-select status-${idea.status}`;
  statusSelect.setAttribute('aria-label', `Status for "${idea.title}"`);
  for (const [value, label] of Object.entries(STATUS_LABELS)) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (value === idea.status) opt.selected = true;
    statusSelect.appendChild(opt);
  }
  statusSelect.addEventListener('change', () => {
    const ideas = getIdeas();
    const target = ideas.find((i) => i.id === idea.id);
    if (target) {
      target.status = statusSelect.value;
      saveIdeas(ideas);
    }
    statusSelect.className = `status-select status-${statusSelect.value}`;
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'idea-delete';
  deleteBtn.setAttribute('aria-label', `Delete idea "${idea.title}"`);
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(`Delete "${idea.title}"? This cannot be undone.`)) return;
    const ideas = getIdeas().filter((i) => i.id !== idea.id);
    saveIdeas(ideas);
    render();
  });

  head.appendChild(titleEl);
  head.appendChild(statusSelect);
  head.appendChild(deleteBtn);
  li.appendChild(head);

  if (idea.description) {
    const descEl = document.createElement('p');
    descEl.className = 'idea-desc';
    descEl.textContent = idea.description;
    li.appendChild(descEl);
  }

  const dateEl = document.createElement('p');
  dateEl.className = 'idea-date';
  dateEl.textContent = `Added ${formatDate(idea.createdAt)}`;
  li.appendChild(dateEl);

  const notesSection = document.createElement('div');
  notesSection.className = 'notes-section';

  const notesTitle = document.createElement('h4');
  notesTitle.className = 'notes-title';
  notesTitle.textContent = 'Follow-up notes';
  notesSection.appendChild(notesTitle);

  const notes = Array.isArray(idea.notes) ? idea.notes : [];
  if (notes.length > 0) {
    const notesList = document.createElement('ul');
    notesList.className = 'notes-list';
    const newestFirst = [...notes].reverse();
    for (const note of newestFirst) {
      notesList.appendChild(buildNoteItem(note));
    }
    notesSection.appendChild(notesList);
  }

  const noteForm = document.createElement('form');
  noteForm.className = 'note-form';

  const noteTextarea = document.createElement('textarea');
  noteTextarea.rows = 2;
  noteTextarea.maxLength = 500;
  noteTextarea.placeholder = 'Add a follow-up thought...';
  noteTextarea.setAttribute('aria-label', `Add a follow-up note to "${idea.title}"`);

  const noteSubmit = document.createElement('button');
  noteSubmit.type = 'submit';
  noteSubmit.className = 'secondary-btn';
  noteSubmit.textContent = 'Add Note';

  noteForm.appendChild(noteTextarea);
  noteForm.appendChild(noteSubmit);

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = noteTextarea.value.trim();
    if (!text) return;
    const ideas = getIdeas();
    const target = ideas.find((i) => i.id === idea.id);
    if (target) {
      if (!Array.isArray(target.notes)) target.notes = [];
      target.notes.push({ id: String(Date.now()), text, createdAt: new Date().toISOString() });
      saveIdeas(ideas);
    }
    render();
  });

  notesSection.appendChild(noteForm);
  li.appendChild(notesSection);

  return li;
}

function render() {
  const allIdeas = getIdeas();

  const query = searchInput.value.trim().toLowerCase();
  const filtered = query
    ? allIdeas.filter(
        (i) =>
          i.title.toLowerCase().includes(query) || (i.description || '').toLowerCase().includes(query)
      )
    : allIdeas;

  ideaList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent =
      allIdeas.length === 0
        ? 'No ideas yet. Jot down your first one above.'
        : 'No ideas match your search.';
    return;
  }
  emptyState.hidden = true;

  for (const idea of filtered) {
    ideaList.appendChild(buildIdeaCard(idea));
  }
}

render();
