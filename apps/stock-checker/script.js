// ===========================
// Stock Price Checker - Script
// ===========================

// --- Step 1: Paste your Finnhub API key here ---
// Get a free key at: https://finnhub.io/register
const API_KEY = 'd92tlr1r01qpou389j80d92tlr1r01qpou389j8g';

const BASE_URL = 'https://finnhub.io/api/v1';

document.addEventListener('DOMContentLoaded', function () {
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
});

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
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    showError('API key not set. Open script.js and replace YOUR_API_KEY_HERE with your Finnhub key.');
    return;
  }

  showLoading(symbol);

  try {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`;
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
