// ===========================
// Restock Planner
// ===========================

const STORAGE_KEY = 'restockPlanner:items:v1';

const EMOJI_OPTIONS = ['🧴', '🧼', '🧻', '🪥', '🧽', '🧦', '☕', '📦'];
const LEVELS = [
  { value: 100, label: 'Full' },
  { value: 50, label: 'Half' },
  { value: 20, label: 'Low' },
  { value: 0, label: 'Empty' }
];

const DUE_SOON_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

let selectedEmoji = EMOJI_OPTIONS[0];

// -----------------------
// ID helper
// -----------------------

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// -----------------------
// localStorage read/write
// -----------------------

function getItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
    return "Looks like it's out — time for a new one! 🛒";
  }
  if (prediction.daysLeft <= 0) {
    return "Might already be running out — worth a peek! 👀";
  }
  if (prediction.daysLeft <= DUE_SOON_DAYS) {
    return 'About ' + prediction.daysLeft + (prediction.daysLeft === 1 ? ' day' : ' days') + " left — might want to grab one soon!";
  }
  return 'About ' + prediction.remainingDays + ' days left — you\'re all good for now 😊';
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

document.addEventListener('DOMContentLoaded', function () {
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
    btn.setAttribute('aria-label', 'Icon ' + emoji);
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
    empty.textContent = "No items yet! Add your first one below and we'll start keeping an eye on it. 🧺";
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
  deleteBtn.setAttribute('aria-label', 'Remove ' + item.name);
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
    btn.textContent = lvl.label;
    btn.setAttribute('aria-label', 'Set ' + item.name + ' to ' + lvl.label);
    btn.setAttribute('aria-pressed', item.level === lvl.value ? 'true' : 'false');
    btn.addEventListener('click', function () { setItemLevel(item.id, lvl.value); });
    levelRow.appendChild(btn);
  });

  card.appendChild(header);
  card.appendChild(levelRow);

  if (prediction.dueSoon) {
    const badge = document.createElement('p');
    badge.className = 'item-due-soon-badge';
    badge.textContent = '🔔 Running low soon';
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
    ? 'Nothing expected yet — nice and quiet.'
    : thisMonthCount + (thisMonthCount === 1 ? ' item might need restocking' : ' items might need restocking');

  document.getElementById('nextMonthAmount').textContent = formatYen(nextMonthTotal);
  document.getElementById('nextMonthSub').textContent = nextMonthCount === 0
    ? 'Nothing expected yet — nice and quiet.'
    : nextMonthCount + (nextMonthCount === 1 ? ' item might need restocking' : ' items might need restocking');

  const banner = document.getElementById('dueSoonBanner');
  if (dueSoonCount > 0) {
    banner.hidden = false;
    banner.textContent = '🔔 ' + dueSoonCount + (dueSoonCount === 1 ? ' item' : ' items') + ' might run out soon';
  } else {
    banner.hidden = true;
  }
}
