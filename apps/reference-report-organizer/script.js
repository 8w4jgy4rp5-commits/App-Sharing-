// ===========================
// Reference & Report Organizer
// ===========================

const CHAPTERS_KEY = 'referenceReportOrganizer:chapters:v1';
const REFERENCES_KEY = 'referenceReportOrganizer:references:v1';

let editingRefId = null;

// -----------------------
// ID helper
// -----------------------

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// -----------------------
// localStorage read/write
// -----------------------

function getChapters() {
  const raw = localStorage.getItem(CHAPTERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChapters(chapters) {
  localStorage.setItem(CHAPTERS_KEY, JSON.stringify(chapters));
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

function sortedChapters() {
  return getChapters().slice().sort((a, b) => a.order - b.order);
}

function isValidUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { showView(btn.dataset.view); });
  });

  document.getElementById('chapterForm').addEventListener('submit', handleAddChapter);
  document.getElementById('showAddRefBtn').addEventListener('click', openAddRefForm);
  document.getElementById('cancelRefBtn').addEventListener('click', closeRefForm);
  document.getElementById('refForm').addEventListener('submit', handleSubmitRef);
  document.getElementById('addQuoteBtn').addEventListener('click', function () { addQuoteRow(''); });
  document.getElementById('refSearch').addEventListener('input', renderRefList);
  document.getElementById('chapterSelect').addEventListener('change', renderChapterRefList);
  document.getElementById('copyDraftBtn').addEventListener('click', handleCopyDraft);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleImportFile);

  renderChapters();
  renderRefList();
  renderChapterSelect();
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
// Chapters
// ===========================

function handleAddChapter(e) {
  e.preventDefault();
  const input = document.getElementById('chapterName');
  const name = input.value.trim();
  if (!name) return;

  const chapters = getChapters();
  chapters.push({ id: genId(), name: name, order: chapters.length });
  saveChapters(chapters);

  input.value = '';
  renderChapters();
  renderChapterSelect();
  if (!document.getElementById('refForm').hidden) renderChapterCheckboxes();
}

function moveChapter(id, direction) {
  const chapters = sortedChapters();
  const idx = chapters.findIndex(function (c) { return c.id === id; });
  const swapIdx = idx + direction;
  if (idx < 0 || swapIdx < 0 || swapIdx >= chapters.length) return;

  const tmp = chapters[idx];
  chapters[idx] = chapters[swapIdx];
  chapters[swapIdx] = tmp;
  chapters.forEach(function (c, i) { c.order = i; });

  saveChapters(chapters);
  renderChapters();
  renderChapterSelect();
}

function renameChapter(id, newName) {
  const name = newName.trim();
  if (!name) { renderChapters(); return; }

  const chapters = getChapters();
  const chapter = chapters.find(function (c) { return c.id === id; });
  if (!chapter) return;
  chapter.name = name;
  saveChapters(chapters);
  renderChapters();
  renderChapterSelect();
  renderChapterRefList();
  if (!document.getElementById('refForm').hidden) renderChapterCheckboxes();
}

function deleteChapter(id) {
  const chapters = sortedChapters().filter(function (c) { return c.id !== id; });
  chapters.forEach(function (c, i) { c.order = i; });
  saveChapters(chapters);

  const refs = getReferences().map(function (r) {
    return Object.assign({}, r, {
      chapterIds: r.chapterIds.filter(function (cid) { return cid !== id; })
    });
  });
  saveReferences(refs);

  renderChapters();
  renderRefList();
  renderChapterSelect();
  if (!document.getElementById('refForm').hidden) renderChapterCheckboxes();
}

function referenceCountForChapter(chapterId) {
  return getReferences().filter(function (r) { return r.chapterIds.includes(chapterId); }).length;
}

function renderChapters() {
  const list = document.getElementById('chapterList');
  list.innerHTML = '';

  const chapters = sortedChapters();

  if (chapters.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No chapters yet. Add one above to start organizing your report.';
    list.appendChild(empty);
    return;
  }

  chapters.forEach(function (chapter, index) {
    list.appendChild(createChapterCard(chapter, index === 0, index === chapters.length - 1));
  });
}

function createChapterCard(chapter, isFirst, isLast) {
  const card = document.createElement('div');
  card.className = 'chapter-card';

  const controls = document.createElement('div');
  controls.className = 'chapter-order-controls';

  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.textContent = '▲';
  upBtn.setAttribute('aria-label', 'Move chapter up');
  upBtn.disabled = isFirst;
  upBtn.addEventListener('click', function () { moveChapter(chapter.id, -1); });

  const downBtn = document.createElement('button');
  downBtn.type = 'button';
  downBtn.textContent = '▼';
  downBtn.setAttribute('aria-label', 'Move chapter down');
  downBtn.disabled = isLast;
  downBtn.addEventListener('click', function () { moveChapter(chapter.id, 1); });

  controls.appendChild(upBtn);
  controls.appendChild(downBtn);

  const main = document.createElement('div');
  main.className = 'chapter-main';

  const nameDisplay = document.createElement('span');
  nameDisplay.className = 'chapter-name-display';
  nameDisplay.textContent = chapter.name;
  nameDisplay.tabIndex = 0;
  nameDisplay.setAttribute('role', 'button');
  nameDisplay.setAttribute('aria-label', 'Edit chapter name');
  nameDisplay.addEventListener('click', function () { startRenameChapter(chapter, main, nameDisplay); });

  const count = document.createElement('p');
  count.className = 'chapter-ref-count';
  const n = referenceCountForChapter(chapter.id);
  count.textContent = n === 1 ? '1 reference linked' : n + ' references linked';

  main.appendChild(nameDisplay);
  main.appendChild(count);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete chapter ' + chapter.name);
  deleteBtn.addEventListener('click', function () { deleteChapter(chapter.id); });

  card.appendChild(controls);
  card.appendChild(main);
  card.appendChild(deleteBtn);

  return card;
}

function startRenameChapter(chapter, container, nameDisplay) {
  const editor = document.createElement('input');
  editor.type = 'text';
  editor.className = 'chapter-name-editor';
  editor.value = chapter.name;

  container.replaceChild(editor, nameDisplay);
  editor.focus();
  editor.select();

  function commit() {
    renameChapter(chapter.id, editor.value);
  }

  editor.addEventListener('blur', commit);
  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); editor.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); renderChapters(); }
  });
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
  renderChapterCheckboxes([]);
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
    ref.quotes.forEach(function (q) { addQuoteRow(q.text); });
  } else {
    addQuoteRow('');
  }

  renderChapterCheckboxes(ref.chapterIds || []);
  document.getElementById('refForm').hidden = false;
  document.getElementById('refForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('refTitle').focus();
}

function closeRefForm() {
  editingRefId = null;
  document.getElementById('refForm').hidden = true;
}

function addQuoteRow(text) {
  const quoteList = document.getElementById('quoteList');
  const row = document.createElement('div');
  row.className = 'quote-row';

  const textarea = document.createElement('textarea');
  textarea.className = 'quote-input';
  textarea.value = text || '';
  textarea.placeholder = 'Quote or excerpt';
  textarea.setAttribute('aria-label', 'Quote or excerpt');

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'quote-remove-btn';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', 'Remove quote');
  removeBtn.addEventListener('click', function () { row.remove(); });

  row.appendChild(textarea);
  row.appendChild(removeBtn);
  quoteList.appendChild(row);
}

function renderChapterCheckboxes(selectedIds) {
  const selected = new Set(selectedIds || []);
  const container = document.getElementById('chapterCheckboxes');
  container.innerHTML = '';

  const chapters = sortedChapters();

  if (chapters.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'muted-hint';
    hint.textContent = 'No chapters yet. Add one in the Chapters tab first.';
    container.appendChild(hint);
    return;
  }

  const list = document.createElement('div');
  list.className = 'checkbox-list';

  chapters.forEach(function (chapter) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = chapter.id;
    checkbox.checked = selected.has(chapter.id);

    const span = document.createElement('span');
    span.textContent = chapter.name;

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

  const quotes = Array.from(document.querySelectorAll('#quoteList .quote-input'))
    .map(function (el) { return el.value.trim(); })
    .filter(function (text) { return text.length > 0; })
    .map(function (text) { return { id: genId(), text: text }; });

  const chapterIds = Array.from(document.querySelectorAll('#chapterCheckboxes input[type="checkbox"]:checked'))
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
      existing.chapterIds = chapterIds;
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
      chapterIds: chapterIds,
      createdAt: Date.now()
    });
  }

  saveReferences(refs);
  closeRefForm();
  renderRefList();
  renderChapters();
  renderChapterRefList();
}

// ===========================
// All References view
// ===========================

function deleteReference(id) {
  const refs = getReferences().filter(function (r) { return r.id !== id; });
  saveReferences(refs);
  renderRefList();
  renderChapters();
  renderChapterRefList();
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

  const chapterMap = new Map(getChapters().map(function (c) { return [c.id, c.name]; }));

  filtered.forEach(function (ref) {
    list.appendChild(createRefCard(ref, chapterMap));
  });
}

function createRefCard(ref, chapterMap) {
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
  const linkedNames = (ref.chapterIds || [])
    .map(function (id) { return chapterMap.get(id); })
    .filter(Boolean);

  if (linkedNames.length) {
    linkedNames.forEach(function (name) {
      const chip = document.createElement('span');
      chip.className = 'chapter-chip';
      chip.textContent = name;
      chips.appendChild(chip);
    });
  } else {
    const chip = document.createElement('span');
    chip.className = 'muted-hint';
    chip.textContent = 'No chapters assigned';
    chips.appendChild(chip);
  }
  card.appendChild(chips);

  return card;
}

// ===========================
// By Chapter view
// ===========================

function renderChapterSelect() {
  const select = document.getElementById('chapterSelect');
  const previousValue = select.value;
  select.innerHTML = '';

  const chapters = sortedChapters();

  if (chapters.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No chapters yet';
    select.appendChild(option);
    select.disabled = true;
    renderChapterRefList();
    return;
  }

  select.disabled = false;
  chapters.forEach(function (chapter) {
    const option = document.createElement('option');
    option.value = chapter.id;
    option.textContent = chapter.name;
    select.appendChild(option);
  });

  if (chapters.some(function (c) { return c.id === previousValue; })) {
    select.value = previousValue;
  }

  renderChapterRefList();
}

function getRefsForChapter(chapterId) {
  return getReferences().filter(function (r) { return r.chapterIds.includes(chapterId); });
}

function renderChapterRefList() {
  const container = document.getElementById('chapterRefList');
  container.innerHTML = '';
  document.getElementById('copyStatus').textContent = '';

  const chapters = sortedChapters();
  if (chapters.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'Add a chapter first, then link references to it.';
    container.appendChild(empty);
    return;
  }

  const chapterId = document.getElementById('chapterSelect').value;
  const refs = getRefsForChapter(chapterId);

  if (refs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No references linked to this chapter yet. Assign some from the All References tab.';
    container.appendChild(empty);
    return;
  }

  refs.forEach(function (ref) {
    container.appendChild(createChapterRefDetailCard(ref));
  });
}

function createChapterRefDetailCard(ref) {
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

function buildDraftText(chapter, refs) {
  const lines = ['Chapter: ' + chapter.name, ''];

  refs.forEach(function (ref) {
    lines.push(ref.title + ' — ' + (ref.authors || 'Unknown author'));
    if (ref.url) lines.push('URL: ' + ref.url);
    lines.push('Summary:');
    lines.push(ref.summary || '(no summary)');
    lines.push('');
    lines.push('Key quotes/excerpts:');
    if (ref.quotes && ref.quotes.length) {
      ref.quotes.forEach(function (q) { lines.push('- ' + q.text); });
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
  const chapters = sortedChapters();
  const chapterId = document.getElementById('chapterSelect').value;
  const chapter = chapters.find(function (c) { return c.id === chapterId; });

  if (!chapter) {
    status.textContent = 'Add a chapter first.';
    status.classList.add('error');
    return;
  }

  const refs = getRefsForChapter(chapterId);
  if (refs.length === 0) {
    status.textContent = 'No references linked to this chapter yet.';
    status.classList.add('error');
    return;
  }

  const text = buildDraftText(chapter, refs);

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
    chapters: getChapters(),
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

function mergeChapters(existing, imported) {
  const map = new Map(existing.map(function (c) { return [c.id, c]; }));
  let nextOrder = existing.length;
  imported.forEach(function (c) {
    if (c && (typeof c.id === 'string' || typeof c.id === 'number') && typeof c.name === 'string') {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        order: typeof c.order === 'number' ? c.order : nextOrder++
      });
    }
  });
  return Array.from(map.values());
}

function mergeReferences(existing, imported, validChapterIds) {
  const map = new Map(existing.map(function (r) { return [r.id, r]; }));
  imported.forEach(function (r) {
    if (r && (typeof r.id === 'string' || typeof r.id === 'number') && typeof r.title === 'string') {
      const quotes = Array.isArray(r.quotes)
        ? r.quotes
            .filter(function (q) { return q && typeof q.text === 'string'; })
            .map(function (q) { return { id: (typeof q.id === 'string' || typeof q.id === 'number') ? q.id : genId(), text: q.text }; })
        : [];
      const chapterIds = Array.isArray(r.chapterIds)
        ? r.chapterIds.filter(function (cid) { return validChapterIds.has(cid); })
        : [];

      map.set(r.id, {
        id: r.id,
        title: r.title,
        authors: typeof r.authors === 'string' ? r.authors : '',
        url: typeof r.url === 'string' ? r.url : '',
        summary: typeof r.summary === 'string' ? r.summary : '',
        note: typeof r.note === 'string' ? r.note : '',
        quotes: quotes,
        chapterIds: chapterIds,
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

    if (!data || !Array.isArray(data.chapters) || !Array.isArray(data.references)) {
      status.classList.add('error');
      status.textContent = 'Failed to read the JSON file.';
      e.target.value = '';
      return;
    }

    const mergedChapters = mergeChapters(getChapters(), data.chapters);
    const validChapterIds = new Set(mergedChapters.map(function (c) { return c.id; }));
    const mergedRefs = mergeReferences(getReferences(), data.references, validChapterIds).map(function (r) {
      return Object.assign({}, r, {
        chapterIds: r.chapterIds.filter(function (cid) { return validChapterIds.has(cid); })
      });
    });

    saveChapters(mergedChapters);
    saveReferences(mergedRefs);

    renderChapters();
    renderRefList();
    renderChapterSelect();
    if (!document.getElementById('refForm').hidden) closeRefForm();

    status.classList.remove('error');
    status.textContent = 'Import complete';
    e.target.value = '';
  };
  reader.readAsText(file);
}
