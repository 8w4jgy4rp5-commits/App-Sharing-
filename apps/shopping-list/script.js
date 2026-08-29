// ===========================
// Shopping List
// 買うものリスト。売り場ごとに並べて、カゴに入れたらチェック。
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'shoppingList:items:v1';

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

// 売り場の順番＝画面に出る順番(店内をまわる順のイメージ)
const CATEGORIES = [
  { id: 'produce',   emoji: '🥬' },
  { id: 'meat',      emoji: '🍖' },
  { id: 'dairy',     emoji: '🥚' },
  { id: 'bakery',    emoji: '🍞' },
  { id: 'pantry',    emoji: '🥫' },
  { id: 'frozen',    emoji: '🧊' },
  { id: 'drinks',    emoji: '🥤' },
  { id: 'household', emoji: '🧻' },
  { id: 'other',     emoji: '🛒' }
];

// 「Add everyday basics」で入る定番の買い物
const STARTER_ITEMS = [
  { category: 'produce',   key: 'sOnions' },
  { category: 'produce',   key: 'sTomatoes' },
  { category: 'meat',      key: 'sChicken' },
  { category: 'dairy',     key: 'sMilk' },
  { category: 'dairy',     key: 'sEggs' },
  { category: 'bakery',    key: 'sBread' },
  { category: 'pantry',    key: 'sRice' },
  { category: 'pantry',    key: 'sCookingOil' },
  { category: 'frozen',    key: 'sFrozenVeg' },
  { category: 'drinks',    key: 'sCoffeeTea' },
  { category: 'household', key: 'sToiletPaper' },
  { category: 'household', key: 'sDishSoap' },
  { category: 'household', key: 'sDetergent' }
];

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'Shopping List',
    titleWord1: 'Shopping',
    titleWord2: 'List',
    subtitle: 'Write down what you need, then tick each thing off as it goes in your basket.',
    progressHeading: 'Shopping progress',
    addHeading: 'Add something to buy',
    nameLabel: 'Item',
    nameHint: 'One thing at a time — keep it short',
    namePlaceholder: 'e.g. Milk',
    categoryLabel: 'Section',
    addBtn: 'Add to list',
    listHeading: 'Your list',
    removeBought: 'Remove bought',
    clearAll: 'Clear list',
    emptyArtTitle: 'An empty shopping basket',
    emptyTitle: 'Nothing on the list yet',
    emptyText: 'Add what you need above, or start from a list of everyday basics.',
    starterBtn: 'Add everyday basics',
    storageNote: 'Your list is saved in this browser. It is not shared with anyone else.',
    howToHeading: 'How to use',
    howTo1: 'Add each thing you need to buy, and pick the section of the shop it belongs to.',
    howTo2: 'Tick the box as it goes into your basket. The bar shows what is still missing.',
    howTo3: 'Back home? Press "Remove bought" to clear what you got, and anything you missed stays on the list.',

    errEmpty: 'Please type what you want to buy.',
    errTooLong: 'Please keep it under 80 characters.',
    errDuplicate: 'That item is already on your list.',

    boughtCount: '{done} of {total} in the basket',
    noteStart: 'Nothing picked up yet. Take your time.',
    noteGoing: '{left} still to find.',
    noteDone: "That's everything. Nice work!",
    deleteItem: 'Delete {name}',
    confirmRemoveBought: 'Remove the {count} item(s) you have already bought?',
    confirmClear: 'Delete the whole list? This cannot be undone.',

    produce: 'Fruit & veg',
    meat: 'Meat & fish',
    dairy: 'Dairy & eggs',
    bakery: 'Bakery',
    pantry: 'Pantry',
    frozen: 'Frozen',
    drinks: 'Drinks',
    household: 'Household',
    other: 'Other',

    sOnions: 'Onions',
    sTomatoes: 'Tomatoes',
    sChicken: 'Chicken',
    sMilk: 'Milk',
    sEggs: 'Eggs',
    sBread: 'Bread',
    sRice: 'Rice',
    sCookingOil: 'Cooking oil',
    sFrozenVeg: 'Frozen vegetables',
    sCoffeeTea: 'Coffee or tea',
    sToiletPaper: 'Toilet paper',
    sDishSoap: 'Dish soap',
    sDetergent: 'Laundry detergent'
  },

  ja: {
    title: 'Shopping List',
    titleWord1: 'Shopping',
    titleWord2: 'List',
    subtitle: '買うものを書いておいて、カゴに入れたらチェック。買い忘れを防ぎます。',
    progressHeading: '買い物の進み具合',
    addHeading: '買うものを追加',
    nameLabel: '品名',
    nameHint: '1つずつ、短い名前で',
    namePlaceholder: '例: 牛乳',
    categoryLabel: '売り場',
    addBtn: 'リストに追加',
    listHeading: '買うものリスト',
    removeBought: '買ったものを消す',
    clearAll: 'リストを空にする',
    emptyArtTitle: '空の買い物カゴ',
    emptyTitle: 'まだ何も入っていません',
    emptyText: '上のフォームから追加するか、定番の買い物リストから始めましょう。',
    starterBtn: '定番の買い物を追加',
    storageNote: 'リストはこのブラウザに保存されます。他の人には共有されません。',
    howToHeading: '使い方',
    howTo1: '買うものを入力して、売り場(野菜・肉・日用品など)を選びます。',
    howTo2: 'カゴに入れたらチェック。バーで残りがどれくらいかわかります。',
    howTo3: '帰ってきたら「買ったものを消す」で片付け。買えなかったものはリストに残ります。',

    errEmpty: '買うものを入力してください。',
    errTooLong: '80文字以内で入力してください。',
    errDuplicate: 'その品はすでにリストにあります。',

    boughtCount: '{total}個中 {done}個 かご入り',
    noteStart: 'まだ何も入れていません。ゆっくりどうぞ。',
    noteGoing: 'あと{left}個です。',
    noteDone: '全部そろいました。おつかれさまです！',
    deleteItem: '{name}を削除',
    confirmRemoveBought: '買った{count}個をリストから消しますか？',
    confirmClear: 'リストを全部削除しますか？元に戻せません。',

    produce: '野菜・果物',
    meat: '肉・魚',
    dairy: '乳製品・卵',
    bakery: 'パン',
    pantry: '常温食品・調味料',
    frozen: '冷凍食品',
    drinks: '飲みもの',
    household: '日用品',
    other: 'その他',

    sOnions: '玉ねぎ',
    sTomatoes: 'トマト',
    sChicken: '鶏肉',
    sMilk: '牛乳',
    sEggs: '卵',
    sBread: 'パン',
    sRice: 'お米',
    sCookingOil: 'サラダ油',
    sFrozenVeg: '冷凍野菜',
    sCoffeeTea: 'コーヒー・お茶',
    sToiletPaper: 'トイレットペーパー',
    sDishSoap: '食器用洗剤',
    sDetergent: '洗濯洗剤'
  },

  es: {
    title: 'Shopping List',
    titleWord1: 'Shopping',
    titleWord2: 'List',
    subtitle: 'Apunta lo que necesitas y márcalo cuando lo eches a la cesta.',
    progressHeading: 'Progreso de la compra',
    addHeading: 'Añade algo que comprar',
    nameLabel: 'Artículo',
    nameHint: 'Uno a la vez, con un nombre corto',
    namePlaceholder: 'ej. Leche',
    categoryLabel: 'Sección',
    addBtn: 'Añadir a la lista',
    listHeading: 'Tu lista',
    removeBought: 'Quitar lo comprado',
    clearAll: 'Vaciar la lista',
    emptyArtTitle: 'Una cesta de la compra vacía',
    emptyTitle: 'Todavía no hay nada en la lista',
    emptyText: 'Añade lo que necesitas arriba o empieza con una lista de básicos.',
    starterBtn: 'Añadir lo básico',
    storageNote: 'Tu lista se guarda en este navegador. No se comparte con nadie más.',
    howToHeading: 'Cómo se usa',
    howTo1: 'Añade cada cosa que necesitas comprar y elige la sección de la tienda.',
    howTo2: 'Marca la casilla al echarlo a la cesta. La barra muestra lo que falta.',
    howTo3: '¿De vuelta en casa? Pulsa "Quitar lo comprado" y lo que no encontraste sigue en la lista.',

    errEmpty: 'Escribe qué quieres comprar.',
    errTooLong: 'Usa menos de 80 caracteres.',
    errDuplicate: 'Ese artículo ya está en tu lista.',

    boughtCount: '{done} de {total} en la cesta',
    noteStart: 'Aún no has cogido nada. Con calma.',
    noteGoing: 'Te faltan {left}.',
    noteDone: 'Ya está todo. ¡Buen trabajo!',
    deleteItem: 'Eliminar {name}',
    confirmRemoveBought: '¿Quitar los {count} artículos que ya has comprado?',
    confirmClear: '¿Eliminar toda la lista? No se puede deshacer.',

    produce: 'Fruta y verdura',
    meat: 'Carne y pescado',
    dairy: 'Lácteos y huevos',
    bakery: 'Panadería',
    pantry: 'Despensa',
    frozen: 'Congelados',
    drinks: 'Bebidas',
    household: 'Hogar',
    other: 'Otros',

    sOnions: 'Cebollas',
    sTomatoes: 'Tomates',
    sChicken: 'Pollo',
    sMilk: 'Leche',
    sEggs: 'Huevos',
    sBread: 'Pan',
    sRice: 'Arroz',
    sCookingOil: 'Aceite',
    sFrozenVeg: 'Verdura congelada',
    sCoffeeTea: 'Café o té',
    sToiletPaper: 'Papel higiénico',
    sDishSoap: 'Lavavajillas',
    sDetergent: 'Detergente'
  }
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const t = STRINGS[getLang()];

// '{done} of {total} in the basket' のような文の穴埋め
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
const removeBoughtBtn = document.getElementById('removeBoughtBtn');
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
    console.error('Shopping List: 保存に失敗しました', e);
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
  li.className = 'item-row' + (item.bought ? ' is-bought' : '');

  const label = document.createElement('label');
  label.className = 'item-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(item.bought);
  checkbox.addEventListener('change', function () {
    toggleBought(item.id, checkbox.checked);
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
  const boughtHere = items.filter(function (i) { return i.bought; }).length;
  count.textContent = boughtHere + ' / ' + items.length;

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

  const done = items.filter(function (i) { return i.bought; }).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);

  progressText.textContent = fill(t.boughtCount, { done: done, total: total });
  progressFill.style.width = percent + '%';

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

  // 「買ったものを消す」は、チェック済みが1つ以上あるときだけ出す
  const boughtCount = items.filter(function (i) { return i.bought; }).length;
  removeBoughtBtn.hidden = boughtCount === 0;

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
  items.push({ id: makeId(), name: name, category: category, bought: false });
  saveItems(items);
  render();
}

function toggleBought(id, bought) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.bought = bought;
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
    items.push({ id: makeId(), name: name, category: starter.category, bought: false });
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

removeBoughtBtn.addEventListener('click', function () {
  const items = getItems();
  const bought = items.filter(function (i) { return i.bought; });
  if (bought.length === 0) return;
  if (!window.confirm(fill(t.confirmRemoveBought, { count: bought.length }))) return;
  saveItems(items.filter(function (i) { return !i.bought; }));
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

  store = await openStore('shopping-list', 'items', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
