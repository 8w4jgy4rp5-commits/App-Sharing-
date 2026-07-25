// ===========================
// Company Watchlist - Script
// ===========================

// Key used to read/write data in localStorage
const STORAGE_KEY = 'companyWatchlist';

// Human-readable label for each status value
const STATUS_LABELS = {
  'watching':   'Watching',
  'top-choice': 'Top Choice',
  'follow-up':  'Follow Up'
};

// Clicking the badge cycles through statuses in this order
const STATUS_CYCLE = ['watching', 'top-choice', 'follow-up'];

// Tracks which filter button is currently active
let activeFilter = 'all';

// Tracks the current industry search string (lowercase for comparison)
let searchQuery = '';

// Run everything after the page has fully loaded
document.addEventListener('DOMContentLoaded', function () {
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
      alert('Import failed: not a valid JSON file');
      return;
    }

    if (!data || !Array.isArray(data.companies)) {
      alert('Import failed: unexpected file format');
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
    alert('Imported ' + added + ' compan' + (added === 1 ? 'y' : 'ies'));
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
      ? 'No companies yet. Add one above!'
      : 'No companies match your current filters.';
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
    tickerBadge.title = 'Click to edit ticker';
    tickerBadge.addEventListener('click', function () {
      startTickerEditing(company.id, company.ticker, tickerBadge, company.name);
    });
    nameGroup.appendChild(tickerBadge);
  } else {
    const tickerHint = document.createElement('span');
    tickerHint.className = 'add-ticker-hint';
    tickerHint.textContent = '+ Add ticker';
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
  badge.title = 'Click to change status';

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
  industryLabel.textContent = 'Industry';

  const industryText = document.createElement('p');
  industryText.className = 'card-text';
  industryText.textContent = company.industry;

  card.appendChild(industryLabel);
  card.appendChild(industryText);

  // --- Notes (always shown; click to edit inline) ---
  const notesLabel = document.createElement('p');
  notesLabel.className = 'card-label';
  notesLabel.textContent = 'Notes';

  const notesDisplay = document.createElement('p');
  notesDisplay.className = 'card-text card-notes';

  if (company.notes) {
    notesDisplay.textContent = company.notes;
  } else {
    const hint = document.createElement('span');
    hint.className = 'add-note-hint';
    hint.textContent = '+ Click to add a note';
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
  date.textContent = 'Added on ' + company.createdAt;

  // "Check price" link — only shown when a ticker is set
  if (company.ticker) {
    const checkBtn = document.createElement('a');
    checkBtn.href      = '../stock-checker/index.html?ticker=' + encodeURIComponent(company.ticker);
    checkBtn.target    = '_blank';
    checkBtn.rel       = 'noopener noreferrer';
    checkBtn.className = 'check-price-btn';
    checkBtn.textContent = 'Check price →';
    footer.appendChild(date);
    footer.appendChild(checkBtn);
  } else {
    footer.appendChild(date);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Remove';

  deleteBtn.addEventListener('click', function () {
    if (confirm('Remove "' + company.name + '" from your watchlist?')) {
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
  input.placeholder = 'e.g. AAPL';
  input.maxLength = 10;

  const searchBtn = document.createElement('button');
  searchBtn.type      = 'button';
  searchBtn.className = 'ticker-search-btn ticker-search-btn-inline';
  searchBtn.textContent = '🔍';
  searchBtn.title     = 'Search ticker by company name';

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
  textarea.placeholder = 'Write a note...';

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
    showTickerMessage(resultsEl, 'Enter a company name first');
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
      showTickerMessage(resultsEl, 'No matches found — you can enter the ticker manually');
      return;
    }

    renderTickerResults(results.slice(0, 5), resultsEl, onSelect);
  } catch (e) {
    showTickerMessage(resultsEl, 'Search failed — you can enter the ticker manually');
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
