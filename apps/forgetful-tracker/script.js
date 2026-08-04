// ===========================
// Forgetful Tracker
// ===========================

const STORAGE_KEY = 'forgetfulTracker:items:v1';
const DEVICE_ID_KEY = 'forgetfulTracker:deviceId:v1';
const CHECK_INTERVAL_MS = 20 * 1000;
const LANG_KEY = 'cobbleworks:lang:v1';

// Web Pushの公開鍵(公開して問題ない値)。秘密鍵はEdge Function側にのみ置く。
const VAPID_PUBLIC_KEY = 'BCTRqMI1R172Kv_jJBw0df5f4jxRjPuKgXFXJ6yH7VeFNTyY5m-7U6TR3tnaag3iidYPWR0sA3W2sdk-SKWw0VE';

// -----------------------
// Localization (reads the shared platform language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: '🔔 Forgetful Tracker',
    subtitle: "Register what you're carrying and when you plan to leave. Get an alert at that time, and track what you forget most often.",
    enableNotifications: 'Enable notifications',
    notifyNote: "Note: once enabled, alerts arrive even if this app is closed or you're using another app, as long as you stay connected to the internet.",
    addItemHeading: 'Add item',
    itemNameLabel: 'Item name',
    itemNamePlaceholder: 'e.g. Umbrella',
    itemTimeLabel: 'Expected departure time',
    addItemBtn: 'Add item',
    yourItemsHeading: 'Your items',
    resetBtn: 'Reset for next trip',
    emptyMessage: "No items yet. Add something you don't want to forget!",
    notSupported: "Notifications aren't supported in this browser. On iPhone, try adding this app to your Home Screen first.",
    notificationsEnabled: "Notifications enabled — you'll get alerts even if the app is closed.",
    notificationsBlocked: 'Notifications blocked. Enable them in your browser settings to get alerts.',
    clickToEnable: 'Click "Enable notifications" to get alerted at departure time, even if the app is closed.',
    notifyTitle: "Don't forget!",
    removeItem: function (name) { return 'Remove ' + name; },
    markPacked: function (name) { return 'Mark ' + name + ' as packed'; },
    gotIt: 'Got it',
    forgotIt: 'Forgot it',
    alertedTag: 'Alerted',
    forgottenCount: function (n) { return 'Forgotten ' + n + (n === 1 ? ' time' : ' times'); },
  },
  ja: {
    title: '🔔 忘れ物トラッカー',
    subtitle: '持っていく物と出発予定時刻を登録しましょう。その時刻になったら通知でお知らせし、よく忘れる物を記録します。',
    enableNotifications: '通知を有効にする',
    notifyNote: '注意: 一度有効にすれば、このアプリを閉じていても、他のアプリを使っていても通知が届きます（インターネット接続が必要です）。',
    addItemHeading: '持ち物を追加',
    itemNameLabel: '持ち物の名前',
    itemNamePlaceholder: '例: 傘',
    itemTimeLabel: '出発予定時刻',
    addItemBtn: '追加',
    yourItemsHeading: '持ち物リスト',
    resetBtn: '次の外出のためにリセット',
    emptyMessage: 'まだ持ち物がありません。忘れたくないものを追加しましょう！',
    notSupported: 'このブラウザでは通知がサポートされていません。iPhoneの場合は、まずこのアプリをホーム画面に追加してみてください。',
    notificationsEnabled: '通知が有効になりました。アプリを閉じていても届きます。',
    notificationsBlocked: '通知がブロックされています。通知を受け取るにはブラウザの設定で許可してください。',
    clickToEnable: '「通知を有効にする」をクリックすると、アプリを閉じていても出発時刻にお知らせします。',
    notifyTitle: '忘れ物にご注意！',
    removeItem: function (name) { return name + 'を削除'; },
    markPacked: function (name) { return name + 'を持った印をつける'; },
    gotIt: '持った',
    forgotIt: '忘れた',
    alertedTag: '通知済み',
    forgottenCount: function (n) { return n + '回忘れました'; },
  },
  es: {
    title: '🔔 Rastreador de Olvidos',
    subtitle: 'Registra lo que llevas y a qué hora planeas salir. Recibe una alerta a esa hora y lleva un registro de lo que más se te olvida.',
    enableNotifications: 'Activar notificaciones',
    notifyNote: 'Nota: una vez activadas, las alertas llegan aunque esta app esté cerrada o estés usando otra app, siempre que tengas conexión a internet.',
    addItemHeading: 'Añadir artículo',
    itemNameLabel: 'Nombre del artículo',
    itemNamePlaceholder: 'ej. Paraguas',
    itemTimeLabel: 'Hora prevista de salida',
    addItemBtn: 'Añadir artículo',
    yourItemsHeading: 'Tus artículos',
    resetBtn: 'Reiniciar para el próximo viaje',
    emptyMessage: 'Aún no hay artículos. ¡Añade algo que no quieras olvidar!',
    notSupported: 'Las notificaciones no son compatibles con este navegador. En iPhone, prueba primero a añadir esta app a la pantalla de inicio.',
    notificationsEnabled: 'Notificaciones activadas: llegarán aunque cierres la app.',
    notificationsBlocked: 'Notificaciones bloqueadas. Actívalas en la configuración de tu navegador para recibir alertas.',
    clickToEnable: 'Haz clic en "Activar notificaciones" para recibir una alerta a la hora de salida, aunque cierres la app.',
    notifyTitle: '¡No lo olvides!',
    removeItem: function (name) { return 'Eliminar ' + name; },
    markPacked: function (name) { return 'Marcar ' + name + ' como listo'; },
    gotIt: 'Listo',
    forgotIt: 'Se me olvidó',
    alertedTag: 'Notificado',
    forgottenCount: function (n) { return 'Olvidado ' + n + (n === 1 ? ' vez' : ' veces'); },
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

function genUuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers (RFC4122 v4-ish, good enough as an opaque id)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = genUuid();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
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

// "HH:MM"(端末のローカル時刻)から、次にその時刻が来る絶対時刻(ms)を計算する。
// すでに過ぎていれば翌日のその時刻にする。
function computeNotifyAt(hhmm) {
  const parts = hhmm.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();
  registerServiceWorker();
  setupNotifyUI();

  document.getElementById('itemForm').addEventListener('submit', handleAddItem);
  document.getElementById('resetBtn').addEventListener('click', handleReset);

  reconcileNotifiedFlags();
  renderItemList();
  setInterval(reconcileNotifiedFlags, CHECK_INTERVAL_MS);

  // 前回のセッションで既に許可済みなら、購読とアイテムの再同期をしておく
  // (端末を機種変更した場合の再登録や、オフライン中に追加したアイテムの取りこぼし対策)。
  if ('Notification' in window && Notification.permission === 'granted') {
    enablePushSync();
  }
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
    Notification.requestPermission().then(function (permission) {
      updateNotifyStatus();
      if (permission === 'granted') enablePushSync();
    });
  });
}

function updateNotifyStatus() {
  const status = document.getElementById('notifyStatus');

  if (!('Notification' in window)) {
    status.textContent = t.notSupported;
    status.className = 'notify-status notify-status--alert';
    return;
  }

  if (Notification.permission === 'granted') {
    status.textContent = t.notificationsEnabled;
    status.className = 'notify-status notify-status--ok';
  } else if (Notification.permission === 'denied') {
    status.textContent = t.notificationsBlocked;
    status.className = 'notify-status notify-status--alert';
  } else {
    status.textContent = t.clickToEnable;
    status.className = 'notify-status';
  }
}

// 実際の通知表示は、サーバー(Edge Function)からのプッシュを受けたsw.jsが行う。
// ここでは「時刻が過ぎたアイテムに"通知済み"の印を付ける」画面表示用の処理だけを行う。
function reconcileNotifiedFlags() {
  const items = getItems();
  const now = Date.now();
  let changed = false;

  items.forEach(function (item) {
    if (!item.notifyAt) {
      item.notifyAt = computeNotifyAt(item.time);
      changed = true;
    }
    if (!item.notified && now >= item.notifyAt) {
      item.notified = true;
      changed = true;
    }
  });

  if (changed) {
    saveItems(items);
    renderItemList();
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function hasCloud() {
  return typeof supabaseClient !== 'undefined';
}

// このアイテムの予定時刻をクラウドに登録し、時刻が来たらサーバー側からプッシュしてもらう。
// 通知が無効/未許可、またはSupabase未接続なら何もしない(ローカル保存だけで従来通り動く)。
async function syncReminder(item) {
  if (!hasCloud() || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    await supabaseClient.from('forgetful_tracker_reminders').upsert(
      {
        device_id: getDeviceId(),
        item_id: item.id,
        title: t.notifyTitle,
        body: item.name + ' — ' + item.time,
        notify_at: new Date(item.notifyAt).toISOString(),
        notified: false,
      },
      { onConflict: 'device_id,item_id' }
    );
  } catch (e) {
    console.error('reminder sync failed:', e);
  }
}

async function deleteReminder(itemId) {
  if (!hasCloud() || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    await supabaseClient
      .from('forgetful_tracker_reminders')
      .delete()
      .eq('device_id', getDeviceId())
      .eq('item_id', itemId);
  } catch (e) {
    console.error('reminder delete failed:', e);
  }
}

// プッシュ購読を作成/更新し、Supabaseに登録した上で、今あるアイテムを全部同期する。
async function enablePushSync() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !hasCloud()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await supabaseClient.from('forgetful_tracker_subscriptions').upsert({
      device_id: getDeviceId(),
      subscription: subscription.toJSON(),
      updated_at: new Date().toISOString(),
    });

    reconcileNotifiedFlags();
    const items = getItems();
    for (const item of items) {
      await syncReminder(item);
    }
  } catch (e) {
    console.error('push subscription failed:', e);
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
  const newItem = {
    id: genId(),
    name: name,
    time: time,
    notifyAt: computeNotifyAt(time),
    forgottenCount: 0,
    checked: false,
    notified: false,
    createdAt: Date.now()
  };
  items.push(newItem);
  saveItems(items);
  syncReminder(newItem);

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
  deleteReminder(id);
  renderItemList();
}

function handleReset() {
  const items = getItems();
  items.forEach(function (item) {
    item.checked = false;
    item.notified = false;
    item.notifyAt = computeNotifyAt(item.time);
  });
  saveItems(items);
  items.forEach(syncReminder);
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
    empty.textContent = t.emptyMessage;
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
  deleteBtn.setAttribute('aria-label', t.removeItem(item.name));
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
  checkbox.setAttribute('aria-label', t.markPacked(item.name));
  checkbox.addEventListener('change', function () { toggleChecked(item.id); });
  checkLabel.appendChild(checkbox);
  checkLabel.appendChild(document.createTextNode(' ' + t.gotIt));

  const forgotBtn = document.createElement('button');
  forgotBtn.type = 'button';
  forgotBtn.className = 'term-btn term-btn--alert';
  forgotBtn.textContent = t.forgotIt;
  forgotBtn.addEventListener('click', function () { markForgotten(item.id); });

  actionRow.appendChild(checkLabel);
  actionRow.appendChild(forgotBtn);

  card.appendChild(header);
  card.appendChild(actionRow);

  if (item.notified) {
    const notifiedTag = document.createElement('p');
    notifiedTag.className = 'notified-tag';
    notifiedTag.textContent = t.alertedTag;
    card.appendChild(notifiedTag);
  }

  if (item.forgottenCount > 0) {
    const badge = document.createElement('p');
    badge.className = 'forgotten-badge';
    badge.textContent = t.forgottenCount(item.forgottenCount);
    card.appendChild(badge);
  }

  return card;
}
