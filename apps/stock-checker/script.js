// ===========================
// Stock Price Checker - Script
// ===========================

// API key is entered by each user and stored only in their own browser
// (this stack has no backend, so a key can never stay hidden in the code — see platform-rules).
const API_KEY_STORAGE_KEY = 'stock-checker:apiKey:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

const BASE_URL = 'https://finnhub.io/api/v1';

// -----------------------
// Localization (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Stock Price Checker',
    subtitle: 'Look up real-time US stock prices.',
    changeApiKeyBtn: 'Change API key',
    apiKeyIntro: "To use this app, enter your own free Finnhub API key. It's saved only in your browser, never sent anywhere else.",
    apiKeyPlaceholder: 'Paste your Finnhub API key',
    apiKeyAriaLabel: 'Finnhub API key',
    saveApiKey: 'Save',
    apiKeyHintPrefix: "Don't have one? ",
    getFreeKey: 'Get a free key',
    apiKeyHintSuffix: '.',
    tickerPlaceholder: 'Enter ticker symbol (e.g. AAPL)',
    tickerAriaLabel: 'Stock ticker symbol',
    searchBtn: 'Search',
    sectorWatchlist: 'Watchlist',
    sectorTech: 'Tech',
    sectorFinance: 'Finance',
    sectorHealth: 'Health',
    sectorConsumer: 'Consumer',
    sectorEnergy: 'Energy',
    backupHeading: 'Backup',
    backupNote: "Your API key is stored only in this browser. If you're moving from a local copy to a hosted one (or vice versa), export it here and import it on the other one — they don't share data automatically.",
    exportBackup: '⬇ Export backup',
    importBackup: '⬆ Import backup',
    importInvalidJson: 'Import failed: not a valid JSON file',
    importBadFormat: 'Import failed: unexpected file format',
    apiKeyImported: 'API key imported!',
    pleaseEnterApiKey: 'Please enter your Finnhub API key above first.',
    fetching: function (symbol) { return 'Fetching ' + symbol + '...'; },
    tickerNotFound: function (symbol) { return '"' + symbol + '" was not found. Double-check the ticker symbol.'; },
    fetchFailed: 'Could not fetch data. Check your internet connection and try again.',
    asOf: function (time) { return 'as of ' + time; },
    openLabel: 'Open',
    prevCloseLabel: 'Prev Close',
    dayHighLabel: 'Day High',
    dayLowLabel: 'Day Low',
    dataByPrefix: 'Data by',
  },
  ja: {
    title: '株価チェッカー',
    subtitle: '米国株のリアルタイム株価を調べられます。',
    changeApiKeyBtn: 'APIキーを変更',
    apiKeyIntro: 'このアプリを使うには、ご自身のFinnhub APIキー（無料）を入力してください。キーはこのブラウザにのみ保存され、他に送信されることはありません。',
    apiKeyPlaceholder: 'Finnhub APIキーを貼り付け',
    apiKeyAriaLabel: 'Finnhub APIキー',
    saveApiKey: '保存',
    apiKeyHintPrefix: 'お持ちでない場合は',
    getFreeKey: 'こちらから無料キーを取得',
    apiKeyHintSuffix: 'してください。',
    tickerPlaceholder: '銘柄コードを入力（例: AAPL）',
    tickerAriaLabel: '株式ティッカーシンボル',
    searchBtn: '検索',
    sectorWatchlist: 'ウォッチリスト',
    sectorTech: 'テック',
    sectorFinance: '金融',
    sectorHealth: 'ヘルスケア',
    sectorConsumer: '消費財',
    sectorEnergy: 'エネルギー',
    backupHeading: 'バックアップ',
    backupNote: 'APIキーはこのブラウザにのみ保存されています。ローカル版とホスティング版を行き来する場合（またはその逆）は、ここでエクスポートしてもう一方でインポートしてください。データは自動的には共有されません。',
    exportBackup: '⬇ バックアップを書き出す',
    importBackup: '⬆ バックアップを読み込む',
    importInvalidJson: 'インポート失敗: 正しいJSONファイルではありません',
    importBadFormat: 'インポート失敗: ファイル形式が想定と異なります',
    apiKeyImported: 'APIキーをインポートしました！',
    pleaseEnterApiKey: 'まず上でFinnhub APIキーを入力してください。',
    fetching: function (symbol) { return symbol + ' を取得中...'; },
    tickerNotFound: function (symbol) { return '「' + symbol + '」が見つかりませんでした。銘柄コードを確認してください。'; },
    fetchFailed: 'データを取得できませんでした。インターネット接続を確認して再度お試しください。',
    asOf: function (time) { return time + ' 時点'; },
    openLabel: '始値',
    prevCloseLabel: '前日終値',
    dayHighLabel: '当日高値',
    dayLowLabel: '当日安値',
    dataByPrefix: '提供:',
  },
  es: {
    title: 'Consultor de Precios de Acciones',
    subtitle: 'Consulta precios de acciones de EE. UU. en tiempo real.',
    changeApiKeyBtn: 'Cambiar clave API',
    apiKeyIntro: 'Para usar esta app, introduce tu propia clave API gratuita de Finnhub. Se guarda solo en tu navegador y nunca se envía a ningún otro lugar.',
    apiKeyPlaceholder: 'Pega tu clave API de Finnhub',
    apiKeyAriaLabel: 'Clave API de Finnhub',
    saveApiKey: 'Guardar',
    apiKeyHintPrefix: '¿No tienes una? ',
    getFreeKey: 'Consigue una clave gratis',
    apiKeyHintSuffix: '.',
    tickerPlaceholder: 'Introduce el símbolo bursátil (ej. AAPL)',
    tickerAriaLabel: 'Símbolo bursátil',
    searchBtn: 'Buscar',
    sectorWatchlist: 'Lista de seguimiento',
    sectorTech: 'Tecnología',
    sectorFinance: 'Finanzas',
    sectorHealth: 'Salud',
    sectorConsumer: 'Consumo',
    sectorEnergy: 'Energía',
    backupHeading: 'Copia de seguridad',
    backupNote: 'Tu clave API se guarda solo en este navegador. Si pasas de una copia local a una alojada en la nube (o viceversa), expórtala aquí e impórtala en la otra — no comparten datos automáticamente.',
    exportBackup: '⬇ Exportar copia',
    importBackup: '⬆ Importar copia',
    importInvalidJson: 'Error al importar: el archivo no es un JSON válido',
    importBadFormat: 'Error al importar: formato de archivo inesperado',
    apiKeyImported: '¡Clave API importada!',
    pleaseEnterApiKey: 'Primero introduce tu clave API de Finnhub arriba.',
    fetching: function (symbol) { return 'Buscando ' + symbol + '...'; },
    tickerNotFound: function (symbol) { return 'No se encontró "' + symbol + '". Verifica el símbolo bursátil.'; },
    fetchFailed: 'No se pudieron obtener los datos. Verifica tu conexión a internet e inténtalo de nuevo.',
    asOf: function (time) { return 'a las ' + time; },
    openLabel: 'Apertura',
    prevCloseLabel: 'Cierre ant.',
    dayHighLabel: 'Máximo del día',
    dayLowLabel: 'Mínimo del día',
    dataByPrefix: 'Datos de',
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

document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();
  setupApiKey();
  setupSearch();
  setupQuickPicks();
  loadWatchlistTickers();

  // If opened via "Check price →" link, auto-search the ticker from the URL
  const params = new URLSearchParams(window.location.search);
  const preload = params.get('ticker');
  if (preload) {
    const symbol = preload.trim().toUpperCase();
    document.getElementById('tickerInput').value = symbol;
    fetchQuote(symbol);
  }

  // When the Watchlist app updates localStorage in another tab, refresh this section
  window.addEventListener('storage', function (e) {
    if (e.key === 'companyWatchlist') {
      loadWatchlistTickers();
    }
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
// Backup (export/import)
// =====================

// Downloads the saved API key as a JSON file
function exportBackup() {
  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    apiKey: getApiKey()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stock-checker-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Reads a JSON file and restores the API key from it
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

    if (!data || typeof data.apiKey !== 'string' || !data.apiKey) {
      alert(t.importBadFormat);
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, data.apiKey);
    alert(t.apiKeyImported);
    location.reload(); // Simplest way to refresh the API key section's state
  };

  reader.readAsText(file);
}

// =====================
// API Key Setup
// =====================

function setupApiKey() {
  const section   = document.getElementById('api-key-section');
  const input     = document.getElementById('apiKeyInput');
  const saveBtn   = document.getElementById('saveApiKeyBtn');
  const changeBtn = document.getElementById('changeApiKeyBtn');

  function showSetup() {
    section.style.display = 'block';
    changeBtn.style.display = 'none';
    input.value = getApiKey();
  }

  function showReady() {
    section.style.display = 'none';
    changeBtn.style.display = 'inline-block';
  }

  saveBtn.addEventListener('click', function () {
    const key = input.value.trim();
    if (!key) return;
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    showReady();
  });

  changeBtn.addEventListener('click', showSetup);

  if (getApiKey()) {
    showReady();
  } else {
    showSetup();
  }
}

// =====================
// Watchlist Integration
// =====================

// Reads companies from the Watchlist app's localStorage and renders
// them as quick-pick buttons at the top of the list
function loadWatchlistTickers() {
  const data      = localStorage.getItem('companyWatchlist');
  const companies = data ? JSON.parse(data) : [];

  // Only show companies that have a ticker symbol set
  const withTickers = companies.filter(function (c) { return c.ticker; });

  const group   = document.getElementById('watchlist-group');
  const buttons = document.getElementById('watchlist-buttons');

  buttons.innerHTML = '';

  if (withTickers.length === 0) {
    group.style.display = 'none';
    return;
  }

  withTickers.forEach(function (company) {
    const btn = document.createElement('button');
    btn.className    = 'quick-btn watchlist-btn';
    btn.dataset.ticker = company.ticker;
    btn.textContent  = company.ticker;
    btn.title        = company.name; // full name shown on hover
    btn.addEventListener('click', function () {
      document.getElementById('tickerInput').value = company.ticker;
      fetchQuote(company.ticker);
    });
    buttons.appendChild(btn);
  });

  group.style.display = 'flex';
}

// =====================
// Search Setup
// =====================

function setupSearch() {
  const btn   = document.getElementById('searchBtn');
  const input = document.getElementById('tickerInput');

  btn.addEventListener('click', function () {
    const symbol = input.value.trim().toUpperCase();
    if (symbol) fetchQuote(symbol);
  });

  // Allow pressing Enter to search
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const symbol = input.value.trim().toUpperCase();
      if (symbol) fetchQuote(symbol);
    }
  });
}

function setupQuickPicks() {
  document.querySelectorAll('.quick-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const ticker = btn.dataset.ticker;
      document.getElementById('tickerInput').value = ticker;
      fetchQuote(ticker);
    });
  });
}

// =====================
// API Call
// =====================

// async/await lets us write asynchronous code (network requests) in a readable way
async function fetchQuote(symbol) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showError(t.pleaseEnterApiKey);
    document.getElementById('api-key-section').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  showLoading(symbol);

  try {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('API request failed with status ' + response.status);
    }

    const data = await response.json();

    // Finnhub returns c=0 when the ticker doesn't exist
    if (data.c === 0) {
      showError(t.tickerNotFound(symbol));
      return;
    }

    showResult(symbol, data);

  } catch (err) {
    showError(t.fetchFailed);
  }
}

// =====================
// Display Functions
// =====================

function showLoading(symbol) {
  document.getElementById('resultArea').innerHTML =
    '<p class="status-message">' + escapeHtml(t.fetching(symbol)) + '</p>';
}

function showError(message) {
  document.getElementById('resultArea').innerHTML =
    '<p class="error-message">' + escapeHtml(message) + '</p>';
}

function showResult(symbol, data) {
  const isPositive = data.d >= 0;
  const sign       = isPositive ? '+' : '';
  const changeClass = isPositive ? 'positive' : 'negative';
  const now        = new Date().toLocaleTimeString('en-US');

  // Build the card using DOM methods to avoid XSS risks with user-supplied input
  const area = document.getElementById('resultArea');
  area.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'result-card';

  card.innerHTML =
    '<div class="result-header">' +
      '<span class="result-symbol">' + escapeHtml(symbol) + '</span>' +
      '<span class="result-time">' + escapeHtml(t.asOf(now)) + '</span>' +
    '</div>' +
    '<div class="result-price">$' + data.c.toFixed(2) + '</div>' +
    '<div class="result-change ' + changeClass + '">' +
      sign + data.d.toFixed(2) + ' (' + sign + data.dp.toFixed(2) + '%)' +
    '</div>' +
    '<div class="result-details">' +
      '<div class="detail-item">' +
        '<span class="detail-label">' + escapeHtml(t.openLabel) + '</span>' +
        '<span class="detail-value">$' + data.o.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="detail-item">' +
        '<span class="detail-label">' + escapeHtml(t.prevCloseLabel) + '</span>' +
        '<span class="detail-value">$' + data.pc.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="detail-item">' +
        '<span class="detail-label">' + escapeHtml(t.dayHighLabel) + '</span>' +
        '<span class="detail-value">$' + data.h.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="detail-item">' +
        '<span class="detail-label">' + escapeHtml(t.dayLowLabel) + '</span>' +
        '<span class="detail-value">$' + data.l.toFixed(2) + '</span>' +
      '</div>' +
    '</div>' +
    '<p class="data-source">' + escapeHtml(t.dataByPrefix) + ' <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer">Finnhub</a></p>';

  area.appendChild(card);
}

// =====================
// Utility
// =====================

// Prevents XSS by escaping special HTML characters in strings
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
