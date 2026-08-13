// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'ideaNotebook:ideas:v1';

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
// Localization (reads the shared platform language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Idea Notebook',
    subtitle: 'Capture business ideas before they slip away, and build on them over time.',
    newIdeaHeading: 'New Idea',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Subscription box for local coffee roasters',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: "What's the idea, in a sentence or two?",
    titleRequiredError: 'Please enter a title for your idea.',
    addIdeaBtn: 'Add Idea',
    yourIdeasHeading: 'Your Ideas',
    searchLabel: 'Search your ideas',
    searchPlaceholder: 'Search ideas',
    statusNew: 'New',
    statusExploring: 'Exploring',
    statusOnHold: 'On Hold',
    statusForAriaLabel: function (title) { return `Status for "${title}"`; },
    deleteIdeaAriaLabel: function (title) { return `Delete idea "${title}"`; },
    confirmDelete: function (title) { return `Delete "${title}"? This cannot be undone.`; },
    addedOn: function (date) { return `Added ${date}`; },
    followUpNotes: 'Follow-up notes',
    addNotePlaceholder: 'Add a follow-up thought...',
    addNoteAriaLabel: function (title) { return `Add a follow-up note to "${title}"`; },
    addNoteBtn: 'Add Note',
    emptyNoIdeas: 'No ideas yet. Jot down your first one above.',
    emptyNoMatch: 'No ideas match your search.',
  },
  ja: {
    title: 'アイデアノート',
    subtitle: 'ビジネスアイデアを忘れないうちに記録し、時間をかけて育てましょう。',
    newIdeaHeading: '新しいアイデア',
    titleLabel: 'タイトル',
    titlePlaceholder: '例: 地元コーヒー焙煎所のサブスクリプションボックス',
    descriptionLabel: '説明（任意）',
    descriptionPlaceholder: 'どんなアイデアですか？一言でどうぞ',
    titleRequiredError: 'アイデアのタイトルを入力してください。',
    addIdeaBtn: 'アイデアを追加',
    yourIdeasHeading: 'あなたのアイデア',
    searchLabel: 'アイデアを検索',
    searchPlaceholder: 'アイデアを検索',
    statusNew: '新規',
    statusExploring: '検討中',
    statusOnHold: '保留中',
    statusForAriaLabel: function (title) { return `「${title}」のステータス`; },
    deleteIdeaAriaLabel: function (title) { return `「${title}」を削除`; },
    confirmDelete: function (title) { return `「${title}」を削除しますか？この操作は取り消せません。`; },
    addedOn: function (date) { return `追加日: ${date}`; },
    followUpNotes: 'フォローアップメモ',
    addNotePlaceholder: '思いついたことを追記...',
    addNoteAriaLabel: function (title) { return `「${title}」にフォローアップメモを追加`; },
    addNoteBtn: 'メモを追加',
    emptyNoIdeas: 'まだアイデアがありません。上から最初の一つを書き留めましょう。',
    emptyNoMatch: '検索に一致するアイデアがありません。',
  },
  es: {
    title: 'Cuaderno de Ideas',
    subtitle: 'Anota tus ideas de negocio antes de que se te olviden y desarróllalas con el tiempo.',
    newIdeaHeading: 'Nueva Idea',
    titleLabel: 'Título',
    titlePlaceholder: 'ej. Caja de suscripción para tostadores de café locales',
    descriptionLabel: 'Descripción (opcional)',
    descriptionPlaceholder: '¿Cuál es la idea, en una o dos frases?',
    titleRequiredError: 'Por favor, escribe un título para tu idea.',
    addIdeaBtn: 'Añadir Idea',
    yourIdeasHeading: 'Tus Ideas',
    searchLabel: 'Buscar tus ideas',
    searchPlaceholder: 'Buscar ideas',
    statusNew: 'Nueva',
    statusExploring: 'Explorando',
    statusOnHold: 'En Pausa',
    statusForAriaLabel: function (title) { return `Estado de "${title}"`; },
    deleteIdeaAriaLabel: function (title) { return `Eliminar idea "${title}"`; },
    confirmDelete: function (title) { return `¿Eliminar "${title}"? Esta acción no se puede deshacer.`; },
    addedOn: function (date) { return `Añadida el ${date}`; },
    followUpNotes: 'Notas de seguimiento',
    addNotePlaceholder: 'Añade un pensamiento de seguimiento...',
    addNoteAriaLabel: function (title) { return `Añadir una nota de seguimiento a "${title}"`; },
    addNoteBtn: 'Añadir Nota',
    emptyNoIdeas: 'Aún no hay ideas. Anota la primera arriba.',
    emptyNoMatch: 'Ninguna idea coincide con tu búsqueda.',
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

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (t[key]) el.setAttribute('aria-label', t[key]);
  });
}

const STATUS_LABELS = {
  new: t.statusNew,
  exploring: t.statusExploring,
  onhold: t.statusOnHold,
};

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveIdeas() してよい。
function getIdeas() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveIdeas(ideas) {
  if (!store) return;
  store.set(ideas).catch(function (e) {
    console.error('Idea Notebook: 保存に失敗しました', e);
  });
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
    showError(t.titleRequiredError);
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
  statusSelect.setAttribute('aria-label', t.statusForAriaLabel(idea.title));
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
  deleteBtn.setAttribute('aria-label', t.deleteIdeaAriaLabel(idea.title));
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(t.confirmDelete(idea.title))) return;
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
  dateEl.textContent = t.addedOn(formatDate(idea.createdAt));
  li.appendChild(dateEl);

  const notesSection = document.createElement('div');
  notesSection.className = 'notes-section';

  const notesTitle = document.createElement('h4');
  notesTitle.className = 'notes-title';
  notesTitle.textContent = t.followUpNotes;
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
  noteTextarea.placeholder = t.addNotePlaceholder;
  noteTextarea.setAttribute('aria-label', t.addNoteAriaLabel(idea.title));

  const noteSubmit = document.createElement('button');
  noteSubmit.type = 'submit';
  noteSubmit.className = 'secondary-btn';
  noteSubmit.textContent = t.addNoteBtn;

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
        ? t.emptyNoIdeas
        : t.emptyNoMatch;
    return;
  }
  emptyState.hidden = true;

  for (const idea of filtered) {
    ideaList.appendChild(buildIdeaCard(idea));
  }
}

applyStaticTranslations();
// データ層の準備ができてから描画する
(async function () {
  store = await openStore('idea-notebook', 'ideas', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
