// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'routeNotes:routes:v1';

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

const TIME_SLOT_KEYS = {
  'weekday-morning': 'slotWeekdayMorning',
  'weekday-evening': 'slotWeekdayEvening',
  weekend: 'slotWeekend',
  other: 'slotOther',
};

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'Route Notes',
    subtitle: "Your best bus/train combos for each time of day, so you don't have to re-figure it out.",
    newRouteHeading: 'New Route',
    timeLabel: 'Time',
    slotWeekdayMorning: 'Weekday Morning',
    slotWeekdayEvening: 'Weekday Evening',
    slotWeekend: 'Weekend',
    slotOther: 'Other',
    routeLabel: 'Route',
    routePlaceholder: 'e.g. 42 bus to Elm St, then Red Line express downtown',
    addRouteBtn: 'Add Route',
    routeRequiredError: 'Please describe the route.',
    emptyRoutes: 'No routes yet. Add your first one above.',
    editRouteAriaLabel: 'Edit route',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Delete this route? This cannot be undone.',
  },
  ja: {
    title: 'ルートメモ',
    subtitle: '時間帯ごとのお気に入りのバス・電車の乗り継ぎを記録して、毎回考え直さなくて済むようにします。',
    newRouteHeading: '新しいルート',
    timeLabel: '時間帯',
    slotWeekdayMorning: '平日の朝',
    slotWeekdayEvening: '平日の夕方',
    slotWeekend: '週末',
    slotOther: 'その他',
    routeLabel: 'ルート',
    routePlaceholder: '例: 42番バスでElm St、そこから赤ラインの急行で都心へ',
    addRouteBtn: 'ルートを追加',
    routeRequiredError: 'ルートの内容を入力してください。',
    emptyRoutes: 'まだルートがありません。上から最初のひとつを追加しましょう。',
    editRouteAriaLabel: 'ルートを編集',
    save: '保存',
    cancel: 'キャンセル',
    edit: '編集',
    delete: '削除',
    confirmDelete: 'このルートを削除しますか？元に戻せません。',
  },
  es: {
    title: 'Notas de Ruta',
    subtitle: 'Tus mejores combinaciones de bus/tren para cada momento del día, para no tener que pensarlo de nuevo.',
    newRouteHeading: 'Nueva Ruta',
    timeLabel: 'Horario',
    slotWeekdayMorning: 'Mañana entre semana',
    slotWeekdayEvening: 'Tarde entre semana',
    slotWeekend: 'Fin de semana',
    slotOther: 'Otro',
    routeLabel: 'Ruta',
    routePlaceholder: 'ej. Bus 42 hasta Elm St, luego la línea roja exprés al centro',
    addRouteBtn: 'Añadir Ruta',
    routeRequiredError: 'Por favor describe la ruta.',
    emptyRoutes: 'Aún no hay rutas. Añade la primera arriba.',
    editRouteAriaLabel: 'Editar ruta',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    confirmDelete: '¿Eliminar esta ruta? Esta acción no se puede deshacer.',
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

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveRoutes() してよい。
function getRoutes() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveRoutes(routes) {
  if (!store) return;
  store.set(routes).catch(function (e) {
    console.error('Route Notes: 保存に失敗しました', e);
  });
}

const addForm = document.getElementById('add-form');
const timeSlotSelect = document.getElementById('time-slot-select');
const routeInput = document.getElementById('route-input');
const errorMsg = document.getElementById('error-msg');
const routeGroups = document.getElementById('route-groups');
const emptyState = document.getElementById('empty-state');

let editingId = null;

applyStaticTranslations();

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.hidden = true;
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  const route = routeInput.value.trim();
  if (!route) {
    showError(t.routeRequiredError);
    return;
  }

  const routes = getRoutes();
  routes.unshift({
    id: String(Date.now()),
    timeSlot: timeSlotSelect.value,
    route,
    createdAt: new Date().toISOString(),
  });
  saveRoutes(routes);
  addForm.reset();
  render();
});

function buildRouteCard(item) {
  const li = document.createElement('li');
  li.className = 'route-card';

  if (editingId === item.id) {
    const form = document.createElement('form');
    form.className = 'route-edit-form';

    const textarea = document.createElement('textarea');
    textarea.rows = 2;
    textarea.maxLength = 400;
    textarea.value = item.route;
    textarea.setAttribute('aria-label', t.editRouteAriaLabel);

    const actions = document.createElement('div');
    actions.className = 'route-edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'save-btn';
    saveBtn.textContent = t.save;

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = t.cancel;
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      render();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      if (!text) return;
      const routes = getRoutes();
      const target = routes.find((r) => r.id === item.id);
      if (target) {
        target.route = text;
        saveRoutes(routes);
      }
      editingId = null;
      render();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(textarea);
    form.appendChild(actions);
    li.appendChild(form);
    return li;
  }

  const textEl = document.createElement('p');
  textEl.className = 'route-text';
  textEl.textContent = item.route;
  li.appendChild(textEl);

  const actions = document.createElement('div');
  actions.className = 'route-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'edit-btn';
  editBtn.textContent = t.edit;
  editBtn.addEventListener('click', () => {
    editingId = item.id;
    render();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = t.delete;
  deleteBtn.addEventListener('click', () => {
    if (!confirm(t.confirmDelete)) return;
    const routes = getRoutes().filter((r) => r.id !== item.id);
    saveRoutes(routes);
    render();
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(actions);

  return li;
}

function render() {
  const routes = getRoutes();
  routeGroups.innerHTML = '';

  if (routes.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent = t.emptyRoutes;
    return;
  }
  emptyState.hidden = true;

  for (const slot of Object.keys(TIME_SLOT_KEYS)) {
    const items = routes.filter((r) => r.timeSlot === slot);
    if (items.length === 0) continue;

    const group = document.createElement('div');
    group.className = 'time-group';

    const heading = document.createElement('h2');
    heading.className = 'section-title';
    heading.textContent = t[TIME_SLOT_KEYS[slot]];
    group.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'route-list';
    for (const item of items) {
      list.appendChild(buildRouteCard(item));
    }
    group.appendChild(list);

    routeGroups.appendChild(group);
  }
}

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('route-notes', 'routes', {
    default: [],
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
