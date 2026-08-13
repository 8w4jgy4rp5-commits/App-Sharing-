// ===========================
// Restock Planner
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'restockPlanner:items:v1';

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
const LANG_KEY = 'cobbleworks:lang:v1';

const EMOJI_OPTIONS = ['🧴', '🧼', '🧻', '🪥', '🧽', '🧦', '☕', '📦'];
const LEVELS = [
  { value: 100, labelKey: 'levelFull' },
  { value: 50, labelKey: 'levelHalf' },
  { value: 20, labelKey: 'levelLow' },
  { value: 0, labelKey: 'levelEmpty' }
];

const DUE_SOON_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

let selectedEmoji = EMOJI_OPTIONS[0];

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'Restock Planner',
    heading: '🧴 Restock Planner',
    subtitle: "Tap when you check a bottle. We'll gently guess when you'll need a new one — and roughly what it'll cost.",
    thisMonthLabel: 'This month',
    nextMonthLabel: 'Next month',
    nothingExpected: 'Nothing expected yet — nice and quiet.',
    itemsHeading: 'Your items',
    addItemBtn: '+ Add an item',
    addItemFormTitle: 'Add an item',
    iconLabel: 'Icon',
    iconHint: 'Pick whatever feels right',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Body soap',
    priceLabel: 'Price (¥)',
    priceHint: 'Roughly how much a new one costs',
    pricePlaceholder: 'e.g. 600',
    cycleDaysLabel: 'Usually lasts about how many days?',
    cycleDaysHint: 'A rough guess is totally fine',
    cycleDaysPlaceholder: 'e.g. 30',
    submitAddItem: 'Add item',
    cancel: 'Cancel',
    levelFull: 'Full',
    levelHalf: 'Half',
    levelLow: 'Low',
    levelEmpty: 'Empty',
    predictionOut: "Looks like it's out — time for a new one! 🛒",
    predictionMaybeOut: 'Might already be running out — worth a peek! 👀',
    predictionDueSoon: function (n) { return 'About ' + n + (n === 1 ? ' day' : ' days') + ' left — might want to grab one soon!'; },
    predictionOk: function (n) { return 'About ' + n + " days left — you're all good for now 😊"; },
    emptyItems: "No items yet! Add your first one below and we'll start keeping an eye on it. 🧺",
    iconAriaLabel: function (emoji) { return 'Icon ' + emoji; },
    removeItemAriaLabel: function (name) { return 'Remove ' + name; },
    setLevelAriaLabel: function (name, label) { return 'Set ' + name + ' to ' + label; },
    runningLowSoon: '🔔 Running low soon',
    itemsMightNeedRestocking: function (n) { return n + (n === 1 ? ' item might need restocking' : ' items might need restocking'); },
    dueSoonBanner: function (n) { return '🔔 ' + n + (n === 1 ? ' item' : ' items') + ' might run out soon'; },
  },
  ja: {
    title: 'ストック管理',
    heading: '🧴 ストック管理',
    subtitle: 'ボトルをチェックしたらタップしてください。次に必要になりそうな時期と、だいたいの費用を予測します。',
    thisMonthLabel: '今月',
    nextMonthLabel: '来月',
    nothingExpected: '今のところ予定なし — 静かなものです。',
    itemsHeading: '登録アイテム',
    addItemBtn: '+ アイテムを追加',
    addItemFormTitle: 'アイテムを追加',
    iconLabel: 'アイコン',
    iconHint: '好きなものを選んでください',
    nameLabel: '名前',
    namePlaceholder: '例: ボディソープ',
    priceLabel: '価格（¥）',
    priceHint: '新品を買うときのだいたいの値段',
    pricePlaceholder: '例: 600',
    cycleDaysLabel: '普段は何日くらいもちますか？',
    cycleDaysHint: 'おおよその目安でOKです',
    cycleDaysPlaceholder: '例: 30',
    submitAddItem: '追加する',
    cancel: 'キャンセル',
    levelFull: '満タン',
    levelHalf: '半分',
    levelLow: '少ない',
    levelEmpty: '空っぽ',
    predictionOut: 'そろそろ空みたいです — 新しいものを用意しましょう！🛒',
    predictionMaybeOut: 'もうすぐ切れているかも — 確認してみましょう！👀',
    predictionDueSoon: function (n) { return 'あと約' + n + '日 — そろそろ買っておくと安心です！'; },
    predictionOk: function (n) { return 'あと約' + n + '日 — まだ余裕があります 😊'; },
    emptyItems: 'まだアイテムがありません！下から最初のひとつを追加すると、見守りを始めます。🧺',
    iconAriaLabel: function (emoji) { return 'アイコン ' + emoji; },
    removeItemAriaLabel: function (name) { return name + 'を削除'; },
    setLevelAriaLabel: function (name, label) { return name + 'を' + label + 'に設定'; },
    runningLowSoon: '🔔 まもなく少なくなります',
    itemsMightNeedRestocking: function (n) { return n + '件のアイテムが補充時期かもしれません'; },
    dueSoonBanner: function (n) { return '🔔 ' + n + '件のアイテムがまもなく切れそうです'; },
  },
  es: {
    title: 'Planificador de Reposición',
    heading: '🧴 Planificador de Reposición',
    subtitle: 'Toca cuando revises un envase. Calcularemos con cuidado cuándo necesitarás uno nuevo, y aproximadamente cuánto costará.',
    thisMonthLabel: 'Este mes',
    nextMonthLabel: 'Próximo mes',
    nothingExpected: 'Nada previsto por ahora — todo tranquilo.',
    itemsHeading: 'Tus artículos',
    addItemBtn: '+ Añadir artículo',
    addItemFormTitle: 'Añadir artículo',
    iconLabel: 'Icono',
    iconHint: 'Elige el que más te guste',
    nameLabel: 'Nombre',
    namePlaceholder: 'ej. Jabón corporal',
    priceLabel: 'Precio (¥)',
    priceHint: 'Aproximadamente cuánto cuesta uno nuevo',
    pricePlaceholder: 'ej. 600',
    cycleDaysLabel: '¿Cuántos días suele durar?',
    cycleDaysHint: 'Una estimación aproximada está bien',
    cycleDaysPlaceholder: 'ej. 30',
    submitAddItem: 'Añadir artículo',
    cancel: 'Cancelar',
    levelFull: 'Lleno',
    levelHalf: 'Mitad',
    levelLow: 'Bajo',
    levelEmpty: 'Vacío',
    predictionOut: '¡Parece que se acabó — hora de conseguir uno nuevo! 🛒',
    predictionMaybeOut: 'Podría estar por acabarse — ¡vale la pena revisar! 👀',
    predictionDueSoon: function (n) { return 'Quedan unos ' + n + (n === 1 ? ' día' : ' días') + ' — quizá quieras conseguir uno pronto.'; },
    predictionOk: function (n) { return 'Quedan unos ' + n + ' días — todo en orden por ahora 😊'; },
    emptyItems: '¡Aún no hay artículos! Añade el primero abajo y empezaremos a vigilarlo. 🧺',
    iconAriaLabel: function (emoji) { return 'Icono ' + emoji; },
    removeItemAriaLabel: function (name) { return 'Eliminar ' + name; },
    setLevelAriaLabel: function (name, label) { return 'Ajustar ' + name + ' a ' + label; },
    runningLowSoon: '🔔 Se acabará pronto',
    itemsMightNeedRestocking: function (n) { return n === 1 ? '1 artículo podría necesitar reposición' : n + ' artículos podrían necesitar reposición'; },
    dueSoonBanner: function (n) { return n === 1 ? '🔔 1 artículo podría acabarse pronto' : '🔔 ' + n + ' artículos podrían acabarse pronto'; },
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
// ID helper
// -----------------------

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// -----------------------
// localStorage read/write
// -----------------------

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveItems() してよい。
function getItems() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveItems(items) {
  if (!store) return;
  store.set(items).catch(function (e) {
    console.error('Restock Planner: 保存に失敗しました', e);
  });
}

// -----------------------
// Prediction helpers
// -----------------------

function daysFromToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

// Computes everything derived from an item's stock level in one pass, so
// callers (card rendering, forecast totals) share a single prediction.
function getPrediction(item) {
  const remainingDays = Math.round(item.cycleDays * (item.level / 100));
  const predictedDate = new Date(item.lastUpdated);
  predictedDate.setDate(predictedDate.getDate() + remainingDays);
  const daysLeft = daysFromToday(predictedDate);
  return {
    remainingDays: remainingDays,
    predictedDate: predictedDate,
    daysLeft: daysLeft,
    dueSoon: daysLeft <= DUE_SOON_DAYS
  };
}

function predictionCopy(item, prediction) {
  if (item.level === 0) {
    return t.predictionOut;
  }
  if (prediction.daysLeft <= 0) {
    return t.predictionMaybeOut;
  }
  if (prediction.daysLeft <= DUE_SOON_DAYS) {
    return t.predictionDueSoon(prediction.daysLeft);
  }
  return t.predictionOk(prediction.remainingDays);
}

function formatYen(amount) {
  return '¥' + Math.round(amount).toLocaleString('en-US');
}

// Sortable year+month number, so "this month or earlier" can be compared
// with a single <= instead of juggling separate key strings.
function yearMonthNumber(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  // データ層の準備ができるまで描画も操作もさせない
  store = await openStore('restock-planner', 'items', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderAll(); });

  applyStaticTranslations();
  renderEmojiPicker();

  document.getElementById('showAddItemBtn').addEventListener('click', openAddForm);
  document.getElementById('cancelItemBtn').addEventListener('click', closeAddForm);
  document.getElementById('itemForm').addEventListener('submit', handleAddItem);

  renderAll();
});

function renderAll() {
  renderItemList();
  renderForecast();
}

// -----------------------
// Add item form
// -----------------------

function renderEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = '';
  EMOJI_OPTIONS.forEach(function (emoji) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-option' + (emoji === selectedEmoji ? ' selected' : '');
    btn.textContent = emoji;
    btn.setAttribute('aria-label', t.iconAriaLabel(emoji));
    btn.addEventListener('click', function () {
      selectedEmoji = emoji;
      renderEmojiPicker();
    });
    picker.appendChild(btn);
  });
}

function openAddForm() {
  selectedEmoji = EMOJI_OPTIONS[0];
  document.getElementById('itemName').value = '';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemCycleDays').value = '';
  renderEmojiPicker();
  document.getElementById('itemForm').hidden = false;
  document.getElementById('itemName').focus();
}

function closeAddForm() {
  document.getElementById('itemForm').hidden = true;
}

function handleAddItem(e) {
  e.preventDefault();

  const name = document.getElementById('itemName').value.trim();
  const price = Number(document.getElementById('itemPrice').value);
  const cycleDays = Number(document.getElementById('itemCycleDays').value);

  if (!name || !(price >= 0) || !(cycleDays > 0)) return;

  const items = getItems();
  items.push({
    id: genId(),
    name: name,
    emoji: selectedEmoji,
    price: price,
    cycleDays: cycleDays,
    level: 100,
    lastUpdated: Date.now(),
    createdAt: Date.now()
  });
  saveItems(items);

  closeAddForm();
  renderAll();
}

// -----------------------
// Item list
// -----------------------

function setItemLevel(id, level) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.level = level;
  item.lastUpdated = Date.now();
  saveItems(items);
  renderAll();
}

function deleteItem(id) {
  const items = getItems().filter(function (i) { return i.id !== id; });
  saveItems(items);
  renderAll();
}

function renderItemList() {
  const list = document.getElementById('itemList');
  list.innerHTML = '';

  const items = getItems();

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.emptyItems;
    list.appendChild(empty);
    return;
  }

  items.forEach(function (item) {
    list.appendChild(createItemCard(item));
  });
}

function createItemCard(item) {
  const prediction = getPrediction(item);

  const card = document.createElement('div');
  card.className = 'item-card' + (prediction.dueSoon ? ' due-soon' : '');

  const header = document.createElement('div');
  header.className = 'item-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'item-title-group';

  const emojiSpan = document.createElement('span');
  emojiSpan.className = 'item-emoji';
  emojiSpan.textContent = item.emoji || '📦';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'item-name';
  nameSpan.textContent = item.name;

  titleGroup.appendChild(emojiSpan);
  titleGroup.appendChild(nameSpan);

  const priceTag = document.createElement('span');
  priceTag.className = 'item-price-tag';
  priceTag.textContent = formatYen(item.price);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'item-delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', t.removeItemAriaLabel(item.name));
  deleteBtn.addEventListener('click', function () { deleteItem(item.id); });

  header.appendChild(titleGroup);
  header.appendChild(priceTag);
  header.appendChild(deleteBtn);

  const levelRow = document.createElement('div');
  levelRow.className = 'level-row';
  LEVELS.forEach(function (lvl) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level-btn' + (item.level === lvl.value ? ' active' : '');
    btn.textContent = t[lvl.labelKey];
    btn.setAttribute('aria-label', t.setLevelAriaLabel(item.name, t[lvl.labelKey]));
    btn.setAttribute('aria-pressed', item.level === lvl.value ? 'true' : 'false');
    btn.addEventListener('click', function () { setItemLevel(item.id, lvl.value); });
    levelRow.appendChild(btn);
  });

  card.appendChild(header);
  card.appendChild(levelRow);

  if (prediction.dueSoon) {
    const badge = document.createElement('p');
    badge.className = 'item-due-soon-badge';
    badge.textContent = t.runningLowSoon;
    card.appendChild(badge);
  }

  const predictionEl = document.createElement('p');
  predictionEl.className = 'item-prediction';
  predictionEl.textContent = predictionCopy(item, prediction);
  card.appendChild(predictionEl);

  return card;
}

// -----------------------
// Monthly forecast
// -----------------------

function renderForecast() {
  const items = getItems();
  const today = new Date();
  const thisYM = yearMonthNumber(today);
  const nextYM = thisYM + 1;

  let thisMonthTotal = 0;
  let thisMonthCount = 0;
  let nextMonthTotal = 0;
  let nextMonthCount = 0;
  let dueSoonCount = 0;

  items.forEach(function (item) {
    const prediction = getPrediction(item);
    const itemYM = yearMonthNumber(prediction.predictedDate);

    // Anything predicted for this month or earlier (including overdue items
    // whose stock level hasn't been updated in a while) still counts as an
    // expected expense this month, not just an exact month match.
    if (itemYM <= thisYM) {
      thisMonthTotal += item.price;
      thisMonthCount += 1;
    } else if (itemYM === nextYM) {
      nextMonthTotal += item.price;
      nextMonthCount += 1;
    }

    if (prediction.dueSoon) dueSoonCount += 1;
  });

  document.getElementById('thisMonthAmount').textContent = formatYen(thisMonthTotal);
  document.getElementById('thisMonthSub').textContent = thisMonthCount === 0
    ? t.nothingExpected
    : t.itemsMightNeedRestocking(thisMonthCount);

  document.getElementById('nextMonthAmount').textContent = formatYen(nextMonthTotal);
  document.getElementById('nextMonthSub').textContent = nextMonthCount === 0
    ? t.nothingExpected
    : t.itemsMightNeedRestocking(nextMonthCount);

  const banner = document.getElementById('dueSoonBanner');
  if (dueSoonCount > 0) {
    banner.hidden = false;
    banner.textContent = t.dueSoonBanner(dueSoonCount);
  } else {
    banner.hidden = true;
  }
}
