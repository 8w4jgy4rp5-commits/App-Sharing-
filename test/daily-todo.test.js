// daily-todo × app-sync.store() の統合テスト。
// アプリ側のコード(getTasks / saveTasks / normalizeDailyTasks / openStore)を
// 実ファイルから読み込んで動かす。
const { loadDailyTodo, makeLocalStorage, makeSupabase, session, envelope, lsKey, tick } = require('./harness');

const OWNER = 'user-a';
const K = lsKey('daily-todo', 'tasks');
const LEGACY = 'dailyTodo:tasks:v1';

function loggedIn(rows) {
  return makeSupabase({ session: session(OWNER), rows: rows || new Map() });
}

function task(over) {
  return Object.assign({
    id: 't1', text: 'Task', priority: 'medium', completed: false,
    isDaily: false, streakCount: 0, lastCompletedDate: null
  }, over || {});
}

// アプリのサンドボックス内の関数を呼ぶ
function fn(env, name) { return env.sandbox[name]; }

describe('daily-todo :: 起動', function () {
  it('store が無い状態でも getTasks() は [] を返す', async function () {
    const env = loadDailyTodo();
    assert.sameJson(fn(env, 'getTasks')(), []);
  });

  it('initStore() 後に store が使える', async function () {
    const env = loadDailyTodo();
    await fn(env, 'initStore')();
    assert.sameJson(fn(env, 'getTasks')(), []);
  });

  it('データが無ければ空配列で始まる', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    assert.sameJson(fn(env, 'getTasks')(), []);
  });

  it('旧キーのタスクを引き継ぐ', async function () {
    const ls = makeLocalStorage();
    ls.setItem(LEGACY, JSON.stringify([task({ text: 'legacy' })]));
    const env = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(env, 'initStore')();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'legacy');
  });

  it('引き継いでも旧キーは残る', async function () {
    const ls = makeLocalStorage();
    ls.setItem(LEGACY, JSON.stringify([task()]));
    const env = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(env, 'initStore')();
    assert.ok(ls.getItem(LEGACY));
  });

  it('新キーがあれば旧キーより優先する', async function () {
    const ls = makeLocalStorage();
    ls.setItem(LEGACY, JSON.stringify([task({ text: 'old' })]));
    ls.setItem(K, JSON.stringify(envelope([task({ text: 'new' })], 9000)));
    const env = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(env, 'initStore')();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'new');
  });

  it('配列でないデータが入っていても [] を返す', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope({ not: 'array' }, 9000)));
    const env = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(env, 'initStore')();
    assert.sameJson(fn(env, 'getTasks')(), []);
  });

  it('壊れたデータでも起動する', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, '{{{');
    const env = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(env, 'initStore')();
    assert.sameJson(fn(env, 'getTasks')(), []);
  });
});

describe('daily-todo :: getTasks() はコピーを返す', function () {
  it('getTasks() の結果を書き換えても保存前は反映されない', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ text: 'a' })]);
    const t = fn(env, 'getTasks')();
    t[0].text = 'CHANGED';
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'a');
  });

  it('取得 → 書き換え → 保存 が反映される', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ text: 'a' })]);
    const t = fn(env, 'getTasks')();
    t[0].completed = true;
    fn(env, 'saveTasks')(t);
    await tick();
    assert.strictEqual(fn(env, 'getTasks')()[0].completed, true);
  });

  it('取得 → push → 保存 が反映される', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = fn(env, 'getTasks')();
    t.push(task({ id: 'x' }));
    fn(env, 'saveTasks')(t);
    await tick();
    assert.strictEqual(fn(env, 'getTasks')().length, 1);
  });

  it('取得 → filter で削除 → 保存 が反映される', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ id: 'a' }), task({ id: 'b' })]);
    const rest = fn(env, 'getTasks')().filter((t) => t.id !== 'a');
    fn(env, 'saveTasks')(rest);
    await tick();
    assert.sameJson(fn(env, 'getTasks')().map((t) => t.id), ['b']);
  });

  it('保存しなかった書き換えは捨てられる', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ text: 'keep' })]);
    const t = fn(env, 'getTasks')();
    t.push(task({ id: 'ghost' }));
    t[0].text = 'ghost';
    assert.strictEqual(fn(env, 'getTasks')().length, 1);
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'keep');
  });

  it('毎回別の配列が返る', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task()]);
    assert.notStrictEqual(fn(env, 'getTasks')(), fn(env, 'getTasks')());
    assert.notStrictEqual(fn(env, 'getTasks')()[0], fn(env, 'getTasks')()[0]);
  });

  it('saveTasks に渡した配列を後から触っても保存済みの値は変わらない', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [task({ text: 'saved' })];
    fn(env, 'saveTasks')(t);
    await tick();
    t[0].text = 'mutated';
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'saved');
  });
});

describe('daily-todo :: subscribe と再描画', function () {
  it('自分の保存では renderAll が呼ばれない', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    env.renders = 0;
    fn(env, 'saveTasks')([task()]);
    await tick();
    assert.strictEqual(env.renders, 0);
  });

  it('別タブの変更では renderAll が呼ばれる', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    env.renders = 0;
    env.window.dispatch('storage', {
      key: K, newValue: JSON.stringify(envelope([task({ text: 'tab' })], Date.now() + 9000))
    });
    assert.strictEqual(env.renders, 1);
  });

  it('別タブの変更後 getTasks() が新しい値を返す', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    env.window.dispatch('storage', {
      key: K, newValue: JSON.stringify(envelope([task({ text: 'tab' })], Date.now() + 9000))
    });
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'tab');
  });

  it('連続保存でも renderAll は増えない', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    env.renders = 0;
    for (let i = 0; i < 5; i++) fn(env, 'saveTasks')([task({ id: 'i' + i })]);
    await tick(20);
    assert.strictEqual(env.renders, 0);
  });

  it('リモート由来の変更で renderAll が呼ばれる', async function () {
    const rows = new Map();
    const env = loadDailyTodo({ supabase: loggedIn(rows) });
    await fn(env, 'initStore')();
    env.renders = 0;
    rows.set(OWNER + '|daily-todo|tasks', envelope([task({ text: 'remote' })], Date.now() + 60000, OWNER));
    await env.getStore()._refreshFromRemote(true);
    assert.strictEqual(env.renders, 1);
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'remote');
  });
});

describe('daily-todo :: normalizeDailyTasks', function () {
  const today = () => fn(envRef, 'todayStr')();
  let envRef = null;

  it('毎日タスクでなければ触らない', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [task({ isDaily: false, completed: true })];
    fn(env, 'normalizeDailyTasks')(t);
    assert.strictEqual(t[0].completed, true);
  });

  it('今日完了済みなら completed を立て直す', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [task({ isDaily: true, completed: false, lastCompletedDate: fn(env, 'todayStr')() })];
    fn(env, 'normalizeDailyTasks')(t);
    assert.strictEqual(t[0].completed, true);
  });

  it('日をまたいだらチェックが外れる', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [task({ isDaily: true, completed: true, lastCompletedDate: '2000-01-01' })];
    fn(env, 'normalizeDailyTasks')(t);
    assert.strictEqual(t[0].completed, false);
  });

  it('前日でなければストリークが0に戻る', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [task({ isDaily: true, streakCount: 7, lastCompletedDate: '2000-01-01' })];
    fn(env, 'normalizeDailyTasks')(t);
    assert.strictEqual(t[0].streakCount, 0);
  });

  it('昨日完了ならストリークは保たれる', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [task({ isDaily: true, streakCount: 7, lastCompletedDate: fn(env, 'yesterdayStr')() })];
    fn(env, 'normalizeDailyTasks')(t);
    assert.strictEqual(t[0].streakCount, 7);
  });

  it('変化があれば保存される', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ isDaily: true, completed: true, lastCompletedDate: '2000-01-01' })]);
    fn(env, 'normalizeDailyTasks')(fn(env, 'getTasks')());
    await tick();
    assert.strictEqual(fn(env, 'getTasks')()[0].completed, false);
  });

  it('変化が無ければ保存しない(t が動かない)', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ isDaily: false })]);
    const before = JSON.parse(env.localStorage.getItem(K)).t;
    fn(env, 'normalizeDailyTasks')(fn(env, 'getTasks')());
    await tick();
    assert.strictEqual(JSON.parse(env.localStorage.getItem(K)).t, before);
  });

  it('正規化の保存が再描画を誘発しない', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    await fn(env, 'saveTasks')([task({ isDaily: true, completed: true, lastCompletedDate: '2000-01-01' })]);
    env.renders = 0;
    fn(env, 'normalizeDailyTasks')(fn(env, 'getTasks')());
    await tick(20);
    assert.strictEqual(env.renders, 0);
  });

  it('複数の毎日タスクをまとめて正規化する', async function () {
    const env = loadDailyTodo({ supabase: null });
    await fn(env, 'initStore')();
    const t = [
      task({ id: 'a', isDaily: true, completed: true, lastCompletedDate: '2000-01-01' }),
      task({ id: 'b', isDaily: true, completed: true, lastCompletedDate: '2000-01-02' })
    ];
    fn(env, 'normalizeDailyTasks')(t);
    assert.sameJson(t.map((x) => x.completed), [false, false]);
  });
});

describe('daily-todo :: openStore スタブ(app-sync.js が無い場合)', function () {
  it('AppSync が無くても store が用意される', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    assert.ok(env.getStore());
    assert.sameJson(fn(env, 'getTasks')(), []);
  });

  it('保存と再取得ができる', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task({ text: 'stub' })]);
    await tick();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'stub');
  });

  it('app-sync と同じキーへ書く', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task()]);
    await tick();
    assert.ok(env.localStorage.getItem(K), 'appdata: キーに書かれていない');
  });

  it('app-sync と同じエンベロープ形式で書く', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task()]);
    await tick();
    const e = JSON.parse(env.localStorage.getItem(K));
    assert.sameJson(Object.keys(e).sort(), ['av', 'd', 'o', 't', 'v']);
    assert.strictEqual(e.v, 1);
    assert.strictEqual(e.o, null);
  });

  it('スタブで書いたデータを app-sync が引き継げる', async function () {
    const ls = makeLocalStorage();
    const stub = loadDailyTodo({ withoutAppSync: true, localStorage: ls, supabase: null });
    await fn(stub, 'initStore')();
    fn(stub, 'saveTasks')([task({ text: 'written by stub' })]);
    await tick();

    // 次の起動では app-sync.js が読めた、という想定
    const real = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(real, 'initStore')();
    assert.strictEqual(fn(real, 'getTasks')()[0].text, 'written by stub');
  });

  it('app-sync が書いたデータをスタブが読める', async function () {
    const ls = makeLocalStorage();
    const real = loadDailyTodo({ localStorage: ls, supabase: null });
    await fn(real, 'initStore')();
    await fn(real, 'saveTasks')([task({ text: 'written by app-sync' })]);

    const stub = loadDailyTodo({ withoutAppSync: true, localStorage: ls, supabase: null });
    await fn(stub, 'initStore')();
    assert.strictEqual(fn(stub, 'getTasks')()[0].text, 'written by app-sync');
  });

  it('旧キーからも読める', async function () {
    const ls = makeLocalStorage();
    ls.setItem(LEGACY, JSON.stringify([task({ text: 'legacy' })]));
    const env = loadDailyTodo({ withoutAppSync: true, localStorage: ls, supabase: null });
    await fn(env, 'initStore')();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'legacy');
  });

  it('スタブの get() もコピーを返す', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task({ text: 'a' })]);
    await tick();
    const t = fn(env, 'getTasks')();
    t[0].text = 'CHANGED';
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'a');
  });

  it('スタブの subscribe / flush / status が呼べる', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    const s = env.getStore();
    assert.strictEqual(typeof s.subscribe(function () {}), 'function');
    await s.flush();
    assert.sameJson(s.status(), { online: false, syncing: false, lastSyncedAt: null, error: null });
  });

  it('localStorage が書けなくてもメモリ上では動く', async function () {
    const env = loadDailyTodo({ withoutAppSync: true, supabase: null });
    await fn(env, 'initStore')();
    env.localStorage._throwOnSet = true;
    fn(env, 'saveTasks')([task({ text: 'memory only' })]);
    await tick();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'memory only');
  });

  it('AppSync.store() が例外を投げてもスタブへ落ちる', async function () {
    const env = loadDailyTodo({ supabase: null });
    env.sandbox.window.AppSync = { store: function () { throw new Error('boom'); } };
    await fn(env, 'initStore')();
    assert.ok(env.getStore());
    fn(env, 'saveTasks')([task({ text: 'fallback' })]);
    await tick();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'fallback');
  });
});

describe('daily-todo :: 同期', function () {
  it('ログイン中の保存がクラウドへ上がる', async function () {
    const sb = loggedIn();
    const env = loadDailyTodo({ supabase: sb });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task({ text: 'synced' })]);
    await tick();
    await env.getStore().flush();
    assert.strictEqual(sb._state.rows.get(OWNER + '|daily-todo|tasks').d[0].text, 'synced');
  });

  it('クラウドにあるタスクを起動時に読む', async function () {
    const rows = new Map([[OWNER + '|daily-todo|tasks', envelope([task({ text: 'cloud' })], 9000, OWNER)]]);
    const env = loadDailyTodo({ supabase: loggedIn(rows) });
    await fn(env, 'initStore')();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'cloud');
  });

  it('未ログインならローカルだけで完結する', async function () {
    const sb = makeSupabase({ session: null });
    const env = loadDailyTodo({ supabase: sb });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task()]);
    await tick(20);
    assert.strictEqual(sb._state.upserts, 0);
    assert.strictEqual(fn(env, 'getTasks')().length, 1);
  });

  it('別アカウントのローカルデータは表示しない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope([task({ text: 'other user' })], Date.now() + 99999, 'user-b')));
    const env = loadDailyTodo({ localStorage: ls, supabase: loggedIn() });
    await fn(env, 'initStore')();
    assert.sameJson(fn(env, 'getTasks')(), []);
  });

  it('クラウド保存に失敗してもローカルには残る', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertError: { message: 'down' } });
    const env = loadDailyTodo({ supabase: sb });
    await fn(env, 'initStore')();
    fn(env, 'saveTasks')([task({ text: 'kept' })]);
    await tick();
    await env.getStore().flush();
    assert.strictEqual(fn(env, 'getTasks')()[0].text, 'kept');
  });
});
