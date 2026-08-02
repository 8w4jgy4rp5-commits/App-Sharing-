const STORAGE_KEY = 'vocabTracker:words:v1';

const FILTER_LABELS = { all: 'All', learning: 'Learning', known: 'Known' };

let filter = 'all';
let searchQuery = '';
let editingId = null;
let editError = '';

let quizQueue = [];
let quizIndex = 0;
let correctCount = 0;
let quizAnswered = false;

// -----------------------
// Storage helpers
// -----------------------

function getWords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWords(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function getLearningWords(words) {
  return words.filter((w) => w.status === 'learning');
}

// -----------------------
// DOM references
// -----------------------

const addForm = document.getElementById('add-form');
const wordInput = document.getElementById('word-input');
const meaningInput = document.getElementById('meaning-input');
const errorMsg = document.getElementById('error-msg');
const statusMsg = document.getElementById('status-msg');

const wordCountEl = document.getElementById('word-count');
const filterTabs = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const wordListEl = document.getElementById('word-list');
const emptyState = document.getElementById('empty-state');
const noResultsState = document.getElementById('no-results-state');

const quizIntroSection = document.getElementById('quiz-intro');
const quizIntroText = document.getElementById('quiz-intro-text');
const startQuizBtn = document.getElementById('start-quiz-btn');
const quizPlaySection = document.getElementById('quiz-play');
const quizProgress = document.getElementById('quiz-progress');
const quizWordEl = document.getElementById('quiz-word');
const quizOptionsEl = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const nextBtn = document.getElementById('next-btn');
const exitQuizBtn = document.getElementById('exit-quiz-btn');
const quizResultSection = document.getElementById('quiz-result');
const quizResultText = document.getElementById('quiz-result-text');
const quizAgainBtn = document.getElementById('quiz-again-btn');
const quizCloseBtn = document.getElementById('quiz-close-btn');

// -----------------------
// Add word
// -----------------------

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (!word || !meaning) {
    errorMsg.textContent = 'Please enter both a word and its meaning.';
    errorMsg.hidden = false;
    return;
  }
  errorMsg.hidden = true;

  const words = getWords();
  words.push({
    id: String(Date.now()),
    word,
    meaning,
    status: 'learning',
    createdAt: Date.now(),
  });
  saveWords(words);

  statusMsg.textContent = `Added "${word}".`;
  wordInput.value = '';
  meaningInput.value = '';
  wordInput.focus();
  refreshAll();
});

// -----------------------
// Filter tabs + search
// -----------------------

filterTabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterTabs.forEach((b) => b.classList.toggle('active', b === btn));
    renderList();
  });
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  renderList();
});

function matchesSearch(w, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q);
}

// -----------------------
// Word list rendering
// -----------------------

function renderList() {
  const words = getWords();
  wordCountEl.textContent = words.length ? `(${words.length})` : '';

  filterTabs.forEach((btn) => {
    const key = btn.dataset.filter;
    const count = key === 'all' ? words.length : words.filter((w) => w.status === key).length;
    btn.textContent = `${FILTER_LABELS[key]} (${count})`;
  });

  const filtered = words
    .filter((w) => (filter === 'all' ? true : w.status === filter) && matchesSearch(w, searchQuery))
    .sort((a, b) => b.createdAt - a.createdAt);

  wordListEl.innerHTML = '';

  if (words.length === 0) {
    emptyState.hidden = false;
    noResultsState.hidden = true;
    return;
  }
  emptyState.hidden = true;

  if (filtered.length === 0) {
    noResultsState.hidden = false;
    noResultsState.querySelector('p').textContent = searchQuery.trim()
      ? 'No words match your search.'
      : `No ${filter} words yet.`;
    return;
  }
  noResultsState.hidden = true;

  filtered.forEach((w) => wordListEl.appendChild(renderWordItem(w)));
}

function renderWordItem(w) {
  const li = document.createElement('li');
  li.className = 'word-card';
  li.dataset.id = w.id;

  if (editingId === w.id) {
    li.appendChild(renderEditForm(w));
    return li;
  }

  const main = document.createElement('div');
  main.className = 'word-card-main';

  const textWrap = document.createElement('div');
  const wordEl = document.createElement('p');
  wordEl.className = 'word-text';
  wordEl.textContent = w.word;
  const meaningEl = document.createElement('p');
  meaningEl.className = 'meaning-text';
  meaningEl.textContent = w.meaning;
  textWrap.appendChild(wordEl);
  textWrap.appendChild(meaningEl);

  const badge = document.createElement('span');
  badge.className = `status-badge ${w.status}`;
  badge.textContent = w.status === 'known' ? 'Known' : 'Learning';

  main.appendChild(textWrap);
  main.appendChild(badge);

  const actions = document.createElement('div');
  actions.className = 'word-card-actions';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'word-action-btn';
  toggleBtn.dataset.action = 'toggle-status';
  toggleBtn.dataset.id = w.id;
  toggleBtn.textContent = w.status === 'known' ? 'Mark as Learning' : 'Mark as Known';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'word-action-btn';
  editBtn.dataset.action = 'edit';
  editBtn.dataset.id = w.id;
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'word-action-btn delete-btn';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.dataset.id = w.id;
  deleteBtn.textContent = 'Delete';

  actions.appendChild(toggleBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(main);
  li.appendChild(actions);
  return li;
}

function renderEditForm(w) {
  const form = document.createElement('div');
  form.className = 'edit-form';

  const wordField = document.createElement('input');
  wordField.className = 'map-input edit-word-input';
  wordField.type = 'text';
  wordField.maxLength = 60;
  wordField.value = w.word;

  const meaningField = document.createElement('input');
  meaningField.className = 'map-input edit-meaning-input';
  meaningField.type = 'text';
  meaningField.maxLength = 200;
  meaningField.value = w.meaning;

  form.appendChild(wordField);
  form.appendChild(meaningField);

  if (editError) {
    const err = document.createElement('p');
    err.className = 'error-msg';
    err.textContent = editError;
    form.appendChild(err);
  }

  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'primary-btn';
  saveBtn.dataset.action = 'save-edit';
  saveBtn.dataset.id = w.id;
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'secondary-btn';
  cancelBtn.dataset.action = 'cancel-edit';
  cancelBtn.dataset.id = w.id;
  cancelBtn.textContent = 'Cancel';

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(cancelBtn);
  form.appendChild(btnRow);

  return form;
}

wordListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || !btn.dataset.action) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const words = getWords();
  const idx = words.findIndex((w) => w.id === id);

  if (action === 'toggle-status') {
    if (idx === -1) return;
    words[idx].status = words[idx].status === 'known' ? 'learning' : 'known';
    saveWords(words);
    refreshAll();
  } else if (action === 'delete') {
    if (idx === -1) return;
    if (!window.confirm(`Delete "${words[idx].word}"? This cannot be undone.`)) return;
    words.splice(idx, 1);
    saveWords(words);
    refreshAll();
  } else if (action === 'edit') {
    editingId = id;
    editError = '';
    renderList();
  } else if (action === 'cancel-edit') {
    editingId = null;
    editError = '';
    renderList();
  } else if (action === 'save-edit') {
    const li = btn.closest('.word-card');
    const newWord = li.querySelector('.edit-word-input').value.trim();
    const newMeaning = li.querySelector('.edit-meaning-input').value.trim();
    if (!newWord || !newMeaning) {
      editError = 'Please enter both a word and its meaning.';
      renderList();
      return;
    }
    if (idx === -1) return;
    words[idx].word = newWord;
    words[idx].meaning = newMeaning;
    saveWords(words);
    editingId = null;
    editError = '';
    refreshAll();
  }
});

// -----------------------
// Quiz
// -----------------------

function normalize(s) {
  return s.trim().toLowerCase();
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function updateQuizIntro() {
  const words = getWords();
  const learning = getLearningWords(words);
  const canStart = learning.length >= 1 && words.length >= 2;
  startQuizBtn.disabled = !canStart;

  if (learning.length === 0) {
    quizIntroText.textContent = 'Mark at least one word as "Learning" to start a quiz.';
  } else if (words.length < 2) {
    quizIntroText.textContent = 'Add at least one more word so the quiz has answer choices.';
  } else {
    quizIntroText.textContent = `Test yourself on ${learning.length} word${learning.length === 1 ? '' : 's'} you're still learning.`;
  }
}

function buildOptions(word, allWords) {
  const correctMeaning = word.meaning;
  const seen = new Set([normalize(correctMeaning)]);
  const pool = shuffle(allWords.filter((w) => w.id !== word.id));
  const distractors = [];
  for (const w of pool) {
    const norm = normalize(w.meaning);
    if (seen.has(norm)) continue;
    seen.add(norm);
    distractors.push(w.meaning);
    if (distractors.length >= 3) break;
  }
  return shuffle([correctMeaning, ...distractors]);
}

function startQuiz() {
  const words = getWords();
  const learning = getLearningWords(words);
  if (learning.length < 1 || words.length < 2) return;

  quizQueue = shuffle(learning).map((w) => ({ ...w }));
  quizIndex = 0;
  correctCount = 0;

  quizIntroSection.hidden = true;
  quizResultSection.hidden = true;
  quizPlaySection.hidden = false;

  renderQuestion(words);
}

function renderQuestion(allWords) {
  const words = allWords || getWords();
  const word = quizQueue[quizIndex];
  quizAnswered = false;

  quizProgress.textContent = `Question ${quizIndex + 1} of ${quizQueue.length}`;
  quizWordEl.textContent = word.word;
  quizFeedback.textContent = '';
  quizFeedback.className = 'quiz-feedback';
  nextBtn.hidden = true;

  const options = buildOptions(word, words);
  quizOptionsEl.innerHTML = '';
  options.forEach((optionText) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option-btn';
    btn.textContent = optionText;
    btn.dataset.correct = optionText === word.meaning ? 'true' : 'false';
    quizOptionsEl.appendChild(btn);
  });
}

quizOptionsEl.addEventListener('click', (e) => {
  if (quizAnswered) return;
  const btn = e.target.closest('.quiz-option-btn');
  if (!btn) return;

  quizAnswered = true;
  const isCorrect = btn.dataset.correct === 'true';
  if (isCorrect) correctCount++;

  btn.classList.add(isCorrect ? 'correct' : 'incorrect');
  if (!isCorrect) {
    const correctBtn = Array.from(quizOptionsEl.children).find((b) => b.dataset.correct === 'true');
    if (correctBtn) correctBtn.classList.add('correct');
  }
  Array.from(quizOptionsEl.children).forEach((b) => (b.disabled = true));

  quizFeedback.textContent = isCorrect ? 'Correct!' : 'Not quite.';
  quizFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');

  nextBtn.hidden = false;
  nextBtn.textContent = quizIndex + 1 < quizQueue.length ? 'Next Question' : 'See Result';
});

nextBtn.addEventListener('click', () => {
  quizIndex++;
  if (quizIndex < quizQueue.length) {
    renderQuestion();
  } else {
    showQuizResult();
  }
});

function showQuizResult() {
  quizPlaySection.hidden = true;
  quizResultSection.hidden = false;
  quizResultText.textContent = `You got ${correctCount} out of ${quizQueue.length} correct.`;
}

startQuizBtn.addEventListener('click', startQuiz);

exitQuizBtn.addEventListener('click', () => {
  quizPlaySection.hidden = true;
  quizIntroSection.hidden = false;
  updateQuizIntro();
});

quizAgainBtn.addEventListener('click', () => {
  quizResultSection.hidden = true;
  startQuiz();
});

quizCloseBtn.addEventListener('click', () => {
  quizResultSection.hidden = true;
  quizIntroSection.hidden = false;
  updateQuizIntro();
});

// -----------------------
// Init
// -----------------------

function refreshAll() {
  renderList();
  updateQuizIntro();
}

refreshAll();
