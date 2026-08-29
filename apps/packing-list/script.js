// ===========================
// Packing List
// 旅行の持ち物チェックリスト。カテゴリごとに並べて、詰めたらチェック。
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'packingList:items:v1';

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
const MAX_NAME_LENGTH = 80;

// カテゴリの順番＝画面に出る順番
const CATEGORIES = [
  { id: 'documents',   emoji: '🛂' },
  { id: 'money',       emoji: '💳' },
  { id: 'electronics', emoji: '🔌' },
  { id: 'clothes',     emoji: '👕' },
  { id: 'toiletries',  emoji: '🧴' },
  { id: 'health',      emoji: '💊' },
  { id: 'other',       emoji: '🎒' }
];

// 「Add starter essentials」で入る定番の持ち物
const STARTER_ITEMS = [
  { category: 'documents',   key: 'sPassport' },
  { category: 'documents',   key: 'sTickets' },
  { category: 'money',       key: 'sWallet' },
  { category: 'money',       key: 'sCash' },
  { category: 'electronics', key: 'sCharger' },
  { category: 'electronics', key: 'sPowerBank' },
  { category: 'electronics', key: 'sAdapter' },
  { category: 'clothes',     key: 'sUnderwear' },
  { category: 'clothes',     key: 'sSocks' },
  { category: 'clothes',     key: 'sChangeOfClothes' },
  { category: 'toiletries',  key: 'sToothbrush' },
  { category: 'toiletries',  key: 'sSkincare' },
  { category: 'health',      key: 'sMedicine' },
  { category: 'other',       key: 'sBottle' },
  { category: 'other',       key: 'sUmbrella' },
  { category: 'other',       key: 'sHeadphones' }
];

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'Packing List',
    titleWord1: 'Packing',
    titleWord2: 'List',
    subtitle: 'Tick things off as you pack, so nothing important stays at home.',
    progressHeading: 'Packing progress',
    addHeading: 'Add something to bring',
    nameLabel: 'Item',
    nameHint: 'One thing at a time — keep it short',
    namePlaceholder: 'e.g. Passport',
    categoryLabel: 'Category',
    addBtn: 'Add to list',
    listHeading: 'Your list',
    uncheckAll: 'Uncheck all',
    clearAll: 'Clear list',
    emptyArtTitle: 'An open, empty suitcase',
    emptyTitle: 'Your suitcase is empty',
    emptyText: 'Add items above, or start from a ready-made list of travel basics.',
    starterBtn: 'Add starter essentials',
    storageNote: 'Your list is saved in this browser. It is not shared with anyone else.',
    howToHeading: 'How to use',
    howTo1: 'Add each thing you want to bring, and pick a category for it.',
    howTo2: 'Tick the box as each item goes into your bag. The bar shows how far along you are.',
    howTo3: 'Back home? Press "Uncheck all" and the same list is ready for your next trip.',

    errEmpty: 'Please type what you want to bring.',
    errTooLong: 'Please keep it under 80 characters.',
    errDuplicate: 'That item is already on your list.',

    packedCount: '{done} of {total} packed',
    noteStart: 'Nothing packed yet. Start with the easy stuff.',
    noteGoing: '{left} left to pack.',
    noteDone: 'All packed. Have a great trip!',
    deleteItem: 'Delete {name}',
    confirmUncheck: 'Uncheck every item, ready for the next trip?',
    confirmClear: 'Delete the whole list? This cannot be undone.',

    documents: 'Documents',
    money: 'Money',
    electronics: 'Electronics',
    clothes: 'Clothes',
    toiletries: 'Toiletries',
    health: 'Health',
    other: 'Other',

    sPassport: 'Passport / ID',
    sTickets: 'Tickets & bookings',
    sWallet: 'Wallet & cards',
    sCash: 'Some cash',
    sCharger: 'Phone charger',
    sPowerBank: 'Power bank',
    sAdapter: 'Plug adapter',
    sUnderwear: 'Underwear',
    sSocks: 'Socks',
    sChangeOfClothes: 'Change of clothes',
    sToothbrush: 'Toothbrush & toothpaste',
    sSkincare: 'Skincare basics',
    sMedicine: 'Everyday medicine',
    sBottle: 'Water bottle',
    sUmbrella: 'Folding umbrella',
    sHeadphones: 'Headphones'
  },

  ja: {
    title: 'Packing List',
    titleWord1: 'Packing',
    titleWord2: 'List',
    subtitle: '荷造りしながらチェック。大事なものを家に置き去りにしません。',
    progressHeading: '荷造りの進み具合',
    addHeading: '持っていくものを追加',
    nameLabel: '持ち物',
    nameHint: '1つずつ、短い名前で',
    namePlaceholder: '例: パスポート',
    categoryLabel: 'カテゴリ',
    addBtn: 'リストに追加',
    listHeading: '持ち物リスト',
    uncheckAll: 'チェックを全部外す',
    clearAll: 'リストを空にする',
    emptyArtTitle: '開いた空のスーツケース',
    emptyTitle: 'スーツケースはまだ空です',
    emptyText: '上のフォームから追加するか、定番の持ち物リストから始めましょう。',
    starterBtn: '定番の持ち物を追加',
    storageNote: 'リストはこのブラウザに保存されます。他の人には共有されません。',
    howToHeading: '使い方',
    howTo1: '持っていくものを入力して、カテゴリを選びます。',
    howTo2: 'カバンに入れたらチェック。バーで進み具合がわかります。',
    howTo3: '帰ってきたら「チェックを全部外す」で、次の旅行にそのまま使えます。',

    errEmpty: '持っていくものを入力してください。',
    errTooLong: '80文字以内で入力してください。',
    errDuplicate: 'その持ち物はすでにリストにあります。',

    packedCount: '{total}個中 {done}個 完了',
    noteStart: 'まだ何も詰めていません。簡単なものから始めましょう。',
    noteGoing: 'あと{left}個です。',
    noteDone: '荷造り完了。いってらっしゃい！',
    deleteItem: '{name}を削除',
    confirmUncheck: 'すべてのチェックを外しますか？次の旅行用に使えます。',
    confirmClear: 'リストを全部削除しますか？元に戻せません。',

    documents: '書類',
    money: 'お金',
    electronics: '電子機器',
    clothes: '衣類',
    toiletries: '洗面用具',
    health: '健康',
    other: 'その他',

    sPassport: 'パスポート / 身分証',
    sTickets: 'チケット・予約情報',
    sWallet: '財布・カード',
    sCash: '現金',
    sCharger: 'スマホの充電器',
    sPowerBank: 'モバイルバッテリー',
    sAdapter: '変換プラグ',
    sUnderwear: '下着',
    sSocks: '靴下',
    sChangeOfClothes: '着替え',
    sToothbrush: '歯ブラシ・歯磨き粉',
    sSkincare: 'スキンケア用品',
    sMedicine: 'いつもの薬',
    sBottle: '水筒',
    sUmbrella: '折りたたみ傘',
    sHeadphones: 'イヤホン'
  },

  es: {
    title: 'Packing List',
    titleWord1: 'Packing',
    titleWord2: 'List',
    subtitle: 'Marca cada cosa al guardarla, para no dejar nada importante en casa.',
    progressHeading: 'Progreso del equipaje',
    addHeading: 'Añade algo que llevar',
    nameLabel: 'Objeto',
    nameHint: 'Uno a la vez, con un nombre corto',
    namePlaceholder: 'ej. Pasaporte',
    categoryLabel: 'Categoría',
    addBtn: 'Añadir a la lista',
    listHeading: 'Tu lista',
    uncheckAll: 'Desmarcar todo',
    clearAll: 'Vaciar la lista',
    emptyArtTitle: 'Una maleta abierta y vacía',
    emptyTitle: 'Tu maleta está vacía',
    emptyText: 'Añade objetos arriba o empieza con una lista de básicos de viaje.',
    starterBtn: 'Añadir lo básico',
    storageNote: 'Tu lista se guarda en este navegador. No se comparte con nadie más.',
    howToHeading: 'Cómo se usa',
    howTo1: 'Añade cada cosa que quieras llevar y elige su categoría.',
    howTo2: 'Marca la casilla cuando la guardes. La barra muestra tu avance.',
    howTo3: '¿De vuelta en casa? Pulsa "Desmarcar todo" y la lista queda lista para el próximo viaje.',

    errEmpty: 'Escribe qué quieres llevar.',
    errTooLong: 'Usa menos de 80 caracteres.',
    errDuplicate: 'Ese objeto ya está en tu lista.',

    packedCount: '{done} de {total} guardados',
    noteStart: 'Aún no has guardado nada. Empieza por lo fácil.',
    noteGoing: 'Te faltan {left}.',
    noteDone: 'Todo guardado. ¡Buen viaje!',
    deleteItem: 'Eliminar {name}',
    confirmUncheck: '¿Desmarcar todos los objetos para el próximo viaje?',
    confirmClear: '¿Eliminar toda la lista? No se puede deshacer.',

    documents: 'Documentos',
    money: 'Dinero',
    electronics: 'Electrónica',
    clothes: 'Ropa',
    toiletries: 'Aseo',
    health: 'Salud',
    other: 'Otros',

    sPassport: 'Pasaporte / DNI',
    sTickets: 'Billetes y reservas',
    sWallet: 'Cartera y tarjetas',
    sCash: 'Algo de efectivo',
    sCharger: 'Cargador del móvil',
    sPowerBank: 'Batería externa',
    sAdapter: 'Adaptador de enchufe',
    sUnderwear: 'Ropa interior',
    sSocks: 'Calcetines',
    sChangeOfClothes: 'Muda de ropa',
    sToothbrush: 'Cepillo y pasta de dientes',
    sSkincare: 'Cuidado de la piel',
    sMedicine: 'Medicinas de siempre',
    sBottle: 'Botella de agua',
    sUmbrella: 'Paraguas plegable',
    sHeadphones: 'Auriculares'
  }
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const t = STRINGS[getLang()];

// '{done} of {total} packed' のような文の穴埋め
function fill(template, values) {
  let out = template;
  for (const key of Object.keys(values)) {
    out = out.split('{' + key + '}').join(values[key]);
  }
  return out;
}

function applyStaticTranslations() {
  document.documentElement.setAttribute('lang', getLang());
  document.title = t.title + ' | CobbleWorks';

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
// DOM
// -----------------------

const progressSection = document.getElementById('progressSection');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const progressNote = document.getElementById('progressNote');

const addForm = document.getElementById('addForm');
const itemNameInput = document.getElementById('itemName');
const itemCategorySelect = document.getElementById('itemCategory');
const nameError = document.getElementById('nameError');

const itemList = document.getElementById('itemList');
const emptyState = document.getElementById('emptyState');
const listActions = document.getElementById('listActions');
const uncheckAllBtn = document.getElementById('uncheckAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const starterBtn = document.getElementById('starterBtn');

// -----------------------
// データの読み書き
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
    console.error('Packing List: 保存に失敗しました', e);
  });
}

function makeId() {
  return 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

// -----------------------
// 入力チェック
// -----------------------

function showError(message) {
  nameError.textContent = message;
  nameError.hidden = false;
  itemNameInput.setAttribute('aria-invalid', 'true');
}

function clearError() {
  nameError.textContent = '';
  nameError.hidden = true;
  itemNameInput.removeAttribute('aria-invalid');
}

// 問題なければ整えた名前、だめならnullを返す
function validateName(rawName, category, items) {
  const name = rawName.trim().replace(/\s+/g, ' ');

  if (name === '') {
    showError(t.errEmpty);
    return null;
  }
  if (name.length > MAX_NAME_LENGTH) {
    showError(t.errTooLong);
    return null;
  }
  const isDuplicate = items.some(function (item) {
    return item.category === category && item.name.toLowerCase() === name.toLowerCase();
  });
  if (isDuplicate) {
    showError(t.errDuplicate);
    return null;
  }

  clearError();
  return name;
}

// -----------------------
// 画面の組み立て
// -----------------------

function buildCategoryOptions() {
  for (const category of CATEGORIES) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.emoji + ' ' + t[category.id];
    itemCategorySelect.appendChild(option);
  }
}

function buildItemRow(item) {
  const li = document.createElement('li');
  li.className = 'item-row' + (item.packed ? ' is-packed' : '');

  const label = document.createElement('label');
  label.className = 'item-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(item.packed);
  checkbox.addEventListener('change', function () {
    togglePacked(item.id, checkbox.checked);
  });

  const name = document.createElement('span');
  name.className = 'item-name';
  name.textContent = item.name;

  label.appendChild(checkbox);
  label.appendChild(name);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', fill(t.deleteItem, { name: item.name }));
  deleteBtn.addEventListener('click', function () {
    deleteItem(item.id);
  });

  li.appendChild(label);
  li.appendChild(deleteBtn);
  return li;
}

function buildCategoryGroup(category, items) {
  const section = document.createElement('section');
  section.className = 'category-group';

  const heading = document.createElement('h3');
  heading.className = 'category-head';

  const emoji = document.createElement('span');
  emoji.setAttribute('aria-hidden', 'true');
  emoji.textContent = category.emoji;

  const label = document.createElement('span');
  label.textContent = t[category.id];

  const count = document.createElement('span');
  count.className = 'category-count';
  const packedHere = items.filter(function (i) { return i.packed; }).length;
  count.textContent = packedHere + ' / ' + items.length;

  heading.appendChild(emoji);
  heading.appendChild(label);
  heading.appendChild(count);

  const list = document.createElement('ul');
  list.className = 'item-list';
  for (const item of items) {
    list.appendChild(buildItemRow(item));
  }

  section.appendChild(heading);
  section.appendChild(list);
  return section;
}

function renderProgress(items) {
  if (items.length === 0) {
    progressSection.hidden = true;
    return;
  }
  progressSection.hidden = false;

  const done = items.filter(function (i) { return i.packed; }).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);

  progressText.textContent = fill(t.packedCount, { done: done, total: total });
  progressFill.style.width = percent + '%';
  progressFill.classList.toggle('is-done', done === total);

  if (done === 0) {
    progressNote.textContent = t.noteStart;
  } else if (done === total) {
    progressNote.textContent = t.noteDone;
  } else {
    progressNote.textContent = fill(t.noteGoing, { left: total - done });
  }
}

function render() {
  const items = getItems();

  itemList.textContent = '';
  emptyState.hidden = items.length > 0;
  listActions.hidden = items.length === 0;

  for (const category of CATEGORIES) {
    const inCategory = items.filter(function (i) { return i.category === category.id; });
    if (inCategory.length === 0) continue;
    itemList.appendChild(buildCategoryGroup(category, inCategory));
  }

  renderProgress(items);
}

// -----------------------
// 操作
// -----------------------

function addItem(name, category) {
  const items = getItems();
  items.push({ id: makeId(), name: name, category: category, packed: false });
  saveItems(items);
  render();
}

function togglePacked(id, packed) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.packed = packed;
  saveItems(items);
  render();
}

function deleteItem(id) {
  const items = getItems().filter(function (i) { return i.id !== id; });
  saveItems(items);
  render();
}

function addStarterItems() {
  const items = getItems();
  for (const starter of STARTER_ITEMS) {
    const name = t[starter.key];
    const exists = items.some(function (i) {
      return i.category === starter.category && i.name.toLowerCase() === name.toLowerCase();
    });
    if (exists) continue;
    items.push({ id: makeId(), name: name, category: starter.category, packed: false });
  }
  saveItems(items);
  render();
}

addForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const category = itemCategorySelect.value;
  const name = validateName(itemNameInput.value, category, getItems());
  if (name === null) {
    itemNameInput.focus();
    return;
  }
  addItem(name, category);
  itemNameInput.value = '';
  itemNameInput.focus();
});

itemNameInput.addEventListener('input', function () {
  if (!nameError.hidden) clearError();
});

starterBtn.addEventListener('click', addStarterItems);

uncheckAllBtn.addEventListener('click', function () {
  if (!window.confirm(t.confirmUncheck)) return;
  const items = getItems();
  for (const item of items) item.packed = false;
  saveItems(items);
  render();
});

clearAllBtn.addEventListener('click', function () {
  if (!window.confirm(t.confirmClear)) return;
  saveItems([]);
  render();
});

// -----------------------
// 起動
// -----------------------

// データ層の準備ができてから描画する
(async function () {
  applyStaticTranslations();
  buildCategoryOptions();

  store = await openStore('packing-list', 'items', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
