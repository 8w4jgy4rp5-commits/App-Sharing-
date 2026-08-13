// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'flashcardsEs:cards:v1';
const API_KEY_STORAGE = 'flashcardsEs:apiKey:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

// AppSync.store() のインスタンス。起動時に初期化される。
let store = null;

// app-sync.js が読み込めなかったときの保険。localStorage だけで動き、同期はしない。
// app-sync と同じキー・同じエンベロープ形式で書くので、次に正常に読み込めた
// 起動でそのまま拾われ、クラウドへ上がる。
async function openStore(slug, key, opts) {
  try { if (window.AppSync) return await window.AppSync.store(slug, key, opts); } catch (e) { console.error(e); }
  const o = opts || {}, k = 'appdata:' + slug + ':' + key;
  const read = function (s) { try { return JSON.parse(localStorage.getItem(s)); } catch (e) { return null; } };
  const cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  const env = read(k);
  let c = env && 'd' in env ? env.d : ((o.legacyKey && read(o.legacyKey)) ?? o.default ?? null);
  return {
    get: function () { return cp(c); },
    set: function (v) {
      c = cp(v);
      try { localStorage.setItem(k, JSON.stringify({ v: 1, av: o.version || 1, t: Date.now(), o: null, d: c })); } catch (e) {}
      return Promise.resolve();
    },
    subscribe: function () { return function () {}; },
    flush: function () { return Promise.resolve(); },
    status: function () { return { online: false, syncing: false, lastSyncedAt: null, error: null }; }
  };
}

// -----------------------
// Localization (reads the platform-wide language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Spanish Flashcards',
    subtitle: 'Add a word, then flip the card to see its definition and example.',
    apiKeyHeading: 'Dictionary API Key',
    apiKeyHelpBefore: 'Add your own free Merriam-Webster Spanish-English Dictionary API key to auto-fill definitions and examples when you add a card. Get one at',
    apiKeyHelpAfter: 'Your key is saved only in this browser and is never uploaded anywhere.',
    apiKeyLabel: 'API key',
    apiKeyPlaceholder: 'e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    saveKeyBtn: 'Save Key',
    clearKeyBtn: 'Clear Key',
    pleasePasteKey: 'Please paste a key before saving.',
    keySavedStatus: 'Key saved to this browser.',
    keyClearedStatus: 'Key cleared.',
    noApiKeyStatus: 'No API key set. You can enter the card manually.',
    noApiKeyFallback: function (phrase) { return `Add your Merriam-Webster API key above to look up definitions automatically, or add your own definition for "${phrase}" — we've suggested an example below, feel free to edit it.`; },
    addCardHeading: 'Add a Card',
    wordLabel: 'Word or phrase',
    wordPlaceholder: 'e.g. madrugada',
    addCardBtn: 'Add Card',
    definitionLabel: 'Definition (in Spanish)',
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
    title: 'スペイン語フラッシュカード',
    subtitle: '単語を追加して、カードをめくると意味と例文が確認できます。',
    apiKeyHeading: '辞書APIキー',
    apiKeyHelpBefore: 'Merriam-Webster西英辞典の無料APIキーを追加すると、カード追加時に意味と例文を自動入力できます。取得はこちらから：',
    apiKeyHelpAfter: 'キーはこのブラウザにのみ保存され、どこにもアップロードされません。',
    apiKeyLabel: 'APIキー',
    apiKeyPlaceholder: '例: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    saveKeyBtn: 'キーを保存',
    clearKeyBtn: 'キーを削除',
    pleasePasteKey: '保存する前にキーを貼り付けてください。',
    keySavedStatus: 'キーをこのブラウザに保存しました。',
    keyClearedStatus: 'キーを削除しました。',
    noApiKeyStatus: 'APIキーが設定されていません。手動でカードを入力できます。',
    noApiKeyFallback: function (phrase) { return `上でMerriam-WebsterのAPIキーを追加すると自動で意味を検索できます。または「${phrase}」の意味を自分で入力してください — 下に例文の候補を用意したので、自由に編集してください。`; },
    addCardHeading: 'カードを追加',
    wordLabel: '単語・フレーズ',
    wordPlaceholder: '例: madrugada',
    addCardBtn: 'カードを追加',
    definitionLabel: '意味（スペイン語で）',
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
    title: 'Tarjetas de Español',
    subtitle: 'Añade una palabra y luego voltea la tarjeta para ver su definición y un ejemplo.',
    apiKeyHeading: 'Clave de la API del diccionario',
    apiKeyHelpBefore: 'Añade tu propia clave gratuita de la API del diccionario español-inglés de Merriam-Webster para autocompletar definiciones y ejemplos al añadir una tarjeta. Consíguela en',
    apiKeyHelpAfter: 'Tu clave se guarda solo en este navegador y nunca se sube a ningún sitio.',
    apiKeyLabel: 'Clave de la API',
    apiKeyPlaceholder: 'ej. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    saveKeyBtn: 'Guardar clave',
    clearKeyBtn: 'Borrar clave',
    pleasePasteKey: 'Pega una clave antes de guardar.',
    keySavedStatus: 'Clave guardada en este navegador.',
    keyClearedStatus: 'Clave borrada.',
    noApiKeyStatus: 'No hay ninguna clave configurada. Puedes ingresar la tarjeta manualmente.',
    noApiKeyFallback: function (phrase) { return `Añade tu clave de la API de Merriam-Webster arriba para buscar definiciones automáticamente, o añade tu propia definición para "${phrase}" — sugerimos un ejemplo abajo, siéntete libre de editarlo.`; },
    addCardHeading: 'Añadir una tarjeta',
    wordLabel: 'Palabra o frase',
    wordPlaceholder: 'ej. madrugada',
    addCardBtn: 'Añadir tarjeta',
    definitionLabel: 'Definición (en español)',
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

// Ships with the app owner's own free Merriam-Webster key as a working
// default (already agreed to be exposed client-side, since this is a static
// site with no backend) — "Clear Key" opts a visitor out of that default so
// they can use their own key instead of sharing the owner's request quota.
const DEFAULT_API_KEY = 'fef4c641-54aa-4d55-af94-0006d8fe922b';
const CLEARED_KEY_SENTINEL = '__cleared__';

function getApiKey() {
  const stored = localStorage.getItem(API_KEY_STORAGE);
  if (stored === CLEARED_KEY_SENTINEL) return '';
  return stored || DEFAULT_API_KEY;
}

function saveApiKey(key) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE, key);
  } else {
    localStorage.setItem(API_KEY_STORAGE, CLEARED_KEY_SENTINEL);
  }
}

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveCards() してよい。
function getCards() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveCards(cards) {
  if (!store) return;
  store.set(cards).catch(function (e) {
    console.error('Flashcards: 保存に失敗しました', e);
  });
}

function stripMwMarkup(text) {
  return text
    .replace(/\{bc\}/g, '')
    .replace(/\{[a-z_]+\|([^|}]*)[^}]*\}/gi, '$1')
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

  showAnswerBtn.focus();
}

function setRateButtonsDisabled(disabled) {
  rateBtns.forEach((btn) => {
    btn.disabled = disabled;
  });
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
  quizAgainBtn.focus();
}

function applyRating(rating) {
  if (rateBtns[0] && rateBtns[0].disabled) return;
  setRateButtonsDisabled(true);
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
  setRateButtonsDisabled(false);
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
    apiKeyStatus.textContent = t.pleasePasteKey;
    return;
  }
  saveApiKey(key);
  apiKeyStatus.textContent = t.keySavedStatus;
});

clearApiKeyBtn.addEventListener('click', () => {
  saveApiKey('');
  apiKeyInput.value = '';
  apiKeyStatus.textContent = t.keyClearedStatus;
});

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

  const apiKey = getApiKey();
  if (!apiKey) {
    exampleInput.value = (await lookupWiktionaryExample(phrase)) || placeholderExample(phrase);
    showFallback(phrase, t.noApiKeyFallback(phrase));
    statusMsg.textContent = t.noApiKeyStatus;
    addBtn.disabled = false;
    addBtn.textContent = t.addCardBtn;
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
        statusMsg.textContent = t.cardAddedStatus(phrase);
        render();
        return;
      }
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

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('flashcards-es', 'cards', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
