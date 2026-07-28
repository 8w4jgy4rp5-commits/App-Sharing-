// ===========================
// Free Trial Tracker
// ===========================

const STORAGE_KEY = 'freeTrialTracker:trials:v1';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5分ごとに期限をチェック（日付単位なので頻繁である必要はない）
const ADVANCE_WARNING_DAYS = 3; // この日数前に一度目の通知を出す
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization (reads the shared platform language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: '💳 Free Trial Tracker',
    subtitle: "Register your free trials with a cancel-by date, and get notified before you're charged.",
    enableNotifications: 'Enable notifications',
    notifyNote: 'Note: alerts only fire while this app is open or was recently active in this browser. Fully closing the app may block alerts, especially on iPhone.',
    addTrialHeading: 'Add a free trial',
    serviceLabel: 'Service name',
    servicePlaceholder: 'e.g. Streaming Plus',
    cancelByLabel: 'Cancel by',
    priceLabel: 'Price after trial (optional)',
    pricePlaceholder: 'e.g. $12.99/mo',
    addTrialBtn: 'Add trial',
    yourTrialsHeading: 'Your trials',
    emptyMessage: 'No trials yet. Add one before you forget!',
    notSupported: "Notifications aren't supported in this browser. On iPhone, try adding this app to your Home Screen first.",
    notificationsEnabled: 'Notifications enabled.',
    notificationsBlocked: 'Notifications blocked. Enable them in your browser settings to get alerts.',
    clickToEnable: 'Click "Enable notifications" to get alerted before you\'re charged.',
    notifyAdvanceTitle: 'Cancel-by date coming up',
    notifyDueTitle: 'Cancel it today!',
    removeTrial: function (name) { return 'Remove ' + name; },
    markCancelled: function (name) { return 'Mark ' + name + ' as cancelled'; },
    cancelled: 'Cancelled',
    daysLeft: function (n) { return n === 1 ? '1 day left' : n + ' days left'; },
    dueTodayTag: 'Due today!',
    overdueTag: 'Overdue!',
  },
  ja: {
    title: '💳 無料トライアル管理',
    subtitle: '無料トライアルと解約期限を登録して、課金される前に通知を受け取りましょう。',
    enableNotifications: '通知を有効にする',
    notifyNote: '注意: 通知はこのアプリが開いている、またはこのブラウザで最近使われていた場合のみ届きます。アプリを完全に閉じると通知がブロックされることがあります（特にiPhoneで）。',
    addTrialHeading: 'トライアルを追加',
    serviceLabel: 'サービス名',
    servicePlaceholder: '例: 動画配信サービス',
    cancelByLabel: '解約期限',
    priceLabel: 'トライアル後の料金（任意）',
    pricePlaceholder: '例: 月額1,200円',
    addTrialBtn: '追加',
    yourTrialsHeading: 'トライアル一覧',
    emptyMessage: 'まだ登録がありません。忘れる前に追加しましょう！',
    notSupported: 'このブラウザでは通知がサポートされていません。iPhoneの場合は、まずこのアプリをホーム画面に追加してみてください。',
    notificationsEnabled: '通知が有効になりました。',
    notificationsBlocked: '通知がブロックされています。通知を受け取るにはブラウザの設定で許可してください。',
    clickToEnable: '「通知を有効にする」をクリックすると、課金前にお知らせします。',
    notifyAdvanceTitle: 'もうすぐ解約期限です',
    notifyDueTitle: '今日が解約期限です！',
    removeTrial: function (name) { return name + 'を削除'; },
    markCancelled: function (name) { return name + 'を解約済みにする'; },
    cancelled: '解約済み',
    daysLeft: function (n) { return 'あと' + n + '日'; },
    dueTodayTag: '本日期限！',
    overdueTag: '期限切れ！',
  },
  es: {
    title: '💳 Rastreador de Pruebas Gratuitas',
    subtitle: 'Registra tus pruebas gratuitas con una fecha límite de cancelación y recibe una alerta antes de que te cobren.',
    enableNotifications: 'Activar notificaciones',
    notifyNote: 'Nota: las alertas solo se activan mientras esta app está abierta o estuvo activa recientemente en este navegador. Cerrar la app por completo puede bloquear las alertas, especialmente en iPhone.',
    addTrialHeading: 'Añadir prueba gratuita',
    serviceLabel: 'Nombre del servicio',
    servicePlaceholder: 'ej. Streaming Plus',
    cancelByLabel: 'Cancelar antes de',
    priceLabel: 'Precio después de la prueba (opcional)',
    pricePlaceholder: 'ej. 12,99 €/mes',
    addTrialBtn: 'Añadir prueba',
    yourTrialsHeading: 'Tus pruebas',
    emptyMessage: '¡Aún no hay pruebas registradas. Añade una antes de que se te olvide!',
    notSupported: 'Las notificaciones no son compatibles con este navegador. En iPhone, prueba primero a añadir esta app a la pantalla de inicio.',
    notificationsEnabled: 'Notificaciones activadas.',
    notificationsBlocked: 'Notificaciones bloqueadas. Actívalas en la configuración de tu navegador para recibir alertas.',
    clickToEnable: 'Haz clic en "Activar notificaciones" para recibir una alerta antes de que te cobren.',
    notifyAdvanceTitle: 'Se acerca la fecha límite de cancelación',
    notifyDueTitle: '¡Cancélalo hoy!',
    removeTrial: function (name) { return 'Eliminar ' + name; },
    markCancelled: function (name) { return 'Marcar ' + name + ' como cancelada'; },
    cancelled: 'Cancelada',
    daysLeft: function (n) { return n === 1 ? 'Queda 1 día' : 'Quedan ' + n + ' días'; },
    dueTodayTag: '¡Vence hoy!',
    overdueTag: '¡Vencida!',
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

function getTrials() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrials(trials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trials));
}

// -----------------------
// Date helpers
// -----------------------

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// cancelBy: 'YYYY-MM-DD'。何日後（マイナスなら何日過ぎているか）を返す
function daysUntil(cancelBy) {
  const target = new Date(cancelBy + 'T00:00:00');
  const diffMs = target.getTime() - todayDateOnly().getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();
  registerServiceWorker();
  setupNotifyUI();

  document.getElementById('trialForm').addEventListener('submit', handleAddTrial);

  renderTrialList();
  checkNotifications();
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

function fireNotification(title, body, tag) {
  const options = { body: body, tag: tag };

  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(function (reg) {
      reg.showNotification(title, options);
    });
  } else if (window.Notification) {
    new Notification(title, options);
  }
}

// 期限の3日前に一度、期限当日・期限切れ後にもう一度、それぞれ1回だけ通知する
function checkNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const trials = getTrials();
  let changed = false;

  trials.forEach(function (trial) {
    if (trial.cancelled) return;
    const remaining = daysUntil(trial.cancelBy);

    if (!trial.notifiedAdvance && remaining <= ADVANCE_WARNING_DAYS && remaining > 0) {
      fireNotification(t.notifyAdvanceTitle, trial.service + ' — ' + t.daysLeft(remaining), 'trial-advance-' + trial.id);
      trial.notifiedAdvance = true;
      changed = true;
    }

    if (!trial.notifiedDue && remaining <= 0) {
      fireNotification(t.notifyDueTitle, trial.service, 'trial-due-' + trial.id);
      trial.notifiedDue = true;
      changed = true;
    }
  });

  if (changed) {
    saveTrials(trials);
    renderTrialList();
  }
}

// -----------------------
// Add trial
// -----------------------

function handleAddTrial(e) {
  e.preventDefault();

  const serviceInput = document.getElementById('serviceName');
  const dateInput = document.getElementById('cancelByDate');
  const priceInput = document.getElementById('trialPrice');

  const service = serviceInput.value.trim();
  const cancelBy = dateInput.value;
  const price = priceInput.value.trim();

  if (!service || !cancelBy) return;

  const trials = getTrials();
  trials.push({
    id: genId(),
    service: service,
    cancelBy: cancelBy,
    price: price,
    cancelled: false,
    notifiedAdvance: false,
    notifiedDue: false,
    createdAt: Date.now()
  });
  saveTrials(trials);

  serviceInput.value = '';
  dateInput.value = '';
  priceInput.value = '';
  serviceInput.focus();
  renderTrialList();
}

// -----------------------
// Trial actions
// -----------------------

function toggleCancelled(id) {
  const trials = getTrials();
  const trial = trials.find(function (tr) { return tr.id === id; });
  if (!trial) return;
  trial.cancelled = !trial.cancelled;
  saveTrials(trials);
  renderTrialList();
}

function deleteTrial(id) {
  const trials = getTrials().filter(function (tr) { return tr.id !== id; });
  saveTrials(trials);
  renderTrialList();
}

// -----------------------
// Render
// -----------------------

function renderTrialList() {
  const list = document.getElementById('trialList');
  list.innerHTML = '';

  const trials = getTrials().slice().sort(function (a, b) {
    if (a.cancelled !== b.cancelled) return a.cancelled ? 1 : -1;
    return a.cancelBy < b.cancelBy ? -1 : a.cancelBy > b.cancelBy ? 1 : 0;
  });

  if (trials.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.emptyMessage;
    list.appendChild(empty);
    return;
  }

  trials.forEach(function (trial) {
    list.appendChild(createTrialCard(trial));
  });
}

function createTrialCard(trial) {
  const remaining = daysUntil(trial.cancelBy);
  const isUrgent = !trial.cancelled && remaining <= 0;
  const isWarning = !trial.cancelled && remaining > 0 && remaining <= ADVANCE_WARNING_DAYS;

  const card = document.createElement('div');
  card.className = 'trial-card'
    + (trial.cancelled ? ' cancelled' : '')
    + (isUrgent ? ' urgent' : '')
    + (isWarning ? ' warning' : '');

  const header = document.createElement('div');
  header.className = 'trial-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'trial-title-group';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'trial-name';
  nameSpan.textContent = trial.service;
  titleGroup.appendChild(nameSpan);

  if (trial.price) {
    const priceSpan = document.createElement('span');
    priceSpan.className = 'trial-price';
    priceSpan.textContent = trial.price;
    titleGroup.appendChild(priceSpan);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'trial-delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', t.removeTrial(trial.service));
  deleteBtn.addEventListener('click', function () { deleteTrial(trial.id); });

  header.appendChild(titleGroup);
  header.appendChild(deleteBtn);

  const dateRow = document.createElement('div');
  dateRow.className = 'trial-date-row';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'trial-date';
  dateSpan.textContent = trial.cancelBy;
  dateRow.appendChild(dateSpan);

  if (!trial.cancelled) {
    const tag = document.createElement('span');
    if (remaining < 0) {
      tag.className = 'trial-tag trial-tag--urgent';
      tag.textContent = t.overdueTag;
      dateRow.appendChild(tag);
    } else if (remaining === 0) {
      tag.className = 'trial-tag trial-tag--urgent';
      tag.textContent = t.dueTodayTag;
      dateRow.appendChild(tag);
    } else if (remaining <= ADVANCE_WARNING_DAYS) {
      tag.className = 'trial-tag trial-tag--warning';
      tag.textContent = t.daysLeft(remaining);
      dateRow.appendChild(tag);
    }
  }

  card.appendChild(header);
  card.appendChild(dateRow);

  const cancelLabel = document.createElement('label');
  cancelLabel.className = 'cancel-label';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!trial.cancelled;
  checkbox.setAttribute('aria-label', t.markCancelled(trial.service));
  checkbox.addEventListener('change', function () { toggleCancelled(trial.id); });
  cancelLabel.appendChild(checkbox);
  cancelLabel.appendChild(document.createTextNode(' ' + t.cancelled));
  card.appendChild(cancelLabel);

  return card;
}
