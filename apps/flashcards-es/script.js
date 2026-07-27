const STORAGE_KEY = 'flashcardsEs:cards:v1';
const API_KEY_STORAGE = 'flashcardsEs:apiKey:v1';

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

function saveApiKey(key) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

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

function stripMwMarkup(text) {
  return text
    .replace(/\{bc\}/g, '')
    .replace(/\{\/?[a-z_]+\}/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

function findMwExample(defArray) {
  if (!Array.isArray(defArray)) return '';
  for (const d of defArray) {
    if (!d || !Array.isArray(d.sseq)) continue;
    for (const seqGroup of d.sseq) {
      for (const senseArr of seqGroup) {
        const sense = Array.isArray(senseArr) ? senseArr[1] : null;
        if (!sense || !Array.isArray(sense.dt)) continue;
        for (const entry of sense.dt) {
          const [type, value] = entry;
          if (type === 'vis' && Array.isArray(value) && value[0] && value[0].t) {
            return stripMwMarkup(value[0].t);
          }
        }
      }
    }
  }
  return '';
}

function extractMwCardData(mwJson) {
  if (!Array.isArray(mwJson) || mwJson.length === 0) return null;
  const entry = mwJson.find(
    (e) => e && typeof e === 'object' && Array.isArray(e.shortdef) && e.shortdef.length > 0
  );
  if (!entry) return null;
  const definition = stripMwMarkup(entry.shortdef[0]);
  const partOfSpeech = typeof entry.fl === 'string' ? entry.fl : '';
  const example = findMwExample(entry.def);
  return { definition, example, partOfSpeech };
}

// Merriam-Webster's Spanish-English entries often lack an example sentence.
// Wiktionary is used only as a secondary source to fill that gap, by reading
// the "==Spanish==" section of the English Wiktionary page for the phrase and
// pulling the sentence out of its {{ux|es|...}} usage-example template.
function stripWikiMarkup(text) {
  return text
    .replace(/\{\{l\|[^|}]+\|([^|}]+)[^}]*\}\}/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]+)\]\]/g, '$2')
    .replace(/'''/g, '')
    .replace(/''/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Splits a wiki-template's parameter string on top-level "|" characters,
// ignoring any "|" that appears inside a nested [[...]] or {{...}} — e.g. a
// piped wikilink like [[perro|perros]] inside the example sentence itself,
// which the previous simple regex cut off at the wrong point.
function splitTemplateParams(str) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const two = str.slice(i, i + 2);
    if (two === '[[' || two === '{{') {
      depth++;
      current += two;
      i++;
      continue;
    }
    if (two === ']]' || two === '}}') {
      depth = Math.max(0, depth - 1);
      current += two;
      i++;
      continue;
    }
    if (str[i] === '|' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += str[i];
  }
  parts.push(current);
  return parts;
}

// Citation-based examples (dated "#*:" quotes, {{quote-journal}}/{{quote-text}}
// templates) were deliberately left out here: they pull arbitrary excerpts
// from real news/books, which can surface unrelated and sometimes heavy
// real-world subject matter (crime, politics, etc.) — not appropriate for a
// vocabulary flashcard's example sentence. Only the {{ux}}/{{uxi}} template
// is used, since Wiktionary editors write those specifically as short,
// neutral usage illustrations.
function trimExample(text, maxLen = 220) {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const cut = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('! '), truncated.lastIndexOf('? '));
  return cut > 40 ? truncated.slice(0, cut + 1) : `${truncated.trim()}…`;
}

// Finds the index just past the "}}" that matches the "{{" at startIdx,
// tracking nested {{...}} depth — a {{ux|es|...}} example can itself
// contain a nested template like {{l|es|palabra}} before its own closing
// "}}", which a naive non-nesting-aware regex would truncate at.
function findMatchingBraces(text, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth++;
      i++;
      continue;
    }
    if (text[i] === '}' && text[i + 1] === '}') {
      depth--;
      i++;
      if (depth === 0) return i + 1;
      continue;
    }
  }
  return -1;
}

function extractWiktionaryExample(wikitext) {
  const start = wikitext.indexOf('==Spanish==');
  if (start === -1) return '';
  const rest = wikitext.slice(start + '==Spanish=='.length);
  const nextHeading = rest.match(/\n==[^=][\s\S]*?==\n/);
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest;

  const openMatch = /\{\{u(?:x|xi)\|es\|/.exec(section);
  if (!openMatch) return '';
  const endIdx = findMatchingBraces(section, openMatch.index);
  if (endIdx === -1) return '';
  const inner = section.slice(openMatch.index + openMatch[0].length, endIdx - 2);
  for (const param of splitTemplateParams(inner)) {
    const trimmed = param.trim();
    if (trimmed && !trimmed.includes('=')) {
      return trimExample(stripWikiMarkup(trimmed));
    }
  }
  return '';
}

// Last-resort guarantee so every card has something in its example slot,
// even when neither Merriam-Webster nor Wiktionary has a usage example for
// the word. This is clearly a study prompt, not a claimed real quotation.
function placeholderExample(phrase) {
  return `Try using "${phrase}" in a sentence of your own.`;
}

async function lookupWiktionaryExample(phrase) {
  try {
    const res = await fetch(
      `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(phrase)}&prop=wikitext&format=json&origin=*`
    );
    if (!res.ok) return '';
    const data = await res.json();
    const wikitext = data && data.parse && data.parse.wikitext && data.parse.wikitext['*'];
    return wikitext ? extractWiktionaryExample(wikitext) : '';
  } catch {
    return '';
  }
}

const apiKeyForm = document.getElementById('api-key-form');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyStatus = document.getElementById('api-key-status');
const clearApiKeyBtn = document.getElementById('clear-api-key-btn');

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
const fillExamplesBtn = document.getElementById('fill-examples-btn');
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
// Unrated cards get the same top priority as "no" (never tested = treat as not known yet).
const UNRATED_RANK = RATING_RANK.no;

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

apiKeyInput.value = getApiKey();

apiKeyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyStatus.textContent = 'Please paste a key before saving.';
    return;
  }
  saveApiKey(key);
  apiKeyStatus.textContent = 'Key saved to this browser.';
});

clearApiKeyBtn.addEventListener('click', () => {
  saveApiKey('');
  apiKeyInput.value = '';
  apiKeyStatus.textContent = 'Key cleared.';
});

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

  const apiKey = getApiKey();
  if (!apiKey) {
    exampleInput.value = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
    showFallback(
      phrase,
      `Add your Merriam-Webster API key above to look up definitions automatically, or add your own definition for "${phrase}" — we've suggested an example below, feel free to edit it.`
    );
    statusMsg.textContent = 'No API key set. You can enter the card manually.';
    addBtn.disabled = false;
    addBtn.textContent = 'Add Card';
    return;
  }

  try {
    const res = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/spanish/json/${encodeURIComponent(phrase)}?key=${encodeURIComponent(apiKey)}`
    );
    if (res.ok) {
      const data = await res.json();
      const extracted = extractMwCardData(data);
      if (extracted) {
        if (!extracted.example) {
          extracted.example = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
        }
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
    exampleInput.value = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
    showFallback(
      phrase,
      `We couldn't find "${phrase}" in the dictionary. You can add your own definition — we've suggested an example below, feel free to edit it.`
    );
    statusMsg.textContent = `"${phrase}" was not found. You can enter it manually.`;
  } catch {
    exampleInput.value = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
    showFallback(
      phrase,
      `We couldn't reach the dictionary service. You can add your own definition for "${phrase}" — we've suggested an example below, feel free to edit it.`
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

fillExamplesBtn.addEventListener('click', async () => {
  const cards = getCards();
  const missing = cards.filter((c) => !c.example);
  if (missing.length === 0) {
    statusMsg.textContent = 'Every card already has an example.';
    return;
  }
  fillExamplesBtn.disabled = true;
  for (let i = 0; i < missing.length; i++) {
    const card = missing[i];
    fillExamplesBtn.textContent = `Filling… (${i + 1}/${missing.length})`;
    card.example = (await lookupWiktionaryExample(card.phrase)) || placeholderExample(card.phrase);
  }
  saveCards(cards);
  fillExamplesBtn.disabled = false;
  fillExamplesBtn.textContent = 'Fill Missing Examples';
  statusMsg.textContent = `Added an example to ${missing.length} card${missing.length === 1 ? '' : 's'}.`;
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

