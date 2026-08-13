// ===========================
// Book & Show Tracker - Logic
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'bookShowTracker:items:v1';

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
// Localization (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Book & Show Tracker',
    subtitle: "Keep track of what you want to read or watch, and what you've finished.",
    addItemHeading: 'Add an Item',
    titleLabel: 'Title',
    titleHelp: 'What book or show do you want to read or watch?',
    titlePlaceholder: 'e.g. Dune, Breaking Bad',
    typeLabel: 'Type',
    typeHelp: 'Is this a book or a show?',
    typeBook: 'Book',
    typeShow: 'Show',
    notesLabel: 'Notes',
    notesHelp: 'Why do you want to check this out? (optional)',
    notesPlaceholder: 'e.g. Recommended by a friend',
    addToListBtn: 'Add to List',
    filterAllTypes: 'All Types',
    filterBooks: 'Books',
    filterShows: 'Shows',
    filterAllStatus: 'All Status',
    filterWantTo: 'Want to',
    filterFinished: 'Finished',
    myListHeading: 'My List',
    guideAriaLabel: 'How to use this app',
    howToUseHeading: 'How to Use',
    guideStep1Title: 'Add a book or show',
    guideStep1Text: "Enter a title, choose Book or Show, and optionally note why you're interested.",
    guideStep2Title: 'Mark it finished',
    guideStep2Text: 'Tap the status badge on a card to switch between "Want to" and "Finished".',
    guideStep3Title: 'Rate it & reflect',
    guideStep3Text: 'Once finished, give it a star rating and write down what you learned.',
    guideStep4Title: 'Filter your list',
    guideStep4Text: 'Use the pill buttons above the list to narrow it down by type or status.',
    statusBadgeWant: 'Want to',
    statusBadgeFinished: 'Finished ✓',
    markAsFinishedAria: 'Mark as finished',
    markAsWantAria: 'Mark as want to',
    whatILearnedLabel: 'What I learned',
    learningsPlaceholder: 'Any takeaways worth remembering? (optional)',
    learningsAriaLabel: function (title) { return 'Learnings for ' + title; },
    ratingLabel: 'Rating',
    rateStarsAria: function (n) { return 'Rate ' + n + ' star' + (n > 1 ? 's' : ''); },
    finishedOn: function (date) { return 'Finished ' + date; },
    addedOn: function (date) { return 'Added ' + date; },
    deleteBtn: 'Delete',
    deleteItemAria: function (title) { return 'Delete ' + title; },
    emptyNoItems: "Nothing here yet. Add a book or show you'd like to check out!",
    emptyNoMatch: 'No items match this filter.',
  },
  ja: {
    title: '読書・視聴トラッカー',
    subtitle: '読みたい・観たい作品と、読み終えた・観終えた作品を記録しましょう。',
    addItemHeading: 'アイテムを追加',
    titleLabel: 'タイトル',
    titleHelp: '読みたい本や観たい番組は何ですか？',
    titlePlaceholder: '例: Dune、ブレイキング・バッド',
    typeLabel: '種類',
    typeHelp: '本ですか、それとも番組ですか？',
    typeBook: '本',
    typeShow: '番組',
    notesLabel: 'メモ',
    notesHelp: 'なぜ気になっているのですか？（任意）',
    notesPlaceholder: '例: 友達に勧められた',
    addToListBtn: 'リストに追加',
    filterAllTypes: 'すべての種類',
    filterBooks: '本',
    filterShows: '番組',
    filterAllStatus: 'すべての状態',
    filterWantTo: '気になる',
    filterFinished: '完了',
    myListHeading: 'マイリスト',
    guideAriaLabel: 'このアプリの使い方',
    howToUseHeading: '使い方',
    guideStep1Title: '本や番組を追加',
    guideStep1Text: 'タイトルを入力し、本か番組かを選び、気になる理由があれば任意でメモしましょう。',
    guideStep2Title: '完了にする',
    guideStep2Text: 'カードのステータスバッジをタップすると「気になる」と「完了」を切り替えられます。',
    guideStep3Title: '評価して振り返る',
    guideStep3Text: '完了したら星評価をつけて、学んだことを書き留めましょう。',
    guideStep4Title: 'リストを絞り込む',
    guideStep4Text: 'リスト上部のピルボタンで、種類やステータスによって絞り込めます。',
    statusBadgeWant: '気になる',
    statusBadgeFinished: '完了 ✓',
    markAsFinishedAria: '完了にする',
    markAsWantAria: '気になるに戻す',
    whatILearnedLabel: '学んだこと',
    learningsPlaceholder: '覚えておきたい学びはありますか？（任意）',
    learningsAriaLabel: function (title) { return '「' + title + '」の学び'; },
    ratingLabel: '評価',
    rateStarsAria: function (n) { return '星' + n + 'つで評価'; },
    finishedOn: function (date) { return '完了日: ' + date; },
    addedOn: function (date) { return '追加日: ' + date; },
    deleteBtn: '削除',
    deleteItemAria: function (title) { return '「' + title + '」を削除'; },
    emptyNoItems: 'まだ何もありません。読みたい本や観たい番組を追加しましょう！',
    emptyNoMatch: 'この条件に一致するアイテムはありません。',
  },
  es: {
    title: 'Rastreador de Libros y Series',
    subtitle: 'Lleva un registro de lo que quieres leer o ver, y de lo que ya has terminado.',
    addItemHeading: 'Añadir un elemento',
    titleLabel: 'Título',
    titleHelp: '¿Qué libro o serie quieres leer o ver?',
    titlePlaceholder: 'ej. Dune, Breaking Bad',
    typeLabel: 'Tipo',
    typeHelp: '¿Es un libro o una serie?',
    typeBook: 'Libro',
    typeShow: 'Serie',
    notesLabel: 'Notas',
    notesHelp: '¿Por qué te interesa? (opcional)',
    notesPlaceholder: 'ej. Recomendado por un amigo',
    addToListBtn: 'Añadir a la lista',
    filterAllTypes: 'Todos los tipos',
    filterBooks: 'Libros',
    filterShows: 'Series',
    filterAllStatus: 'Todos los estados',
    filterWantTo: 'Pendiente',
    filterFinished: 'Terminado',
    myListHeading: 'Mi lista',
    guideAriaLabel: 'Cómo usar esta app',
    howToUseHeading: 'Cómo usarla',
    guideStep1Title: 'Añade un libro o serie',
    guideStep1Text: 'Escribe un título, elige Libro o Serie y, si quieres, anota por qué te interesa.',
    guideStep2Title: 'Márcalo como terminado',
    guideStep2Text: 'Toca la insignia de estado en una tarjeta para alternar entre "Pendiente" y "Terminado".',
    guideStep3Title: 'Califícalo y reflexiona',
    guideStep3Text: 'Una vez terminado, dale una calificación con estrellas y anota lo que aprendiste.',
    guideStep4Title: 'Filtra tu lista',
    guideStep4Text: 'Usa los botones tipo píldora encima de la lista para filtrar por tipo o estado.',
    statusBadgeWant: 'Pendiente',
    statusBadgeFinished: 'Terminado ✓',
    markAsFinishedAria: 'Marcar como terminado',
    markAsWantAria: 'Marcar como pendiente',
    whatILearnedLabel: 'Lo que aprendí',
    learningsPlaceholder: '¿Alguna idea que valga la pena recordar? (opcional)',
    learningsAriaLabel: function (title) { return 'Aprendizajes de ' + title; },
    ratingLabel: 'Calificación',
    rateStarsAria: function (n) { return 'Calificar con ' + n + ' estrella' + (n > 1 ? 's' : ''); },
    finishedOn: function (date) { return 'Terminado el ' + date; },
    addedOn: function (date) { return 'Añadido el ' + date; },
    deleteBtn: 'Eliminar',
    deleteItemAria: function (title) { return 'Eliminar ' + title; },
    emptyNoItems: 'Aún no hay nada aquí. ¡Añade un libro o serie que quieras probar!',
    emptyNoMatch: 'Ningún elemento coincide con este filtro.',
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

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria-label');
    if (t[key]) el.setAttribute('aria-label', t[key]);
  });
}

applyStaticTranslations();

// Locale used for displaying dates, matched to the current UI language
const DATE_LOCALES = { en: 'en-US', ja: 'ja-JP', es: 'es-ES' };

// Reads all items from localStorage; returns [] if missing or corrupted
// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveItems() してよい。
function getItems() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveItems(items) {
  if (!store) return;
  store.set(items).catch(function (e) {
    console.error('Book & Show Tracker: 保存に失敗しました', e);
  });
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
  return date.toLocaleDateString(DATE_LOCALES[getLang()], { year: 'numeric', month: 'short', day: 'numeric' });
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
  typeBadge.textContent = item.type === 'book' ? t.typeBook : t.typeShow;

  const title = document.createElement('span');
  title.className = item.status === 'finished' ? 'card-title finished' : 'card-title';
  title.textContent = item.title;

  titleGroup.append(typeBadge, title);

  const statusBtn = document.createElement('button');
  statusBtn.type = 'button';
  statusBtn.className = `status-badge status-${item.status}`;
  statusBtn.textContent = item.status === 'want' ? t.statusBadgeWant : t.statusBadgeFinished;
  statusBtn.setAttribute('aria-label', item.status === 'want' ? t.markAsFinishedAria : t.markAsWantAria);
  statusBtn.addEventListener('click', () => toggleStatus(item.id));

  header.append(titleGroup, statusBtn);
  card.appendChild(header);

  // Notes (optional, shown if present)
  if (item.notes) {
    const notesLabel = document.createElement('p');
    notesLabel.className = 'card-label';
    notesLabel.textContent = t.notesLabel;
    const notesText = document.createElement('p');
    notesText.className = 'card-text';
    notesText.textContent = item.notes;
    card.append(notesLabel, notesText);
  }

  // Learnings (only shown once finished)
  if (item.status === 'finished') {
    const learningsLabel = document.createElement('p');
    learningsLabel.className = 'card-label';
    learningsLabel.textContent = t.whatILearnedLabel;

    const learningsInput = document.createElement('textarea');
    learningsInput.className = 'learnings-input';
    learningsInput.placeholder = t.learningsPlaceholder;
    learningsInput.value = item.learnings;
    learningsInput.setAttribute('aria-label', t.learningsAriaLabel(item.title));
    learningsInput.addEventListener('change', () => saveLearnings(item.id, learningsInput.value));

    card.append(learningsLabel, learningsInput);

    const ratingLabel = document.createElement('p');
    ratingLabel.className = 'card-label';
    ratingLabel.textContent = t.ratingLabel;

    const ratingRow = document.createElement('div');
    ratingRow.className = 'rating-row';
    const rating = item.rating || 0;
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'star-btn';
      star.textContent = i <= rating ? '★' : '☆';
      star.setAttribute('aria-label', t.rateStarsAria(i));
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
    ? t.finishedOn(formatDate(item.finishedAt))
    : t.addedOn(formatDate(item.createdAt));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = t.deleteBtn;
  deleteBtn.setAttribute('aria-label', t.deleteItemAria(item.title));
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
    empty.textContent = t.emptyNoItems;
    itemList.appendChild(empty);
  } else if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.emptyNoMatch;
    itemList.appendChild(empty);
  } else {
    filtered.forEach((item) => itemList.appendChild(buildCard(item)));
  }

  listCount.textContent = `(${filtered.length})`;
}

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('book-show-tracker', 'items', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
