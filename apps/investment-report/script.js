// Investment Report — one research report per company: fixed basics on top,
// dated notes added underneath as the user learns more.

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

// 表示言語はプラットフォームの設定を借りる(端末ごとの設定なので同期しない)
const LANG_KEY = 'cobbleworks:lang:v1';

const STATUSES = ['watching', 'candidate', 'holding', 'passed'];
const TAGS = ['strength', 'risk', 'event', 'idea'];

// -----------------------
// Localization
// -----------------------

const STRINGS = {
  en: {
    locale: 'en-US',
    title: 'Investment Report',
    subtitle:
      'Keep one research report per company — fill in the basics once, then add dated notes as you learn more, so your view of each company builds up in one place.',
    disclaimer: 'This tool helps you organize your own research notes. It does not provide financial advice.',
    guideSummary: 'How to use',
    guideStep1: 'Add a company and fill in the basics — what it does, key numbers, and why you are watching it.',
    guideStepOpen: 'In the list, click a company name to open its report. Click it again to fold it away.',
    guideStep2: 'Whenever you read or notice something, add a short note to that company.',
    guideStep3: 'Tag each note as Strength, Risk, Event or Idea, so you can see at a glance which way the evidence is leaning.',
    guideStep4: 'Click the status badge to move a company through Watching → Candidate → Holding → Passed.',
    guideStep5: 'Use "Copy report" to paste a whole report as plain text into a document or an email.',
    guidePrivacy:
      'Your reports are private to you. They are saved in this browser, and synced to your other devices while you are signed in to CobbleWorks.',
    newReportBtn: '+ New report',
    newReportHeading: 'New Report',
    editReportHeading: 'Edit Report',
    nameLabel: 'Company name',
    nameHelp: 'What is the company called?',
    namePlaceholder: 'e.g. Kurita Water Industries',
    nameRequired: 'Please enter a company name.',
    tickerLabel: 'Ticker / Code',
    tickerPlaceholder: 'e.g. 6370 or XYL',
    marketLabel: 'Market',
    marketPlaceholder: 'e.g. TSE Prime, NYSE',
    industryLabel: 'Industry',
    industryPlaceholder: 'e.g. Water treatment',
    asOfLabel: 'Info as of',
    urlLabel: 'Website',
    urlHelp: 'Investor relations page or company site (http:// or https:// only).',
    urlPlaceholder: 'https://example.com/investors',
    urlInvalid: 'Please enter a web address starting with http:// or https://',
    businessLabel: 'What it does',
    businessHelp: 'The business in two or three lines.',
    businessPlaceholder: 'Main products, customers, and where the revenue comes from',
    numbersLabel: 'Key numbers',
    numbersHelp: 'Market cap, revenue, profit, growth — whatever you want to remember.',
    numbersPlaceholder: 'Market cap: ... / Revenue: ... / Operating profit: ...',
    thesisLabel: "Why I'm watching",
    thesisHelp: 'Your reason for looking at this company at all. Rewrite it as your view changes.',
    thesisPlaceholder: 'What would have to be true for this to work out?',
    createBtn: 'Create report',
    saveBtn: 'Save changes',
    cancelBtn: 'Cancel',
    yourReportsHeading: 'Your Reports',
    searchLabel: 'Search your reports',
    searchPlaceholder: 'Search by company, ticker or industry',
    filterLabel: 'Filter by status',
    filterAll: 'All',
    statusWatching: 'Watching',
    statusCandidate: 'Candidate',
    statusHolding: 'Holding',
    statusPassed: 'Passed',
    statusAria: function (name) { return 'Change status of ' + name; },
    reportCount: function (n) { return n === 1 ? '1 company' : n + ' companies'; },
    emptyNoReports: 'No reports yet. Add the first company you want to look into.',
    emptyNoMatch: 'No reports match your search or filter.',
    editBtn: 'Edit',
    copyBtn: 'Copy report',
    deleteAria: function (name) { return 'Delete the report for ' + name; },
    confirmDelete: function (name) { return 'Delete the report for "' + name + '" and all its notes? This cannot be undone.'; },
    infoBusiness: 'What it does',
    infoNumbers: 'Key numbers',
    infoThesis: "Why I'm watching",
    asOf: function (date) { return 'Basics as of ' + date; },
    noBasics: 'No basics filled in yet. Use Edit to add what the company does and your key numbers.',
    notesTitle: 'Notes',
    notesCount: function (n) { return n === 1 ? '1 note' : n + ' notes'; },
    noNotes: 'No notes yet. Add what you noticed today.',
    addNotePlaceholder: 'What did you notice?',
    addNoteAria: function (name) { return 'Add a note to ' + name; },
    tagSelectAria: function (name) { return 'Tag for the new note on ' + name; },
    addNoteBtn: 'Add',
    tagStrength: 'Strength',
    tagRisk: 'Risk',
    tagEvent: 'Event',
    tagIdea: 'Idea',
    earlierNotes: function (n) { return 'Earlier notes (' + n + ')'; },
    deleteNoteAria: 'Delete this note',
    confirmDeleteNote: 'Delete this note? This cannot be undone.',
    copied: 'Report copied as text',
    copyFailed: 'Could not copy. Please select the text manually.',
    backupHeading: 'Backup',
    backupNote:
      'Export your reports as a file to keep a copy of your own, or to move them into another browser. Importing the same file twice will not create duplicates.',
    exportBtn: '⬇ Export backup',
    importBtn: '⬆ Import backup',
    importInvalidJson: 'Import failed: not a valid JSON file',
    importBadFormat: 'Import failed: unexpected file format',
    importedCount: function (n) { return n === 1 ? 'Imported 1 report' : 'Imported ' + n + ' reports'; },
    saveFailed: 'Could not save your change. Please try again.',
    statusLine: 'Status'
  },

  ja: {
    locale: 'ja-JP',
    title: 'Investment Report',
    subtitle:
      '1社につき1つのレポート。最初に基本情報を書き、そのあとは気づいたことを日付つきで足していくと、その会社への見方が1か所に積み上がります。',
    disclaimer: 'これは自分用のメモを整理する道具です。投資助言ではありません。',
    guideSummary: '使い方',
    guideStep1: '会社を追加し、基本情報（事業内容・主要な数字・注目している理由）を埋めます。',
    guideStepOpen: '一覧では会社名を押すと、そのレポートの中身が開きます。もう一度押すと閉じます。',
    guideStep2: '何か読んだり気づいたりしたら、その会社に短いメモを足します。',
    guideStep3: 'メモには Strength / Risk / Event / Idea のタグを付けます。どちらに材料が傾いているか一目で分かります。',
    guideStep4: 'ステータスのバッジを押すと Watching → Candidate → Holding → Passed と切り替わります。',
    guideStep5: '「Copy report」を押すと、レポート全体をテキストでコピーして資料やメールに貼れます。',
    guidePrivacy:
      'レポートはあなただけのものです。このブラウザに保存され、CobbleWorks にログインしている間は他の端末とも同期されます。',
    newReportBtn: '＋ レポートを追加',
    newReportHeading: '新しいレポート',
    editReportHeading: 'レポートを編集',
    nameLabel: '会社名',
    nameHelp: 'どの会社ですか？',
    namePlaceholder: '例：栗田工業',
    nameRequired: '会社名を入力してください。',
    tickerLabel: '証券コード / ティッカー',
    tickerPlaceholder: '例：6370、XYL',
    marketLabel: '市場',
    marketPlaceholder: '例：東証プライム、NYSE',
    industryLabel: '業種',
    industryPlaceholder: '例：水処理',
    asOfLabel: '情報の基準日',
    urlLabel: 'ウェブサイト',
    urlHelp: 'IRページや公式サイト（http:// か https:// で始まるもののみ）。',
    urlPlaceholder: 'https://example.com/investors',
    urlInvalid: 'http:// または https:// で始まるアドレスを入力してください。',
    businessLabel: '事業内容',
    businessHelp: '何をしている会社かを2〜3行で。',
    businessPlaceholder: '主な製品・顧客・売上がどこから来ているか',
    numbersLabel: '主要な数字',
    numbersHelp: '時価総額・売上・利益・成長率など、覚えておきたい数字を自由に。',
    numbersPlaceholder: '時価総額：… ／ 売上高：… ／ 営業利益：…',
    thesisLabel: '注目している理由',
    thesisHelp: 'そもそもこの会社を見ている理由。考えが変わったら書き直してください。',
    thesisPlaceholder: 'この投資がうまくいくには、何が本当である必要がある？',
    createBtn: 'レポートを作る',
    saveBtn: '変更を保存',
    cancelBtn: 'キャンセル',
    yourReportsHeading: 'レポート一覧',
    searchLabel: 'レポートを検索',
    searchPlaceholder: '会社名・コード・業種で検索',
    filterLabel: 'ステータスで絞り込む',
    filterAll: 'すべて',
    statusWatching: 'Watching',
    statusCandidate: 'Candidate',
    statusHolding: 'Holding',
    statusPassed: 'Passed',
    statusAria: function (name) { return name + ' のステータスを変更'; },
    reportCount: function (n) { return n + ' 社'; },
    emptyNoReports: 'まだレポートがありません。気になっている会社をひとつ追加してみてください。',
    emptyNoMatch: '検索・絞り込みに一致するレポートがありません。',
    editBtn: '編集',
    copyBtn: 'コピー',
    deleteAria: function (name) { return name + ' のレポートを削除'; },
    confirmDelete: function (name) { return '「' + name + '」のレポートとメモをすべて削除しますか？元に戻せません。'; },
    infoBusiness: '事業内容',
    infoNumbers: '主要な数字',
    infoThesis: '注目している理由',
    asOf: function (date) { return '基本情報の基準日：' + date; },
    noBasics: '基本情報がまだ空です。「編集」から事業内容や数字を書き足せます。',
    notesTitle: 'メモ',
    notesCount: function (n) { return n + ' 件'; },
    noNotes: 'まだメモがありません。今日気づいたことを書いてみてください。',
    addNotePlaceholder: '気づいたことは？',
    addNoteAria: function (name) { return name + ' にメモを追加'; },
    tagSelectAria: function (name) { return name + ' の新しいメモのタグ'; },
    addNoteBtn: '追加',
    tagStrength: '強み',
    tagRisk: 'リスク',
    tagEvent: '出来事',
    tagIdea: '自分の考え',
    earlierNotes: function (n) { return '以前のメモ（' + n + '件）'; },
    deleteNoteAria: 'このメモを削除',
    confirmDeleteNote: 'このメモを削除しますか？元に戻せません。',
    copied: 'レポートをテキストでコピーしました',
    copyFailed: 'コピーできませんでした。手動で選択してください。',
    backupHeading: 'バックアップ',
    backupNote:
      'レポートをファイルに書き出して手元に残したり、別のブラウザへ移したりできます。同じファイルを2回読み込んでも重複しません。',
    exportBtn: '⬇ 書き出す',
    importBtn: '⬆ 読み込む',
    importInvalidJson: '読み込み失敗：JSONファイルとして読めませんでした',
    importBadFormat: '読み込み失敗：ファイルの形式が違います',
    importedCount: function (n) { return n + ' 件のレポートを読み込みました'; },
    saveFailed: '保存できませんでした。もう一度お試しください。',
    statusLine: 'ステータス'
  },

  es: {
    locale: 'es-ES',
    title: 'Investment Report',
    subtitle:
      'Un informe por empresa: rellena los datos básicos una vez y añade notas fechadas a medida que aprendas, para que tu visión de cada empresa se acumule en un solo lugar.',
    disclaimer: 'Esta herramienta te ayuda a organizar tus propias notas. No ofrece asesoramiento financiero.',
    guideSummary: 'Cómo usarlo',
    guideStep1: 'Añade una empresa y rellena lo básico: a qué se dedica, cifras clave y por qué la sigues.',
    guideStepOpen: 'En la lista, pulsa el nombre de una empresa para abrir su informe. Pulsa otra vez para cerrarlo.',
    guideStep2: 'Cada vez que leas o notes algo, añade una nota breve a esa empresa.',
    guideStep3: 'Etiqueta cada nota como Fortaleza, Riesgo, Suceso o Idea para ver hacia dónde se inclinan las señales.',
    guideStep4: 'Pulsa la etiqueta de estado para pasar de Watching → Candidate → Holding → Passed.',
    guideStep5: 'Usa "Copiar informe" para pegar el informe completo como texto en un documento o correo.',
    guidePrivacy:
      'Tus informes son privados. Se guardan en este navegador y se sincronizan con tus otros dispositivos mientras tengas sesión iniciada en CobbleWorks.',
    newReportBtn: '+ Nuevo informe',
    newReportHeading: 'Nuevo informe',
    editReportHeading: 'Editar informe',
    nameLabel: 'Nombre de la empresa',
    nameHelp: '¿Cómo se llama la empresa?',
    namePlaceholder: 'p. ej. Kurita Water Industries',
    nameRequired: 'Introduce el nombre de la empresa.',
    tickerLabel: 'Ticker / Código',
    tickerPlaceholder: 'p. ej. 6370 o XYL',
    marketLabel: 'Mercado',
    marketPlaceholder: 'p. ej. TSE Prime, NYSE',
    industryLabel: 'Sector',
    industryPlaceholder: 'p. ej. Tratamiento de agua',
    asOfLabel: 'Datos a fecha de',
    urlLabel: 'Sitio web',
    urlHelp: 'Página de inversores o sitio oficial (solo http:// o https://).',
    urlPlaceholder: 'https://example.com/investors',
    urlInvalid: 'Introduce una dirección que empiece por http:// o https://',
    businessLabel: 'A qué se dedica',
    businessHelp: 'El negocio en dos o tres líneas.',
    businessPlaceholder: 'Productos principales, clientes y de dónde vienen los ingresos',
    numbersLabel: 'Cifras clave',
    numbersHelp: 'Capitalización, ingresos, beneficio, crecimiento: lo que quieras recordar.',
    numbersPlaceholder: 'Capitalización: ... / Ingresos: ... / Beneficio operativo: ...',
    thesisLabel: 'Por qué la sigo',
    thesisHelp: 'Tu razón para mirar esta empresa. Reescríbela cuando cambie tu visión.',
    thesisPlaceholder: '¿Qué tendría que ser cierto para que esto salga bien?',
    createBtn: 'Crear informe',
    saveBtn: 'Guardar cambios',
    cancelBtn: 'Cancelar',
    yourReportsHeading: 'Tus informes',
    searchLabel: 'Buscar en tus informes',
    searchPlaceholder: 'Buscar por empresa, ticker o sector',
    filterLabel: 'Filtrar por estado',
    filterAll: 'Todos',
    statusWatching: 'Watching',
    statusCandidate: 'Candidate',
    statusHolding: 'Holding',
    statusPassed: 'Passed',
    statusAria: function (name) { return 'Cambiar el estado de ' + name; },
    reportCount: function (n) { return n === 1 ? '1 empresa' : n + ' empresas'; },
    emptyNoReports: 'Aún no hay informes. Añade la primera empresa que quieras estudiar.',
    emptyNoMatch: 'Ningún informe coincide con tu búsqueda o filtro.',
    editBtn: 'Editar',
    copyBtn: 'Copiar informe',
    deleteAria: function (name) { return 'Eliminar el informe de ' + name; },
    confirmDelete: function (name) { return '¿Eliminar el informe de "' + name + '" y todas sus notas? No se puede deshacer.'; },
    infoBusiness: 'A qué se dedica',
    infoNumbers: 'Cifras clave',
    infoThesis: 'Por qué la sigo',
    asOf: function (date) { return 'Datos a fecha de ' + date; },
    noBasics: 'Todavía no hay datos básicos. Usa Editar para añadir a qué se dedica y tus cifras.',
    notesTitle: 'Notas',
    notesCount: function (n) { return n === 1 ? '1 nota' : n + ' notas'; },
    noNotes: 'Aún no hay notas. Añade lo que hayas observado hoy.',
    addNotePlaceholder: '¿Qué has observado?',
    addNoteAria: function (name) { return 'Añadir una nota a ' + name; },
    tagSelectAria: function (name) { return 'Etiqueta para la nueva nota de ' + name; },
    addNoteBtn: 'Añadir',
    tagStrength: 'Fortaleza',
    tagRisk: 'Riesgo',
    tagEvent: 'Suceso',
    tagIdea: 'Idea',
    earlierNotes: function (n) { return 'Notas anteriores (' + n + ')'; },
    deleteNoteAria: 'Eliminar esta nota',
    confirmDeleteNote: '¿Eliminar esta nota? No se puede deshacer.',
    copied: 'Informe copiado como texto',
    copyFailed: 'No se pudo copiar. Selecciona el texto manualmente.',
    backupHeading: 'Copia de seguridad',
    backupNote:
      'Exporta tus informes a un archivo para guardarlos o moverlos a otro navegador. Importar el mismo archivo dos veces no crea duplicados.',
    exportBtn: '⬇ Exportar copia',
    importBtn: '⬆ Importar copia',
    importInvalidJson: 'Error al importar: no es un archivo JSON válido',
    importBadFormat: 'Error al importar: formato de archivo inesperado',
    importedCount: function (n) { return n === 1 ? 'Se importó 1 informe' : 'Se importaron ' + n + ' informes'; },
    saveFailed: 'No se pudo guardar el cambio. Inténtalo de nuevo.',
    statusLine: 'Estado'
  }
};

let lang = 'en';

function t(key) {
  const pack = STRINGS[lang] || STRINGS.en;
  const value = pack[key];
  return value === undefined ? STRINGS.en[key] : value;
}

function readLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) { saved = null; }
  return STRINGS[saved] ? saved : 'en';
}

// data-i18n / data-i18n-placeholder / data-i18n-aria-label の静的テキストを差し替える
function applyStaticStrings() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const value = t(el.dataset.i18n);
    if (typeof value === 'string') el.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const value = t(el.dataset.i18nPlaceholder);
    if (typeof value === 'string') el.placeholder = value;
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const value = t(el.dataset.i18nAriaLabel);
    if (typeof value === 'string') el.setAttribute('aria-label', value);
  });
}

// -----------------------
// Data helpers
// -----------------------

function getReports() {
  if (!store) return [];
  const reports = store.get();
  return Array.isArray(reports) ? reports : [];
}

function saveReports(reports) {
  if (!store) return;
  store.set(reports).catch(function (e) {
    console.error('Investment Report: 保存に失敗しました', e);
    showToast(t('saveFailed'));
  });
}

function findReport(reports, id) {
  for (let i = 0; i < reports.length; i++) {
    if (reports[i].id === id) return reports[i];
  }
  return null;
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  const d = new Date();
  const pad = function (n) { return n < 10 ? '0' + n : String(n); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(t('locale'), { year: 'numeric', month: 'short', day: 'numeric' });
}

// http / https 以外のスキーム(javascript: など)はリンクにしない
function safeUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') return '';
  let parsed;
  try { parsed = new URL(url.trim()); } catch (e) { return ''; }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
}

// 保存されているレポートの形をそろえる(古い/壊れたデータで描画が落ちないように)
function normalizeReport(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name === '') return null;
  const notes = Array.isArray(raw.notes) ? raw.notes : [];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid('rep'),
    name: name,
    ticker: typeof raw.ticker === 'string' ? raw.ticker : '',
    market: typeof raw.market === 'string' ? raw.market : '',
    industry: typeof raw.industry === 'string' ? raw.industry : '',
    url: typeof raw.url === 'string' ? raw.url : '',
    business: typeof raw.business === 'string' ? raw.business : '',
    numbers: typeof raw.numbers === 'string' ? raw.numbers : '',
    thesis: typeof raw.thesis === 'string' ? raw.thesis : '',
    asOf: typeof raw.asOf === 'string' ? raw.asOf : '',
    status: STATUSES.indexOf(raw.status) >= 0 ? raw.status : 'watching',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    notes: notes.map(function (n) {
      if (!n || typeof n !== 'object' || typeof n.text !== 'string') return null;
      return {
        id: typeof n.id === 'string' && n.id ? n.id : uid('note'),
        text: n.text,
        tag: TAGS.indexOf(n.tag) >= 0 ? n.tag : 'event',
        createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString()
      };
    }).filter(Boolean)
  };
}

// -----------------------
// View state
// -----------------------

let searchQuery = '';
let statusFilter = 'all';
let editingId = null;
let toastTimer = null;

// 会社名を押して開いているレポートの id(画面上の状態なので保存はしない)
const openReports = {};

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
}

function matchesFilters(report) {
  if (statusFilter !== 'all' && report.status !== statusFilter) return false;
  const q = searchQuery.trim().toLowerCase();
  if (q === '') return true;
  return (
    report.name.toLowerCase().indexOf(q) >= 0 ||
    report.ticker.toLowerCase().indexOf(q) >= 0 ||
    report.industry.toLowerCase().indexOf(q) >= 0
  );
}

// 新しく更新されたものを上に。最終更新が同じならあとから作ったものを上に。
function sortReports(reports) {
  return reports.slice().sort(function (a, b) {
    if (a.updatedAt === b.updatedAt) return a.createdAt < b.createdAt ? 1 : -1;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

// -----------------------
// Rendering
// -----------------------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function buildInfoBlock(labelKey, text) {
  const block = el('div', 'info-block');
  block.appendChild(el('span', 'info-label', t(labelKey)));
  block.appendChild(el('p', 'info-text', text));
  return block;
}

function buildNoteItem(report, note) {
  const item = el('li', 'note-item');

  const head = el('div', 'note-head');
  head.appendChild(el('span', 'chip tag-' + note.tag, t('tag' + note.tag.charAt(0).toUpperCase() + note.tag.slice(1))));
  head.appendChild(el('span', 'note-date', formatDate(note.createdAt)));

  const del = el('button', 'icon-btn', '×');
  del.type = 'button';
  del.setAttribute('aria-label', t('deleteNoteAria'));
  del.addEventListener('click', function () { deleteNote(report.id, note.id); });
  head.appendChild(del);

  item.appendChild(head);
  item.appendChild(el('p', 'note-text', note.text));
  return item;
}

function buildNotesSection(report) {
  const section = el('div', 'notes-section');

  const head = el('div', 'notes-head');
  head.appendChild(el('h4', 'notes-title', t('notesTitle')));
  head.appendChild(el('span', 'notes-count', t('notesCount')(report.notes.length)));
  section.appendChild(head);

  // メモの追加フォーム
  const form = el('form', 'note-form');
  form.noValidate = true;

  const input = el('textarea', 'map-input note-input');
  input.rows = 2;
  input.maxLength = 600;
  input.placeholder = t('addNotePlaceholder');
  input.setAttribute('aria-label', t('addNoteAria')(report.name));

  const select = el('select', 'map-input note-tag-select');
  select.setAttribute('aria-label', t('tagSelectAria')(report.name));
  TAGS.forEach(function (tag) {
    const option = el('option', null, t('tag' + tag.charAt(0).toUpperCase() + tag.slice(1)));
    option.value = tag;
    select.appendChild(option);
  });

  const addBtn = el('button', 'btn-primary note-add-btn', t('addNoteBtn'));
  addBtn.type = 'submit';

  form.appendChild(input);
  form.appendChild(select);
  form.appendChild(addBtn);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (text === '') { input.focus(); return; }
    addNote(report.id, text, select.value);
  });
  section.appendChild(form);

  if (report.notes.length === 0) {
    section.appendChild(el('p', 'no-notes', t('noNotes')));
    return section;
  }

  // 新しい順。最新1件だけ開いて見せ、それ以前は折りたたむ
  const sorted = report.notes.slice().sort(function (a, b) {
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  const latestList = el('ul', 'note-list');
  latestList.appendChild(buildNoteItem(report, sorted[0]));
  section.appendChild(latestList);

  if (sorted.length > 1) {
    const details = el('details', 'earlier-notes');
    details.appendChild(el('summary', null, t('earlierNotes')(sorted.length - 1)));
    const olderList = el('ul', 'note-list');
    sorted.slice(1).forEach(function (note) {
      olderList.appendChild(buildNoteItem(report, note));
    });
    details.appendChild(olderList);
    section.appendChild(details);
  }

  return section;
}

function buildCard(report) {
  const item = el('li', 'report-item');
  const card = el('div', 'map-card report-card');

  // --- 見出し行 ---
  const top = el('div', 'report-top');
  const heading = el('div', 'report-heading');

  // 会社名そのものが開閉ボタン。押すとレポートの中身が開く
  const nameHeading = el('h3', 'company-name');
  const nameBtn = el('button', 'company-name-btn', report.name);
  nameBtn.type = 'button';
  nameHeading.appendChild(nameBtn);
  heading.appendChild(nameHeading);

  if (report.ticker) heading.appendChild(el('span', 'chip chip-ticker', report.ticker));

  const statusBtn = el('button', 'status-btn status-' + report.status, t('status' + report.status.charAt(0).toUpperCase() + report.status.slice(1)));
  statusBtn.type = 'button';
  statusBtn.setAttribute('aria-label', t('statusAria')(report.name));
  statusBtn.addEventListener('click', function () { cycleStatus(report.id); });
  heading.appendChild(statusBtn);
  top.appendChild(heading);

  const actions = el('div', 'report-actions');

  const editBtn = el('button', 'text-btn', t('editBtn'));
  editBtn.type = 'button';
  editBtn.addEventListener('click', function () { startEdit(report.id); });
  actions.appendChild(editBtn);

  const copyBtn = el('button', 'text-btn', t('copyBtn'));
  copyBtn.type = 'button';
  copyBtn.addEventListener('click', function () { copyReport(report.id); });
  actions.appendChild(copyBtn);

  const delBtn = el('button', 'icon-btn', '🗑');
  delBtn.type = 'button';
  delBtn.setAttribute('aria-label', t('deleteAria')(report.name));
  delBtn.addEventListener('click', function () { deleteReport(report.id); });
  actions.appendChild(delBtn);

  top.appendChild(actions);
  card.appendChild(top);

  // --- ここから下が開閉する中身 ---
  const body = el('div', 'report-body');

  // --- 市場・業種・サイト ---
  const metaParts = [];
  if (report.market) metaParts.push(report.market);
  if (report.industry) metaParts.push(report.industry);
  const link = safeUrl(report.url);
  if (metaParts.length > 0 || link) {
    const meta = el('p', 'report-meta', metaParts.join(' · '));
    if (link) {
      if (metaParts.length > 0) meta.appendChild(document.createTextNode(' · '));
      const a = el('a', null, new URL(link).hostname);
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      meta.appendChild(a);
    }
    body.appendChild(meta);
  }

  // --- 基本情報 ---
  let hasBasics = false;
  if (report.business) { body.appendChild(buildInfoBlock('infoBusiness', report.business)); hasBasics = true; }
  if (report.numbers) { body.appendChild(buildInfoBlock('infoNumbers', report.numbers)); hasBasics = true; }
  if (report.thesis) { body.appendChild(buildInfoBlock('infoThesis', report.thesis)); hasBasics = true; }
  if (!hasBasics) body.appendChild(el('p', 'no-basics', t('noBasics')));
  if (report.asOf) body.appendChild(el('p', 'asof', t('asOf')(formatDate(report.asOf))));

  // --- メモ ---
  body.appendChild(buildNotesSection(report));

  card.appendChild(body);

  // 開閉。再描画せずに切り替えるので、書きかけのメモが消えない
  function setOpen(open) {
    if (open) openReports[report.id] = true; else delete openReports[report.id];
    body.hidden = !open;
    card.classList.toggle('is-open', open);
    nameBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  setOpen(openReports[report.id] === true);
  nameBtn.addEventListener('click', function () { setOpen(!openReports[report.id]); });

  item.appendChild(card);
  return item;
}

function renderFilters() {
  const row = document.getElementById('status-filter');
  row.textContent = '';
  const options = [{ key: 'all', label: t('filterAll') }].concat(
    STATUSES.map(function (s) {
      return { key: s, label: t('status' + s.charAt(0).toUpperCase() + s.slice(1)) };
    })
  );
  options.forEach(function (option) {
    const chip = el('button', 'filter-chip', option.label);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', statusFilter === option.key ? 'true' : 'false');
    chip.addEventListener('click', function () {
      statusFilter = option.key;
      renderAll();
    });
    row.appendChild(chip);
  });
}

// 保存のあとは必ずここを呼ぶ(subscribe は他端末ぶんしか流れてこない)
function renderAll() {
  const reports = getReports().map(normalizeReport).filter(Boolean);
  const visible = sortReports(reports.filter(matchesFilters));

  renderFilters();

  document.getElementById('report-count').textContent =
    reports.length > 0 ? t('reportCount')(reports.length) : '';

  const list = document.getElementById('report-list');
  list.textContent = '';
  visible.forEach(function (report) { list.appendChild(buildCard(report)); });

  const empty = document.getElementById('empty-state');
  if (visible.length === 0) {
    empty.hidden = false;
    empty.querySelector('p').textContent =
      reports.length === 0 ? t('emptyNoReports') : t('emptyNoMatch');
  } else {
    empty.hidden = true;
  }
}

// -----------------------
// Actions
// -----------------------

function cycleStatus(id) {
  const reports = getReports().map(normalizeReport).filter(Boolean);
  const report = findReport(reports, id);
  if (!report) return;
  report.status = STATUSES[(STATUSES.indexOf(report.status) + 1) % STATUSES.length];
  report.updatedAt = new Date().toISOString();
  saveReports(reports);
  renderAll();
}

function addNote(reportId, text, tag) {
  const reports = getReports().map(normalizeReport).filter(Boolean);
  const report = findReport(reports, reportId);
  if (!report) return;
  report.notes.push({
    id: uid('note'),
    text: text,
    tag: TAGS.indexOf(tag) >= 0 ? tag : 'event',
    createdAt: new Date().toISOString()
  });
  report.updatedAt = new Date().toISOString();
  saveReports(reports);
  renderAll();
}

function deleteNote(reportId, noteId) {
  if (!window.confirm(t('confirmDeleteNote'))) return;
  const reports = getReports().map(normalizeReport).filter(Boolean);
  const report = findReport(reports, reportId);
  if (!report) return;
  report.notes = report.notes.filter(function (n) { return n.id !== noteId; });
  report.updatedAt = new Date().toISOString();
  saveReports(reports);
  renderAll();
}

function deleteReport(id) {
  const reports = getReports().map(normalizeReport).filter(Boolean);
  const report = findReport(reports, id);
  if (!report) return;
  if (!window.confirm(t('confirmDelete')(report.name))) return;
  saveReports(reports.filter(function (r) { return r.id !== id; }));
  if (editingId === id) closeForm();
  renderAll();
}

function buildReportText(report) {
  const lines = [];
  const headParts = [];
  if (report.ticker) headParts.push(report.ticker);
  if (report.market) headParts.push(report.market);
  lines.push(report.name + (headParts.length ? ' (' + headParts.join(' · ') + ')' : ''));
  if (report.industry) lines.push(t('industryLabel') + ': ' + report.industry);
  const link = safeUrl(report.url);
  if (link) lines.push(t('urlLabel') + ': ' + link);
  lines.push(t('statusLine') + ': ' + t('status' + report.status.charAt(0).toUpperCase() + report.status.slice(1)));
  if (report.asOf) lines.push(t('asOf')(formatDate(report.asOf)));

  [['infoBusiness', report.business], ['infoNumbers', report.numbers], ['infoThesis', report.thesis]].forEach(function (pair) {
    if (!pair[1]) return;
    lines.push('', '[' + t(pair[0]) + ']', pair[1]);
  });

  if (report.notes.length > 0) {
    lines.push('', '[' + t('notesTitle') + '] ' + t('notesCount')(report.notes.length));
    report.notes.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })
      .forEach(function (note) {
        lines.push(
          formatDate(note.createdAt) + ' [' + t('tag' + note.tag.charAt(0).toUpperCase() + note.tag.slice(1)) + '] ' + note.text
        );
      });
  }
  return lines.join('\n');
}

function copyReport(id) {
  const report = findReport(getReports().map(normalizeReport).filter(Boolean), id);
  if (!report) return;
  const text = buildReportText(report);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      function () { showToast(t('copied')); },
      function () { fallbackCopy(text); }
    );
    return;
  }
  fallbackCopy(text);
}

// clipboard API が使えない(古いブラウザ / http)ときの保険
function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(area);
  showToast(ok ? t('copied') : t('copyFailed'));
}

// -----------------------
// Form (create / edit)
// -----------------------

const FIELD_IDS = {
  name: 'name-input',
  ticker: 'ticker-input',
  market: 'market-input',
  industry: 'industry-input',
  asOf: 'asof-input',
  url: 'url-input',
  business: 'business-input',
  numbers: 'numbers-input',
  thesis: 'thesis-input'
};

function fieldValue(key) {
  return document.getElementById(FIELD_IDS[key]).value.trim();
}

function fillForm(report) {
  Object.keys(FIELD_IDS).forEach(function (key) {
    document.getElementById(FIELD_IDS[key]).value = report ? (report[key] || '') : '';
  });
  if (!report) document.getElementById(FIELD_IDS.asOf).value = todayISO();
}

function setFormErrors(nameError, urlError) {
  document.getElementById('name-error').hidden = !nameError;
  document.getElementById('url-error').hidden = !urlError;
}

function openForm() {
  document.getElementById('report-form').hidden = false;
  document.getElementById('show-form-btn').hidden = true;
  document.getElementById(FIELD_IDS.name).focus();
}

function closeForm() {
  editingId = null;
  fillForm(null);
  setFormErrors(false, false);
  document.getElementById('report-form').hidden = true;
  document.getElementById('show-form-btn').hidden = false;
  document.getElementById('form-title').textContent = t('newReportHeading');
  document.getElementById('save-btn').textContent = t('createBtn');
}

function startEdit(id) {
  const report = findReport(getReports().map(normalizeReport).filter(Boolean), id);
  if (!report) return;
  editingId = id;
  fillForm(report);
  setFormErrors(false, false);
  document.getElementById('form-title').textContent = t('editReportHeading');
  document.getElementById('save-btn').textContent = t('saveBtn');
  openForm();
  document.getElementById('report-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function submitForm(event) {
  event.preventDefault();
  const name = fieldValue('name');
  const rawUrl = fieldValue('url');
  const urlOk = rawUrl === '' || safeUrl(rawUrl) !== '';
  setFormErrors(name === '', !urlOk);
  if (name === '') { document.getElementById(FIELD_IDS.name).focus(); return; }
  if (!urlOk) { document.getElementById(FIELD_IDS.url).focus(); return; }

  const reports = getReports().map(normalizeReport).filter(Boolean);
  const now = new Date().toISOString();
  const values = {};
  Object.keys(FIELD_IDS).forEach(function (key) { values[key] = fieldValue(key); });

  if (editingId) {
    const report = findReport(reports, editingId);
    if (report) {
      Object.keys(values).forEach(function (key) { report[key] = values[key]; });
      report.updatedAt = now;
    }
    openReports[editingId] = true;
  } else {
    const created = normalizeReport(
      Object.assign({}, values, {
        id: uid('rep'),
        status: 'watching',
        createdAt: now,
        updatedAt: now,
        notes: []
      })
    );
    reports.push(created);
    // 登録した直後は中身が見えている状態にする
    if (created) openReports[created.id] = true;
  }

  saveReports(reports);
  closeForm();
  renderAll();
}

// -----------------------
// Backup
// -----------------------

function exportBackup() {
  const payload = {
    app: 'investment-report',
    version: 1,
    exportedAt: new Date().toISOString(),
    reports: getReports().map(normalizeReport).filter(Boolean)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'investment-report-backup-' + todayISO() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = function () {
    let parsed;
    try { parsed = JSON.parse(String(reader.result)); } catch (e) {
      showToast(t('importInvalidJson'));
      return;
    }
    const incoming = parsed && Array.isArray(parsed.reports) ? parsed.reports : null;
    if (!incoming) { showToast(t('importBadFormat')); return; }

    const reports = getReports().map(normalizeReport).filter(Boolean);
    const seen = {};
    reports.forEach(function (r) { seen[r.id] = true; });

    let added = 0;
    incoming.forEach(function (raw) {
      const report = normalizeReport(raw);
      if (!report || seen[report.id]) return;
      seen[report.id] = true;
      reports.push(report);
      added++;
    });

    saveReports(reports);
    renderAll();
    showToast(t('importedCount')(added));
  };
  reader.readAsText(file);
}

// -----------------------
// Start-up
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  lang = readLang();
  applyStaticStrings();

  // データ層を先に用意する(読み込み途中の画面で操作させないため)
  store = await openStore('investment-report', 'reports', { default: [] });

  document.getElementById('show-form-btn').addEventListener('click', openForm);
  document.getElementById('cancel-btn').addEventListener('click', closeForm);
  document.getElementById('report-form').addEventListener('submit', submitForm);

  document.getElementById('search-input').addEventListener('input', function (event) {
    searchQuery = event.target.value;
    renderAll();
  });

  document.getElementById('export-btn').addEventListener('click', exportBackup);
  document.getElementById('import-btn').addEventListener('click', function () {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', function (event) {
    const file = event.target.files && event.target.files[0];
    if (file) importBackup(file);
    event.target.value = '';
  });

  fillForm(null);

  store.subscribe(function () { renderAll(); });
  renderAll();
});
