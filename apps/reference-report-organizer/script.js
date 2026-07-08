// ===========================
// Reference & Report Organizer
// ===========================

const PAPERS_KEY = 'referenceReportOrganizer:papers:v1';
const REFERENCES_KEY = 'referenceReportOrganizer:references:v1';
const OLD_CHAPTERS_KEY = 'referenceReportOrganizer:chapters:v1';

let editingRefId = null;
let selectedPaperId = null;

// -----------------------
// ID helper
// -----------------------

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// -----------------------
// localStorage read/write
// -----------------------

function getPapers() {
  const raw = localStorage.getItem(PAPERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePapers(papers) {
  localStorage.setItem(PAPERS_KEY, JSON.stringify(papers));
}

function getReferences() {
  const raw = localStorage.getItem(REFERENCES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReferences(refs) {
  localStorage.setItem(REFERENCES_KEY, JSON.stringify(refs));
}

function sortedPapers() {
  return getPapers().slice().sort((a, b) => a.order - b.order);
}

function isValidUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

// -----------------------
// One-time migration from the old "chapter" model
// -----------------------

function migrateIfNeeded() {
  if (!localStorage.getItem(PAPERS_KEY)) {
    const oldRaw = localStorage.getItem(OLD_CHAPTERS_KEY);
    if (oldRaw) {
      try {
        const oldChapters = JSON.parse(oldRaw);
        if (Array.isArray(oldChapters)) {
          savePapers(oldChapters.map(function (c) {
            return { id: c.id, title: c.name, order: c.order };
          }));
        }
      } catch {
        // ignore corrupted legacy data
      }
    }
  }

  const refs = getReferences();
  let changed = false;
  refs.forEach(function (r) {
    if (r.chapterIds && !r.paperIds) {
      r.paperIds = r.chapterIds;
      delete r.chapterIds;
      changed = true;
    } else if (!Array.isArray(r.paperIds)) {
      r.paperIds = [];
      changed = true;
    }
  });
  if (changed) saveReferences(refs);
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  migrateIfNeeded();

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { showView(btn.dataset.view); });
  });

  document.getElementById('showAddRefBtn').addEventListener('click', openAddRefForm);
  document.getElementById('cancelRefBtn').addEventListener('click', closeRefForm);
  document.getElementById('refForm').addEventListener('submit', handleSubmitRef);
  document.getElementById('addQuoteBtn').addEventListener('click', function () { addQuoteRow(''); });
  document.getElementById('refSearch').addEventListener('input', renderRefList);

  document.getElementById('paperForm').addEventListener('submit', handleAddPaper);
  document.getElementById('copyDraftBtn').addEventListener('click', handleCopyDraft);

  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImportFile);

  renderRefList();
  renderPaperList();
});

function showView(viewId) {
  document.querySelectorAll('.view').forEach(function (section) {
    section.hidden = section.id !== viewId;
  });
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });
}

// ===========================
// Papers (By Paper view)
// ===========================

function handleAddPaper(e) {
  e.preventDefault();
  const input = document.getElementById('paperTitle');
  const title = input.value.trim();
  if (!title) return;

  const papers = getPapers();
  papers.push({ id: genId(), title: title, order: papers.length });
  savePapers(papers);

  input.value = '';
  renderPaperList();
  renderRefList();
  if (!document.getElementById('refForm').hidden) renderPaperCheckboxes();
}

function deletePaper(id) {
  const papers = sortedPapers().filter(function (p) { return p.id !== id; });
  papers.forEach(function (p, i) { p.order = i; });
  savePapers(papers);

  const refs = getReferences().map(function (r) {
    return Object.assign({}, r, {
      paperIds: r.paperIds.filter(function (pid) { return pid !== id; })
    });
  });
  saveReferences(refs);

  if (selectedPaperId === id) selectedPaperId = null;

  renderPaperList();
  renderRefList();
  if (!document.getElementById('refForm').hidden) renderPaperCheckboxes();
}

function selectPaper(id) {
  selectedPaperId = id;
  renderPaperList();
}

function referenceCountForPaper(paperId) {
  return getReferences().filter(function (r) { return r.paperIds.includes(paperId); }).length;
}

function renderPaperList() {
  const list = document.getElementById('paperList');
  list.innerHTML = '';

  const papers = sortedPapers();

  if (papers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No papers yet. Add one above to start organizing your references.';
    list.appendChild(empty);
    renderPaperRefList();
    return;
  }

  if (selectedPaperId && !papers.some(function (p) { return p.id === selectedPaperId; })) {
    selectedPaperId = null;
  }

  papers.forEach(function (paper) {
    list.appendChild(createPaperItem(paper));
  });

  renderPaperRefList();
}

function createPaperItem(paper) {
  const item = document.createElement('div');
  item.className = 'paper-item' + (paper.id === selectedPaperId ? ' selected' : '');

  const selectBtn = document.createElement('button');
  selectBtn.type = 'button';
  selectBtn.className = 'paper-select-btn';
  selectBtn.addEventListener('click', function () { selectPaper(paper.id); });

  const titleSpan = document.createElement('span');
  titleSpan.textContent = paper.title;
  selectBtn.appendChild(titleSpan);

  const count = document.createElement('span');
  count.className = 'paper-ref-count';
  const n = referenceCountForPaper(paper.id);
  count.textContent = n === 1 ? '(1 reference)' : '(' + n + ' references)';
  selectBtn.appendChild(count);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete paper ' + paper.title);
  deleteBtn.addEventListener('click', function () { deletePaper(paper.id); });

  item.appendChild(selectBtn);
  item.appendChild(deleteBtn);

  return item;
}

// ===========================
// Reference form (add / edit)
// ===========================

function openAddRefForm() {
  editingRefId = null;
  document.getElementById('refFormTitle').textContent = 'Add reference';
  document.getElementById('refSubmitBtn').textContent = 'Add reference';
  document.getElementById('refTitle').value = '';
  document.getElementById('refAuthors').value = '';
  document.getElementById('refUrl').value = '';
  document.getElementById('refSummary').value = '';
  document.getElementById('refNote').value = '';
  document.getElementById('quoteList').innerHTML = '';
  addQuoteRow('');
  renderPaperCheckboxes([]);
  document.getElementById('refForm').hidden = false;
  document.getElementById('refTitle').focus();
}

function openEditRefForm(ref) {
  editingRefId = ref.id;
  document.getElementById('refFormTitle').textContent = 'Edit reference';
  document.getElementById('refSubmitBtn').textContent = 'Save changes';
  document.getElementById('refTitle').value = ref.title;
  document.getElementById('refAuthors').value = ref.authors || '';
  document.getElementById('refUrl').value = ref.url || '';
  document.getElementById('refSummary').value = ref.summary || '';
  document.getElementById('refNote').value = ref.note || '';

  const quoteList = document.getElementById('quoteList');
  quoteList.innerHTML = '';
  if (ref.quotes && ref.quotes.length) {
    ref.quotes.forEach(function (q) { addQuoteRow(q.text, q.source); });
  } else {
    addQuoteRow('');
  }

  renderPaperCheckboxes(ref.paperIds || []);
  document.getElementById('refForm').hidden = false;
  document.getElementById('refForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('refTitle').focus();
}

function closeRefForm() {
  editingRefId = null;
  document.getElementById('refForm').hidden = true;
}

function addQuoteRow(text, source) {
  const quoteList = document.getElementById('quoteList');
  const row = document.createElement('div');
  row.className = 'quote-row';

  const fields = document.createElement('div');
  fields.className = 'quote-row-fields';

  const textarea = document.createElement('textarea');
  textarea.className = 'quote-input';
  textarea.value = text || '';
  textarea.placeholder = 'Quote or excerpt';
  textarea.setAttribute('aria-label', 'Quote or excerpt');

  const sourceInput = document.createElement('input');
  sourceInput.type = 'text';
  sourceInput.className = 'quote-source-input';
  sourceInput.value = source || '';
  sourceInput.placeholder = 'Source (e.g. p. 12, Introduction)';
  sourceInput.setAttribute('aria-label', 'Source of this quote');

  fields.appendChild(textarea);
  fields.appendChild(sourceInput);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'quote-remove-btn';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', 'Remove quote');
  removeBtn.addEventListener('click', function () { row.remove(); });

  row.appendChild(fields);
  row.appendChild(removeBtn);
  quoteList.appendChild(row);
}

function renderPaperCheckboxes(selectedIds) {
  const selected = new Set(selectedIds || []);
  const container = document.getElementById('paperCheckboxes');
  container.innerHTML = '';

  const papers = sortedPapers();

  if (papers.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'muted-hint';
    hint.textContent = 'No papers yet. Add one in the By Paper tab first.';
    container.appendChild(hint);
    return;
  }

  const list = document.createElement('div');
  list.className = 'checkbox-list';

  papers.forEach(function (paper) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = paper.id;
    checkbox.checked = selected.has(paper.id);

    const span = document.createElement('span');
    span.textContent = paper.title;

    label.appendChild(checkbox);
    label.appendChild(span);
    list.appendChild(label);
  });

  container.appendChild(list);
}

function handleSubmitRef(e) {
  e.preventDefault();

  const title = document.getElementById('refTitle').value.trim();
  if (!title) return;

  const authors = document.getElementById('refAuthors').value.trim();
  const urlRaw = document.getElementById('refUrl').value.trim();
  const url = isValidUrl(urlRaw) ? urlRaw : '';
  const summary = document.getElementById('refSummary').value.trim();
  const note = document.getElementById('refNote').value.trim();

  const quotes = Array.from(document.querySelectorAll('#quoteList .quote-row'))
    .map(function (row) {
      return {
        text: row.querySelector('.quote-input').value.trim(),
        source: row.querySelector('.quote-source-input').value.trim()
      };
    })
    .filter(function (q) { return q.text.length > 0; })
    .map(function (q) { return { id: genId(), text: q.text, source: q.source }; });

  const paperIds = Array.from(document.querySelectorAll('#paperCheckboxes input[type="checkbox"]:checked'))
    .map(function (el) { return el.value; });

  const refs = getReferences();

  if (editingRefId) {
    const existing = refs.find(function (r) { return r.id === editingRefId; });
    if (existing) {
      existing.title = title;
      existing.authors = authors;
      existing.url = url;
      existing.summary = summary;
      existing.note = note;
      existing.quotes = quotes;
      existing.paperIds = paperIds;
    }
  } else {
    refs.push({
      id: genId(),
      title: title,
      authors: authors,
      url: url,
      summary: summary,
      note: note,
      quotes: quotes,
      paperIds: paperIds,
      createdAt: Date.now()
    });
  }

  saveReferences(refs);
  closeRefForm();
  renderRefList();
  renderPaperList();
}

// ===========================
// All References view
// ===========================

function deleteReference(id) {
  const refs = getReferences().filter(function (r) { return r.id !== id; });
  saveReferences(refs);
  renderRefList();
  renderPaperList();
}

function renderRefList() {
  const list = document.getElementById('refList');
  list.innerHTML = '';

  const allRefs = getReferences();
  const query = document.getElementById('refSearch').value.trim().toLowerCase();

  if (allRefs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No references yet. Click "+ Add reference" above to get started.';
    list.appendChild(empty);
    return;
  }

  const filtered = query
    ? allRefs.filter(function (r) {
        return [r.title, r.authors, r.summary, r.note].some(function (field) {
          return (field || '').toLowerCase().includes(query);
        });
      })
    : allRefs;

  if (filtered.length === 0) {
    const noResults = document.createElement('p');
    noResults.className = 'empty-message';
    noResults.textContent = 'No references match your search.';
    list.appendChild(noResults);
    return;
  }

  const paperMap = new Map(getPapers().map(function (p) { return [p.id, p.title]; }));

  filtered.forEach(function (ref) {
    list.appendChild(createRefCard(ref, paperMap));
  });
}

function createRefCard(ref, paperMap) {
  const card = document.createElement('div');
  card.className = 'ref-card';

  const header = document.createElement('div');
  header.className = 'ref-card-header';

  const titleWrap = document.createElement('div');
  if (isValidUrl(ref.url)) {
    const link = document.createElement('a');
    link.className = 'ref-title';
    link.href = ref.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = ref.title;
    titleWrap.appendChild(link);
  } else {
    const span = document.createElement('span');
    span.className = 'ref-title';
    span.textContent = ref.title;
    titleWrap.appendChild(span);
  }
  if (ref.authors) {
    const authors = document.createElement('p');
    authors.className = 'ref-authors';
    authors.textContent = ref.authors;
    titleWrap.appendChild(authors);
  }

  const actions = document.createElement('div');
  actions.className = 'ref-card-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function () { openEditRefForm(ref); });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function () { deleteReference(ref.id); });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  header.appendChild(titleWrap);
  header.appendChild(actions);
  card.appendChild(header);

  if (ref.summary) {
    const label = document.createElement('p');
    label.className = 'card-label';
    label.textContent = 'Summary';
    const text = document.createElement('p');
    text.className = 'card-text';
    text.textContent = ref.summary;
    card.appendChild(label);
    card.appendChild(text);
  }

  const chips = document.createElement('div');
  chips.className = 'chip-row';
  const linkedTitles = (ref.paperIds || [])
    .map(function (id) { return paperMap.get(id); })
    .filter(Boolean);

  if (linkedTitles.length) {
    linkedTitles.forEach(function (title) {
      const chip = document.createElement('span');
      chip.className = 'paper-chip';
      chip.textContent = title;
      chips.appendChild(chip);
    });
  } else {
    const chip = document.createElement('span');
    chip.className = 'muted-hint';
    chip.textContent = 'No papers assigned';
    chips.appendChild(chip);
  }
  card.appendChild(chips);

  return card;
}

// ===========================
// By Paper view
// ===========================

function getRefsForPaper(paperId) {
  return getReferences().filter(function (r) { return r.paperIds.includes(paperId); });
}

function renderPaperRefList() {
  const container = document.getElementById('paperRefList');
  const copyBtn = document.getElementById('copyDraftBtn');
  container.innerHTML = '';
  document.getElementById('copyStatus').textContent = '';

  const papers = sortedPapers();
  if (papers.length === 0) {
    copyBtn.hidden = true;
    return;
  }

  if (!selectedPaperId) {
    copyBtn.hidden = true;
    const hint = document.createElement('p');
    hint.className = 'empty-message';
    hint.textContent = 'Select a paper above to see its references.';
    container.appendChild(hint);
    return;
  }

  copyBtn.hidden = false;
  const refs = getRefsForPaper(selectedPaperId);

  if (refs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No references linked to this paper yet. Assign some from the All References tab.';
    container.appendChild(empty);
    return;
  }

  refs.forEach(function (ref) {
    container.appendChild(createPaperRefDetailCard(ref));
  });
}

function createPaperRefDetailCard(ref) {
  const card = document.createElement('div');
  card.className = 'ref-card';

  const titleWrap = document.createElement('div');
  if (isValidUrl(ref.url)) {
    const link = document.createElement('a');
    link.className = 'ref-title';
    link.href = ref.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = ref.title;
    titleWrap.appendChild(link);
  } else {
    const span = document.createElement('span');
    span.className = 'ref-title';
    span.textContent = ref.title;
    titleWrap.appendChild(span);
  }
  card.appendChild(titleWrap);

  if (ref.authors) {
    const authors = document.createElement('p');
    authors.className = 'ref-authors';
    authors.textContent = ref.authors;
    card.appendChild(authors);
  }

  addLabeledText(card, 'Summary', ref.summary || '(no summary)');

  const quotesLabel = document.createElement('p');
  quotesLabel.className = 'card-label';
  quotesLabel.textContent = 'Key quotes / excerpts';
  card.appendChild(quotesLabel);

  if (ref.quotes && ref.quotes.length) {
    const ul = document.createElement('ul');
    ul.className = 'quote-block';
    ref.quotes.forEach(function (q) {
      const li = document.createElement('li');
      li.textContent = q.text;
      if (q.source) {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'quote-source';
        sourceSpan.textContent = 'Source: ' + q.source;
        li.appendChild(sourceSpan);
      }
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.className = 'card-text';
    p.textContent = '(none)';
    card.appendChild(p);
  }

  addLabeledText(card, 'Personal note', ref.note || '(none)');

  return card;
}

function addLabeledText(container, labelText, text) {
  const label = document.createElement('p');
  label.className = 'card-label';
  label.textContent = labelText;
  const p = document.createElement('p');
  p.className = 'card-text';
  p.textContent = text;
  container.appendChild(label);
  container.appendChild(p);
}

// ===========================
// Copy for draft
// ===========================

function buildDraftText(paper, refs) {
  const lines = ['Paper: ' + paper.title, ''];

  refs.forEach(function (ref) {
    lines.push(ref.title + ' — ' + (ref.authors || 'Unknown author'));
    if (ref.url) lines.push('URL: ' + ref.url);
    lines.push('Summary:');
    lines.push(ref.summary || '(no summary)');
    lines.push('');
    lines.push('Key quotes/excerpts:');
    if (ref.quotes && ref.quotes.length) {
      ref.quotes.forEach(function (q) {
        lines.push('- ' + q.text + (q.source ? ' (Source: ' + q.source + ')' : ''));
      });
    } else {
      lines.push('(none)');
    }
    lines.push('');
    lines.push('Personal note:');
    lines.push(ref.note || '(none)');
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

function handleCopyDraft() {
  const status = document.getElementById('copyStatus');
  const papers = sortedPapers();
  const paper = papers.find(function (p) { return p.id === selectedPaperId; });

  if (!paper) {
    status.classList.add('error');
    status.textContent = 'Select a paper first.';
    return;
  }

  const refs = getRefsForPaper(paper.id);
  if (refs.length === 0) {
    status.classList.add('error');
    status.textContent = 'No references linked to this paper yet.';
    return;
  }

  const text = buildDraftText(paper, refs);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      status.classList.remove('error');
      status.textContent = 'Copied to clipboard!';
    }, function () {
      const ok = fallbackCopy(text);
      status.classList.toggle('error', !ok);
      status.textContent = ok ? 'Copied to clipboard!' : 'Failed to copy. Please try again.';
    });
  } else {
    const ok = fallbackCopy(text);
    status.classList.toggle('error', !ok);
    status.textContent = ok ? 'Copied to clipboard!' : 'Failed to copy. Please try again.';
  }
}

// ===========================
// Export / Import
// ===========================

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function handleExport() {
  const data = {
    papers: getPapers(),
    references: getReferences()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reference-report-organizer-export-' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const status = document.getElementById('dataStatus');
  status.classList.remove('error');
  status.textContent = 'Export complete';
}

function mergePapers(existing, imported) {
  const map = new Map(existing.map(function (p) { return [p.id, p]; }));
  let nextOrder = existing.length;
  imported.forEach(function (p) {
    if (p && (typeof p.id === 'string' || typeof p.id === 'number') && typeof p.title === 'string') {
      map.set(p.id, {
        id: p.id,
        title: p.title,
        order: typeof p.order === 'number' ? p.order : nextOrder++
      });
    }
  });
  return Array.from(map.values());
}

function mergeReferences(existing, imported, validPaperIds) {
  const map = new Map(existing.map(function (r) { return [r.id, r]; }));
  imported.forEach(function (r) {
    if (r && (typeof r.id === 'string' || typeof r.id === 'number') && typeof r.title === 'string') {
      const quotes = Array.isArray(r.quotes)
        ? r.quotes
            .filter(function (q) { return q && typeof q.text === 'string'; })
            .map(function (q) {
              return {
                id: (typeof q.id === 'string' || typeof q.id === 'number') ? q.id : genId(),
                text: q.text,
                source: typeof q.source === 'string' ? q.source : ''
              };
            })
        : [];
      const paperIds = Array.isArray(r.paperIds)
        ? r.paperIds.filter(function (pid) { return validPaperIds.has(pid); })
        : [];

      map.set(r.id, {
        id: r.id,
        title: r.title,
        authors: typeof r.authors === 'string' ? r.authors : '',
        url: typeof r.url === 'string' ? r.url : '',
        summary: typeof r.summary === 'string' ? r.summary : '',
        note: typeof r.note === 'string' ? r.note : '',
        quotes: quotes,
        paperIds: paperIds,
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now()
      });
    }
  });
  return Array.from(map.values());
}

function handleImportFile(e) {
  const file = e.target.files[0];
  const status = document.getElementById('dataStatus');
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch {
      status.classList.add('error');
      status.textContent = 'Failed to read the JSON file.';
      e.target.value = '';
      return;
    }

    if (!data || !Array.isArray(data.papers) || !Array.isArray(data.references)) {
      status.classList.add('error');
      status.textContent = 'Failed to read the JSON file.';
      e.target.value = '';
      return;
    }

    const mergedPapers = mergePapers(getPapers(), data.papers);
    const validPaperIds = new Set(mergedPapers.map(function (p) { return p.id; }));
    const mergedRefs = mergeReferences(getReferences(), data.references, validPaperIds).map(function (r) {
      return Object.assign({}, r, {
        paperIds: r.paperIds.filter(function (pid) { return validPaperIds.has(pid); })
      });
    });

    savePapers(mergedPapers);
    saveReferences(mergedRefs);

    renderRefList();
    renderPaperList();
    if (!document.getElementById('refForm').hidden) closeRefForm();

    status.classList.remove('error');
    status.textContent = 'Import complete';
    e.target.value = '';
  };
  reader.readAsText(file);
}
