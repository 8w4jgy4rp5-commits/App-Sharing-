// ===========================
// Stock Price Checker - Script
// ===========================

// API key is entered by each user and stored only in their own browser
// (this stack has no backend, so a key can never stay hidden in the code — see platform-rules).
const API_KEY_STORAGE_KEY = 'stock-checker:apiKey:v1';

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

const BASE_URL = 'https://finnhub.io/api/v1';

document.addEventListener('DOMContentLoaded', function () {
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
      alert('Import failed: not a valid JSON file');
      return;
    }

    if (!data || typeof data.apiKey !== 'string' || !data.apiKey) {
      alert('Import failed: unexpected file format');
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, data.apiKey);
    alert('API key imported!');
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
    showError('Please enter your Finnhub API key above first.');
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
      showError('"' + symbol + '" was not found. Double-check the ticker symbol.');
      return;
    }

    showResult(symbol, data);

  } catch (err) {
    showError('Could not fetch data. Check your internet connection and try again.');
  }
}

// =====================
// Display Functions
// =====================

function showLoading(symbol) {
  document.getElementById('resultArea').innerHTML =
    '<p class="status-message">Fetching ' + symbol + '...</p>';
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
      '<span class="result-time">as of ' + escapeHtml(now) + '</span>' +
    '</div>' +
    '<div class="result-price">$' + data.c.toFixed(2) + '</div>' +
    '<div class="result-change ' + changeClass + '">' +
      sign + data.d.toFixed(2) + ' (' + sign + data.dp.toFixed(2) + '%)' +
    '</div>' +
    '<div class="result-details">' +
      '<div class="detail-item">' +
        '<span class="detail-label">Open</span>' +
        '<span class="detail-value">$' + data.o.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="detail-item">' +
        '<span class="detail-label">Prev Close</span>' +
        '<span class="detail-value">$' + data.pc.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="detail-item">' +
        '<span class="detail-label">Day High</span>' +
        '<span class="detail-value">$' + data.h.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="detail-item">' +
        '<span class="detail-label">Day Low</span>' +
        '<span class="detail-value">$' + data.l.toFixed(2) + '</span>' +
      '</div>' +
    '</div>' +
    '<p class="data-source">Data by <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer">Finnhub</a></p>';

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
