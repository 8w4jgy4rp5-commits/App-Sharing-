// store() へ移行した各アプリの共通契約テスト。
// アプリを増やすたびに APPS へ1行足せば、同じ検証が全部かかる。
const fs = require('fs');
const path = require('path');
const { loadAppSync, makeLocalStorage, makeSupabase, session, envelope, lsKey, tick } = require('./harness');

const OWNER = 'user-a';
const APPS_DIR = path.join(__dirname, '..', 'apps');

// slug / store key / 旧localStorageキー / get関数 / save関数 / 描画関数
const APPS = [
  { slug: 'daily-todo',    key: 'tasks',  legacy: 'dailyTodo:tasks:v1',    get: 'getTasks',  save: 'saveTasks',  render: 'renderAll' },
  { slug: 'habit-tracker', key: 'habits', legacy: 'habitTracker:habits:v1', get: 'getHabits', save: 'saveHabits', render: 'renderHabits' },
  { slug: 'daily-wins',    key: 'wins',   legacy: 'dailyWins:wins:v1',      get: 'getWins',   save: 'saveWins',   render: 'renderWins' },

  { slug: 'book-show-tracker',  key: 'items',   legacy: 'bookShowTracker:items:v1',   get: 'getItems',   save: 'saveItems',   render: 'render' },
  { slug: 'idea-notebook',      key: 'ideas',   legacy: 'ideaNotebook:ideas:v1',      get: 'getIdeas',   save: 'saveIdeas',   render: 'render' },
  { slug: 'memory-diary',       key: 'entries', legacy: 'memoryDiary:entries:v1',     get: 'getEntries', save: 'saveEntries', render: 'render' },
  { slug: 'route-notes',        key: 'routes',  legacy: 'routeNotes:routes:v1',       get: 'getRoutes',  save: 'saveRoutes',  render: 'render' },
  { slug: 'what-to-cook',       key: 'meals',   legacy: 'whatToCook:meals:v1',        get: 'getMeals',   save: 'saveMeals',   render: 'render' },
  { slug: 'flashcards-en',      key: 'cards',   legacy: 'flashcardsEn:cards:v1',      get: 'getCards',   save: 'saveCards',   render: 'render' },
  { slug: 'place-picks',        key: 'places',  legacy: 'placePicks:places:v1',       get: 'getPlaces',  save: 'savePlaces',  render: 'renderPlaces' },
  { slug: 'song-catcher',       key: 'entries', legacy: 'songCatcher:entries:v1',     get: 'getEntries', save: 'saveEntries', render: 'renderEntries' },
  { slug: 'daily-summary',      key: 'entries', legacy: 'dailySummary:entries:v1',    get: 'getEntries', save: 'saveEntries', render: 'renderEntries', ready: true },
  { slug: 'restock-planner',    key: 'items',   legacy: 'restockPlanner:items:v1',    get: 'getItems',   save: 'saveItems',   render: 'renderAll',     ready: true },
  { slug: 'free-trial-tracker', key: 'trials',  legacy: 'freeTrialTracker:trials:v1', get: 'getTrials',  save: 'saveTrials',  render: 'renderTrialList', ready: true },
  { slug: 'simple-budget',      key: 'records', legacy: 'simpleBudget:records:v1',    get: 'getRecords', save: 'saveRecords', render: 'renderAll',     ready: true }
];

// アプリのスクリプトを読み込む。DOMを触る箇所があるので描画は差し替える。
// 起動時の自己実行(async IIFE)が走るため、await で完了を待つ。
function loadApp(app, opts) {
  const env = loadAppSync(opts);
  const doc = env.document;

  // 各アプリが掴むDOM要素は使い捨てのダミーで足りる。
  // 描画そのものは差し替えるので、起動が通ればよい。
  function dummy() {
    return new Proxy({
      innerHTML: '', textContent: '', value: '', hidden: false, className: '',
      checked: false, disabled: false, offsetWidth: 0, dataset: {},
      style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      options: [], files: [], children: [],
      setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
      appendChild() {}, removeChild() {}, remove() {}, insertBefore() {},
      addEventListener() {}, removeEventListener() {}, reset() {}, focus() {},
      querySelector: () => dummy(), querySelectorAll: () => [],
      closest: () => null, contains: () => false
    }, { get: (t, k) => (k in t ? t[k] : (typeof k === 'string' ? dummy() : undefined)) });
  }
  doc.getElementById = () => dummy();
  doc.querySelector = () => dummy();
  doc.querySelectorAll = () => [];
  doc.createElement = () => dummy();
  doc.documentElement = dummy();
  doc.body = dummy();
  doc.head = dummy();
  env.sandbox.crypto = { randomUUID: () => 'id-' + Math.random().toString(36).slice(2) };
  env.sandbox.alert = function () {};
  env.sandbox.confirm = function () { return true; };
  env.sandbox.matchMedia = function () { return { matches: false, addEventListener() {} }; };

  const src = fs.readFileSync(path.join(APPS_DIR, app.slug, 'script.js'), 'utf8');
  require('vm').runInContext(src, env.sandbox, { filename: app.slug + '/script.js' });

  env.renders = 0;
  env.sandbox[app.render] = function () { env.renders++; };
  return env;
}

// 起動の完了を待つ。アプリごとに入口が違う:
//   initStore()        daily-todo
//   DOMContentLoaded   起動処理をイベントに載せているアプリ
//   即時実行            末尾の async IIFE
// どれも store が入った時点で完了とみなす。
async function boot(env, app) {
  if (typeof env.sandbox.initStore === 'function') await env.sandbox.initStore();
  else if (app.ready) await Promise.all(env.document.dispatch('DOMContentLoaded'));

  for (let i = 0; i < 50 && !env.getStore(); i++) await tick();
  if (!env.getStore()) throw new Error('起動が完了しない (store が null のまま)');
  await tick();
}

// 配列を1つ持つ形ではないアプリ。静的チェックだけ共通でかけ、
// 動作は個別に検証する(このファイルの末尾)。
const STATIC_ONLY = [{ slug: 'micro-stretch', key: 'records', legacy: 'microStretch:records:v1' }];

APPS.concat(STATIC_ONLY).forEach(function (app) {
  describe('migrated static :: ' + app.slug, function () {
    it('index.html が共有スクリプトを正しい順で読む', function () {
      const html = fs.readFileSync(path.join(APPS_DIR, app.slug, 'index.html'), 'utf8');
      const order = ['supabase-js', 'supabase-config.js', 'app-sync.js', 'script.js']
        .map((s) => html.indexOf(s));
      assert.ok(order.every((i) => i !== -1), '読み込まれていないスクリプトがある: ' + order);
      const sorted = order.slice().sort((a, b) => a - b);
      assert.sameJson(order, sorted, '読み込み順が違う');
    });

    it('openStore スタブがテンプレートと一致する', function () {
      const src = fs.readFileSync(path.join(APPS_DIR, app.slug, 'script.js'), 'utf8');
      const skill = fs.readFileSync(
        path.join(__dirname, '..', '.claude', 'skills', 'app-template', 'SKILL.md'), 'utf8'
      );
      const grab = (s) => (s.match(/async function openStore[\s\S]*?\n\}/) || [])[0];
      assert.ok(grab(src), 'openStore が無い');
      assert.strictEqual(grab(src), grab(skill), 'テンプレートと差異がある');
    });

    it('localStorage を直接読み書きしない', function () {
      const src = fs.readFileSync(path.join(APPS_DIR, app.slug, 'script.js'), 'utf8');
      // openStore スタブの中の localStorage は正当なので取り除いてから見る
      const body = src.replace(/async function openStore[\s\S]*?\n\}/, '');
      const hits = (body.match(/localStorage\.(getItem|setItem)\(\s*(LEGACY_STORAGE_KEY|[A-Z_]*STORAGE_KEY)/g) || []);
      assert.sameJson(hits, [], 'アプリ本体が旧キーを直接触っている');
    });
  });
});

APPS.forEach(function (app) {
  const K = lsKey(app.slug, app.key);

  describe('migrated :: ' + app.slug, function () {
    it('空の状態で起動できる', async function () {
      const env = loadApp(app, { supabase: null });
      await boot(env, app);
      assert.sameJson(env.sandbox[app.get](), []);
    });

    it('保存と再取得ができる', async function () {
      const env = loadApp(app, { supabase: null });
      await boot(env, app);
      env.sandbox[app.save]([{ id: 'a' }]);
      await tick();
      assert.sameJson(env.sandbox[app.get](), [{ id: 'a' }]);
    });

    it('旧キーのデータを引き継ぎ、旧キーは残す', async function () {
      const ls = makeLocalStorage();
      ls.setItem(app.legacy, JSON.stringify([{ id: 'legacy' }]));
      const env = loadApp(app, { localStorage: ls, supabase: null });
      await boot(env, app);
      assert.sameJson(env.sandbox[app.get](), [{ id: 'legacy' }]);
      assert.ok(ls.getItem(app.legacy), '旧キーが消えている');
    });

    it('get() がコピーを返す', async function () {
      const env = loadApp(app, { supabase: null });
      await boot(env, app);
      env.sandbox[app.save]([{ id: 'a' }]);
      await tick();
      const v = env.sandbox[app.get]();
      v[0].id = 'CHANGED';
      v.push({ id: 'ghost' });
      assert.sameJson(env.sandbox[app.get](), [{ id: 'a' }]);
    });

    it('取得 → 直接書き換え → 保存 が通る', async function () {
      const env = loadApp(app, { supabase: null });
      await boot(env, app);
      env.sandbox[app.save]([{ id: 'a', done: false }]);
      await tick();
      const v = env.sandbox[app.get]();
      v[0].done = true;
      env.sandbox[app.save](v);
      await tick();
      assert.strictEqual(env.sandbox[app.get]()[0].done, true);
    });

    it('自分の保存では再描画されない', async function () {
      const env = loadApp(app, { supabase: null });
      await boot(env, app);
      env.renders = 0;
      env.sandbox[app.save]([{ id: 'a' }]);
      await tick(10);
      assert.strictEqual(env.renders, 0);
    });

    it('別タブの変更で再描画される', async function () {
      const env = loadApp(app, { supabase: null });
      await boot(env, app);
      env.renders = 0;
      env.window.dispatch('storage', {
        key: K, newValue: JSON.stringify(envelope([{ id: 'tab' }], Date.now() + 9000))
      });
      assert.strictEqual(env.renders, 1);
      assert.sameJson(env.sandbox[app.get](), [{ id: 'tab' }]);
    });

    it('ログイン中の保存がクラウドへ上がる', async function () {
      const sb = makeSupabase({ session: session(OWNER), rows: new Map() });
      const env = loadApp(app, { supabase: sb });
      await boot(env, app);
      env.sandbox[app.save]([{ id: 'synced' }]);
      await tick(1200);
      assert.sameJson(
        (sb._state.rows.get(OWNER + '|' + app.slug + '|' + app.key) || {}).d,
        [{ id: 'synced' }]
      );
    });

    it('クラウドのデータを起動時に読む', async function () {
      const rows = new Map([
        [OWNER + '|' + app.slug + '|' + app.key, envelope([{ id: 'cloud' }], 9000, OWNER)]
      ]);
      const env = loadApp(app, { supabase: makeSupabase({ session: session(OWNER), rows: rows }) });
      await boot(env, app);
      assert.sameJson(env.sandbox[app.get](), [{ id: 'cloud' }]);
    });

    it('別アカウントのローカルデータは表示しない', async function () {
      const ls = makeLocalStorage();
      ls.setItem(K, JSON.stringify(envelope([{ id: 'other' }], Date.now() + 99999, 'user-b')));
      const env = loadApp(app, {
        localStorage: ls, supabase: makeSupabase({ session: session(OWNER), rows: new Map() })
      });
      await boot(env, app);
      assert.sameJson(env.sandbox[app.get](), []);
    });

    it('app-sync.js が無くても動く', async function () {
      const env = loadApp(app, { withoutAppSync: true, supabase: null });
      await boot(env, app);
      env.sandbox[app.save]([{ id: 'stub' }]);
      await tick();
      assert.sameJson(env.sandbox[app.get](), [{ id: 'stub' }]);
      assert.ok(env.localStorage.getItem(K), 'appdata: キーに書かれていない');
    });
  });
});

// micro-stretch だけ配列ではなく { date, todayCount, totalCount } を1件持つ。
// 読み取り時に日付の正規化と型の検証を通すので、共通の表には載せられない。
describe('migrated :: micro-stretch', function () {
  const app = { slug: 'micro-stretch', key: 'records', render: 'renderRecords', ready: true };
  const K = lsKey('micro-stretch', 'records');
  const today = () => new Date().toISOString().slice(0, 10);

  it('データが無ければ今日の0件から始まる', async function () {
    const env = loadApp(app, { supabase: null });
    await boot(env, app);
    const r = env.sandbox.getRecords();
    assert.strictEqual(r.todayCount, 0);
    assert.strictEqual(r.totalCount, 0);
  });

  it('保存と再取得ができる', async function () {
    const env = loadApp(app, { supabase: null });
    await boot(env, app);
    env.sandbox.saveRecords({ date: today(), todayCount: 2, totalCount: 7 });
    await tick();
    assert.strictEqual(env.sandbox.getRecords().totalCount, 7);
  });

  it('旧キーの記録を引き継ぐ', async function () {
    const ls = makeLocalStorage();
    ls.setItem('microStretch:records:v1', JSON.stringify({ date: today(), todayCount: 4, totalCount: 12 }));
    const env = loadApp(app, { localStorage: ls, supabase: null });
    await boot(env, app);
    assert.strictEqual(env.sandbox.getRecords().totalCount, 12);
    assert.ok(ls.getItem('microStretch:records:v1'), '旧キーが消えている');
  });

  it('日付が変わると todayCount だけ0に戻る', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope({ date: '2020-01-01', todayCount: 5, totalCount: 30 }, 9000)));
    const env = loadApp(app, { localStorage: ls, supabase: null });
    await boot(env, app);
    const r = env.sandbox.getRecords();
    assert.strictEqual(r.todayCount, 0, 'todayCount が持ち越されている');
    assert.strictEqual(r.totalCount, 30, 'totalCount が失われている');
  });

  it('壊れた値でも既定値で起動する', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope({ date: 5, todayCount: 'x', totalCount: null }, 9000)));
    const env = loadApp(app, { localStorage: ls, supabase: null });
    await boot(env, app);
    const r = env.sandbox.getRecords();
    assert.strictEqual(r.todayCount, 0);
    assert.strictEqual(r.totalCount, 0);
    assert.strictEqual(typeof r.date, 'string');
  });

  it('get() がコピーを返す', async function () {
    const env = loadApp(app, { supabase: null });
    await boot(env, app);
    env.sandbox.saveRecords({ date: today(), todayCount: 1, totalCount: 1 });
    await tick();
    const r = env.sandbox.getRecords();
    r.totalCount = 999;
    assert.strictEqual(env.sandbox.getRecords().totalCount, 1);
  });

  it('自分の保存では再描画されない', async function () {
    const env = loadApp(app, { supabase: null });
    await boot(env, app);
    env.renders = 0;
    env.sandbox.saveRecords({ date: today(), todayCount: 1, totalCount: 1 });
    await tick(10);
    assert.strictEqual(env.renders, 0);
  });

  it('別タブの変更で再描画される', async function () {
    const env = loadApp(app, { supabase: null });
    await boot(env, app);
    env.renders = 0;
    env.window.dispatch('storage', {
      key: K,
      newValue: JSON.stringify(envelope({ date: today(), todayCount: 3, totalCount: 8 }, Date.now() + 9000))
    });
    assert.strictEqual(env.renders, 1);
    assert.strictEqual(env.sandbox.getRecords().totalCount, 8);
  });

  it('app-sync.js が無くても動く', async function () {
    const env = loadApp(app, { withoutAppSync: true, supabase: null });
    await boot(env, app);
    env.sandbox.saveRecords({ date: today(), todayCount: 1, totalCount: 4 });
    await tick();
    assert.strictEqual(env.sandbox.getRecords().totalCount, 4);
    assert.ok(env.localStorage.getItem(K), 'appdata: キーに書かれていない');
  });
});
