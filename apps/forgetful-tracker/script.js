// ===========================
// Forgetful Tracker
// ===========================

const STORAGE_KEY = 'forgetfulTracker:items:v1';
const CHECK_INTERVAL_MS = 20 * 1000;

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
// Time helpers
// -----------------------

function currentHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  registerServiceWorker();
  setupNotifyUI();

  document.getElementById('itemForm').addEventListener('submit', handleAddItem);
  document.getElementById('resetBtn').addEventListener('click', handleReset);

  renderItemList();
  setInterval(checkNotifications, CHECK_INTERVAL_MS);
});

// -----------------------
// PWA / Service worker
// -----------------------

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(function () {
    // Installability is a nice-to-have; ignore failures (e.g. non-https local file access)
  });
}

// -----------------------
// Notifications
// -----------------------

function setupNotifyUI() {
  const btn = document.getElementById('enableNotifyBtn');
  updateNotifyStatus();

  if (!('Notification' in window)) {
    btn.disabled = true;
    return;
  }

  btn.addEventListener('click', function () {
    Notification.requestPermission().then(function () {
      updateNotifyStatus();
    });
  });
}

function updateNotifyStatus() {
  const status = document.getElementById('notifyStatus');

  if (!('Notification' in window)) {
    status.textContent = "Notifications aren't supported in this browser. On iPhone, try adding this app to your Home Screen first.";
    status.className = 'notify-status notify-status--alert';
    return;
  }

  if (Notification.permission === 'granted') {
    status.textContent = 'Notifications enabled.';
    status.className = 'notify-status notify-status--ok';
  } else if (Notification.permission === 'denied') {
    status.textContent = 'Notifications blocked. Enable them in your browser settings to get alerts.';
    status.className = 'notify-status notify-status--alert';
  } else {
    status.textContent = 'Click "Enable notifications" to get alerted at departure time.';
    status.className = 'notify-status';
  }
}

function fireNotification(item) {
  const title = "Don't forget!";
  const options = { body: item.name + ' — ' + item.time, tag: 'forgetful-' + item.id };

  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(function (reg) {
      reg.showNotification(title, options);
    });
  } else if (window.Notification) {
    new Notification(title, options);
  }
}

function checkNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const items = getItems();
  const now = currentHHMM();
  let changed = false;

  items.forEach(function (item) {
    if (!item.notified && item.time === now) {
      fireNotification(item);
      item.notified = true;
      changed = true;
    }
  });

  if (changed) {
    saveItems(items);
    renderItemList();
  }
}

// -----------------------
// Add item
// -----------------------

function handleAddItem(e) {
  e.preventDefault();

  const nameInput = document.getElementById('itemName');
  const timeInput = document.getElementById('itemTime');
  const name = nameInput.value.trim();
  const time = timeInput.value;

  if (!name || !time) return;

  const items = getItems();
  items.push({
    id: genId(),
    name: name,
    time: time,
    forgottenCount: 0,
    checked: false,
    notified: false,
    createdAt: Date.now()
  });
  saveItems(items);

  nameInput.value = '';
  timeInput.value = '';
  nameInput.focus();
  renderItemList();
}

// -----------------------
// Item actions
// -----------------------

function toggleChecked(id) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.checked = !item.checked;
  saveItems(items);
  renderItemList();
}

function markForgotten(id) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.forgottenCount += 1;
  saveItems(items);
  renderItemList();
}

function deleteItem(id) {
  const items = getItems().filter(function (i) { return i.id !== id; });
  saveItems(items);
  renderItemList();
}

function handleReset() {
  const items = getItems();
  items.forEach(function (item) {
    item.checked = false;
    item.notified = false;
  });
  saveItems(items);
  renderItemList();
}

// -----------------------
// Render
// -----------------------

function renderItemList() {
  const list = document.getElementById('itemList');
  list.innerHTML = '';

  const items = getItems().slice().sort(function (a, b) {
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'No items yet. Add something you don\'t want to forget!';
    list.appendChild(empty);
    return;
  }

  items.forEach(function (item) {
    list.appendChild(createItemCard(item));
  });
}

function createItemCard(item) {
  const card = document.createElement('div');
  card.className = 'item-card' + (item.checked ? ' checked' : '');

  const header = document.createElement('div');
  header.className = 'item-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'item-title-group';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'item-name';
  nameSpan.textContent = item.name;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'item-time';
  timeSpan.textContent = item.time;

  titleGroup.appendChild(nameSpan);
  titleGroup.appendChild(timeSpan);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'item-delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', 'Remove ' + item.name);
  deleteBtn.addEventListener('click', function () { deleteItem(item.id); });

  header.appendChild(titleGroup);
  header.appendChild(deleteBtn);

  const actionRow = document.createElement('div');
  actionRow.className = 'action-row';

  const checkLabel = document.createElement('label');
  checkLabel.className = 'check-label';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!item.checked;
  checkbox.setAttribute('aria-label', 'Mark ' + item.name + ' as packed');
  checkbox.addEventListener('change', function () { toggleChecked(item.id); });
  checkLabel.appendChild(checkbox);
  checkLabel.appendChild(document.createTextNode(' Got it'));

  const forgotBtn = document.createElement('button');
  forgotBtn.type = 'button';
  forgotBtn.className = 'term-btn term-btn--alert';
  forgotBtn.textContent = 'Forgot it';
  forgotBtn.addEventListener('click', function () { markForgotten(item.id); });

  actionRow.appendChild(checkLabel);
  actionRow.appendChild(forgotBtn);

  card.appendChild(header);
  card.appendChild(actionRow);

  if (item.notified) {
    const notifiedTag = document.createElement('p');
    notifiedTag.className = 'notified-tag';
    notifiedTag.textContent = 'Alerted';
    card.appendChild(notifiedTag);
  }

  if (item.forgottenCount > 0) {
    const badge = document.createElement('p');
    badge.className = 'forgotten-badge';
    badge.textContent = 'Forgotten ' + item.forgottenCount + (item.forgottenCount === 1 ? ' time' : ' times');
    card.appendChild(badge);
  }

  return card;
}
