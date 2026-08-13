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
  { slug: 'daily-wins',    key: 'wins',   legacy: 'dailyWins:wins:v1',      get: 'getWins',   save: 'saveWins',   render: 'renderWins' }
];

// アプリのスクリプトを読み込む。DOMを触る箇所があるので描画は差し替える。
// 起動時の自己実行(async IIFE)が走るため、await で完了を待つ。
function loadApp(app, opts) {
  const env = loadAppSync(opts);
  const doc = env.document;

  // 各アプリが getElementById で掴む要素は使い捨てのダミーで足りる
  doc.getElementById = function () {
    return {
      innerHTML: '', textContent: '', value: '', hidden: false, className: '',
      style: {}, classList: { add() {}, remove() {} },
      setAttribute() {}, appendChild() {}, addEventListener() {}, reset() {},
      offsetWidth: 0
    };
  };
  env.sandbox.crypto = { randomUUID: () => 'id-' + Math.random().toString(36).slice(2) };

  const src = fs.readFileSync(path.join(APPS_DIR, app.slug, 'script.js'), 'utf8');
  require('vm').runInContext(src, env.sandbox, { filename: app.slug + '/script.js' });

  env.renders = 0;
  env.sandbox[app.render] = function () { env.renders++; };
  return env;
}

// 起動(IIFE または initStore)の完了を待つ
async function boot(env, app) {
  if (typeof env.sandbox.initStore === 'function') await env.sandbox.initStore();
  await tick();
  await tick();
}

APPS.forEach(function (app) {
  const K = lsKey(app.slug, app.key);

  describe('migrated :: ' + app.slug, function () {
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
