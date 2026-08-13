// ===========================
// Company News Feed - Script
// ===========================

// API key is entered by each user and stored only in their own browser
// (this stack has no backend, so a key can never stay hidden in the code — see platform-rules).
const API_KEY_STORAGE_KEY = 'news-feed:apiKey:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

// Watchlist アプリが同期対応前に使っていたキー。company-watchlist-us と同じ値に
// しておかないと、まだ移行していない端末のデータを拾えない。
const LEGACY_WATCHLIST_KEY = 'companyWatchlist';

// company-watchlist-us の store。読み取り専用で使う(set() は呼ばない)。
let watchlistStore = null;

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

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

const BASE_URL = 'https://gnews.io/api/v4/search';

// file:// で開くとブラウザのOriginが "null" になりAPIに弾かれるため、
// 仲介サーバー（CORSプロキシ）を通してリクエストを送る。
// GitHub Pages で公開するとこのプロキシは不要になる。
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// -----------------------
// i18n (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Company News Feed',
    subtitle: 'Get the latest news for any company.',
    changeApiKey: 'Change API key',
    apiKeyIntro: "To use this app, enter your own free GNews API key. It's saved only in your browser, never sent anywhere else.",
    apiKeyInputPlaceholder: 'Paste your GNews API key',
    apiKeyInputAriaLabel: 'GNews API key',
    saveApiKey: 'Save',
    apiKeyHintPrefix: "Don't have one?",
    apiKeyHintLink: 'Get a free key',
    apiKeyHintSuffix: '.',
    queryInputPlaceholder: 'Search company name (e.g. Apple, Tesla)',
    queryInputAriaLabel: 'Company name to search',
    search: 'Search',
    watchlistLabel: 'From your watchlist:',
    missingApiKey: 'Please enter your GNews API key above first.',
    searching: function (q) { return 'Searching news for "' + q + '"...'; },
    noResults: function (q) { return 'No news found for "' + q + '".'; },
    apiError: function (detail) { return 'API error: ' + detail; },
    fetchFailed: function (msg) { return 'Fetch failed: ' + msg + ' — Open DevTools (F12) → Console for details.'; },
    resultsCount: function (n, q) { return n + ' articles found for "' + q + '"'; },
  },
  ja: {
    title: '企業ニュースフィード',
    subtitle: '企業ごとの最新ニュースを取得できます。',
    changeApiKey: 'APIキーを変更',
    apiKeyIntro: 'このアプリを使うには、GNewsの無料APIキーをご自身で入力してください。キーはこのブラウザにのみ保存され、他へは一切送信されません。',
    apiKeyInputPlaceholder: 'GNews APIキーを貼り付け',
    apiKeyInputAriaLabel: 'GNews APIキー',
    saveApiKey: '保存',
    apiKeyHintPrefix: 'お持ちでない方は',
    apiKeyHintLink: '無料キーを取得',
    apiKeyHintSuffix: 'できます。',
    queryInputPlaceholder: '検索する企業名（例: Apple、Tesla）',
    queryInputAriaLabel: '検索する企業名',
    search: '検索',
    watchlistLabel: 'ウォッチリストから:',
    missingApiKey: '上のGNews APIキー欄にまずキーを入力してください。',
    searching: function (q) { return '"' + q + '" のニュースを検索中...'; },
    noResults: function (q) { return '"' + q + '" に関するニュースは見つかりませんでした。'; },
    apiError: function (detail) { return 'APIエラー: ' + detail; },
    fetchFailed: function (msg) { return '取得に失敗しました: ' + msg + ' — 詳細はDevTools（F12）のコンソールを確認してください。'; },
    resultsCount: function (n, q) { return '"' + q + '" の記事が' + n + '件見つかりました'; },
  },
  es: {
    title: 'Noticias de Empresas',
    subtitle: 'Consulta las últimas noticias de cualquier empresa.',
    changeApiKey: 'Cambiar clave de API',
    apiKeyIntro: 'Para usar esta app, introduce tu propia clave de API gratuita de GNews. Se guarda solo en tu navegador y nunca se envía a ningún otro lugar.',
    apiKeyInputPlaceholder: 'Pega tu clave de API de GNews',
    apiKeyInputAriaLabel: 'Clave de API de GNews',
    saveApiKey: 'Guardar',
    apiKeyHintPrefix: '¿No tienes una?',
    apiKeyHintLink: 'Consigue una clave gratis',
    apiKeyHintSuffix: '.',
    queryInputPlaceholder: 'Busca el nombre de una empresa (ej. Apple, Tesla)',
    queryInputAriaLabel: 'Nombre de la empresa a buscar',
    search: 'Buscar',
    watchlistLabel: 'De tu lista de seguimiento:',
    missingApiKey: 'Primero introduce tu clave de API de GNews arriba.',
    searching: function (q) { return 'Buscando noticias de "' + q + '"...'; },
    noResults: function (q) { return 'No se encontraron noticias de "' + q + '".'; },
    apiError: function (detail) { return 'Error de la API: ' + detail; },
    fetchFailed: function (msg) { return 'Error al obtener datos: ' + msg + ' — Abre las herramientas de desarrollo (F12) → Consola para más detalles.'; },
    resultsCount: function (n, q) { return n + ' artículos encontrados para "' + q + '"'; },
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

document.addEventListener('DOMContentLoaded', async function () {
  applyStaticTranslations();
  setupApiKey();
  setupSearch();

  // Watchlist アプリと同じ store を読み取り専用で開く。set() は呼ばない。
  watchlistStore = await openStore('company-watchlist-us', 'companies', {
    default: [],
    legacyKey: LEGACY_WATCHLIST_KEY
  });

  // 他デバイス・他タブで Watchlist が更新されたらクイックピックを更新
  watchlistStore.subscribe(function () { loadWatchlistCompanies(); });
  loadWatchlistCompanies();
});

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
// Search Setup
// =====================

function setupSearch() {
  const btn   = document.getElementById('searchBtn');
  const input = document.getElementById('queryInput');

  btn.addEventListener('click', function () {
    const query = input.value.trim();
    if (query) fetchNews(query);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) fetchNews(query);
    }
  });
}

// =====================
// Watchlist Integration
// =====================

// Reads company names from the Watchlist app and shows them as quick picks
function loadWatchlistCompanies() {
  const v         = watchlistStore ? watchlistStore.get() : null;
  const companies = Array.isArray(v) ? v : [];

  const container = document.getElementById('watchlist-picks');
  const buttons   = document.getElementById('watchlist-buttons');

  buttons.innerHTML = '';

  if (companies.length === 0) {
    container.style.display = 'none';
    return;
  }

  companies.forEach(function (company) {
    const btn = document.createElement('button');
    btn.className   = 'picks-btn';
    btn.textContent = company.name;
    btn.addEventListener('click', function () {
      document.getElementById('queryInput').value = company.name;
      fetchNews(company.name);
    });
    buttons.appendChild(btn);
  });

  container.style.display = 'flex';
}

// =====================
// API Call
// =====================

async function fetchNews(query) {
  const apiKey = getApiKey();
  if (!apiKey) {
    showError(t.missingApiKey);
    document.getElementById('api-key-section').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  showLoading(query);

  try {
    const targetUrl = BASE_URL +
      '?q=' + encodeURIComponent(query) +
      '&lang=en' +
      '&max=10' +
      '&token=' + apiKey;

    // CORSプロキシ経由でリクエストを送る
    const url = CORS_PROXY + encodeURIComponent(targetUrl);

    const response = await fetch(url);
    const data = await response.json();

    // GNews returns error details in the JSON body even when status is not OK
    if (!response.ok) {
      const detail = data.errors ? data.errors.join(' / ') : 'Status ' + response.status;
      showError(t.apiError(detail));
      return;
    }

    if (!data.articles || data.articles.length === 0) {
      showEmpty(query);
      return;
    }

    renderArticles(query, data.articles);

  } catch (err) {
    // Show the actual error message to help diagnose the problem
    console.error('News fetch error:', err);
    showError(t.fetchFailed(err.message));
  }
}

// =====================
// Render Functions
// =====================

function showLoading(query) {
  document.getElementById('resultsArea').innerHTML =
    '<p class="status-message">' + escapeHtml(t.searching(query)) + '</p>';
}

function showEmpty(query) {
  document.getElementById('resultsArea').innerHTML =
    '<p class="status-message">' + escapeHtml(t.noResults(query)) + '</p>';
}

function showError(message) {
  document.getElementById('resultsArea').innerHTML =
    '<p class="error-message">' + escapeHtml(message) + '</p>';
}

function renderArticles(query, articles) {
  const area = document.getElementById('resultsArea');
  area.innerHTML = '';

  // Show result count above the cards
  const count = document.createElement('p');
  count.id          = 'resultsCount';
  count.textContent = t.resultsCount(articles.length, query);
  area.appendChild(count);

  articles.forEach(function (article) {
    area.appendChild(createArticleCard(article));
  });
}

function createArticleCard(article) {
  const card = document.createElement('div');
  card.className = 'article-card';

  // Title as a link to the full article
  const title = document.createElement('a');
  title.href        = article.url;
  title.target      = '_blank';
  title.rel         = 'noopener noreferrer';
  title.className   = 'article-title';
  title.textContent = article.title;

  // Source name + date on one row
  const meta = document.createElement('div');
  meta.className = 'article-meta';

  const source = document.createElement('span');
  source.className   = 'article-source';
  source.textContent = article.source.name;

  const date = document.createElement('span');
  date.className   = 'article-date';
  date.textContent = formatDate(article.publishedAt);

  meta.appendChild(source);
  meta.appendChild(date);

  // Description text
  const desc = document.createElement('p');
  desc.className   = 'article-description';
  desc.textContent = article.description || '';

  card.appendChild(title);
  card.appendChild(meta);
  if (article.description) card.appendChild(desc);

  return card;
}

// =====================
// Utility
// =====================

// Converts ISO date string (2026-07-02T12:00:00Z) to a locale-formatted date,
// e.g. "Jul 2, 2026" (en), "2026年7月2日" (ja), "2 jul 2026" (es)
const DATE_LOCALE = { en: 'en-US', ja: 'ja-JP', es: 'es-ES' };

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(DATE_LOCALE[getLang()], {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
