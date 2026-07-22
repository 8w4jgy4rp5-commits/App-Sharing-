const STORAGE_KEY = 'flashcardsEn:cards:v1';
const LANG = 'en';

function getCards() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function extractCardData(apiJson) {
  if (!Array.isArray(apiJson) || apiJson.length === 0) return null;
  const meanings = [];
  for (const entry of apiJson) {
    if (entry && Array.isArray(entry.meanings)) meanings.push(...entry.meanings);
  }
  let firstUsable = null;
  for (const meaning of meanings) {
    if (!meaning || !Array.isArray(meaning.definitions)) continue;
    const pos = typeof meaning.partOfSpeech === 'string' ? meaning.partOfSpeech.trim() : '';
    for (const def of meaning.definitions) {
      if (!def || typeof def.definition !== 'string') continue;
      const definition = def.definition.trim();
      if (!definition) continue;
      const example = typeof def.example === 'string' ? def.example.trim() : '';
      const candidate = { definition, example, partOfSpeech: pos };
      if (example) return candidate;
      if (!firstUsable) firstUsable = candidate;
    }
  }
  return firstUsable;
}

const addForm = document.getElementById('add-form');
const phraseInput = document.getElementById('phrase-input');
const addBtn = document.getElementById('add-btn');
const errorMsg = document.getElementById('error-msg');
const statusMsg = document.getElementById('status-msg');

const fallbackBlock = document.getElementById('fallback-block');
const fallbackMessage = document.getElementById('fallback-message');
const definitionInput = document.getElementById('definition-input');
const exampleInput = document.getElementById('example-input');
const saveFallbackBtn = document.getElementById('save-fallback-btn');
const cancelFallbackBtn = document.getElementById('cancel-fallback-btn');

const searchInput = document.getElementById('search-input');
const shuffleBtn = document.getElementById('shuffle-btn');
const cardList = document.getElementById('card-list');
const emptyState = document.getElementById('empty-state');

const quizIntro = document.getElementById('quiz-intro');
const quizIntroText = document.getElementById('quiz-intro-text');
const startQuizBtn = document.getElementById('start-quiz-btn');
const quizPlay = document.getElementById('quiz-play');
const quizProgress = document.getElementById('quiz-progress');
const quizPhrase = document.getElementById('quiz-phrase');
const quizAnswer = document.getElementById('quiz-answer');
const quizPos = document.getElementById('quiz-pos');
const quizDef = document.getElementById('quiz-def');
const quizEx = document.getElementById('quiz-ex');
const showAnswerBtn = document.getElementById('show-answer-btn');
const rateRow = document.getElementById('rate-row');
const rateBtns = document.querySelectorAll('.rate-btn');
const exitQuizBtn = document.getElementById('exit-quiz-btn');
const quizResult = document.getElementById('quiz-result');
const quizResultText = document.getElementById('quiz-result-text');
const quizAgainBtn = document.getElementById('quiz-again-btn');
const quizCloseBtn = document.getElementById('quiz-close-btn');

const QUIZ_SIZE = 10;
const RATING_RANK = { no: 0, sort_of: 2, complete: 3 };
const UNRATED_RANK = 1;

let pendingPhrase = null;
let displayOrder = null;
let quizQueue = [];
let quizIndex = 0;
let quizResults = { no: 0, sort_of: 0, complete: 0 };

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function rankOf(card) {
  return card.lastRating in RATING_RANK ? RATING_RANK[card.lastRating] : UNRATED_RANK;
}

function pickQuizCards(count) {
  const shuffled = shuffleArray(getCards());
  shuffled.sort((a, b) => rankOf(a) - rankOf(b));
  return shuffled.slice(0, count);
}

function updateQuizAvailability() {
  const count = getCards().length;
  if (count === 0) {
    quizIntroText.textContent = 'Add some cards first, then come back to quiz yourself.';
    startQuizBtn.disabled = true;
  } else {
    const n = Math.min(count, QUIZ_SIZE);
    quizIntroText.textContent = `Test yourself on ${n} card${n === 1 ? '' : 's'}, picked randomly with priority for the ones you know least.`;
    startQuizBtn.disabled = false;
  }
}

function showQuizQuestion() {
  const card = quizQueue[quizIndex];
  quizProgress.textContent = `Question ${quizIndex + 1} of ${quizQueue.length}`;
  quizPhrase.textContent = card.phrase;
  quizAnswer.hidden = true;
  rateRow.hidden = true;
  showAnswerBtn.hidden = false;

  quizPos.hidden = !card.partOfSpeech;
  quizPos.textContent = card.partOfSpeech || '';
  quizDef.textContent = card.definition || 'No definition added.';
  quizEx.hidden = !card.example;
  quizEx.textContent = card.example || '';
}

function startQuiz() {
  quizQueue = pickQuizCards(QUIZ_SIZE);
  if (quizQueue.length === 0) return;
  quizIndex = 0;
  quizResults = { no: 0, sort_of: 0, complete: 0 };
  quizIntro.hidden = true;
  quizResult.hidden = true;
  quizPlay.hidden = false;
  showQuizQuestion();
}

function finishQuiz() {
  quizPlay.hidden = true;
  quizResult.hidden = false;
  const total = quizQueue.length;
  quizResultText.textContent = `Quiz complete! ${quizResults.complete} complete, ${quizResults.sort_of} sort of, ${quizResults.no} no — out of ${total}.`;
  render();
}

function applyRating(rating) {
  const currentCard = quizQueue[quizIndex];
  const cards = getCards();
  const target = cards.find((c) => c.id === currentCard.id);
  if (target) {
    target.lastRating = rating;
    saveCards(cards);
  }
  quizResults[rating] += 1;
  quizIndex += 1;
  if (quizIndex >= quizQueue.length) {
    finishQuiz();
  } else {
    showQuizQuestion();
  }
}

startQuizBtn.addEventListener('click', startQuiz);
quizAgainBtn.addEventListener('click', startQuiz);

showAnswerBtn.addEventListener('click', () => {
  quizAnswer.hidden = false;
  showAnswerBtn.hidden = true;
  rateRow.hidden = false;
});

rateBtns.forEach((btn) => {
  btn.addEventListener('click', () => applyRating(btn.dataset.rating));
});

exitQuizBtn.addEventListener('click', () => {
  quizPlay.hidden = true;
  quizIntro.hidden = false;
  updateQuizAvailability();
});

quizCloseBtn.addEventListener('click', () => {
  quizResult.hidden = true;
  quizIntro.hidden = false;
  updateQuizAvailability();
});

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.hidden = true;
}

function hideFallback() {
  fallbackBlock.hidden = true;
  pendingPhrase = null;
  definitionInput.value = '';
  exampleInput.value = '';
}

function showFallback(phrase, reason) {
  pendingPhrase = phrase;
  fallbackMessage.textContent = reason;
  fallbackBlock.hidden = false;
  definitionInput.focus();
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  hideFallback();

  const phrase = phraseInput.value.trim();
  if (!phrase) {
    showError('Please type a word or phrase.');
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = 'Looking up…';
  statusMsg.textContent = 'Looking up definition…';

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${LANG}/${encodeURIComponent(phrase)}`);
    if (res.ok) {
      const data = await res.json();
      const extracted = extractCardData(data);
      if (extracted) {
        const cards = getCards();
        cards.push({
          id: String(Date.now()),
          phrase,
          definition: extracted.definition,
          example: extracted.example,
          partOfSpeech: extracted.partOfSpeech,
          source: 'api',
          createdAt: new Date().toISOString(),
        });
        saveCards(cards);
        addForm.reset();
        statusMsg.textContent = `Card added for "${phrase}".`;
        render();
        return;
      }
    }
    showFallback(
      phrase,
      `We couldn't find "${phrase}" in the dictionary. You can add your own definition and example.`
    );
    statusMsg.textContent = `"${phrase}" was not found. You can enter it manually.`;
  } catch {
    showFallback(
      phrase,
      `We couldn't reach the dictionary service. You can add your own definition and example for "${phrase}".`
    );
    statusMsg.textContent = 'Could not reach the dictionary service.';
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Add Card';
  }
});

saveFallbackBtn.addEventListener('click', () => {
  if (!pendingPhrase) return;
  const definition = definitionInput.value.trim();
  const example = exampleInput.value.trim();
  const cards = getCards();
  cards.push({
    id: String(Date.now()),
    phrase: pendingPhrase,
    definition,
    example,
    partOfSpeech: '',
    source: 'manual',
    createdAt: new Date().toISOString(),
  });
  saveCards(cards);
  const savedPhrase = pendingPhrase;
  addForm.reset();
  hideFallback();
  statusMsg.textContent = `Card added for "${savedPhrase}".`;
  render();
});

cancelFallbackBtn.addEventListener('click', () => {
  hideFallback();
  statusMsg.textContent = 'Cancelled.';
});

shuffleBtn.addEventListener('click', () => {
  const cards = getCards();
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  displayOrder = ids;
  render();
});

searchInput.addEventListener('input', render);

function buildTile(card) {
  const li = document.createElement('li');
  li.className = 'card-cell';

  const flipBtn = document.createElement('button');
  flipBtn.type = 'button';
  flipBtn.className = 'flip-tile';
  flipBtn.setAttribute('aria-pressed', 'false');

  const inner = document.createElement('span');
  inner.className = 'flip-inner';

  const front = document.createElement('span');
  front.className = 'face face-front';
  const phraseEl = document.createElement('span');
  phraseEl.className = 'tile-phrase';
  phraseEl.textContent = card.phrase;
  const hintEl = document.createElement('span');
  hintEl.className = 'tile-hint';
  hintEl.textContent = 'Tap to flip';
  front.appendChild(phraseEl);
  front.appendChild(hintEl);

  const back = document.createElement('span');
  back.className = 'face face-back';
  if (card.partOfSpeech) {
    const posEl = document.createElement('span');
    posEl.className = 'tile-pos';
    posEl.textContent = card.partOfSpeech;
    back.appendChild(posEl);
  }
  const defEl = document.createElement('span');
  defEl.className = 'tile-def';
  defEl.textContent = card.definition || 'No definition added.';
  back.appendChild(defEl);
  if (card.example) {
    const exEl = document.createElement('span');
    exEl.className = 'tile-ex';
    exEl.textContent = card.example;
    back.appendChild(exEl);
  }

  inner.appendChild(front);
  inner.appendChild(back);
  flipBtn.appendChild(inner);

  flipBtn.addEventListener('click', () => {
    const flipped = flipBtn.classList.toggle('is-flipped');
    flipBtn.setAttribute('aria-pressed', String(flipped));
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'tile-delete';
  deleteBtn.setAttribute('aria-label', `Delete card "${card.phrase}"`);
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(`Delete the card "${card.phrase}"? This cannot be undone.`)) return;
    const cards = getCards().filter((c) => c.id !== card.id);
    saveCards(cards);
    render();
  });

  li.appendChild(flipBtn);
  li.appendChild(deleteBtn);
  return li;
}

function render() {
  const allCards = getCards();

  let cards = allCards;
  if (displayOrder) {
    const byId = new Map(allCards.map((c) => [c.id, c]));
    cards = displayOrder.map((id) => byId.get(id)).filter(Boolean);
    if (cards.length !== allCards.length) {
      displayOrder = null;
      cards = allCards;
    }
  }

  const query = searchInput.value.trim().toLowerCase();
  const filtered = query ? cards.filter((c) => c.phrase.toLowerCase().includes(query)) : cards;

  cardList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent =
      allCards.length === 0
        ? 'No cards yet. Add your first word above.'
        : 'No cards match your search.';
    updateQuizAvailability();
    return;
  }
  emptyState.hidden = true;

  for (const card of filtered) {
    cardList.appendChild(buildTile(card));
  }

  updateQuizAvailability();
}

render();
