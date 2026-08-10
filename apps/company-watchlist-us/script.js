// ===========================
// Company Watchlist - Script
// ===========================

// Key used to read/write data in localStorage
const STORAGE_KEY = 'companyWatchlist';
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: '🇺🇸 Company Watchlist — US',
    subtitle: "Track companies you're interested in.",
    disclaimer: 'This tool helps you organize notes. It does not provide financial advice.',
    addCompanyHeading: 'Add a Company',
    companyNameLabel: 'Company name',
    companyNameHelp: 'What is the company called?',
    companyNamePlaceholder: 'e.g. Acme Corp',
    industryLabel: 'Industry',
    industryHelp: 'What sector is this company in?',
    industryPlaceholder: 'e.g. SaaS, Finance, Healthcare',
    urlLabel: 'Website URL',
    urlHelp: "Link to the company's website (optional)",
    tickerLabel: 'Stock ticker',
    tickerHelp: 'US stock ticker symbol, if the company is listed (optional) — e.g. AAPL, MSFT',
    tickerPlaceholder: 'e.g. AAPL',
    tickerSearchBtn: '🔍 Search',
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
    tickerEditTitle: 'Click to edit ticker',
    statusChangeTitle: 'Click to change status',
    addTickerHint: '+ Add ticker',
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
    tickerSearchInlineTitle: 'Search ticker by company name',
    enterCompanyNameFirst: 'Enter a company name first',
    noTickerMatches: 'No matches found — you can enter the ticker manually',
    tickerSearchFailed: 'Search failed — you can enter the ticker manually',
  },
  ja: {
    title: '🇺🇸 企業ウォッチリスト — 米国',
    subtitle: '気になる企業を記録しましょう。',
    disclaimer: 'このツールはメモの整理を助けるものであり、投資助言ではありません。',
    addCompanyHeading: '企業を追加',
    companyNameLabel: '会社名',
    companyNameHelp: '会社の名前は何ですか？',
    companyNamePlaceholder: '例: Acme Corp',
    industryLabel: '業界',
    industryHelp: 'この会社はどの分野ですか？',
    industryPlaceholder: '例: SaaS、金融、ヘルスケア',
    urlLabel: 'ウェブサイトURL',
    urlHelp: '会社のウェブサイトへのリンク（任意）',
    tickerLabel: '株式ティッカー',
    tickerHelp: '上場している場合の米国株ティッカーシンボル（任意）— 例: AAPL、MSFT',
    tickerPlaceholder: '例: AAPL',
    tickerSearchBtn: '🔍 検索',
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
    tickerEditTitle: 'クリックしてティッカーを編集',
    statusChangeTitle: 'クリックしてステータスを変更',
    addTickerHint: '+ ティッカーを追加',
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
    tickerSearchInlineTitle: '会社名でティッカーを検索',
    enterCompanyNameFirst: '先に会社名を入力してください',
    noTickerMatches: '一致する結果が見つかりません — ティッカーを手入力できます',
    tickerSearchFailed: '検索に失敗しました — ティッカーを手入力できます',
  },
  es: {
    title: '🇺🇸 Lista de Seguimiento de Empresas — EE. UU.',
    subtitle: 'Lleva un registro de las empresas que te interesan.',
    disclaimer: 'Esta herramienta te ayuda a organizar notas. No ofrece asesoramiento financiero.',
    addCompanyHeading: 'Añadir una empresa',
    companyNameLabel: 'Nombre de la empresa',
    companyNameHelp: '¿Cómo se llama la empresa?',
    companyNamePlaceholder: 'ej. Acme Corp',
    industryLabel: 'Industria',
    industryHelp: '¿En qué sector opera esta empresa?',
    industryPlaceholder: 'ej. SaaS, Finanzas, Salud',
    urlLabel: 'URL del sitio web',
    urlHelp: 'Enlace al sitio web de la empresa (opcional)',
    tickerLabel: 'Símbolo bursátil',
    tickerHelp: 'Símbolo bursátil en EE. UU., si la empresa cotiza en bolsa (opcional) — ej. AAPL, MSFT',
    tickerPlaceholder: 'ej. AAPL',
    tickerSearchBtn: '🔍 Buscar',
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
    tickerEditTitle: 'Haz clic para editar el símbolo',
    statusChangeTitle: 'Haz clic para cambiar el estado',
    addTickerHint: '+ Añadir símbolo',
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
    tickerSearchInlineTitle: 'Buscar símbolo por nombre de empresa',
    enterCompanyNameFirst: 'Primero ingresa el nombre de la empresa',
    noTickerMatches: 'No se encontraron coincidencias — puedes ingresar el símbolo manualmente',
    tickerSearchFailed: 'Error en la búsqueda — puedes ingresar el símbolo manualmente',
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

  document.getElementById('tickerSearchBtn').addEventListener('click', function () {
    const companyName = document.getElementById('companyName').value;
    const ticker      = document.getElementById('ticker');
    const results     = document.getElementById('tickerResults');

    searchTickerAndRender(companyName, results, function (symbol) {
      ticker.value = symbol;
    });
  });

  // Stale suggestions shouldn't linger once the user edits the ticker directly
  document.getElementById('ticker').addEventListener('input', function () {
    clearTickerResults(document.getElementById('tickerResults'));
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
    ticker:    document.getElementById('ticker').value.trim().toUpperCase(),
    notes:     document.getElementById('notes').value.trim(),
    status:    document.getElementById('status').value,
    createdAt: new Date().toLocaleDateString('en-US')
  };

  saveCompany(company);
  renderCompanies();
  this.reset(); // Clear the form fields
  clearTickerResults(document.getElementById('tickerResults'));
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
  a.download = 'company-watchlist-backup.json';
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

  // Wrapper that holds the ticker badge (if any) + company name side by side
  const nameGroup = document.createElement('div');
  nameGroup.className = 'card-name-group';

  // Ticker badge — click to edit if one exists, or show hint to add one
  if (company.ticker) {
    const tickerBadge = document.createElement('span');
    tickerBadge.className = 'ticker-badge ticker-editable';
    tickerBadge.textContent = company.ticker;
    tickerBadge.title = t.tickerEditTitle;
    tickerBadge.addEventListener('click', function () {
      startTickerEditing(company.id, company.ticker, tickerBadge, company.name);
    });
    nameGroup.appendChild(tickerBadge);
  } else {
    const tickerHint = document.createElement('span');
    tickerHint.className = 'add-ticker-hint';
    tickerHint.textContent = t.addTickerHint;
    tickerHint.addEventListener('click', function () {
      startTickerEditing(company.id, '', tickerHint, company.name);
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

  // "Check price" link — only shown when a ticker is set
  if (company.ticker) {
    const checkBtn = document.createElement('a');
    checkBtn.href      = '../stock-checker/index.html?ticker=' + encodeURIComponent(company.ticker);
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
// Inline Ticker Editing
// =====================

function updateTicker(id, newTicker) {
  const companies = getCompanies();
  companies.forEach(function (c) {
    if (c.id === id) c.ticker = newTicker;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

function startTickerEditing(id, currentTicker, displayEl, companyName) {
  // Wrapper holds the input + search button + results together so we can
  // tell whether focus is still "inside" the editor when it moves around
  const wrapper = document.createElement('span');
  wrapper.className = 'ticker-editor-wrapper';

  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'ticker-editor';
  input.value     = currentTicker || '';
  input.placeholder = t.tickerPlaceholder;
  input.maxLength = 10;

  const searchBtn = document.createElement('button');
  searchBtn.type      = 'button';
  searchBtn.className = 'ticker-search-btn ticker-search-btn-inline';
  searchBtn.textContent = '🔍';
  searchBtn.title     = t.tickerSearchInlineTitle;

  const resultsEl = document.createElement('ul');
  resultsEl.className = 'ticker-results';

  wrapper.appendChild(input);
  wrapper.appendChild(searchBtn);
  wrapper.appendChild(resultsEl);

  displayEl.replaceWith(wrapper);
  input.focus();
  input.select();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    updateTicker(id, input.value.trim().toUpperCase());
    renderCompanies();
  }

  searchBtn.addEventListener('click', function () {
    searchTickerAndRender(companyName || '', resultsEl, function (symbol) {
      input.value = symbol;
      input.focus(); // Bring focus back to the input so blur-to-commit still works
    });
  });

  // Focus can move between the input and the search button/results without
  // the user being "done" editing, so only commit once focus leaves the
  // whole wrapper (checked on the next tick, after the new focus lands)
  wrapper.addEventListener('focusout', function () {
    setTimeout(function () {
      if (!wrapper.contains(document.activeElement)) {
        commit();
      }
    }, 0);
  });

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

// =====================
// Ticker Search (by company name)
// =====================
// Shared by the "Add a Company" form and the inline ticker editor.
// No API key needed for this endpoint.

// Looks up ticker symbols matching companyName and renders the outcome into
// resultsEl (a <ul>). Clicking a result calls onSelect(symbol) and clears the list.
async function searchTickerAndRender(companyName, resultsEl, onSelect) {
  const query = companyName.trim();

  if (!query) {
    showTickerMessage(resultsEl, t.enterCompanyNameFirst);
    return;
  }

  try {
    const res = await fetch(
      'https://api.twelvedata.com/symbol_search?symbol=' + encodeURIComponent(query),
      { mode: 'cors' }
    );

    if (!res.ok) throw new Error('Request failed');

    const data = await res.json();
    const results = Array.isArray(data && data.data) ? data.data : [];

    if (results.length === 0) {
      showTickerMessage(resultsEl, t.noTickerMatches);
      return;
    }

    renderTickerResults(results.slice(0, 5), resultsEl, onSelect);
  } catch (e) {
    showTickerMessage(resultsEl, t.tickerSearchFailed);
  }
}

// Renders up to 5 search results as clickable list items
function renderTickerResults(results, resultsEl, onSelect) {
  resultsEl.innerHTML = ''; // Clear existing results before redrawing

  results.forEach(function (result) {
    const item = document.createElement('li');
    item.className = 'ticker-result-item';
    // Built with textContent (never innerHTML) since this text comes from a
    // third-party API response and must not be treated as trusted HTML
    item.textContent = result.symbol + ' — ' + result.instrument_name + ' (' + result.exchange + ')';

    item.addEventListener('click', function () {
      onSelect(result.symbol);
      clearTickerResults(resultsEl);
    });

    resultsEl.appendChild(item);
  });
}

// Shows a single small muted message inside the results list (no matches, error, etc.)
function showTickerMessage(resultsEl, message) {
  resultsEl.innerHTML = '';
  const item = document.createElement('li');
  item.className = 'ticker-result-message';
  item.textContent = message;
  resultsEl.appendChild(item);
}

// Clears (and thereby hides, via CSS) the results list
function clearTickerResults(resultsEl) {
  resultsEl.innerHTML = '';
}
