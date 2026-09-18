// Trip Budget — カテゴリごとの上限を決めて、旅の途中で支出を記録するアプリ。
//
// データは2つに分けて保存する。
//   trip     … 旅行名・通貨・カテゴリ(上限つき)
//   expenses … 支出の一覧
// 分けておくと、スマホとPCで同時に触ったときに片方の変更が
// まるごと消える範囲が狭くなる(同期は「新しい方で丸ごと置き換え」のため)。

// AppSync.store() のインスタンス。起動時に初期化される。
let tripStore = null;
let expenseStore = null;

// app-sync.js が読み込めなかったときの保険。localStorage だけで動き、同期はしない。
// app-sync と同じキー・同じエンベロープ形式で書くので、次に正常に読み込めた
// 起動でそのまま拾われ、クラウドへ上がる。
async function openStore(slug, key, opts) {
  try { if (window.AppSync) return await window.AppSync.store(slug, key, opts); } catch (e) { console.error(e); }
  const o = opts || {}, k = 'appdata:' + slug + ':' + key;
  const read = function (s) { try { return JSON.parse(localStorage.getItem(s)); } catch (e) { return null; } };
  const cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  const env = read(k);
  let c = env && 'd' in env ? env.d : (o.default ?? null);
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

const DEFAULT_TRIP = { name: '', currency: '¥', categories: [] };
const CURRENCIES = ['¥', '$', '€', '£', '₩'];

/* ------------------------------------------------------------------
   データの読み書き
   ------------------------------------------------------------------ */

function getTrip() {
  const raw = tripStore ? tripStore.get() : null;
  const trip = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    name: typeof trip.name === 'string' ? trip.name : '',
    currency: CURRENCIES.indexOf(trip.currency) >= 0 ? trip.currency : '¥',
    categories: Array.isArray(trip.categories) ? trip.categories.filter(isCategory) : []
  };
}

function isCategory(c) {
  return c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string';
}

function saveTrip(trip) {
  if (!tripStore) return;
  tripStore.set(trip).catch(function (e) {
    console.error('Trip Budget: 旅行データの保存に失敗しました', e);
  });
}

function getExpenses() {
  const raw = expenseStore ? expenseStore.get() : null;
  return Array.isArray(raw) ? raw.filter(isExpense) : [];
}

function isExpense(e) {
  return e && typeof e === 'object' && typeof e.id === 'string' && typeof e.amount === 'number';
}

function saveExpenses(expenses) {
  if (!expenseStore) return;
  expenseStore.set(expenses).catch(function (e) {
    console.error('Trip Budget: 支出の保存に失敗しました', e);
  });
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------------
   表示のための小さな関数
   ------------------------------------------------------------------ */

// 金額を「¥1,200」の形にする。小数は必要なときだけ2桁まで出す。
function money(amount, currency) {
  const n = Number(amount) || 0;
  const rounded = Math.round(n * 100) / 100;
  const text = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return currency + text;
}

// 'YYYY-MM-DD' を '9/12' の形にする。日付をまたぐズレを避けるため文字列のまま扱う。
function shortDate(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return '';
  return Number(parts[1]) + '/' + Number(parts[2]);
}

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

// 0〜100の範囲に収めたバーの幅(%)。上限0のカテゴリは、使っていれば満タン扱い。
function barPercent(spent, limit) {
  if (limit > 0) return Math.min(100, (spent / limit) * 100);
  return spent > 0 ? 100 : 0;
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function clearError(el, input) {
  el.textContent = '';
  el.hidden = true;
  if (input) input.removeAttribute('aria-invalid');
}

/* ------------------------------------------------------------------
   画面の描画
   ------------------------------------------------------------------ */

// 編集中のカテゴリID(1つだけ)。null なら編集中でない。
let editingCategoryId = null;

function renderAll() {
  const trip = getTrip();
  const expenses = getExpenses();

  renderTripFields(trip);
  renderTotals(trip, expenses);
  renderCategories(trip, expenses);
  renderExpenseForm(trip);
  renderExpenseList(trip, expenses);
}

// 入力中の欄を書き換えると打ちかけの文字が消えるので、フォーカス中は触らない。
function renderTripFields(trip) {
  const nameInput = document.getElementById('tripNameInput');
  const currencySelect = document.getElementById('currencySelect');
  if (document.activeElement !== nameInput) nameInput.value = trip.name;
  if (document.activeElement !== currencySelect) currencySelect.value = trip.currency;
}

function spentByCategory(expenses) {
  const totals = {};
  expenses.forEach(function (e) {
    totals[e.catId] = (totals[e.catId] || 0) + e.amount;
  });
  return totals;
}

function renderTotals(trip, expenses) {
  const panel = document.getElementById('totalPanel');
  if (trip.categories.length === 0) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;

  const budget = trip.categories.reduce(function (sum, c) { return sum + (Number(c.limit) || 0); }, 0);
  const spent = expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
  const left = budget - spent;
  const over = left < 0;

  document.getElementById('totalBudget').textContent = money(budget, trip.currency);
  document.getElementById('totalSpent').textContent = money(spent, trip.currency);

  const bar = document.getElementById('totalBar');
  bar.style.width = barPercent(spent, budget) + '%';
  bar.classList.toggle('over', over);

  document.getElementById('totalLeftLabel').textContent = over ? 'Over by' : 'Left';
  document.getElementById('totalLeft').textContent = money(Math.abs(left), trip.currency);
  document.getElementById('totalLeft').parentElement.classList.toggle('over', over);
}

function renderCategories(trip, expenses) {
  const list = document.getElementById('catList');
  const empty = document.getElementById('catEmpty');
  list.textContent = '';

  empty.hidden = trip.categories.length > 0;

  const spent = spentByCategory(expenses);

  trip.categories.forEach(function (cat) {
    const li = document.createElement('li');
    li.className = 'cat-row';
    if (editingCategoryId === cat.id) {
      li.appendChild(buildCategoryEditor(cat, trip));
    } else {
      buildCategoryRow(li, cat, spent[cat.id] || 0, trip);
    }
    list.appendChild(li);
  });
}

function buildCategoryRow(li, cat, spent, trip) {
  const limit = Number(cat.limit) || 0;
  const over = limit > 0 && spent > limit;

  const line = document.createElement('div');
  line.className = 'cat-line';

  const name = document.createElement('span');
  name.className = 'cat-name';
  name.textContent = cat.name;

  const figs = document.createElement('b');
  figs.className = 'cat-figs';
  figs.textContent = money(spent, trip.currency) + ' / ' + money(limit, trip.currency);

  line.appendChild(name);
  line.appendChild(figs);

  const bar = document.createElement('div');
  bar.className = 'bar';
  const fill = document.createElement('i');
  fill.style.width = barPercent(spent, limit) + '%';
  if (over) fill.classList.add('over');
  bar.appendChild(fill);

  const foot = document.createElement('div');
  foot.className = 'cat-foot';

  const left = document.createElement('span');
  left.className = 'cat-left' + (over ? ' over' : '');
  if (limit === 0) {
    left.textContent = 'No limit set';
  } else if (over) {
    left.textContent = 'Over by ' + money(spent - limit, trip.currency);
  } else {
    left.textContent = money(limit - spent, trip.currency) + ' left';
  }

  const actions = document.createElement('div');
  actions.className = 'row-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'link-btn';
  editBtn.textContent = 'Edit';
  editBtn.setAttribute('aria-label', 'Edit category ' + cat.name);
  editBtn.addEventListener('click', function () {
    editingCategoryId = cat.id;
    renderAll();
    const input = document.getElementById('editNameInput');
    if (input) input.focus();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'link-btn danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete category ' + cat.name);
  deleteBtn.addEventListener('click', function () { deleteCategory(cat.id); });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  foot.appendChild(left);
  foot.appendChild(actions);

  li.appendChild(line);
  li.appendChild(bar);
  li.appendChild(foot);
}

function buildCategoryEditor(cat, trip) {
  const wrap = document.createElement('div');

  const row = document.createElement('div');
  row.className = 'field-row';

  const nameField = document.createElement('div');
  nameField.className = 'field';
  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'editNameInput');
  nameLabel.textContent = 'Category';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'editNameInput';
  nameInput.maxLength = 24;
  nameInput.value = cat.name;
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);

  const limitField = document.createElement('div');
  limitField.className = 'field field-narrow';
  const limitLabel = document.createElement('label');
  limitLabel.setAttribute('for', 'editLimitInput');
  limitLabel.textContent = 'Limit';
  const limitInput = document.createElement('input');
  limitInput.type = 'number';
  limitInput.id = 'editLimitInput';
  limitInput.min = '0';
  limitInput.step = 'any';
  limitInput.inputMode = 'decimal';
  limitInput.value = String(Number(cat.limit) || 0);
  limitField.appendChild(limitLabel);
  limitField.appendChild(limitInput);

  row.appendChild(nameField);
  row.appendChild(limitField);

  const error = document.createElement('p');
  error.className = 'error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const actions = document.createElement('div');
  actions.className = 'edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'link-btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', function () {
    const name = nameInput.value.trim();
    const limitText = limitInput.value.trim();
    const limit = Number(limitText);

    if (name === '') {
      showError(error, 'Enter a category name.');
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      return;
    }
    if (isDuplicateCategory(name, cat.id)) {
      showError(error, 'You already have a category with that name.');
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      return;
    }
    if (limitText === '' || !isFinite(limit) || limit < 0) {
      showError(error, 'Enter a limit of 0 or more.');
      limitInput.setAttribute('aria-invalid', 'true');
      limitInput.focus();
      return;
    }

    const updated = getTrip();
    updated.categories = updated.categories.map(function (c) {
      return c.id === cat.id ? { id: c.id, name: name, limit: limit } : c;
    });
    saveTrip(updated);
    editingCategoryId = null;
    renderAll();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'link-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function () {
    editingCategoryId = null;
    renderAll();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  wrap.appendChild(row);
  wrap.appendChild(error);
  wrap.appendChild(actions);
  return wrap;
}

// カテゴリを選ぶ <select> は、選択中の項目をなるべく保つ。
function renderExpenseForm(trip) {
  const form = document.getElementById('expForm');
  const locked = document.getElementById('expLocked');
  const select = document.getElementById('expCatSelect');

  const hasCategories = trip.categories.length > 0;
  form.hidden = !hasCategories;
  locked.hidden = hasCategories;
  if (!hasCategories) return;

  const previous = select.value;
  select.textContent = '';
  trip.categories.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
  const stillThere = trip.categories.some(function (c) { return c.id === previous; });
  select.value = stillThere ? previous : trip.categories[0].id;
}

function renderExpenseList(trip, expenses) {
  const list = document.getElementById('expList');
  const empty = document.getElementById('expEmpty');
  list.textContent = '';

  empty.hidden = expenses.length > 0;

  const names = {};
  trip.categories.forEach(function (c) { names[c.id] = c.name; });

  // 新しい順。日付が同じなら、あとから記録した方を上に。
  const sorted = expenses.slice().sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  sorted.forEach(function (exp) {
    const li = document.createElement('li');
    li.className = 'exp-row';

    const date = document.createElement('span');
    date.className = 'exp-date';
    date.textContent = shortDate(exp.date);

    const main = document.createElement('span');
    main.className = 'exp-main';
    main.textContent = names[exp.catId] || 'Removed category';
    if (exp.note) {
      const note = document.createElement('small');
      note.className = 'exp-note';
      note.textContent = exp.note;
      main.appendChild(note);
    }

    const amount = document.createElement('span');
    amount.className = 'exp-amount';
    amount.textContent = money(exp.amount, trip.currency);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'link-btn danger';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Delete expense ' + money(exp.amount, trip.currency) + ' on ' + exp.date);
    remove.addEventListener('click', function () { deleteExpense(exp.id); });

    li.appendChild(date);
    li.appendChild(main);
    li.appendChild(amount);
    li.appendChild(remove);
    list.appendChild(li);
  });
}

/* ------------------------------------------------------------------
   操作
   ------------------------------------------------------------------ */

function isDuplicateCategory(name, exceptId) {
  const lower = name.toLowerCase();
  return getTrip().categories.some(function (c) {
    return c.id !== exceptId && c.name.toLowerCase() === lower;
  });
}

function addCategory(event) {
  event.preventDefault();

  const nameInput = document.getElementById('catNameInput');
  const limitInput = document.getElementById('catLimitInput');
  const nameError = document.getElementById('catNameError');
  const limitError = document.getElementById('catLimitError');

  clearError(nameError, nameInput);
  clearError(limitError, limitInput);

  const name = nameInput.value.trim();
  const limitText = limitInput.value.trim();
  const limit = Number(limitText);

  if (name === '') {
    showError(nameError, 'Enter a category name.');
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
    return;
  }
  if (isDuplicateCategory(name, null)) {
    showError(nameError, 'You already have a category with that name.');
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
    return;
  }
  if (limitText === '' || !isFinite(limit) || limit < 0) {
    showError(limitError, 'Enter a limit of 0 or more.');
    limitInput.setAttribute('aria-invalid', 'true');
    limitInput.focus();
    return;
  }

  const trip = getTrip();
  trip.categories.push({ id: newId(), name: name, limit: limit });
  saveTrip(trip);

  nameInput.value = '';
  limitInput.value = '';
  renderAll();
  nameInput.focus();
}

function deleteCategory(id) {
  const trip = getTrip();
  const cat = trip.categories.filter(function (c) { return c.id === id; })[0];
  if (!cat) return;

  const expenses = getExpenses();
  const attached = expenses.filter(function (e) { return e.catId === id; });

  const message = attached.length > 0
    ? 'Delete "' + cat.name + '" and its ' + attached.length + ' expense' + (attached.length === 1 ? '' : 's') + '?'
    : 'Delete "' + cat.name + '"?';
  if (!window.confirm(message)) return;

  trip.categories = trip.categories.filter(function (c) { return c.id !== id; });
  saveTrip(trip);

  if (attached.length > 0) {
    saveExpenses(expenses.filter(function (e) { return e.catId !== id; }));
  }

  if (editingCategoryId === id) editingCategoryId = null;
  renderAll();
}

function addExpense(event) {
  event.preventDefault();

  const select = document.getElementById('expCatSelect');
  const amountInput = document.getElementById('expAmountInput');
  const dateInput = document.getElementById('expDateInput');
  const noteInput = document.getElementById('expNoteInput');
  const amountError = document.getElementById('expAmountError');
  const dateError = document.getElementById('expDateError');

  clearError(amountError, amountInput);
  clearError(dateError, dateInput);

  const amountText = amountInput.value.trim();
  const amount = Number(amountText);
  const date = dateInput.value;

  if (amountText === '' || !isFinite(amount) || amount <= 0) {
    showError(amountError, 'Enter an amount greater than 0.');
    amountInput.setAttribute('aria-invalid', 'true');
    amountInput.focus();
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    showError(dateError, 'Pick a date.');
    dateInput.setAttribute('aria-invalid', 'true');
    dateInput.focus();
    return;
  }

  const expenses = getExpenses();
  expenses.push({
    id: newId(),
    catId: select.value,
    amount: Math.round(amount * 100) / 100,
    note: noteInput.value.trim(),
    date: date,
    createdAt: Date.now()
  });
  saveExpenses(expenses);

  amountInput.value = '';
  noteInput.value = '';
  renderAll();
  amountInput.focus();
}

function deleteExpense(id) {
  saveExpenses(getExpenses().filter(function (e) { return e.id !== id; }));
  renderAll();
}

function saveTripField() {
  const trip = getTrip();
  trip.name = document.getElementById('tripNameInput').value.trim();
  trip.currency = document.getElementById('currencySelect').value;
  saveTrip(trip);
  renderAll();
}

/* ------------------------------------------------------------------
   起動
   ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', async function () {
  // データを先に用意する。読み込み途中の画面で操作させないため。
  tripStore = await openStore('trip-budget', 'trip', { default: DEFAULT_TRIP });
  expenseStore = await openStore('trip-budget', 'expenses', { default: [] });

  tripStore.subscribe(function () { renderAll(); });
  expenseStore.subscribe(function () { renderAll(); });

  document.getElementById('expDateInput').value = todayIso();
  document.getElementById('tripNameInput').addEventListener('change', saveTripField);
  document.getElementById('currencySelect').addEventListener('change', saveTripField);
  document.getElementById('catForm').addEventListener('submit', addCategory);
  document.getElementById('expForm').addEventListener('submit', addExpense);

  renderAll();
});
