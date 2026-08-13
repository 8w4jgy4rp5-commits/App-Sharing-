// ===========================
// Reference & Report Organizer
// ===========================

const PAPERS_KEY = 'referenceReportOrganizer:papers:v1';
const REFERENCES_KEY = 'referenceReportOrganizer:references:v1';
const OLD_CHAPTERS_KEY = 'referenceReportOrganizer:chapters:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

let editingRefId = null;
let selectedPaperId = null;

// -----------------------
// Localization (reads the platform-wide language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Reference & Report Organizer',
    subtitle: 'Collect research references and organize them by paper to support your writing.',
    viewSelector: 'View selector',
    allReferences: 'All References',
    byPaper: 'By Paper',
    addReferenceBtn: '+ Add reference',
    addReferenceTitle: 'Add reference',
    editReferenceTitle: 'Edit reference',
    saveChangesBtn: 'Save changes',
    refTitleLabel: 'Title',
    refTitlePlaceholder: 'e.g. Attention Is All You Need',
    refAuthorsLabel: 'Author(s)',
    refAuthorsPlaceholder: 'e.g. Vaswani et al.',
    refUrlLabel: 'URL',
    optional: 'Optional',
    refUrlPlaceholder: 'https://...',
    refSummaryLabel: 'Summary (in your own words)',
    refSummaryPlaceholder: 'What is this source about, in your own words?',
    keyQuotesLabel: 'Key quotes / excerpts',
    keyQuotesHint: 'Add the quote text and, optionally, where it came from (e.g. page number or section)',
    addQuoteBtn: '+ Add quote',
    quoteOrExcerptPlaceholder: 'Quote or excerpt',
    quoteSourcePlaceholder: 'Source (e.g. p. 12, Introduction)',
    quoteSourceAriaLabel: 'Source of this quote',
    removeQuoteAriaLabel: 'Remove quote',
    refNoteLabel: 'Personal note',
    refNotePlaceholder: 'Your own thoughts, questions, or how this fits your report',
    papersLabel: 'Papers',
    papersHint: 'Select which paper(s) this reference belongs to',
    cancelBtn: 'Cancel',
    searchLabel: 'Search',
    searchPlaceholder: 'Search by title, author, summary, or note...',
    newPaperTitleLabel: 'New paper title',
    newPaperPlaceholder: 'e.g. Graduation Thesis',
    addPaperBtn: 'Add paper',
    copyDraftBtn: 'Copy for draft',
    exportImportHeading: 'Export / Import Data',
    exportImportDesc: 'Export all data as a single JSON file. Useful as a backup or to move your data to another browser.',
    exportBtn: 'Export JSON',
    importBtn: 'Import JSON',

    noPapersYet: 'No papers yet. Add one above to start organizing your references.',
    noPapersYetCheckbox: 'No papers yet. Add one in the By Paper tab first.',
    referenceCount: function (n) { return n === 1 ? '(1 reference)' : '(' + n + ' references)'; },
    deleteBtn: 'Delete',
    editBtn: 'Edit',
    deletePaperAriaLabel: function (title) { return 'Delete paper ' + title; },
    noReferencesYet: 'No references yet. Click "+ Add reference" above to get started.',
    noReferencesMatch: 'No references match your search.',
    summaryLabel: 'Summary',
    noSummaryParen: '(no summary)',
    noneParen: '(none)',
    personalNoteLabel: 'Personal note',
    noPapersAssigned: 'No papers assigned',
    quoteSourcePrefix: function (source) { return 'Source: ' + source; },
    selectPaperHint: 'Select a paper above to see its references.',
    noRefsLinkedHint: 'No references linked to this paper yet. Assign some from the All References tab.',
    selectPaperFirst: 'Select a paper first.',
    noRefsLinkedShort: 'No references linked to this paper yet.',
    copiedToClipboard: 'Copied to clipboard!',
    failedToCopy: 'Failed to copy. Please try again.',
    exportComplete: 'Export complete',
    importComplete: 'Import complete',
    failedToReadJson: 'Failed to read the JSON file.',

    draftPaperLabel: function (title) { return 'Paper: ' + title; },
    draftUnknownAuthor: 'Unknown author',
    draftUrlLabel: function (url) { return 'URL: ' + url; },
    draftSummaryLabel: 'Summary:',
    draftQuotesLabel: 'Key quotes/excerpts:',
    draftQuoteLine: function (text, source) { return '- ' + text + (source ? ' (Source: ' + source + ')' : ''); },
    draftPersonalNoteLabel: 'Personal note:',
    draftSeparator: '---',
  },
  ja: {
    title: '文献・レポート整理',
    subtitle: '研究の文献を集めて論文ごとに整理し、執筆をサポートします。',
    viewSelector: '表示切り替え',
    allReferences: 'すべての文献',
    byPaper: '論文別',
    addReferenceBtn: '＋ 文献を追加',
    addReferenceTitle: '文献を追加',
    editReferenceTitle: '文献を編集',
    saveChangesBtn: '変更を保存',
    refTitleLabel: 'タイトル',
    refTitlePlaceholder: '例: Attention Is All You Need',
    refAuthorsLabel: '著者',
    refAuthorsPlaceholder: '例: Vaswani et al.',
    refUrlLabel: 'URL',
    optional: '任意',
    refUrlPlaceholder: 'https://...',
    refSummaryLabel: '要約（自分の言葉で）',
    refSummaryPlaceholder: 'この文献は何についてのものですか？自分の言葉でまとめましょう',
    keyQuotesLabel: '重要な引用・抜粋',
    keyQuotesHint: '引用文と、可能であれば出典（ページ番号やセクションなど）を追加してください',
    addQuoteBtn: '＋ 引用を追加',
    quoteOrExcerptPlaceholder: '引用・抜粋',
    quoteSourcePlaceholder: '出典（例: p.12、序論）',
    quoteSourceAriaLabel: 'この引用の出典',
    removeQuoteAriaLabel: '引用を削除',
    refNoteLabel: '個人メモ',
    refNotePlaceholder: '自分の考え、疑問、レポートとの関連など',
    papersLabel: '論文',
    papersHint: 'この文献が関連する論文を選択してください',
    cancelBtn: 'キャンセル',
    searchLabel: '検索',
    searchPlaceholder: 'タイトル・著者・要約・メモで検索...',
    newPaperTitleLabel: '新しい論文名',
    newPaperPlaceholder: '例: 卒業論文',
    addPaperBtn: '論文を追加',
    copyDraftBtn: '下書き用にコピー',
    exportImportHeading: 'データのエクスポート／インポート',
    exportImportDesc: 'すべてのデータを1つのJSONファイルとして書き出します。バックアップや別のブラウザへの移行に便利です。',
    exportBtn: 'JSONを書き出す',
    importBtn: 'JSONを読み込む',

    noPapersYet: '論文がまだありません。上のボタンから追加して文献を整理しましょう。',
    noPapersYetCheckbox: '論文がまだありません。まず「論文別」タブで追加してください。',
    referenceCount: function (n) { return '（' + n + '件の文献）'; },
    deleteBtn: '削除',
    editBtn: '編集',
    deletePaperAriaLabel: function (title) { return title + 'を削除'; },
    noReferencesYet: '文献がまだありません。上の「＋ 文献を追加」から始めましょう。',
    noReferencesMatch: '検索条件に一致する文献がありません。',
    summaryLabel: '要約',
    noSummaryParen: '（要約なし）',
    noneParen: '（なし）',
    personalNoteLabel: '個人メモ',
    noPapersAssigned: '論文が割り当てられていません',
    quoteSourcePrefix: function (source) { return '出典: ' + source; },
    selectPaperHint: '上で論文を選択すると、その文献一覧が表示されます。',
    noRefsLinkedHint: 'この論文にはまだ文献が紐付けられていません。「すべての文献」タブから割り当ててください。',
    selectPaperFirst: 'まず論文を選択してください。',
    noRefsLinkedShort: 'この論文にはまだ文献が紐付けられていません。',
    copiedToClipboard: 'クリップボードにコピーしました！',
    failedToCopy: 'コピーに失敗しました。もう一度お試しください。',
    exportComplete: 'エクスポートが完了しました',
    importComplete: 'インポートが完了しました',
    failedToReadJson: 'JSONファイルの読み込みに失敗しました。',

    draftPaperLabel: function (title) { return '論文: ' + title; },
    draftUnknownAuthor: '著者不明',
    draftUrlLabel: function (url) { return 'URL: ' + url; },
    draftSummaryLabel: '要約:',
    draftQuotesLabel: '重要な引用・抜粋:',
    draftQuoteLine: function (text, source) { return '- ' + text + (source ? '（出典: ' + source + '）' : ''); },
    draftPersonalNoteLabel: '個人メモ:',
    draftSeparator: '---',
  },
  es: {
    title: 'Organizador de Referencias e Informes',
    subtitle: 'Reúne referencias de investigación y organízalas por trabajo para apoyar tu redacción.',
    viewSelector: 'Selector de vista',
    allReferences: 'Todas las referencias',
    byPaper: 'Por trabajo',
    addReferenceBtn: '+ Añadir referencia',
    addReferenceTitle: 'Añadir referencia',
    editReferenceTitle: 'Editar referencia',
    saveChangesBtn: 'Guardar cambios',
    refTitleLabel: 'Título',
    refTitlePlaceholder: 'ej. Attention Is All You Need',
    refAuthorsLabel: 'Autor(es)',
    refAuthorsPlaceholder: 'ej. Vaswani et al.',
    refUrlLabel: 'URL',
    optional: 'Opcional',
    refUrlPlaceholder: 'https://...',
    refSummaryLabel: 'Resumen (con tus propias palabras)',
    refSummaryPlaceholder: '¿De qué trata esta fuente, con tus propias palabras?',
    keyQuotesLabel: 'Citas / extractos clave',
    keyQuotesHint: 'Añade el texto de la cita y, si es posible, de dónde proviene (por ejemplo, número de página o sección)',
    addQuoteBtn: '+ Añadir cita',
    quoteOrExcerptPlaceholder: 'Cita o extracto',
    quoteSourcePlaceholder: 'Fuente (ej. p. 12, Introducción)',
    quoteSourceAriaLabel: 'Fuente de esta cita',
    removeQuoteAriaLabel: 'Eliminar cita',
    refNoteLabel: 'Nota personal',
    refNotePlaceholder: 'Tus propias ideas, preguntas o cómo encaja esto en tu informe',
    papersLabel: 'Trabajos',
    papersHint: 'Selecciona a qué trabajo(s) pertenece esta referencia',
    cancelBtn: 'Cancelar',
    searchLabel: 'Buscar',
    searchPlaceholder: 'Buscar por título, autor, resumen o nota...',
    newPaperTitleLabel: 'Título del nuevo trabajo',
    newPaperPlaceholder: 'ej. Tesis de grado',
    addPaperBtn: 'Añadir trabajo',
    copyDraftBtn: 'Copiar para el borrador',
    exportImportHeading: 'Exportar / Importar datos',
    exportImportDesc: 'Exporta todos los datos como un único archivo JSON. Útil como copia de seguridad o para trasladar tus datos a otro navegador.',
    exportBtn: 'Exportar JSON',
    importBtn: 'Importar JSON',

    noPapersYet: 'Aún no hay trabajos. Añade uno arriba para empezar a organizar tus referencias.',
    noPapersYetCheckbox: 'Aún no hay trabajos. Añade uno primero en la pestaña Por trabajo.',
    referenceCount: function (n) { return n === 1 ? '(1 referencia)' : '(' + n + ' referencias)'; },
    deleteBtn: 'Eliminar',
    editBtn: 'Editar',
    deletePaperAriaLabel: function (title) { return 'Eliminar trabajo ' + title; },
    noReferencesYet: 'Aún no hay referencias. Haz clic en "+ Añadir referencia" arriba para empezar.',
    noReferencesMatch: 'Ninguna referencia coincide con tu búsqueda.',
    summaryLabel: 'Resumen',
    noSummaryParen: '(sin resumen)',
    noneParen: '(ninguno)',
    personalNoteLabel: 'Nota personal',
    noPapersAssigned: 'Sin trabajos asignados',
    quoteSourcePrefix: function (source) { return 'Fuente: ' + source; },
    selectPaperHint: 'Selecciona un trabajo arriba para ver sus referencias.',
    noRefsLinkedHint: 'Aún no hay referencias vinculadas a este trabajo. Asigna algunas desde la pestaña Todas las referencias.',
    selectPaperFirst: 'Selecciona un trabajo primero.',
    noRefsLinkedShort: 'Aún no hay referencias vinculadas a este trabajo.',
    copiedToClipboard: '¡Copiado al portapapeles!',
    failedToCopy: 'No se pudo copiar. Inténtalo de nuevo.',
    exportComplete: 'Exportación completa',
    importComplete: 'Importación completa',
    failedToReadJson: 'No se pudo leer el archivo JSON.',

    draftPaperLabel: function (title) { return 'Trabajo: ' + title; },
    draftUnknownAuthor: 'Autor desconocido',
    draftUrlLabel: function (url) { return 'URL: ' + url; },
    draftSummaryLabel: 'Resumen:',
    draftQuotesLabel: 'Citas/extractos clave:',
    draftQuoteLine: function (text, source) { return '- ' + text + (source ? ' (Fuente: ' + source + ')' : ''); },
    draftPersonalNoteLabel: 'Nota personal:',
    draftSeparator: '---',
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

// -----------------------
// ID helper
// -----------------------

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// -----------------------
// localStorage read/write
// -----------------------

// AppSync.store() のインスタンス。起動時に初期化される。
let papersStore = null;
let referencesStore = null;

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

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて savePapers() してよい。
function getPapers() {
  if (!papersStore) return [];
  const v = papersStore.get();
  return Array.isArray(v) ? v : [];
}

function savePapers(papers) {
  if (!papersStore) return;
  papersStore.set(papers).catch(function (e) {
    console.error('Reference Report Organizer: 保存に失敗しました', e);
  });
}

function getReferences() {
  if (!referencesStore) return [];
  const v = referencesStore.get();
  return Array.isArray(v) ? v : [];
}

function saveReferences(refs) {
  if (!referencesStore) return;
  referencesStore.set(refs).catch(function (e) {
    console.error('Reference Report Organizer: 保存に失敗しました', e);
  });
}

function sortedPapers() {
  return getPapers().slice().sort((a, b) => a.order - b.order);
}

function isValidUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

// -----------------------
// One-time migration from the old "chapter" model
// -----------------------

function migrateIfNeeded() {
  // papers が既にあれば(ローカル・クラウドどちらから来たものでも)変換しない
  if (getPapers().length === 0) {
    const oldRaw = localStorage.getItem(OLD_CHAPTERS_KEY);
    if (oldRaw) {
      try {
        const oldChapters = JSON.parse(oldRaw);
        if (Array.isArray(oldChapters)) {
          savePapers(oldChapters.map(function (c) {
            return { id: c.id, title: c.name, order: c.order };
          }));
        }
      } catch {
        // ignore corrupted legacy data
      }
    }
  }

  const refs = getReferences();
  let changed = false;
  refs.forEach(function (r) {
    if (r.chapterIds && !r.paperIds) {
      r.paperIds = r.chapterIds;
      delete r.chapterIds;
      changed = true;
    } else if (!Array.isArray(r.paperIds)) {
      r.paperIds = [];
      changed = true;
    }
  });
  if (changed) saveReferences(refs);
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  // データ層の準備ができるまで描画も操作もさせない
  papersStore = await openStore('reference-report-organizer', 'papers', {
    default: [],
    legacyKey: PAPERS_KEY
  });
  referencesStore = await openStore('reference-report-organizer', 'references', {
    default: [],
    legacyKey: REFERENCES_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない。
  // 論文一覧には参考文献の件数が出るので、どちらが変わっても両方描き直す。
  function renderBothLists() {
    renderRefList();
    renderPaperList();
  }
  papersStore.subscribe(renderBothLists);
  referencesStore.subscribe(renderBothLists);

  applyStaticTranslations();
  migrateIfNeeded();

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { showView(btn.dataset.view); });
  });

  document.getElementById('showAddRefBtn').addEventListener('click', openAddRefForm);
  document.getElementById('cancelRefBtn').addEventListener('click', closeRefForm);
  document.getElementById('refForm').addEventListener('submit', handleSubmitRef);
  document.getElementById('addQuoteBtn').addEventListener('click', function () { addQuoteRow(''); });
  document.getElementById('refSearch').addEventListener('input', renderRefList);

  document.getElementById('paperForm').addEventListener('submit', handleAddPaper);
  document.getElementById('copyDraftBtn').addEventListener('click', handleCopyDraft);

  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImportFile);

  renderRefList();
  renderPaperList();
});

function showView(viewId) {
  document.querySelectorAll('.view').forEach(function (section) {
    section.hidden = section.id !== viewId;
  });
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
}

// ===========================
// Papers (By Paper view)
// ===========================

function handleAddPaper(e) {
  e.preventDefault();
  const input = document.getElementById('paperTitle');
  const title = input.value.trim();
  if (!title) return;

  const papers = getPapers();
  papers.push({ id: genId(), title: title, order: papers.length });
  savePapers(papers);

  input.value = '';
  renderPaperList();
  renderRefList();
  if (!document.getElementById('refForm').hidden) renderPaperCheckboxes();
}

function deletePaper(id) {
  const papers = sortedPapers().filter(function (p) { return p.id !== id; });
  papers.forEach(function (p, i) { p.order = i; });
  savePapers(papers);

  const refs = getReferences().map(function (r) {
    return Object.assign({}, r, {
      paperIds: r.paperIds.filter(function (pid) { return pid !== id; })
    });
  });
  saveReferences(refs);

  if (selectedPaperId === id) selectedPaperId = null;

  renderPaperList();
  renderRefList();
  if (!document.getElementById('refForm').hidden) renderPaperCheckboxes();
}

function selectPaper(id) {
  selectedPaperId = id;
  renderPaperList();
}

function referenceCountForPaper(paperId) {
  return getReferences().filter(function (r) { return r.paperIds.includes(paperId); }).length;
}

function renderPaperList() {
  const list = document.getElementById('paperList');
  list.innerHTML = '';

  const papers = sortedPapers();

  if (papers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.noPapersYet;
    list.appendChild(empty);
    renderPaperRefList();
    return;
  }

  if (selectedPaperId && !papers.some(function (p) { return p.id === selectedPaperId; })) {
    selectedPaperId = null;
  }

  papers.forEach(function (paper) {
    list.appendChild(createPaperItem(paper));
  });

  renderPaperRefList();
}

function createPaperItem(paper) {
  const item = document.createElement('div');
  item.className = 'paper-item' + (paper.id === selectedPaperId ? ' selected' : '');

  const selectBtn = document.createElement('button');
  selectBtn.type = 'button';
  selectBtn.className = 'paper-select-btn';
  selectBtn.addEventListener('click', function () { selectPaper(paper.id); });

  const titleSpan = document.createElement('span');
  titleSpan.textContent = paper.title;
  selectBtn.appendChild(titleSpan);

  const count = document.createElement('span');
  count.className = 'paper-ref-count';
  const n = referenceCountForPaper(paper.id);
  count.textContent = t.referenceCount(n);
  selectBtn.appendChild(count);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = t.deleteBtn;
  deleteBtn.setAttribute('aria-label', t.deletePaperAriaLabel(paper.title));
  deleteBtn.addEventListener('click', function () { deletePaper(paper.id); });

  item.appendChild(selectBtn);
  item.appendChild(deleteBtn);

  return item;
}

// ===========================
// Reference form (add / edit)
// ===========================

function openAddRefForm() {
  editingRefId = null;
  document.getElementById('refFormTitle').textContent = t.addReferenceTitle;
  document.getElementById('refSubmitBtn').textContent = t.addReferenceTitle;
  document.getElementById('refTitle').value = '';
  document.getElementById('refAuthors').value = '';
  document.getElementById('refUrl').value = '';
  document.getElementById('refSummary').value = '';
  document.getElementById('refNote').value = '';
  document.getElementById('quoteList').innerHTML = '';
  addQuoteRow('');
  renderPaperCheckboxes([]);
  document.getElementById('refForm').hidden = false;
  document.getElementById('refTitle').focus();
}

function openEditRefForm(ref) {
  editingRefId = ref.id;
  document.getElementById('refFormTitle').textContent = t.editReferenceTitle;
  document.getElementById('refSubmitBtn').textContent = t.saveChangesBtn;
  document.getElementById('refTitle').value = ref.title;
  document.getElementById('refAuthors').value = ref.authors || '';
  document.getElementById('refUrl').value = ref.url || '';
  document.getElementById('refSummary').value = ref.summary || '';
  document.getElementById('refNote').value = ref.note || '';

  const quoteList = document.getElementById('quoteList');
  quoteList.innerHTML = '';
  if (ref.quotes && ref.quotes.length) {
    ref.quotes.forEach(function (q) { addQuoteRow(q.text, q.source); });
  } else {
    addQuoteRow('');
  }

  renderPaperCheckboxes(ref.paperIds || []);
  document.getElementById('refForm').hidden = false;
  document.getElementById('refForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('refTitle').focus();
}

function closeRefForm() {
  editingRefId = null;
  document.getElementById('refForm').hidden = true;
}

function addQuoteRow(text, source) {
  const quoteList = document.getElementById('quoteList');
  const row = document.createElement('div');
  row.className = 'quote-row';

  const fields = document.createElement('div');
  fields.className = 'quote-row-fields';

  const textarea = document.createElement('textarea');
  textarea.className = 'quote-input';
  textarea.value = text || '';
  textarea.placeholder = t.quoteOrExcerptPlaceholder;
  textarea.setAttribute('aria-label', t.quoteOrExcerptPlaceholder);

  const sourceInput = document.createElement('input');
  sourceInput.type = 'text';
  sourceInput.className = 'quote-source-input';
  sourceInput.value = source || '';
  sourceInput.placeholder = t.quoteSourcePlaceholder;
  sourceInput.setAttribute('aria-label', t.quoteSourceAriaLabel);

  fields.appendChild(textarea);
  fields.appendChild(sourceInput);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'quote-remove-btn';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', t.removeQuoteAriaLabel);
  removeBtn.addEventListener('click', function () { row.remove(); });

  row.appendChild(fields);
  row.appendChild(removeBtn);
  quoteList.appendChild(row);
}

function renderPaperCheckboxes(selectedIds) {
  const selected = new Set(selectedIds || []);
  const container = document.getElementById('paperCheckboxes');
  container.innerHTML = '';

  const papers = sortedPapers();

  if (papers.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'muted-hint';
    hint.textContent = t.noPapersYetCheckbox;
    container.appendChild(hint);
    return;
  }

  const list = document.createElement('div');
  list.className = 'checkbox-list';

  papers.forEach(function (paper) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = paper.id;
    checkbox.checked = selected.has(paper.id);

    const span = document.createElement('span');
    span.textContent = paper.title;

    label.appendChild(checkbox);
    label.appendChild(span);
    list.appendChild(label);
  });

  container.appendChild(list);
}

function handleSubmitRef(e) {
  e.preventDefault();

  const title = document.getElementById('refTitle').value.trim();
  if (!title) return;

  const authors = document.getElementById('refAuthors').value.trim();
  const urlRaw = document.getElementById('refUrl').value.trim();
  const url = isValidUrl(urlRaw) ? urlRaw : '';
  const summary = document.getElementById('refSummary').value.trim();
  const note = document.getElementById('refNote').value.trim();

  const quotes = Array.from(document.querySelectorAll('#quoteList .quote-row'))
    .map(function (row) {
      return {
        text: row.querySelector('.quote-input').value.trim(),
        source: row.querySelector('.quote-source-input').value.trim()
      };
    })
    .filter(function (q) { return q.text.length > 0; })
    .map(function (q) { return { id: genId(), text: q.text, source: q.source }; });

  const paperIds = Array.from(document.querySelectorAll('#paperCheckboxes input[type="checkbox"]:checked'))
    .map(function (el) { return el.value; });

  const refs = getReferences();

  if (editingRefId) {
    const existing = refs.find(function (r) { return r.id === editingRefId; });
    if (existing) {
      existing.title = title;
      existing.authors = authors;
      existing.url = url;
      existing.summary = summary;
      existing.note = note;
      existing.quotes = quotes;
      existing.paperIds = paperIds;
    }
  } else {
    refs.push({
      id: genId(),
      title: title,
      authors: authors,
      url: url,
      summary: summary,
      note: note,
      quotes: quotes,
      paperIds: paperIds,
      createdAt: Date.now()
    });
  }

  saveReferences(refs);
  closeRefForm();
  renderRefList();
  renderPaperList();
}

// ===========================
// All References view
// ===========================

function deleteReference(id) {
  const refs = getReferences().filter(function (r) { return r.id !== id; });
  saveReferences(refs);
  renderRefList();
  renderPaperList();
}

function renderRefList() {
  const list = document.getElementById('refList');
  list.innerHTML = '';

  const allRefs = getReferences();
  const query = document.getElementById('refSearch').value.trim().toLowerCase();

  if (allRefs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.noReferencesYet;
    list.appendChild(empty);
    return;
  }

  const filtered = query
    ? allRefs.filter(function (r) {
        return [r.title, r.authors, r.summary, r.note].some(function (field) {
          return (field || '').toLowerCase().includes(query);
        });
      })
    : allRefs;

  if (filtered.length === 0) {
    const noResults = document.createElement('p');
    noResults.className = 'empty-message';
    noResults.textContent = t.noReferencesMatch;
    list.appendChild(noResults);
    return;
  }

  const paperMap = new Map(getPapers().map(function (p) { return [p.id, p.title]; }));

  filtered.forEach(function (ref) {
    list.appendChild(createRefCard(ref, paperMap));
  });
}

function createRefCard(ref, paperMap) {
  const card = document.createElement('div');
  card.className = 'ref-card';

  const header = document.createElement('div');
  header.className = 'ref-card-header';

  const titleWrap = document.createElement('div');
  if (isValidUrl(ref.url)) {
    const link = document.createElement('a');
    link.className = 'ref-title';
    link.href = ref.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = ref.title;
    titleWrap.appendChild(link);
  } else {
    const span = document.createElement('span');
    span.className = 'ref-title';
    span.textContent = ref.title;
    titleWrap.appendChild(span);
  }
  if (ref.authors) {
    const authors = document.createElement('p');
    authors.className = 'ref-authors';
    authors.textContent = ref.authors;
    titleWrap.appendChild(authors);
  }

  const actions = document.createElement('div');
  actions.className = 'ref-card-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = t.editBtn;
  editBtn.addEventListener('click', function () { openEditRefForm(ref); });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = t.deleteBtn;
  deleteBtn.addEventListener('click', function () { deleteReference(ref.id); });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  header.appendChild(titleWrap);
  header.appendChild(actions);
  card.appendChild(header);

  if (ref.summary) {
    const label = document.createElement('p');
    label.className = 'card-label';
    label.textContent = t.summaryLabel;
    const text = document.createElement('p');
    text.className = 'card-text';
    text.textContent = ref.summary;
    card.appendChild(label);
    card.appendChild(text);
  }

  const chips = document.createElement('div');
  chips.className = 'chip-row';
  const linkedTitles = (ref.paperIds || [])
    .map(function (id) { return paperMap.get(id); })
    .filter(Boolean);

  if (linkedTitles.length) {
    linkedTitles.forEach(function (title) {
      const chip = document.createElement('span');
      chip.className = 'paper-chip';
      chip.textContent = title;
      chips.appendChild(chip);
    });
  } else {
    const chip = document.createElement('span');
    chip.className = 'muted-hint';
    chip.textContent = t.noPapersAssigned;
    chips.appendChild(chip);
  }
  card.appendChild(chips);

  return card;
}

// ===========================
// By Paper view
// ===========================

function getRefsForPaper(paperId) {
  return getReferences().filter(function (r) { return r.paperIds.includes(paperId); });
}

function renderPaperRefList() {
  const container = document.getElementById('paperRefList');
  const copyBtn = document.getElementById('copyDraftBtn');
  container.innerHTML = '';
  document.getElementById('copyStatus').textContent = '';

  const papers = sortedPapers();
  if (papers.length === 0) {
    copyBtn.hidden = true;
    return;
  }

  if (!selectedPaperId) {
    copyBtn.hidden = true;
    const hint = document.createElement('p');
    hint.className = 'empty-message';
    hint.textContent = t.selectPaperHint;
    container.appendChild(hint);
    return;
  }

  copyBtn.hidden = false;
  const refs = getRefsForPaper(selectedPaperId);

  if (refs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.noRefsLinkedHint;
    container.appendChild(empty);
    return;
  }

  refs.forEach(function (ref) {
    container.appendChild(createPaperRefDetailCard(ref));
  });
}

function createPaperRefDetailCard(ref) {
  const card = document.createElement('div');
  card.className = 'ref-card';

  const titleWrap = document.createElement('div');
  if (isValidUrl(ref.url)) {
    const link = document.createElement('a');
    link.className = 'ref-title';
    link.href = ref.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = ref.title;
    titleWrap.appendChild(link);
  } else {
    const span = document.createElement('span');
    span.className = 'ref-title';
    span.textContent = ref.title;
    titleWrap.appendChild(span);
  }
  card.appendChild(titleWrap);

  if (ref.authors) {
    const authors = document.createElement('p');
    authors.className = 'ref-authors';
    authors.textContent = ref.authors;
    card.appendChild(authors);
  }

  addLabeledText(card, t.summaryLabel, ref.summary || t.noSummaryParen);

  const quotesLabel = document.createElement('p');
  quotesLabel.className = 'card-label';
  quotesLabel.textContent = t.keyQuotesLabel;
  card.appendChild(quotesLabel);

  if (ref.quotes && ref.quotes.length) {
    const ul = document.createElement('ul');
    ul.className = 'quote-block';
    ref.quotes.forEach(function (q) {
      const li = document.createElement('li');
      li.textContent = q.text;
      if (q.source) {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'quote-source';
        sourceSpan.textContent = t.quoteSourcePrefix(q.source);
        li.appendChild(sourceSpan);
      }
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.className = 'card-text';
    p.textContent = t.noneParen;
    card.appendChild(p);
  }

  addLabeledText(card, t.personalNoteLabel, ref.note || t.noneParen);

  return card;
}

function addLabeledText(container, labelText, text) {
  const label = document.createElement('p');
  label.className = 'card-label';
  label.textContent = labelText;
  const p = document.createElement('p');
  p.className = 'card-text';
  p.textContent = text;
  container.appendChild(label);
  container.appendChild(p);
}

// ===========================
// Copy for draft
// ===========================

function buildDraftText(paper, refs) {
  const lines = [t.draftPaperLabel(paper.title), ''];

  refs.forEach(function (ref) {
    lines.push(ref.title + ' — ' + (ref.authors || t.draftUnknownAuthor));
    if (ref.url) lines.push(t.draftUrlLabel(ref.url));
    lines.push(t.draftSummaryLabel);
    lines.push(ref.summary || t.noSummaryParen);
    lines.push('');
    lines.push(t.draftQuotesLabel);
    if (ref.quotes && ref.quotes.length) {
      ref.quotes.forEach(function (q) {
        lines.push(t.draftQuoteLine(q.text, q.source));
      });
    } else {
      lines.push(t.noneParen);
    }
    lines.push('');
    lines.push(t.draftPersonalNoteLabel);
    lines.push(ref.note || t.noneParen);
    lines.push('');
    lines.push(t.draftSeparator);
    lines.push('');
  });

  return lines.join('\n');
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

function handleCopyDraft() {
  const status = document.getElementById('copyStatus');
  const papers = sortedPapers();
  const paper = papers.find(function (p) { return p.id === selectedPaperId; });

  if (!paper) {
    status.classList.add('error');
    status.textContent = t.selectPaperFirst;
    return;
  }

  const refs = getRefsForPaper(paper.id);
  if (refs.length === 0) {
    status.classList.add('error');
    status.textContent = t.noRefsLinkedShort;
    return;
  }

  const text = buildDraftText(paper, refs);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      status.classList.remove('error');
      status.textContent = t.copiedToClipboard;
    }, function () {
      const ok = fallbackCopy(text);
      status.classList.toggle('error', !ok);
      status.textContent = ok ? t.copiedToClipboard : t.failedToCopy;
    });
  } else {
    const ok = fallbackCopy(text);
    status.classList.toggle('error', !ok);
    status.textContent = ok ? t.copiedToClipboard : t.failedToCopy;
  }
}

// ===========================
// Export / Import
// ===========================

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function handleExport() {
  const data = {
    papers: getPapers(),
    references: getReferences()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reference-report-organizer-export-' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const status = document.getElementById('dataStatus');
  status.classList.remove('error');
  status.textContent = t.exportComplete;
}

function mergePapers(existing, imported) {
  const map = new Map(existing.map(function (p) { return [p.id, p]; }));
  let nextOrder = existing.length;
  imported.forEach(function (p) {
    if (p && (typeof p.id === 'string' || typeof p.id === 'number') && typeof p.title === 'string') {
      map.set(p.id, {
        id: p.id,
        title: p.title,
        order: typeof p.order === 'number' ? p.order : nextOrder++
      });
    }
  });
  return Array.from(map.values());
}

function mergeReferences(existing, imported, validPaperIds) {
  const map = new Map(existing.map(function (r) { return [r.id, r]; }));
  imported.forEach(function (r) {
    if (r && (typeof r.id === 'string' || typeof r.id === 'number') && typeof r.title === 'string') {
      const quotes = Array.isArray(r.quotes)
        ? r.quotes
            .filter(function (q) { return q && typeof q.text === 'string'; })
            .map(function (q) {
              return {
                id: (typeof q.id === 'string' || typeof q.id === 'number') ? q.id : genId(),
                text: q.text,
                source: typeof q.source === 'string' ? q.source : ''
              };
            })
        : [];
      const paperIds = Array.isArray(r.paperIds)
        ? r.paperIds.filter(function (pid) { return validPaperIds.has(pid); })
        : [];

      map.set(r.id, {
        id: r.id,
        title: r.title,
        authors: typeof r.authors === 'string' ? r.authors : '',
        url: typeof r.url === 'string' ? r.url : '',
        summary: typeof r.summary === 'string' ? r.summary : '',
        note: typeof r.note === 'string' ? r.note : '',
        quotes: quotes,
        paperIds: paperIds,
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now()
      });
    }
  });
  return Array.from(map.values());
}

function handleImportFile(e) {
  const file = e.target.files[0];
  const status = document.getElementById('dataStatus');
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch {
      status.classList.add('error');
      status.textContent = t.failedToReadJson;
      e.target.value = '';
      return;
    }

    if (!data || !Array.isArray(data.papers) || !Array.isArray(data.references)) {
      status.classList.add('error');
      status.textContent = t.failedToReadJson;
      e.target.value = '';
      return;
    }

    const mergedPapers = mergePapers(getPapers(), data.papers);
    const validPaperIds = new Set(mergedPapers.map(function (p) { return p.id; }));
    const mergedRefs = mergeReferences(getReferences(), data.references, validPaperIds).map(function (r) {
      return Object.assign({}, r, {
        paperIds: r.paperIds.filter(function (pid) { return validPaperIds.has(pid); })
      });
    });

    savePapers(mergedPapers);
    saveReferences(mergedRefs);

    renderRefList();
    renderPaperList();
    if (!document.getElementById('refForm').hidden) closeRefForm();

    status.classList.remove('error');
    status.textContent = t.importComplete;
    e.target.value = '';
  };
  reader.readAsText(file);
}
