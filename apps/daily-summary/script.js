// ===========================
// Daily Summary - script
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'dailySummary:entries:v1';

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
const DISPLAY_LIMIT = 30;
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// i18n (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Daily Summary',
    titlePart1: 'Daily',
    titlePart2: 'Summary',
    subtitle: "A private notebook for the little things you can't say out loud.",
    privacyNote: "🔒 Saved only in this device's browser.",
    notebookPages: 'Notebook pages',
    writeTab: 'Write',
    reflectTab: 'Reflect',
    pastEntries: 'Past entries',
    emptyState: 'No entries yet. Write your first one on the right.',
    today: 'Today',
    writeEntryLabel: 'Write a new entry',
    entryPlaceholder: "What's on your mind today?",
    writeBtn: 'Write',
    dateLocale: 'en-US',
  },
  ja: {
    title: 'デイリーサマリー',
    titlePart1: 'デイリー',
    titlePart2: 'サマリー',
    subtitle: '言葉にできない小さな気持ちを、そっと書き留めるノート。',
    privacyNote: '🔒 このデバイスのブラウザにのみ保存されます。',
    notebookPages: 'ノートのページ',
    writeTab: '書く',
    reflectTab: '振り返る',
    pastEntries: 'これまでの記録',
    emptyState: 'まだ記録がありません。右側から最初の一つを書いてみましょう。',
    today: '今日',
    writeEntryLabel: '新しい記録を書く',
    entryPlaceholder: '今日はどんな気持ちですか？',
    writeBtn: '書く',
    dateLocale: 'ja-JP',
  },
  es: {
    title: 'Resumen Diario',
    titlePart1: 'Resumen',
    titlePart2: 'Diario',
    subtitle: 'Un cuaderno privado para esas pequeñas cosas que no puedes decir en voz alta.',
    privacyNote: '🔒 Guardado solo en el navegador de este dispositivo.',
    notebookPages: 'Páginas del cuaderno',
    writeTab: 'Escribir',
    reflectTab: 'Reflexionar',
    pastEntries: 'Entradas anteriores',
    emptyState: 'Aún no hay entradas. Escribe la primera a la derecha.',
    today: 'Hoy',
    writeEntryLabel: 'Escribir una nueva entrada',
    entryPlaceholder: '¿Qué tienes en mente hoy?',
    writeBtn: 'Escribir',
    dateLocale: 'es-ES',
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

// -----------------------
// localStorage read/write
// -----------------------

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveEntries() してよい。
function getEntries() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveEntries(entries) {
  if (!store) return;
  store.set(entries).catch(function (e) {
    console.error('Daily Summary: 保存に失敗しました', e);
  });
}

// -----------------------
// Formatting
// -----------------------

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(t.dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  // データ層の準備ができるまで描画も操作もさせない
  store = await openStore('daily-summary', 'entries', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderEntries(); });

  applyStaticTranslations();
  document.getElementById('writeForm').addEventListener('submit', handleWrite);
  document.getElementById('writeTabBtn').addEventListener('click', function () { setActiveTab('write'); });
  document.getElementById('reflectTabBtn').addEventListener('click', function () { setActiveTab('reflect'); });

  renderEntries();
});

// -----------------------
// Tabs (mobile only; both pages stay visible on wider screens via CSS)
// -----------------------

function setActiveTab(tab) {
  const writePage = document.getElementById('writePage');
  const reflectPage = document.getElementById('reflectPage');
  const writeTabBtn = document.getElementById('writeTabBtn');
  const reflectTabBtn = document.getElementById('reflectTabBtn');

  const isWrite = tab === 'write';
  writePage.classList.toggle('page--active', isWrite);
  reflectPage.classList.toggle('page--active', !isWrite);
  writeTabBtn.classList.toggle('active', isWrite);
  reflectTabBtn.classList.toggle('active', !isWrite);
  writeTabBtn.setAttribute('aria-selected', String(isWrite));
  reflectTabBtn.setAttribute('aria-selected', String(!isWrite));
}

// -----------------------
// Write
// -----------------------

function handleWrite(e) {
  e.preventDefault();

  const textInput = document.getElementById('entryText');
  const text = textInput.value.trim();
  if (!text) return;

  const entry = {
    id: Date.now(),
    text: text,
    createdAt: new Date().toISOString()
  };

  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);

  this.reset();
  renderEntries();
  setActiveTab('reflect');
  document.getElementById('reflectHeading').focus();
}

// -----------------------
// Render
// -----------------------

function renderEntries() {
  const entries = getEntries()
    .slice()
    .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); })
    .slice(0, DISPLAY_LIMIT);

  const list = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');
  list.innerHTML = '';

  if (entries.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  entries.forEach(function (entry) {
    list.appendChild(createEntryCard(entry));
  });
}

function createEntryCard(entry) {
  const card = document.createElement('div');
  card.className = 'entry-card';

  const date = document.createElement('p');
  date.className = 'entry-date';
  date.textContent = formatTimestamp(entry.createdAt);
  card.appendChild(date);

  const text = document.createElement('p');
  text.className = 'entry-text';
  text.textContent = entry.text;
  card.appendChild(text);

  return card;
}
