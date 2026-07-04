// ===========================
// Company News Feed - Script
// ===========================

// --- Step 1: Paste your GNews API key here ---
// Get a free key at: https://gnews.io/register
const API_KEY = '8bb2bc5da967a059db96a6cce14b7edd';

const BASE_URL = 'https://gnews.io/api/v4/search';

// file:// で開くとブラウザのOriginが "null" になりAPIに弾かれるため、
// 仲介サーバー（CORSプロキシ）を通してリクエストを送る。
// GitHub Pages で公開するとこのプロキシは不要になる。
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

document.addEventListener('DOMContentLoaded', function () {
  setupSearch();
  loadWatchlistCompanies();

  // If the Watchlist app updates in another tab, refresh the quick picks
  window.addEventListener('storage', function (e) {
    if (e.key === 'companyWatchlist') {
      loadWatchlistCompanies();
    }
  });
});

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
  const data      = localStorage.getItem('companyWatchlist');
  const companies = data ? JSON.parse(data) : [];

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
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    showError('API key not set. Open script.js and replace YOUR_API_KEY_HERE with your GNews key.');
    return;
  }

  showLoading(query);

  try {
    const targetUrl = BASE_URL +
      '?q=' + encodeURIComponent(query) +
      '&lang=en' +
      '&max=10' +
      '&token=' + API_KEY;

    // CORSプロキシ経由でリクエストを送る
    const url = CORS_PROXY + encodeURIComponent(targetUrl);

    const response = await fetch(url);
    const data = await response.json();

    // GNews returns error details in the JSON body even when status is not OK
    if (!response.ok) {
      const detail = data.errors ? data.errors.join(' / ') : 'Status ' + response.status;
      showError('API error: ' + detail);
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
    showError('Fetch failed: ' + err.message + ' — Open DevTools (F12) → Console for details.');
  }
}

// =====================
// Render Functions
// =====================

function showLoading(query) {
  document.getElementById('resultsArea').innerHTML =
    '<p class="status-message">Searching news for "' + escapeHtml(query) + '"...</p>';
}

function showEmpty(query) {
  document.getElementById('resultsArea').innerHTML =
    '<p class="status-message">No news found for "' + escapeHtml(query) + '".</p>';
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
  count.textContent = articles.length + ' articles found for "' + query + '"';
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

// Converts ISO date string (2026-07-02T12:00:00Z) to "Jul 2, 2026"
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
