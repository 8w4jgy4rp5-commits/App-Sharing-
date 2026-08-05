// ===========================
// Macro Dashboard - Script
// ===========================

// API key is entered by each user and stored only in their own browser
// (this stack has no backend, so a key can never stay hidden in the code — see platform-rules).
const API_KEY_STORAGE_KEY = 'macroDashboard:apiKey:v1';
const HISTORY_STORAGE_KEY = 'macroDashboard:history:v1';
const MAX_HISTORY_ENTRIES = 30;
const BIG_MOVE_THRESHOLD = 1; // percent

const BASE_URL = 'https://finnhub.io/api/v1';
const FEAR_GREED_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

// Indicators fetched from Finnhub's free /quote endpoint.
// The three US indices aren't available on Finnhub's free tier, so we use
// a highly liquid ETF that tracks each one as a close stand-in.
const INDICATORS = [
  { id: 'usdJpy', symbol: 'OANDA:USD_JPY', label: 'USD/JPY', prefix: '', proxyNote: '' },
  { id: 'sp500', symbol: 'SPY', label: 'S&P 500', prefix: '$', proxyNote: 'via SPY ETF' },
  { id: 'nasdaq', symbol: 'QQQ', label: 'NASDAQ', prefix: '$', proxyNote: 'via QQQ ETF (Nasdaq-100)' },
  { id: 'dow', symbol: 'DIA', label: 'Dow Jones', prefix: '$', proxyNote: 'via DIA ETF' },
];

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

// Reads saved history from localStorage; returns [] if missing or corrupted
function getHistory() {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
}

// Local (not UTC) date key, so "today" matches the user's own calendar day
function todayKey() {
  const d = new Date();
  const pad = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

document.addEventListener('DOMContentLoaded', function () {
  setupApiKey();
  renderHistory();

  document.getElementById('refreshBtn').addEventListener('click', refreshAll);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
});

// =====================
// API Key Setup
// =====================

function setupApiKey() {
  const section = document.getElementById('api-key-section');
  const input = document.getElementById('apiKeyInput');
  const saveBtn = document.getElementById('saveApiKeyBtn');
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
// Refresh
// =====================

async function refreshAll() {
  const apiKey = getApiKey();
  if (!apiKey) {
    showIndicatorsMessage('Please enter your Finnhub API key above first.');
    document.getElementById('api-key-section').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  setRefreshing(true);
  showIndicatorsMessage('Loading...');
  document.getElementById('fearGreedArea').innerHTML = '<p class="status-message">Loading...</p>';

  const [quoteResults, fearGreed] = await Promise.all([
    Promise.all(INDICATORS.map(function (ind) { return fetchQuote(ind.symbol, apiKey); })),
    fetchFearGreed(),
  ]);

  renderIndicators(quoteResults);
  renderFearGreed(fearGreed);
  saveTodaySnapshot(quoteResults, fearGreed);
  renderHistory();
  updateLastUpdated();
  setRefreshing(false);
}

function setRefreshing(isRefreshing) {
  const btn = document.getElementById('refreshBtn');
  btn.disabled = isRefreshing;
  btn.textContent = isRefreshing ? 'Refreshing...' : 'Refresh indicators';
}

function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  el.textContent = 'Last updated ' + new Date().toLocaleTimeString('en-US');
}

// =====================
// Finnhub quote
// =====================

// Returns Finnhub quote data ({c, d, dp, ...}) or null on any failure
async function fetchQuote(symbol, apiKey) {
  try {
    const url = BASE_URL + '/quote?symbol=' + encodeURIComponent(symbol) + '&token=' + apiKey;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    // Finnhub returns c=0 (and pc=0) when the symbol has no data
    if (!data || (data.c === 0 && data.pc === 0)) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function renderIndicators(results) {
  const grid = document.getElementById('indicatorGrid');
  grid.innerHTML = '';

  INDICATORS.forEach(function (ind, i) {
    const data = results[i];
    const card = document.createElement('div');
    card.className = 'indicator-card';

    if (!data) {
      card.classList.add('indicator-error');
      const label = document.createElement('div');
      label.className = 'indicator-label';
      label.textContent = ind.label;
      const msg = document.createElement('p');
      msg.className = 'indicator-error-msg';
      msg.textContent = "Couldn't load";
      card.appendChild(label);
      card.appendChild(msg);
      grid.appendChild(card);
      return;
    }

    const isPositive = data.d >= 0;
    const sign = isPositive ? '+' : '';
    const changeClass = isPositive ? 'positive' : 'negative';
    const isBigMove = Math.abs(data.dp) >= BIG_MOVE_THRESHOLD;
    if (isBigMove) card.classList.add('big-move', changeClass);

    const label = document.createElement('div');
    label.className = 'indicator-label';
    label.textContent = ind.label;
    if (ind.proxyNote) {
      const note = document.createElement('span');
      note.className = 'proxy-note';
      note.textContent = ind.proxyNote;
      label.appendChild(document.createElement('br'));
      label.appendChild(note);
    }

    const value = document.createElement('div');
    value.className = 'indicator-value';
    value.textContent = ind.prefix + data.c.toFixed(2);

    const change = document.createElement('div');
    change.className = 'indicator-change ' + changeClass;
    change.textContent = sign + data.d.toFixed(2) + ' (' + sign + data.dp.toFixed(2) + '%)' + (isBigMove ? ' ⚡' : '');

    card.appendChild(label);
    card.appendChild(value);
    card.appendChild(change);
    grid.appendChild(card);
  });
}

function showIndicatorsMessage(message) {
  const grid = document.getElementById('indicatorGrid');
  grid.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'status-message';
  p.textContent = message;
  grid.appendChild(p);
}

// =====================
// CNN Fear & Greed Index (unofficial endpoint)
// =====================
// This endpoint isn't an official public API, so it can change or start
// blocking browser requests (CORS) without notice. Any failure here is
// handled gracefully with a fallback link — it never breaks the rest of
// the page.

// Returns { score, asOf } or null on any failure
async function fetchFearGreed() {
  try {
    const response = await fetch(FEAR_GREED_URL);
    if (!response.ok) return null;
    const data = await response.json();
    const points = data && data.fear_and_greed_historical && data.fear_and_greed_historical.data;
    if (!Array.isArray(points) || points.length === 0) return null;
    const latest = points[points.length - 1];
    const score = Math.round(latest.y);
    if (typeof score !== 'number' || Number.isNaN(score)) return null;
    return { score: score, asOf: new Date(latest.x) };
  } catch (err) {
    return null;
  }
}

function fearGreedBand(score) {
  if (score < 25) return { label: 'Extreme Fear', className: 'fg-fear', extreme: true };
  if (score < 45) return { label: 'Fear', className: 'fg-fear', extreme: false };
  if (score <= 55) return { label: 'Neutral', className: 'fg-neutral', extreme: false };
  if (score <= 75) return { label: 'Greed', className: 'fg-greed', extreme: false };
  return { label: 'Extreme Greed', className: 'fg-greed', extreme: true };
}

function renderFearGreed(fearGreed) {
  const area = document.getElementById('fearGreedArea');
  area.innerHTML = '';

  if (!fearGreed) {
    const msg = document.createElement('p');
    msg.className = 'fg-fallback-msg';
    msg.textContent = "Couldn't load automatically here (CNN doesn't offer a public API, and browser requests may be blocked).";
    const link = document.createElement('a');
    link.href = 'https://www.cnn.com/markets/fear-and-greed';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'secondary-btn';
    link.textContent = 'Open CNN Fear & Greed page ↗';
    area.appendChild(msg);
    area.appendChild(link);
    return;
  }

  const band = fearGreedBand(fearGreed.score);
  const wrap = document.createElement('div');
  wrap.className = 'fg-result ' + band.className + (band.extreme ? ' fg-extreme' : '');

  const value = document.createElement('div');
  value.className = 'fg-value';
  value.textContent = String(fearGreed.score);

  const label = document.createElement('div');
  label.className = 'fg-label';
  label.textContent = (band.extreme ? '⚠ ' : '') + band.label;

  const asOf = document.createElement('div');
  asOf.className = 'fg-asof';
  asOf.textContent = 'as of ' + fearGreed.asOf.toLocaleDateString('en-US');

  wrap.appendChild(value);
  wrap.appendChild(label);
  wrap.appendChild(asOf);
  area.appendChild(wrap);
}

// =====================
// Daily history
// =====================

function saveTodaySnapshot(quoteResults, fearGreed) {
  const history = getHistory();
  const date = todayKey();

  const entry = {
    date: date,
    usdJpy: quoteResults[0] ? quoteResults[0].c : null,
    sp500: quoteResults[1] ? quoteResults[1].c : null,
    nasdaq: quoteResults[2] ? quoteResults[2].c : null,
    dow: quoteResults[3] ? quoteResults[3].c : null,
    fearGreed: fearGreed ? fearGreed.score : null,
  };

  const existingIndex = history.findIndex(function (h) { return h.date === date; });
  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.unshift(entry);
  }

  history.sort(function (a, b) { return b.date.localeCompare(a.date); });
  saveHistory(history.slice(0, MAX_HISTORY_ENTRIES));
}

function formatHistoryValue(value, prefix) {
  return typeof value === 'number' ? (prefix || '') + value.toFixed(2) : '—';
}

function renderHistory() {
  const history = getHistory();
  const emptyMsg = document.getElementById('historyEmptyMsg');
  const tableWrap = document.getElementById('historyTableWrap');
  const tbody = document.getElementById('historyTableBody');
  const clearBtn = document.getElementById('clearHistoryBtn');

  if (history.length === 0) {
    emptyMsg.style.display = 'block';
    tableWrap.style.display = 'none';
    clearBtn.style.display = 'none';
    return;
  }

  emptyMsg.style.display = 'none';
  tableWrap.style.display = 'block';
  clearBtn.style.display = 'inline-block';

  tbody.innerHTML = '';
  history.forEach(function (entry) {
    const row = document.createElement('tr');

    const cells = [
      entry.date,
      formatHistoryValue(entry.usdJpy, ''),
      formatHistoryValue(entry.sp500, '$'),
      formatHistoryValue(entry.nasdaq, '$'),
      formatHistoryValue(entry.dow, '$'),
      typeof entry.fearGreed === 'number' ? String(entry.fearGreed) : '—',
    ];

    cells.forEach(function (text) {
      const td = document.createElement('td');
      td.textContent = text;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}

function clearHistory() {
  if (!window.confirm('Clear all saved daily history? This cannot be undone.')) return;
  saveHistory([]);
  renderHistory();
}
