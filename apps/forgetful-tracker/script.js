// ===========================
// Forgetful Tracker
// ===========================
//
// 設計の要点：
// このアプリは「忘れっぽい人」のためのものなので、使い続けるのに操作を
// 要求してはいけない。持ち物は一度登録したら毎日同じ時刻に自動で鳴り、
// チェックは日付が変わると自動で外れる。ユーザーが思い出して押すボタンは
// 一つも無い。翌日への繰り越しはサーバー(Edge Function)側でも行うので、
// アプリを二度と開かなくても通知は届き続ける。

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'forgetfulTracker:items:v1';
const DEVICE_ID_KEY = 'forgetfulTracker:deviceId:v1';
const CHECK_INTERVAL_MS = 20 * 1000;
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

// Web Pushの公開鍵(公開して問題ない値)。秘密鍵はEdge Function側にのみ置く。
const VAPID_PUBLIC_KEY = 'BCTRqMI1R172Kv_jJBw0df5f4jxRjPuKgXFXJ6yH7VeFNTyY5m-7U6TR3tnaag3iidYPWR0sA3W2sdk-SKWw0VE';

// -----------------------
// Localization (reads the shared platform language setting via localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: '🔔 Forgetful Tracker',
    titleText: 'Forgetful Tracker',
    subtitle: 'List what you always take with you and the time you leave. Your phone reminds you at that time every day, even when this app is closed.',

    guideSummary: 'How it works',
    guideStep1Title: '1. List what you always take',
    guideStep1Body: 'Umbrella, keys, lunch, gym bag. Add the time you normally head out, too.',
    guideStep2Title: '2. Allow notifications once',
    guideStep2Body: 'One tap. After that the reminder reaches you even when this page is closed.',
    guideStep3Title: '3. It repeats every day',
    guideStep3Body: 'The same nudge arrives at the same time tomorrow. Nothing to reset, nothing to re-enter.',

    addItemHeading: 'Add something you take with you',
    itemNameLabel: 'What do you keep forgetting?',
    itemNamePlaceholder: 'e.g. Umbrella',
    itemTimeLabel: 'What time do you usually leave?',
    itemTimeHint: 'You will be reminded at this time every day.',
    addItemBtn: 'Add item',

    yourItemsHeading: 'Your daily list',
    uncheckAllBtn: 'Uncheck all',
    uncheckDoneBtn: '✓ Cleared',
    emptyMessage: 'Nothing here yet. Add the one thing you forget most often.',

    enableNotifications: 'Turn on the reminder',
    notifyAskHeadline: function (time) {
      return 'Saved. To be reminded at ' + time + ' even when this app is closed, turn on notifications.';
    },
    notifyAskHeadlineNoTime: 'To be reminded even when this app is closed, turn on notifications.',
    notificationsEnabled: function (time) {
      return "Reminders are on. You'll be nudged at " + time + ' every day, even with this app closed.';
    },
    notificationsEnabledNoTime: 'Reminders are on, even when this app is closed.',
    notificationsBlocked: 'Notifications are blocked for this site. Allow them in your browser settings to get reminders.',
    notSupported: "Notifications aren't supported in this browser. On iPhone, add this app to your Home Screen first.",

    notifyTitle: "Don't forget!",
    everyDayAt: function (time) { return 'Every day at ' + time; },
    removeItem: function (name) { return 'Remove ' + name; },
    markPacked: function (name) { return 'Mark ' + name + ' as packed'; },
    pauseItem: 'Pause',
    resumeItem: 'Resume',
    pauseAria: function (name) { return 'Pause reminders for ' + name; },
    resumeAria: function (name) { return 'Resume reminders for ' + name; },
    pausedTag: 'Paused — no reminders',
    gotIt: 'Got it',
    forgotIt: 'Forgot it',
    alertedTag: "Today's reminder was sent",
    forgottenCount: function (n) { return 'Forgotten ' + n + (n === 1 ? ' time' : ' times'); },
  },

  ja: {
    title: '🔔 忘れ物トラッカー',
    titleText: '忘れ物トラッカー',
    subtitle: 'いつも持っていく物と、家を出る時刻を登録しましょう。このアプリを閉じていても、毎日その時刻にスマホがお知らせします。',

    guideSummary: '使い方',
    guideStep1Title: '1. いつも持っていく物を並べる',
    guideStep1Body: '傘、鍵、お弁当、ジムの荷物。いつも家を出る時刻も一緒に入れます。',
    guideStep2Title: '2. 通知を一度だけ許可する',
    guideStep2Body: 'タップ一回です。あとはこのページを閉じていても通知が届きます。',
    guideStep3Title: '3. 毎日くりかえします',
    guideStep3Body: '明日も同じ時刻に同じお知らせが来ます。リセットも再入力も要りません。',

    addItemHeading: '持っていく物を追加',
    itemNameLabel: 'よく忘れるものは何ですか？',
    itemNamePlaceholder: '例: 傘',
    itemTimeLabel: 'いつも家を出るのは何時ですか？',
    itemTimeHint: '毎日この時刻にお知らせします。',
    addItemBtn: '追加',

    yourItemsHeading: '毎日の持ち物',
    uncheckAllBtn: 'チェックを全部外す',
    uncheckDoneBtn: '✓ 外しました',
    emptyMessage: 'まだ何もありません。いちばんよく忘れる物を一つ追加してみましょう。',

    enableNotifications: '通知をオンにする',
    notifyAskHeadline: function (time) {
      return '保存しました。このアプリを閉じていても' + time + 'にお知らせするには、通知をオンにしてください。';
    },
    notifyAskHeadlineNoTime: 'このアプリを閉じていてもお知らせするには、通知をオンにしてください。',
    notificationsEnabled: function (time) {
      return '通知はオンです。このアプリを閉じていても、毎日' + time + 'にお知らせします。';
    },
    notificationsEnabledNoTime: '通知はオンです。このアプリを閉じていても届きます。',
    notificationsBlocked: 'このサイトの通知がブロックされています。お知らせを受け取るにはブラウザの設定で許可してください。',
    notSupported: 'このブラウザでは通知が使えません。iPhoneの場合は、まずこのアプリをホーム画面に追加してください。',

    notifyTitle: '忘れ物にご注意！',
    everyDayAt: function (time) { return '毎日 ' + time; },
    removeItem: function (name) { return name + 'を削除'; },
    markPacked: function (name) { return name + 'を持った印をつける'; },
    pauseItem: '休止',
    resumeItem: '再開',
    pauseAria: function (name) { return name + 'のお知らせを休止する'; },
    resumeAria: function (name) { return name + 'のお知らせを再開する'; },
    pausedTag: '休止中 — お知らせしません',
    gotIt: '持った',
    forgotIt: '忘れた',
    alertedTag: '今日のお知らせは送信済み',
    forgottenCount: function (n) { return n + '回忘れました'; },
  },

  es: {
    title: '🔔 Rastreador de Olvidos',
    titleText: 'Rastreador de Olvidos',
    subtitle: 'Anota lo que siempre llevas contigo y la hora a la que sales. Tu teléfono te avisa a esa hora todos los días, aunque esta app esté cerrada.',

    guideSummary: 'Cómo funciona',
    guideStep1Title: '1. Anota lo que siempre llevas',
    guideStep1Body: 'Paraguas, llaves, comida, bolsa del gimnasio. Añade también la hora a la que sueles salir.',
    guideStep2Title: '2. Permite las notificaciones una vez',
    guideStep2Body: 'Un toque. Después el aviso te llega aunque esta página esté cerrada.',
    guideStep3Title: '3. Se repite cada día',
    guideStep3Body: 'Mañana llega el mismo aviso a la misma hora. Nada que reiniciar, nada que volver a escribir.',

    addItemHeading: 'Añade algo que llevas contigo',
    itemNameLabel: '¿Qué se te olvida siempre?',
    itemNamePlaceholder: 'ej. Paraguas',
    itemTimeLabel: '¿A qué hora sueles salir?',
    itemTimeHint: 'Te avisaremos a esta hora todos los días.',
    addItemBtn: 'Añadir',

    yourItemsHeading: 'Tu lista diaria',
    uncheckAllBtn: 'Desmarcar todo',
    uncheckDoneBtn: '✓ Desmarcado',
    emptyMessage: 'Todavía no hay nada. Añade lo que más se te olvida.',

    enableNotifications: 'Activar el aviso',
    notifyAskHeadline: function (time) {
      return 'Guardado. Para recibir el aviso a las ' + time + ' aunque esta app esté cerrada, activa las notificaciones.';
    },
    notifyAskHeadlineNoTime: 'Para recibir el aviso aunque esta app esté cerrada, activa las notificaciones.',
    notificationsEnabled: function (time) {
      return 'Avisos activados. Te avisaremos a las ' + time + ' todos los días, aunque cierres la app.';
    },
    notificationsEnabledNoTime: 'Avisos activados, aunque esta app esté cerrada.',
    notificationsBlocked: 'Las notificaciones están bloqueadas para este sitio. Actívalas en la configuración de tu navegador.',
    notSupported: 'Las notificaciones no funcionan en este navegador. En iPhone, añade primero esta app a la pantalla de inicio.',

    notifyTitle: '¡No lo olvides!',
    everyDayAt: function (time) { return 'Cada día a las ' + time; },
    removeItem: function (name) { return 'Eliminar ' + name; },
    markPacked: function (name) { return 'Marcar ' + name + ' como listo'; },
    pauseItem: 'Pausar',
    resumeItem: 'Reanudar',
    pauseAria: function (name) { return 'Pausar los avisos de ' + name; },
    resumeAria: function (name) { return 'Reanudar los avisos de ' + name; },
    pausedTag: 'En pausa — sin avisos',
    gotIt: 'Listo',
    forgotIt: 'Se me olvidó',
    alertedTag: 'El aviso de hoy ya se envió',
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
    if (typeof t[key] === 'string') el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (typeof t[key] === 'string') el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria-label');
    if (typeof t[key] === 'string') el.setAttribute('aria-label', t[key]);
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
// データ読み書き
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
    console.error('Forgetful Tracker: 保存に失敗しました', e);
  });
}

// -----------------------
// Time helpers
// -----------------------

// "HH:MM"(端末のローカル時刻)から、次にその時刻が来る絶対時刻(ms)を計算する。
// すでに過ぎていれば翌日のその時刻にする。
function computeNotifyAt(hhmm) {
  const parts = String(hhmm || '').split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!isFinite(h) || !isFinite(m)) return Date.now() + 24 * 60 * 60 * 1000;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
}

// 端末のローカル日付を "YYYY-MM-DD" で返す。日をまたいだかどうかの判定に使う。
function dateKey(ms) {
  const d = new Date(ms);
  const pad = function (n) { return n < 10 ? '0' + n : String(n); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayKey() {
  return dateKey(Date.now());
}

// 休止していない持ち物のうち、いちばん早い時刻。通知の案内文に使う。
function earliestActiveTime(items) {
  const times = items
    .filter(function (i) { return !i.paused && i.time; })
    .map(function (i) { return i.time; })
    .sort();
  return times.length ? times[0] : null;
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  applyStaticTranslations();
  registerServiceWorker();
  setupNotifyUI();

  document.getElementById('itemForm').addEventListener('submit', handleAddItem);
  document.getElementById('resetBtn').addEventListener('click', handleUncheckAll);

  // データ層の準備ができてから描画する
  store = await openStore('forgetful-tracker', 'items', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () {
    renderItemList();
    updateNotifyUI();
  });

  rollOverDaily();
  renderItemList();
  updateNotifyUI();
  syncGuideOpenState();
  setInterval(rollOverDaily, CHECK_INTERVAL_MS);

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

  // 新しいsw.jsが有効になったら、開きっぱなしの画面も自動で最新版に切り替える。
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
}

// -----------------------
// 使い方ガイド
// -----------------------

// 初めて来た人(持ち物ゼロ)には開いて見せ、既に使っている人には畳んでおく。
function syncGuideOpenState() {
  const details = document.getElementById('guideDetails');
  if (!details) return;
  details.open = getItems().length === 0;
}

// -----------------------
// Notifications
// -----------------------

function setupNotifyUI() {
  const btn = document.getElementById('enableNotifyBtn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(function (permission) {
      updateNotifyUI();
      if (permission === 'granted') enablePushSync();
    });
  });
}

// 通知まわりの表示。持ち物が1件も無いうちはセクションごと隠す。
// 理由の分からない許可ダイアログは断られやすく、ブラウザは拒否を記憶するので、
// 「何を何時に知らせるか」が決まってから初めて尋ねる。
function updateNotifyUI() {
  const section = document.getElementById('notify-section');
  const headline = document.getElementById('notifyHeadline');
  const status = document.getElementById('notifyStatus');
  const btn = document.getElementById('enableNotifyBtn');
  if (!section) return;

  const items = getItems();
  if (items.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const earliest = earliestActiveTime(items);

  if (!('Notification' in window)) {
    headline.textContent = '';
    headline.hidden = true;
    btn.hidden = true;
    status.textContent = t.notSupported;
    status.className = 'notify-status notify-status--alert';
    return;
  }

  if (Notification.permission === 'granted') {
    headline.textContent = '';
    headline.hidden = true;
    btn.hidden = true;
    status.textContent = earliest
      ? t.notificationsEnabled(earliest)
      : t.notificationsEnabledNoTime;
    status.className = 'notify-status notify-status--ok';
    return;
  }

  if (Notification.permission === 'denied') {
    headline.textContent = '';
    headline.hidden = true;
    btn.hidden = true;
    status.textContent = t.notificationsBlocked;
    status.className = 'notify-status notify-status--alert';
    return;
  }

  headline.hidden = false;
  headline.textContent = earliest ? t.notifyAskHeadline(earliest) : t.notifyAskHeadlineNoTime;
  btn.hidden = false;
  btn.disabled = false;
  btn.textContent = t.enableNotifications;
  status.textContent = '';
  status.className = 'notify-status';
}

// 実際の通知表示は、サーバー(Edge Function)からのプッシュを受けたsw.jsが行う。
// ここでやるのは画面側の繰り越し：予定時刻を過ぎた持ち物を翌日へ進め、
// 日付が変わったらチェックを外す。どちらもユーザーの操作を必要としない。
function rollOverDaily() {
  const items = getItems();
  const now = Date.now();
  const today = todayKey();
  let changed = false;
  const toSync = [];

  items.forEach(function (item) {
    // 旧データの移行：恒久フラグの notified は使わなくなった
    // (「今日の分が鳴ったか」は lastNotifiedOn の日付で判定する)。
    if ('notified' in item) {
      delete item.notified;
      changed = true;
    }
    if (typeof item.paused !== 'boolean') {
      item.paused = false;
      changed = true;
    }

    if (!item.paused) {
      if (!item.notifyAt) {
        item.notifyAt = computeNotifyAt(item.time);
        changed = true;
        toSync.push(item);
      } else if (now >= item.notifyAt) {
        // 予定時刻を過ぎた = その日の分は鳴った。印を残して次の日へ進める。
        item.lastNotifiedOn = dateKey(item.notifyAt);
        item.notifyAt = computeNotifyAt(item.time);
        changed = true;
        toSync.push(item);
      }
    }

    // 日付が変わったらチェックを自動で外す。
    // 「次の外出のためにリセット」を押させないための仕組み。
    if (item.checked && item.checkedOn !== today) {
      item.checked = false;
      item.checkedOn = null;
      changed = true;
    }
  });

  if (changed) {
    saveItems(items);
    toSync.forEach(function (item) { syncReminder(item); });
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
// 送信後の翌日への繰り越しはEdge Function側が行うので、アプリを開かなくても鳴り続ける。
async function syncReminder(item) {
  if (!hasCloud() || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (item.paused) return;
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

    rollOverDaily();
    const items = getItems();
    for (const item of items) {
      if (!item.paused) await syncReminder(item);
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
    checkedOn: null,
    lastNotifiedOn: null,
    paused: false,
    createdAt: Date.now()
  };
  items.push(newItem);
  saveItems(items);
  syncReminder(newItem);

  nameInput.value = '';
  timeInput.value = '';
  nameInput.focus();
  renderItemList();
  // 1件目が入ったこの瞬間に初めて通知の許可を尋ねる。
  updateNotifyUI();
  syncGuideOpenState();
}

// -----------------------
// Item actions
// -----------------------

function toggleChecked(id) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.checked = !item.checked;
  item.checkedOn = item.checked ? todayKey() : null;
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

// 休止＝削除せずに鳴らなくする。しばらく持ち歩かない物のためのもので、
// クラウド側のreminder行も消すので、休止中は通知が飛ばない。
function togglePaused(id) {
  const items = getItems();
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;

  item.paused = !item.paused;
  if (item.paused) {
    deleteReminder(item.id);
  } else {
    item.notifyAt = computeNotifyAt(item.time);
    syncReminder(item);
  }

  saveItems(items);
  renderItemList();
  updateNotifyUI();
}

function deleteItem(id) {
  const items = getItems().filter(function (i) { return i.id !== id; });
  saveItems(items);
  deleteReminder(id);
  renderItemList();
  updateNotifyUI();
  syncGuideOpenState();
}

// 日付が変わればチェックは自動で外れるので、これは
// 「同じ日に二度出かける」ときのための任意の操作。
function handleUncheckAll() {
  const items = getItems();
  items.forEach(function (item) {
    item.checked = false;
    item.checkedOn = null;
  });
  saveItems(items);
  renderItemList();

  const resetBtn = document.getElementById('resetBtn');
  resetBtn.textContent = t.uncheckDoneBtn;
  setTimeout(function () {
    resetBtn.textContent = t.uncheckAllBtn;
  }, 1500);
}

// -----------------------
// Render
// -----------------------

function renderItemList() {
  const list = document.getElementById('itemList');
  list.innerHTML = '';

  const items = getItems().slice().sort(function (a, b) {
    // 休止中のものは下にまとめ、あとは時刻順
    if (!!a.paused !== !!b.paused) return a.paused ? 1 : -1;
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.hidden = !items.some(function (i) { return i.checked; });
  }

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
  card.className = 'item-card'
    + (item.checked ? ' checked' : '')
    + (item.paused ? ' paused' : '');

  const header = document.createElement('div');
  header.className = 'item-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'item-title-group';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'item-name';
  nameSpan.textContent = item.name;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'item-time';
  timeSpan.textContent = t.everyDayAt(item.time);

  titleGroup.appendChild(nameSpan);
  titleGroup.appendChild(timeSpan);

  const headerBtns = document.createElement('div');
  headerBtns.className = 'item-header-btns';

  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.className = 'item-pause-btn';
  pauseBtn.textContent = item.paused ? t.resumeItem : t.pauseItem;
  pauseBtn.setAttribute('aria-label', item.paused ? t.resumeAria(item.name) : t.pauseAria(item.name));
  pauseBtn.addEventListener('click', function () { togglePaused(item.id); });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'item-delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', t.removeItem(item.name));
  deleteBtn.addEventListener('click', function () { deleteItem(item.id); });

  headerBtns.appendChild(pauseBtn);
  headerBtns.appendChild(deleteBtn);

  header.appendChild(titleGroup);
  header.appendChild(headerBtns);
  card.appendChild(header);

  if (item.paused) {
    const pausedTag = document.createElement('p');
    pausedTag.className = 'paused-tag';
    pausedTag.textContent = t.pausedTag;
    card.appendChild(pausedTag);
  } else {
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
    card.appendChild(actionRow);

    if (item.lastNotifiedOn === todayKey()) {
      const notifiedTag = document.createElement('p');
      notifiedTag.className = 'notified-tag';
      notifiedTag.textContent = t.alertedTag;
      card.appendChild(notifiedTag);
    }
  }

  if (item.forgottenCount > 0) {
    const badge = document.createElement('p');
    badge.className = 'forgotten-badge';
    badge.textContent = t.forgottenCount(item.forgottenCount);
    card.appendChild(badge);
  }

  return card;
}
