// app-sync.js をNode上で動かすための最小環境。
// ブラウザAPI(localStorage / window / document / navigator)と
// Supabaseクライアントを差し替え、1テストごとにまっさらな状態を作る。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP_SYNC_PATH = path.join(__dirname, '..', 'app-sync.js');

// --- localStorage ---------------------------------------------------
function makeLocalStorage() {
  const map = new Map();
  return {
    _map: map,
    _throwOnSet: false,
    getItem(k) { return map.has(String(k)) ? map.get(String(k)) : null; },
    setItem(k, v) {
      if (this._throwOnSet) throw new Error('QuotaExceededError');
      map.set(String(k), String(v));
    },
    removeItem(k) { map.delete(String(k)); },
    clear() { map.clear(); }
  };
}

// --- Supabase のふり ------------------------------------------------
// rows: 'ownerId|slug|key' -> envelope
function makeSupabase(opts) {
  const o = opts || {};
  const state = {
    session: o.session === undefined ? null : o.session,
    rows: o.rows || new Map(),
    pullError: o.pullError || null,   // { message, status } を返させる
    upsertError: o.upsertError || null,
    upsertFailTimes: o.upsertFailTimes || 0, // 最初のN回だけ失敗させる
    pulls: 0,
    upserts: 0,
    upsertLog: []
  };

  function rowKey(owner, slug, key) { return owner + '|' + slug + '|' + key; }

  const client = {
    _state: state,
    auth: {
      getSession: async () => ({ data: { session: state.session }, error: null })
    },
    from(table) {
      if (table !== 'user_app_data') throw new Error('unexpected table: ' + table);
      const filters = {};
      const builder = {
        select() { return builder; },
        eq(col, val) { filters[col] = val; return builder; },
        async maybeSingle() {
          state.pulls++;
          if (state.pullError) return { data: null, error: state.pullError };
          const v = state.rows.get(rowKey(filters.owner_id, filters.app_slug, filters.key));
          if (v === undefined) return { data: null, error: null };
          return { data: { value: v, updated_at: new Date().toISOString() }, error: null };
        },
        async upsert(row) {
          state.upserts++;
          state.upsertLog.push(JSON.parse(JSON.stringify(row.value)));
          if (state.upsertFailTimes > 0) {
            state.upsertFailTimes--;
            return { error: { message: 'network down' } };
          }
          if (state.upsertError) return { error: state.upsertError };
          state.rows.set(rowKey(row.owner_id, row.app_slug, row.key), row.value);
          return { error: null };
        }
      };
      return builder;
    }
  };
  return client;
}

// --- DOM のふり -----------------------------------------------------
function makeDocument() {
  function el(tag) {
    return {
      tagName: tag, textContent: '', className: '', children: [],
      style: {},
      setAttribute() {}, appendChild(c) { this.children.push(c); },
      remove() {},
      classList: { add() {}, remove() {} }
    };
  }
  const doc = {
    visibilityState: 'visible',
    _listeners: {},
    head: el('head'),
    body: el('body'),
    createElement: el,
    addEventListener(ev, fn) { (doc._listeners[ev] = doc._listeners[ev] || []).push(fn); },
    // 非同期ハンドラの戻り値を返す。呼び出し側が待たないと、中で起きた例外が
    // 未処理のPromise拒否になってプロセスごと落ちる。
    dispatch(ev, e) { return (doc._listeners[ev] || []).map((fn) => fn(e)); }
  };
  return doc;
}

// --- 環境の組み立て --------------------------------------------------
// 毎回 app-sync.js を読み直すので、モジュール内の状態(registry や
// globalHandlersReady)もテストごとにリセットされる。
function loadAppSync(opts) {
  const o = opts || {};
  const localStorage = o.localStorage || makeLocalStorage();
  const supabaseClient = o.supabase === null ? undefined : (o.supabase || makeSupabase());
  const document = makeDocument();

  // ブラウザでは window === グローバルオブジェクト。同じ形にしておかないと
  // 「window.X で確認して素の X を呼ぶ」ようなコードの差が出ない。
  const sandbox = {
    _listeners: {},
    addEventListener(ev, fn) { (sandbox._listeners[ev] = sandbox._listeners[ev] || []).push(fn); },
    dispatch(ev, e) { (sandbox._listeners[ev] || []).forEach((fn) => fn(e)); },
    document,
    localStorage,
    navigator: { onLine: o.onLine === undefined ? true : o.onLine },
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    Blob: class { constructor(parts) { this.size = Buffer.byteLength(String(parts[0]), 'utf8'); } }
  };
  if (supabaseClient !== undefined) sandbox.supabaseClient = supabaseClient;
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  if (!o.withoutAppSync) {
    vm.runInContext(fs.readFileSync(APP_SYNC_PATH, 'utf8'), sandbox, { filename: 'app-sync.js' });
  }

  return {
    AppSync: sandbox.AppSync,
    localStorage,
    supabase: supabaseClient,
    window: sandbox,
    document,
    sandbox,
    // daily-todo の `let store` は字句スコープなのでサンドボックス経由で読む
    getStore: () => vm.runInContext('typeof store === "undefined" ? null : store', sandbox)
  };
}

// daily-todo/script.js を同じサンドボックスへ重ねて読み込む。
// DOMContentLoaded は発火させないので、初期化は initStore() を直接呼ぶ。
// opts.withoutAppSync: true で app-sync.js を読まず、アプリ側スタブの経路を試す。
function loadDailyTodo(opts) {
  const o = opts || {};
  const env = loadAppSync(o);

  const src = fs.readFileSync(
    path.join(__dirname, '..', 'apps', 'daily-todo', 'script.js'), 'utf8'
  );
  vm.runInContext(src, env.sandbox, { filename: 'daily-todo/script.js' });

  // 描画はDOMを触るのでテストでは差し替える(呼ばれた回数だけ数える)
  env.renders = 0;
  env.sandbox.renderAll = function () { env.renders++; };
  return env;
}

const session = (id) => ({ user: { id } });
const envelope = (d, t, o, av) => ({ v: 1, av: av === undefined ? 1 : av, t, o: o === undefined ? null : o, d });
const lsKey = (slug, key) => 'appdata:' + slug + ':' + key;
const tick = (ms) => new Promise((r) => setTimeout(r, ms === undefined ? 0 : ms));

module.exports = {
  loadAppSync, loadDailyTodo,
  makeLocalStorage, makeSupabase, session, envelope, lsKey, tick
};
