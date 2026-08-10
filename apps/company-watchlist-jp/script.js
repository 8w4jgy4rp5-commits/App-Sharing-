// ===========================
// Company Watchlist (Japan) - Script
// ===========================

// Key used to read/write data in localStorage
const STORAGE_KEY = 'company-watchlist-jp:companies:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: '🇯🇵 Company Watchlist — Japan',
    subtitle: "Track companies you're interested in.",
    disclaimer: 'This tool helps you organize notes. It does not provide financial advice.',
    usageGuideSummary: 'How to use',
    usageGuideStep1: "Add a company you're interested in using the form below.",
    usageGuideStep2: 'Add its 4-digit securities code (optional) to get a "Check price" link.',
    usageGuideStep3: 'Click the status badge on a card to cycle Watching → Top Choice → Follow Up.',
    usageGuideStep4: 'Click the code badge or the notes text on a card to edit them inline.',
    usageGuideStep5: 'Use the industry search box and filter buttons to narrow down the list.',
    usageGuideStep6: 'Use Export/Import backup to move your data to another browser or device.',
    addCompanyHeading: 'Add a Company',
    companyNameLabel: 'Company name',
    companyNameHelp: 'What is the company called?',
    companyNamePlaceholder: 'e.g. Toyota Motor',
    industryLabel: 'Industry',
    industryHelp: 'What sector is this company in?',
    industryPlaceholder: 'e.g. SaaS, Finance, Healthcare',
    urlLabel: 'Website URL',
    urlHelp: "Link to the company's website (optional)",
    tickerLabel: 'Securities code',
    tickerHelp: '4-digit Japan securities code, if the company is listed (optional) — e.g. 7203, 9984',
    tickerPlaceholder: 'e.g. 7203',
    notesLabel: 'Notes',
    notesHelp: 'Anything you want to remember about this company? (optional)',
    notesPlaceholder: 'e.g. Great culture, apply before March, referral from Taro',
    statusLabel: 'Status',
    statusHelp: 'How interested are you right now?',
    statusWatching: 'Watching',
    statusTopChoice: 'Top Choice',
    statusFollowUp: 'Follow Up',
    addToWatchlistBtn: 'Add to Watchlist',
    industrySearchPlaceholder: 'Search by industry...',
    industrySearchAria: 'Search by industry',
    filterAll: 'All',
    watchlistHeading: 'Watchlist',
    backupHeading: 'Backup',
    backupNote: "This list is stored only in this browser. If you're moving from a local copy to a hosted one (or vice versa), export your data here and import it on the other one — they don't share data automatically.",
    exportBackup: '⬇ Export backup',
    importBackup: '⬆ Import backup',
    tickerEditTitle: 'Click to edit securities code',
    statusChangeTitle: 'Click to change status',
    addTickerHint: '+ Add securities code',
    addNoteHint: '+ Click to add a note',
    noteEditorPlaceholder: 'Write a note...',
    checkPriceBtn: 'Check price →',
    removeBtn: 'Remove',
    removeConfirm: function (name) { return 'Remove "' + name + '" from your watchlist?'; },
    addedOn: function (date) { return 'Added on ' + date; },
    importInvalidJson: 'Import failed: not a valid JSON file',
    importBadFormat: 'Import failed: unexpected file format',
    importedCount: function (n) { return 'Imported ' + n + ' compan' + (n === 1 ? 'y' : 'ies'); },
    emptyNoCompanies: 'No companies yet. Add one above!',
    emptyNoMatch: 'No companies match your current filters.',
  },
  ja: {
    title: '🇯🇵 企業ウォッチリスト — 日本',
    subtitle: '気になる企業を記録しましょう。',
    disclaimer: 'このツールはメモの整理を助けるものであり、投資助言ではありません。',
    usageGuideSummary: '使い方',
    usageGuideStep1: '下のフォームから、気になる企業を追加しましょう。',
    usageGuideStep2: '4桁の証券コード（任意）を入力すると「株価を確認」リンクが表示されます。',
    usageGuideStep3: 'カードのステータスバッジをクリックすると、観察中→第一候補→要フォローの順に切り替わります。',
    usageGuideStep4: 'カードの証券コードやメモ部分をクリックすると、その場で編集できます。',
    usageGuideStep5: '業界の検索欄やフィルターボタンで一覧を絞り込めます。',
    usageGuideStep6: 'バックアップの書き出し/読み込みで、別のブラウザや端末にデータを移せます。',
    addCompanyHeading: '企業を追加',
    companyNameLabel: '会社名',
    companyNameHelp: '会社の名前は何ですか？',
    companyNamePlaceholder: '例: トヨタ自動車',
    industryLabel: '業界',
    industryHelp: 'この会社はどの分野ですか？',
    industryPlaceholder: '例: SaaS、金融、ヘルスケア',
    urlLabel: 'ウェブサイトURL',
    urlHelp: '会社のウェブサイトへのリンク（任意）',
    tickerLabel: '証券コード',
    tickerHelp: '上場している場合の4桁の証券コード（任意）— 例: 7203、9984',
    tickerPlaceholder: '例: 7203',
    notesLabel: 'メモ',
    notesHelp: 'この会社について覚えておきたいことはありますか？（任意）',
    notesPlaceholder: '例: 社風が良い、3月までに応募、タロウさんの紹介',
    statusLabel: 'ステータス',
    statusHelp: '今どのくらい興味がありますか？',
    statusWatching: '観察中',
    statusTopChoice: '第一候補',
    statusFollowUp: '要フォロー',
    addToWatchlistBtn: 'ウォッチリストに追加',
    industrySearchPlaceholder: '業界で検索...',
    industrySearchAria: '業界で検索',
    filterAll: 'すべて',
    watchlistHeading: 'ウォッチリスト',
    backupHeading: 'バックアップ',
    backupNote: 'このリストはこのブラウザにのみ保存されています。ローカル版とホスト版の間で移行する場合は、ここでデータを書き出し、もう一方で読み込んでください — データは自動的には共有されません。',
    exportBackup: '⬇ バックアップを書き出す',
    importBackup: '⬆ バックアップを読み込む',
    tickerEditTitle: 'クリックして証券コードを編集',
    statusChangeTitle: 'クリックしてステータスを変更',
    addTickerHint: '+ 証券コードを追加',
    addNoteHint: '+ クリックしてメモを追加',
    noteEditorPlaceholder: 'メモを入力...',
    checkPriceBtn: '株価を確認 →',
    removeBtn: '削除',
    removeConfirm: function (name) { return '「' + name + '」をウォッチリストから削除しますか？'; },
    addedOn: function (date) { return '追加日: ' + date; },
    importInvalidJson: 'インポート失敗: 正しいJSONファイルではありません',
    importBadFormat: 'インポート失敗: ファイル形式が想定と異なります',
    importedCount: function (n) { return n + '件の企業をインポートしました'; },
    emptyNoCompanies: '企業はまだ登録されていません。上から追加しましょう！',
    emptyNoMatch: '現在の絞り込み条件に一致する企業はありません。',
  },
  es: {
    title: '🇯🇵 Lista de Seguimiento de Empresas — Japón',
    subtitle: 'Lleva un registro de las empresas que te interesan.',
    disclaimer: 'Esta herramienta te ayuda a organizar notas. No ofrece asesoramiento financiero.',
    usageGuideSummary: 'Cómo usar esta app',
    usageGuideStep1: 'Añade una empresa que te interese usando el formulario de abajo.',
    usageGuideStep2: 'Añade su código de valores de 4 dígitos (opcional) para obtener un enlace "Ver precio".',
    usageGuideStep3: 'Haz clic en la insignia de estado de una tarjeta para pasar de En seguimiento → Primera opción → Seguimiento pendiente.',
    usageGuideStep4: 'Haz clic en el código o en las notas de una tarjeta para editarlos directamente.',
    usageGuideStep5: 'Usa el buscador de industria y los filtros para acotar la lista.',
    usageGuideStep6: 'Usa exportar/importar copia de seguridad para mover tus datos a otro navegador o dispositivo.',
    addCompanyHeading: 'Añadir una empresa',
    companyNameLabel: 'Nombre de la empresa',
    companyNameHelp: '¿Cómo se llama la empresa?',
    companyNamePlaceholder: 'ej. Toyota Motor',
    industryLabel: 'Industria',
    industryHelp: '¿En qué sector opera esta empresa?',
    industryPlaceholder: 'ej. SaaS, Finanzas, Salud',
    urlLabel: 'URL del sitio web',
    urlHelp: 'Enlace al sitio web de la empresa (opcional)',
    tickerLabel: 'Código de valores',
    tickerHelp: 'Código de valores japonés de 4 dígitos, si la empresa cotiza en bolsa (opcional) — ej. 7203, 9984',
    tickerPlaceholder: 'ej. 7203',
    notesLabel: 'Notas',
    notesHelp: '¿Algo que quieras recordar sobre esta empresa? (opcional)',
    notesPlaceholder: 'ej. Buen ambiente, postular antes de marzo, referido por Taro',
    statusLabel: 'Estado',
    statusHelp: '¿Cuánto te interesa ahora mismo?',
    statusWatching: 'En seguimiento',
    statusTopChoice: 'Primera opción',
    statusFollowUp: 'Seguimiento pendiente',
    addToWatchlistBtn: 'Añadir a la lista',
    industrySearchPlaceholder: 'Buscar por industria...',
    industrySearchAria: 'Buscar por industria',
    filterAll: 'Todas',
    watchlistHeading: 'Lista de seguimiento',
    backupHeading: 'Copia de seguridad',
    backupNote: 'Esta lista se guarda solo en este navegador. Si estás pasando de una copia local a una alojada (o viceversa), exporta tus datos aquí e impórtalos en la otra — no se comparten automáticamente.',
    exportBackup: '⬇ Exportar copia',
    importBackup: '⬆ Importar copia',
    tickerEditTitle: 'Haz clic para editar el código de valores',
    statusChangeTitle: 'Haz clic para cambiar el estado',
    addTickerHint: '+ Añadir código de valores',
    addNoteHint: '+ Haz clic para añadir una nota',
    noteEditorPlaceholder: 'Escribe una nota...',
    checkPriceBtn: 'Ver precio →',
    removeBtn: 'Eliminar',
    removeConfirm: function (name) { return '¿Eliminar "' + name + '" de tu lista de seguimiento?'; },
    addedOn: function (date) { return 'Añadido el ' + date; },
    importInvalidJson: 'Error al importar: el archivo no es un JSON válido',
    importBadFormat: 'Error al importar: formato de archivo inesperado',
    importedCount: function (n) { return 'Se importaron ' + n + ' empresa' + (n === 1 ? '' : 's'); },
    emptyNoCompanies: 'Aún no hay empresas. ¡Añade una arriba!',
    emptyNoMatch: 'Ninguna empresa coincide con tus filtros actuales.',
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

// Human-readable label for each status value
const STATUS_LABELS = {
  'watching':   t.statusWatching,
  'top-choice': t.statusTopChoice,
  'follow-up':  t.statusFollowUp
};

// Clicking the badge cycles through statuses in this order
const STATUS_CYCLE = ['watching', 'top-choice', 'follow-up'];

// Tracks which filter button is currently active
let activeFilter = 'all';

// Tracks the current industry search string (lowercase for comparison)
let searchQuery = '';

// Run everything after the page has fully loaded
document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();
  renderCompanies();
  setupFilterButtons();

  document.getElementById('industrySearch').addEventListener('input', function () {
    searchQuery = this.value.trim().toLowerCase();
    renderCompanies();
  });

  document.getElementById('exportBtn').addEventListener('click', exportBackup);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function () {
    if (this.files.length > 0) {
      importBackup(this.files[0]);
      this.value = ''; // Allow selecting the same file again later
    }
  });
});

// =====================
// Form Submission
// =====================

document.getElementById('companyForm').addEventListener('submit', function (e) {
  e.preventDefault(); // Prevent the page from reloading

  const company = {
    id:        Date.now(),
    name:      document.getElementById('companyName').value.trim(),
    industry:  document.getElementById('industry').value.trim(),
    url:       document.getElementById('companyUrl').value.trim(),
    ticker:    document.getElementById('ticker').value.trim(),
    notes:     document.getElementById('notes').value.trim(),
    status:    document.getElementById('status').value,
    createdAt: new Date().toLocaleDateString('en-US')
  };

  saveCompany(company);
  renderCompanies();
  this.reset(); // Clear the form fields
});

// =====================
// localStorage Helpers
// =====================

// Returns all companies from localStorage (or an empty array if none saved)
function getCompanies() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Adds one company to the saved list
function saveCompany(company) {
  const companies = getCompanies();
  companies.push(company);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

// Removes one company by its id
function deleteCompany(id) {
  const companies = getCompanies().filter(function (c) {
    return c.id !== id;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

// Changes the status of one company and saves the updated list
function updateStatus(id, newStatus) {
  const companies = getCompanies();
  companies.forEach(function (c) {
    if (c.id === id) {
      c.status = newStatus;
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

// =====================
// Backup (export/import)
// =====================

// Downloads all companies as a JSON file
function exportBackup() {
  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    companies: getCompanies()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'company-watchlist-jp-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Reads a JSON file and merges it into the existing list
function importBackup(file) {
  const reader = new FileReader();

  reader.onload = function () {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      alert(t.importInvalidJson);
      return;
    }

    if (!data || !Array.isArray(data.companies)) {
      alert(t.importBadFormat);
      return;
    }

    // Skip companies whose id already exists, so importing twice is safe
    const companies = getCompanies();
    const existingIds = companies.map(function (c) { return c.id; });
    let added = 0;
    data.companies.forEach(function (c) {
      if (c && c.id != null && existingIds.indexOf(c.id) === -1) {
        companies.push(c);
        added++;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));

    renderCompanies();
    alert(t.importedCount(added));
  };

  reader.readAsText(file);
}

// =====================
// Filter Buttons
// =====================

function setupFilterButtons() {
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Remove .active from all buttons, then add it to the clicked one
      buttons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      activeFilter = btn.dataset.filter; // e.g. 'all', 'watching', 'top-choice'
      renderCompanies();
    });
  });
}

// =====================
// Rendering
// =====================

// Reads companies from localStorage and draws all the cards
function renderCompanies() {
  let companies = getCompanies();

  // If a status filter is active, keep only companies with that status
  if (activeFilter !== 'all') {
    companies = companies.filter(function (c) {
      return c.status === activeFilter;
    });
  }

  // If a search query is entered, keep only companies whose industry matches
  if (searchQuery) {
    companies = companies.filter(function (c) {
      return c.industry.toLowerCase().includes(searchQuery);
    });
  }

  const list = document.getElementById('companyList');
  list.innerHTML = ''; // Clear existing cards before redrawing

  // Update the count shown next to the "Watchlist" heading
  document.getElementById('listCount').textContent = '(' + companies.length + ')';

  // Show a contextual message if there are no companies to display
  if (companies.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'empty-message';
    msg.textContent = getCompanies().length === 0
      ? t.emptyNoCompanies
      : t.emptyNoMatch;
    list.appendChild(msg);
    return;
  }

  // Show newest entries first
  const sorted = [...companies].reverse();
  sorted.forEach(function (company) {
    list.appendChild(createCard(company));
  });
}

// Builds and returns one company card as an HTML element
function createCard(company) {
  const card = document.createElement('div');
  card.className = 'company-card status-' + company.status;

  // --- Header: name group (left) + status badge (right) ---
  const header = document.createElement('div');
  header.className = 'card-header';

  // Wrapper that holds the securities code badge (if any) + company name side by side
  const nameGroup = document.createElement('div');
  nameGroup.className = 'card-name-group';

  // Code badge — click to edit if one exists, or show hint to add one
  if (company.ticker) {
    const tickerBadge = document.createElement('span');
    tickerBadge.className = 'ticker-badge ticker-editable';
    tickerBadge.textContent = company.ticker;
    tickerBadge.title = t.tickerEditTitle;
    tickerBadge.addEventListener('click', function () {
      startTickerEditing(company.id, company.ticker, tickerBadge);
    });
    nameGroup.appendChild(tickerBadge);
  } else {
    const tickerHint = document.createElement('span');
    tickerHint.className = 'add-ticker-hint';
    tickerHint.textContent = t.addTickerHint;
    tickerHint.addEventListener('click', function () {
      startTickerEditing(company.id, '', tickerHint);
    });
    nameGroup.appendChild(tickerHint);
  }

  // Show name as a clickable link if a URL was provided
  if (company.url) {
    const nameLink = document.createElement('a');
    nameLink.href = company.url;
    nameLink.target = '_blank';
    nameLink.rel = 'noopener noreferrer';
    nameLink.className = 'card-name';
    nameLink.textContent = company.name + ' ↗';
    nameGroup.appendChild(nameLink);
  } else {
    const namePlain = document.createElement('span');
    namePlain.className = 'card-name-plain';
    namePlain.textContent = company.name;
    nameGroup.appendChild(namePlain);
  }

  header.appendChild(nameGroup);

  // Status badge — clicking it advances to the next status
  const badge = document.createElement('button');
  badge.className = 'status-badge status-' + company.status;
  badge.textContent = STATUS_LABELS[company.status];
  badge.title = t.statusChangeTitle;

  badge.addEventListener('click', function () {
    const currentIndex = STATUS_CYCLE.indexOf(company.status);
    const nextIndex    = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus   = STATUS_CYCLE[nextIndex];
    updateStatus(company.id, nextStatus);
    renderCompanies();
  });

  header.appendChild(badge);
  card.appendChild(header);

  // --- Industry ---
  const industryLabel = document.createElement('p');
  industryLabel.className = 'card-label';
  industryLabel.textContent = t.industryLabel;

  const industryText = document.createElement('p');
  industryText.className = 'card-text';
  industryText.textContent = company.industry;

  card.appendChild(industryLabel);
  card.appendChild(industryText);

  // --- Notes (always shown; click to edit inline) ---
  const notesLabel = document.createElement('p');
  notesLabel.className = 'card-label';
  notesLabel.textContent = t.notesLabel;

  const notesDisplay = document.createElement('p');
  notesDisplay.className = 'card-text card-notes';

  if (company.notes) {
    notesDisplay.textContent = company.notes;
  } else {
    const hint = document.createElement('span');
    hint.className = 'add-note-hint';
    hint.textContent = t.addNoteHint;
    notesDisplay.appendChild(hint);
  }

  notesDisplay.addEventListener('click', function () {
    startNoteEditing(company.id, company.notes, notesDisplay);
  });

  card.appendChild(notesLabel);
  card.appendChild(notesDisplay);

  // --- Footer: added date (left) + remove button (right) ---
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = t.addedOn(company.createdAt);

  // "Check price" link — only shown when a securities code is set.
  // Links straight to Yahoo! Finance Japan (no API/key needed) since there's
  // no free, keyless Japan stock price API to power an in-platform checker.
  if (company.ticker) {
    const checkBtn = document.createElement('a');
    checkBtn.href      = 'https://finance.yahoo.co.jp/quote/' + encodeURIComponent(company.ticker) + '.T';
    checkBtn.target    = '_blank';
    checkBtn.rel       = 'noopener noreferrer';
    checkBtn.className = 'check-price-btn';
    checkBtn.textContent = t.checkPriceBtn;
    footer.appendChild(date);
    footer.appendChild(checkBtn);
  } else {
    footer.appendChild(date);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = t.removeBtn;

  deleteBtn.addEventListener('click', function () {
    if (confirm(t.removeConfirm(company.name))) {
      deleteCompany(company.id);
      renderCompanies();
    }
  });

  footer.appendChild(deleteBtn);
  card.appendChild(footer);

  return card;
}

// =====================
// Inline Securities Code Editing
// =====================

function updateTicker(id, newTicker) {
  const companies = getCompanies();
  companies.forEach(function (c) {
    if (c.id === id) c.ticker = newTicker;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

function startTickerEditing(id, currentTicker, displayEl) {
  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'ticker-editor';
  input.value     = currentTicker || '';
  input.placeholder = t.tickerPlaceholder;
  input.maxLength = 6;
  input.inputMode = 'numeric';

  displayEl.replaceWith(input);
  input.focus();
  input.select();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    updateTicker(id, input.value.trim());
    renderCompanies();
  }

  input.addEventListener('blur', commit);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter')  { commit(); }
    if (e.key === 'Escape') { committed = true; renderCompanies(); }
  });
}

// =====================
// Inline Note Editing
// =====================

// Saves updated notes text for one company in localStorage
function updateNotes(id, newNotes) {
  const companies = getCompanies();
  companies.forEach(function (c) {
    if (c.id === id) {
      c.notes = newNotes;
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

// Swaps the notes display element for an editable textarea
function startNoteEditing(id, currentNotes, displayEl) {
  const textarea = document.createElement('textarea');
  textarea.className = 'note-editor';
  textarea.value = currentNotes || '';
  textarea.placeholder = t.noteEditorPlaceholder;

  displayEl.replaceWith(textarea);
  textarea.focus();

  // Guard against saving twice (blur can fire after Escape removes the element)
  let committed = false;

  // Clicking away or tabbing out saves the note
  textarea.addEventListener('blur', function () {
    if (committed) return;
    committed = true;
    updateNotes(id, textarea.value.trim());
    renderCompanies();
  });

  // Escape cancels without saving
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      committed = true;
      renderCompanies();
    }
  });
}
