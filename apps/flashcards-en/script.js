const STORAGE_KEY = 'flashcardsEn:cards:v1';
const LANG = 'en';
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization (reads the platform-wide language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'English Flashcards',
    subtitle: 'Add a word, then flip the card to see its definition and example.',
    addCardHeading: 'Add a Card',
    wordLabel: 'Word or phrase',
    wordPlaceholder: 'e.g. serendipity',
    addCardBtn: 'Add Card',
    definitionLabel: 'Definition (in English)',
    definitionPlaceholder: 'Write a short definition',
    exampleLabel: 'Example sentence (optional)',
    examplePlaceholder: 'Write an example sentence',
    saveCardBtn: 'Save Card',
    cancelBtn: 'Cancel',
    yourCardsHeading: 'Your Cards',
    searchCards: 'Search your cards',
    shuffleBtn: 'Shuffle',
    fillExamplesBtn: 'Fill Missing Examples',
    fillingProgress: function (i, total) { return `Filling… (${i}/${total})`; },
    quizHeading: 'Quiz',
    startQuizBtn: 'Start Quiz',
    showAnswerBtn: 'Show Answer',
    rateQuestion: 'How well did you know it?',
    rateNo: 'No',
    rateSortOf: 'Sort of',
    rateComplete: 'Complete',
    exitQuizBtn: 'Exit Quiz',
    startNewQuizBtn: 'Start New Quiz',
    closeBtn: 'Close',
    tapToFlip: 'Tap to flip',
    noDefinitionAdded: 'No definition added.',
    deleteCardAriaLabel: function (phrase) { return `Delete card "${phrase}"`; },
    deleteConfirm: function (phrase) { return `Delete the card "${phrase}"? This cannot be undone.`; },
    pleaseTypeWord: 'Please type a word or phrase.',
    lookingUpBtn: 'Looking up…',
    lookingUpStatus: 'Looking up definition…',
    cardAddedStatus: function (phrase) { return `Card added for "${phrase}".`; },
    notFoundFallback: function (phrase) { return `We couldn't find "${phrase}" in the dictionary. You can add your own definition — we've suggested an example below, feel free to edit it.`; },
    notFoundStatus: function (phrase) { return `"${phrase}" was not found. You can enter it manually.`; },
    couldNotReachFallback: function (phrase) { return `We couldn't reach the dictionary service. You can add your own definition for "${phrase}" — we've suggested an example below, feel free to edit it.`; },
    couldNotReachStatus: 'Could not reach the dictionary service.',
    cancelledStatus: 'Cancelled.',
    everyCardHasExample: 'Every card already has an example.',
    addedExampleCount: function (n) { return `Added an example to ${n} card${n === 1 ? '' : 's'}.`; },
    noCardsYet: 'No cards yet. Add your first word above.',
    noCardsMatchSearch: 'No cards match your search.',
    addSomeCardsFirst: 'Add some cards first, then come back to quiz yourself.',
    testYourself: function (n) { return `Test yourself on ${n} card${n === 1 ? '' : 's'}, picked randomly with priority for the ones you know least.`; },
    questionProgress: function (current, total) { return `Question ${current} of ${total}`; },
    quizComplete: function (c, s, n, total) { return `Quiz complete! ${c} complete, ${s} sort of, ${n} no — out of ${total}.`; },
  },
  ja: {
    title: '英語フラッシュカード',
    subtitle: '単語を追加して、カードをめくると意味と例文が確認できます。',
    addCardHeading: 'カードを追加',
    wordLabel: '単語・フレーズ',
    wordPlaceholder: '例: serendipity',
    addCardBtn: 'カードを追加',
    definitionLabel: '意味（英語で）',
    definitionPlaceholder: '簡単な意味を書いてください',
    exampleLabel: '例文（任意）',
    examplePlaceholder: '例文を書いてください',
    saveCardBtn: 'カードを保存',
    cancelBtn: 'キャンセル',
    yourCardsHeading: '保存したカード',
    searchCards: 'カードを検索',
    shuffleBtn: 'シャッフル',
    fillExamplesBtn: '例文を一括補完',
    fillingProgress: function (i, total) { return `補完中…（${i}/${total}）`; },
    quizHeading: 'クイズ',
    startQuizBtn: 'クイズを始める',
    showAnswerBtn: '答えを見る',
    rateQuestion: 'どのくらい覚えていましたか？',
    rateNo: 'だめ',
    rateSortOf: 'まあまあ',
    rateComplete: '完璧',
    exitQuizBtn: 'クイズを終了',
    startNewQuizBtn: '新しいクイズを始める',
    closeBtn: '閉じる',
    tapToFlip: 'タップしてめくる',
    noDefinitionAdded: '意味が登録されていません。',
    deleteCardAriaLabel: function (phrase) { return `「${phrase}」のカードを削除`; },
    deleteConfirm: function (phrase) { return `「${phrase}」のカードを削除しますか？元に戻せません。`; },
    pleaseTypeWord: '単語かフレーズを入力してください。',
    lookingUpBtn: '検索中…',
    lookingUpStatus: '意味を検索しています…',
    cardAddedStatus: function (phrase) { return `「${phrase}」のカードを追加しました。`; },
    notFoundFallback: function (phrase) { return `辞書に「${phrase}」が見つかりませんでした。自分で意味を入力できます — 下に例文の候補を用意したので、自由に編集してください。`; },
    notFoundStatus: function (phrase) { return `「${phrase}」が見つかりませんでした。手動で入力できます。`; },
    couldNotReachFallback: function (phrase) { return `辞書サービスに接続できませんでした。「${phrase}」の意味を自分で入力できます — 下に例文の候補を用意したので、自由に編集してください。`; },
    couldNotReachStatus: '辞書サービスに接続できませんでした。',
    cancelledStatus: 'キャンセルしました。',
    everyCardHasExample: 'すべてのカードにすでに例文があります。',
    addedExampleCount: function (n) { return `${n}件のカードに例文を追加しました。`; },
    noCardsYet: 'カードはまだありません。上から最初の単語を追加しましょう。',
    noCardsMatchSearch: '検索に一致するカードがありません。',
    addSomeCardsFirst: 'まずはカードを追加してから、クイズに挑戦してみましょう。',
    testYourself: function (n) { return `${n}枚のカードでテストします。まだ覚えていないものを優先してランダムに選ばれます。`; },
    questionProgress: function (current, total) { return `問題 ${current} / ${total}`; },
    quizComplete: function (c, s, n, total) { return `クイズ完了！ 完璧 ${c}、まあまあ ${s}、だめ ${n} — 全${total}問中。`; },
  },
  es: {
    title: 'Tarjetas de Inglés',
    subtitle: 'Añade una palabra y luego voltea la tarjeta para ver su definición y un ejemplo.',
    addCardHeading: 'Añadir una tarjeta',
    wordLabel: 'Palabra o frase',
    wordPlaceholder: 'ej. serendipity',
    addCardBtn: 'Añadir tarjeta',
    definitionLabel: 'Definición (en inglés)',
    definitionPlaceholder: 'Escribe una definición breve',
    exampleLabel: 'Frase de ejemplo (opcional)',
    examplePlaceholder: 'Escribe una frase de ejemplo',
    saveCardBtn: 'Guardar tarjeta',
    cancelBtn: 'Cancelar',
    yourCardsHeading: 'Tus tarjetas',
    searchCards: 'Buscar tus tarjetas',
    shuffleBtn: 'Mezclar',
    fillExamplesBtn: 'Completar ejemplos faltantes',
    fillingProgress: function (i, total) { return `Completando… (${i}/${total})`; },
    quizHeading: 'Cuestionario',
    startQuizBtn: 'Comenzar cuestionario',
    showAnswerBtn: 'Mostrar respuesta',
    rateQuestion: '¿Qué tan bien la sabías?',
    rateNo: 'No',
    rateSortOf: 'Más o menos',
    rateComplete: 'Perfecta',
    exitQuizBtn: 'Salir del cuestionario',
    startNewQuizBtn: 'Comenzar nuevo cuestionario',
    closeBtn: 'Cerrar',
    tapToFlip: 'Toca para voltear',
    noDefinitionAdded: 'No se añadió ninguna definición.',
    deleteCardAriaLabel: function (phrase) { return `Eliminar la tarjeta "${phrase}"`; },
    deleteConfirm: function (phrase) { return `¿Eliminar la tarjeta "${phrase}"? Esta acción no se puede deshacer.`; },
    pleaseTypeWord: 'Escribe una palabra o frase.',
    lookingUpBtn: 'Buscando…',
    lookingUpStatus: 'Buscando la definición…',
    cardAddedStatus: function (phrase) { return `Se añadió la tarjeta de "${phrase}".`; },
    notFoundFallback: function (phrase) { return `No pudimos encontrar "${phrase}" en el diccionario. Puedes añadir tu propia definición — sugerimos un ejemplo abajo, siéntete libre de editarlo.`; },
    notFoundStatus: function (phrase) { return `No se encontró "${phrase}". Puedes ingresarla manualmente.`; },
    couldNotReachFallback: function (phrase) { return `No pudimos conectarnos con el servicio de diccionario. Puedes añadir tu propia definición para "${phrase}" — sugerimos un ejemplo abajo, siéntete libre de editarlo.`; },
    couldNotReachStatus: 'No se pudo conectar con el servicio de diccionario.',
    cancelledStatus: 'Cancelado.',
    everyCardHasExample: 'Todas las tarjetas ya tienen un ejemplo.',
    addedExampleCount: function (n) { return `Se añadió un ejemplo a ${n} tarjeta${n === 1 ? '' : 's'}.`; },
    noCardsYet: 'Aún no hay tarjetas. Añade tu primera palabra arriba.',
    noCardsMatchSearch: 'Ninguna tarjeta coincide con tu búsqueda.',
    addSomeCardsFirst: 'Añade algunas tarjetas primero y luego vuelve para ponerte a prueba.',
    testYourself: function (n) { return `Ponte a prueba con ${n} tarjeta${n === 1 ? '' : 's'}, elegidas al azar dando prioridad a las que menos conoces.`; },
    questionProgress: function (current, total) { return `Pregunta ${current} de ${total}`; },
    quizComplete: function (c, s, n, total) { return `¡Cuestionario completado! ${c} perfectas, ${s} más o menos, ${n} no — de ${total}.`; },
  },
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const t = STRINGS[getLang()];

function applyStaticTranslations() {
  document.documentElement.setAttribute('lang', getLang());
  document.title = t.title;

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria-label');
    if (t[key]) el.setAttribute('aria-label', t[key]);
  });
}

applyStaticTranslations();

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
const fillExamplesBtn = document.getElementById('fill-examples-btn');
const cardList = document.getElementById('card-list');
const emptyState = document.getElementById('empty-state');

async function lookupWord(phrase) {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${LANG}/${encodeURIComponent(phrase)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return extractCardData(data);
}

// Secondary example source, used when the Free Dictionary API has no example
// sentence for a word. Reads the "==English==" section of the English
// Wiktionary page for the phrase and pulls a sentence out of its
// {{ux|en|...}} / {{uxi|en|...}} usage-example template.
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
// ignoring any "|" that appears inside a nested [[...]] or {{...}} (e.g. a
// piped wikilink like [[dog|dogs]] inside the example sentence itself).
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
// tracking nested {{...}} depth — a {{ux|en|...}} example can itself
// contain a nested template like {{l|en|word}} before its own closing "}}",
// which a naive non-nesting-aware regex would truncate at.
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
  const start = wikitext.indexOf('==English==');
  if (start === -1) return '';
  const rest = wikitext.slice(start + '==English=='.length);
  const nextHeading = rest.match(/\n==[^=][\s\S]*?==\n/);
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest;

  const openMatch = /\{\{u(?:x|xi)\|en\|/.exec(section);
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

// Last-resort guarantee so every card has something in its example slot,
// even when neither the dictionary API nor Wiktionary has a usage example
// for the word. This is clearly a study prompt, not a claimed real quotation.
function placeholderExample(phrase) {
  return `Try using "${phrase}" in a sentence of your own.`;
}

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
    quizIntroText.textContent = t.addSomeCardsFirst;
    startQuizBtn.disabled = true;
  } else {
    const n = Math.min(count, QUIZ_SIZE);
    quizIntroText.textContent = t.testYourself(n);
    startQuizBtn.disabled = false;
  }
}

function showQuizQuestion() {
  const card = quizQueue[quizIndex];
  quizProgress.textContent = t.questionProgress(quizIndex + 1, quizQueue.length);
  quizPhrase.textContent = card.phrase;
  quizAnswer.hidden = true;
  rateRow.hidden = true;
  showAnswerBtn.hidden = false;

  quizPos.hidden = !card.partOfSpeech;
  quizPos.textContent = card.partOfSpeech || '';
  quizDef.textContent = card.definition || t.noDefinitionAdded;
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
  quizResultText.textContent = t.quizComplete(quizResults.complete, quizResults.sort_of, quizResults.no, total);
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
    showError(t.pleaseTypeWord);
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = t.lookingUpBtn;
  statusMsg.textContent = t.lookingUpStatus;

  try {
    const extracted = await lookupWord(phrase);
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
      statusMsg.textContent = t.cardAddedStatus(phrase);
      render();
      return;
    }
    exampleInput.value = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
    showFallback(phrase, t.notFoundFallback(phrase));
    statusMsg.textContent = t.notFoundStatus(phrase);
  } catch {
    exampleInput.value = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
    showFallback(phrase, t.couldNotReachFallback(phrase));
    statusMsg.textContent = t.couldNotReachStatus;
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = t.addCardBtn;
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
  statusMsg.textContent = t.cardAddedStatus(savedPhrase);
  render();
});

cancelFallbackBtn.addEventListener('click', () => {
  hideFallback();
  statusMsg.textContent = t.cancelledStatus;
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
    statusMsg.textContent = t.everyCardHasExample;
    return;
  }
  fillExamplesBtn.disabled = true;
  for (let i = 0; i < missing.length; i++) {
    const card = missing[i];
    fillExamplesBtn.textContent = t.fillingProgress(i + 1, missing.length);
    // The dictionary API was already tried when this card was added, so go
    // straight to Wiktionary, then guarantee a value with the placeholder.
    card.example = (await lookupWiktionaryExample(card.phrase)) || placeholderExample(card.phrase);
  }
  saveCards(cards);
  fillExamplesBtn.disabled = false;
  fillExamplesBtn.textContent = t.fillExamplesBtn;
  statusMsg.textContent = t.addedExampleCount(missing.length);
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
  hintEl.textContent = t.tapToFlip;
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
  defEl.textContent = card.definition || t.noDefinitionAdded;
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
  deleteBtn.setAttribute('aria-label', t.deleteCardAriaLabel(card.phrase));
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(t.deleteConfirm(card.phrase))) return;
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
        ? t.noCardsYet
        : t.noCardsMatchSearch;
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
