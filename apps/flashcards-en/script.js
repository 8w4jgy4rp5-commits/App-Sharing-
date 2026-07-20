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

let pendingPhrase = null;
let displayOrder = null;

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
    return;
  }
  emptyState.hidden = true;

  for (const card of filtered) {
    cardList.appendChild(buildTile(card));
  }
}

render();
