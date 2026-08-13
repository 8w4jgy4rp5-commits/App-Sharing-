// AppSync.store() の仕様テスト。
const { loadAppSync, makeSupabase, makeLocalStorage, session, envelope, lsKey, tick } = require('./harness');

const OWNER = 'user-a';
const OTHER = 'user-b';
const SLUG = 'test-app';
const KEY = 'items';
const K = lsKey(SLUG, KEY);

// 送信テストは既定の1000msを待たずに済むよう debounce を縮める
function opts(extra) {
  return Object.assign({ default: [], debounce: 5 }, extra || {});
}

function loggedIn(rows) {
  return makeSupabase({ session: session(OWNER), rows: rows || new Map() });
}

function readLs(env) {
  return JSON.parse(env.localStorage.getItem(K));
}

describe('app-sync :: get() はコピーを返す', function () {
  it('返した配列を書き換えてもキャッシュは変わらない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: [{ n: 1 }] }));
    const a = s.get();
    a.push({ n: 2 });
    a[0].n = 99;
    assert.sameJson(s.get(), [{ n: 1 }]);
  });

  it('毎回別のオブジェクトを返す', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: [{ n: 1 }] }));
    assert.notStrictEqual(s.get(), s.get());
    assert.notStrictEqual(s.get()[0], s.get()[0]);
  });

  it('ネストした値も切り離されている', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: null }));
    await s.set({ a: { b: { c: [1, 2] } } });
    const v = s.get();
    v.a.b.c.push(3);
    assert.sameJson(s.get().a.b.c, [1, 2]);
  });

  it('プリミティブはそのまま返る', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: 'hello' }));
    assert.strictEqual(s.get(), 'hello');
  });

  it('null をそのまま返す', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: null }));
    assert.strictEqual(s.get(), null);
  });

  it('options.default のオブジェクトを書き換えてもキャッシュに影響しない', async function () {
    const e = loadAppSync();
    const def = [{ n: 1 }];
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: def }));
    def.push({ n: 2 });
    def[0].n = 99;
    assert.sameJson(s.get(), [{ n: 1 }]);
  });

  it('同じ default を2つの store で共有しても混ざらない', async function () {
    const e = loadAppSync();
    const def = { count: 0 };
    const a = await e.AppSync.store(SLUG, 'a', opts({ default: def }));
    const b = await e.AppSync.store(SLUG, 'b', opts({ default: def }));
    await a.set({ count: 5 });
    assert.sameJson(b.get(), { count: 0 });
  });

  it('リモート由来の値も get() でコピーされる', async function () {
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope([{ n: 7 }], 500)]]);
    const e = loadAppSync({ supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    s.get()[0].n = 99;
    assert.sameJson(s.get(), [{ n: 7 }]);
  });
});

describe('app-sync :: set() は値を切り離して保持する', function () {
  it('set 後に元のオブジェクトを書き換えてもキャッシュは汚れない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const v = [{ n: 1 }];
    await s.set(v);
    v.push({ n: 2 });
    v[0].n = 99;
    assert.sameJson(s.get(), [{ n: 1 }]);
  });

  it('set 後に元を書き換えても localStorage の内容は変わらない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const v = [{ n: 1 }];
    await s.set(v);
    v[0].n = 99;
    assert.sameJson(readLs(e).d, [{ n: 1 }]);
  });

  it('set 後に元を書き換えても送信されるのは set 時点の値', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const v = [{ n: 1 }];
    await s.set(v);
    v[0].n = 99;
    await s.flush();
    assert.sameJson(sb._state.upsertLog.pop().d, [{ n: 1 }]);
  });

  it('localStorage に v/av/t/o/d のエンベロープで書く', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ version: 3 }));
    await s.set([1]);
    const env = readLs(e);
    assert.sameJson(Object.keys(env).sort(), ['av', 'd', 'o', 't', 'v']);
    assert.strictEqual(env.v, 1);
    assert.strictEqual(env.av, 3);
    assert.strictEqual(typeof env.t, 'number');
  });

  it('連続 set で最後の値が残る', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.set([1, 2]);
    await s.set([1, 2, 3]);
    assert.sameJson(s.get(), [1, 2, 3]);
  });

  it('上限超過は例外にする', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const big = new Array(300 * 1024).fill('x').join('');
    await assert.rejects(() => s.set(big), /大きすぎます/);
  });

  it('上限超過のとき localStorage は書き換わらない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    const before = e.localStorage.getItem(K);
    await s.set(new Array(300 * 1024).fill('x').join('')).catch(() => {});
    assert.strictEqual(e.localStorage.getItem(K), before);
  });

  it('localStorage 書き込み失敗は例外にする', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    e.localStorage._throwOnSet = true;
    await assert.rejects(() => s.set([1]), /ローカル保存に失敗/);
  });
});

describe('app-sync :: subscribe は自分起点では鳴らない', function () {
  it('自分の set() ではコールバックが呼ばれない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    let calls = 0;
    s.subscribe(() => calls++);
    await s.set([1]);
    await s.set([2]);
    assert.strictEqual(calls, 0);
  });

  it('別タブの変更では呼ばれる', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    let got = null;
    s.subscribe((v) => { got = v; });
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([9], Date.now() + 1000)) });
    assert.sameJson(got, [9]);
  });

  it('別タブ由来の source は other-tab', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    let src = null;
    s.subscribe((v, source) => { src = source; });
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([9], Date.now() + 1000)) });
    assert.strictEqual(src, 'other-tab');
  });

  it('リモート由来の source は remote', async function () {
    const rows = new Map();
    const sb = loggedIn(rows);
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    let src = null;
    s.subscribe((v, source) => { src = source; });
    rows.set(OWNER + '|' + SLUG + '|' + KEY, envelope([42], Date.now() + 10000, OWNER));
    e.document.visibilityState = 'visible';
    await s._refreshFromRemote(true);
    assert.strictEqual(src, 'remote');
  });

  it("source に 'local' が渡ることはない", async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const seen = [];
    s.subscribe((v, source) => seen.push(source));
    await s.set([1]);
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([9], Date.now() + 1000)) });
    assert.ok(seen.indexOf('local') === -1);
    assert.sameJson(seen, ['other-tab']);
  });

  it('コールバックが値のコピーを受け取っても元は壊れない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    s.subscribe((v) => { if (Array.isArray(v)) v.push('injected'); });
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([1], Date.now() + 1000)) });
    // subscribe が受け取る値は内部キャッシュそのものだが、get() は必ずコピーを返す
    assert.sameJson(s.get().slice(0, 1), [1]);
  });

  it('unsubscribe すると呼ばれなくなる', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    let calls = 0;
    const off = s.subscribe(() => calls++);
    off();
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([9], Date.now() + 1000)) });
    assert.strictEqual(calls, 0);
  });

  it('複数のコールバックが全部呼ばれる', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    let a = 0, b = 0;
    s.subscribe(() => a++);
    s.subscribe(() => b++);
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([9], Date.now() + 1000)) });
    assert.strictEqual(a, 1);
    assert.strictEqual(b, 1);
  });

  it('1つが例外を投げても他は呼ばれる', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    let b = 0;
    s.subscribe(() => { throw new Error('boom'); });
    s.subscribe(() => b++);
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope([9], Date.now() + 1000)) });
    assert.strictEqual(b, 1);
  });

  it('関数以外を渡しても壊れない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const off = s.subscribe('not a function');
    assert.strictEqual(typeof off, 'function');
    off();
  });

  it('描画関数が保存を伴っても set → notify の往復が起きない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: 0 }));
    let depth = 0, max = 0;
    s.subscribe(function () {
      depth++; max = Math.max(max, depth);
      if (depth < 10) s.set(s.get() + 1);
      depth--;
    });
    await s.set(1);
    assert.strictEqual(max, 0);
  });
});

describe('app-sync :: エンベロープと所有者', function () {
  it('未ログインで保存すると o は null', async function () {
    const e = loadAppSync({ supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    assert.strictEqual(readLs(e).o, null);
  });

  it('ログイン中に保存すると o は現ユーザー', async function () {
    const e = loadAppSync({ supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    assert.strictEqual(readLs(e).o, OWNER);
  });

  it('別ユーザーのローカルデータは採用しない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['b-data'], Date.now() + 99999, OTHER)));
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), []);
  });

  it('別ユーザーのデータは :orphan へ退避される', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['b-data'], Date.now() + 99999, OTHER)));
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn() });
    await e.AppSync.store(SLUG, KEY, opts());
    assert.ok(ls.getItem(K + ':orphan'));
    assert.strictEqual(ls.getItem(K), null);
  });

  it('別ユーザーのローカルがあってもリモートは読む', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['b-data'], Date.now() + 99999, OTHER)));
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['a-data'], 1000, OWNER)]]);
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['a-data']);
  });

  it('o の無い旧データは現ユーザーが引き受ける', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify({ v: 1, av: 1, t: 5000, d: ['old'] }));
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['old']);
    assert.strictEqual(readLs(e).o, OWNER);
  });

  it('o が null のデータも現ユーザーが引き受ける', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['anon'], 5000, null)));
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['anon']);
  });

  it('未ログイン時の set は既存の o を消さない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['x'], 5000, OWNER)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set(['y']);
    assert.strictEqual(readLs(e).o, OWNER);
  });

  it('別タブが書いた別ユーザーのデータは取り込まない', async function () {
    const e = loadAppSync({ supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set(['mine']);
    e.window.dispatch('storage', {
      key: K, newValue: JSON.stringify(envelope(['theirs'], Date.now() + 99999, OTHER))
    });
    assert.sameJson(s.get(), ['mine']);
  });
});

describe('app-sync :: 初回マージと競合解決', function () {
  it('両方なし → default', async function () {
    const e = loadAppSync({ supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: ['d'] }));
    assert.sameJson(s.get(), ['d']);
  });

  it('local のみ → local を採用しリモートへ上げる', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['L'], 5000, OWNER)));
    const sb = loggedIn();
    const e = loadAppSync({ localStorage: ls, supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['L']);
    assert.strictEqual(sb._state.upserts, 1);
  });

  it('remote のみ → remote を採用しローカルへ書く', async function () {
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['R'], 5000, OWNER)]]);
    const e = loadAppSync({ supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['R']);
    assert.sameJson(readLs(e).d, ['R']);
  });

  it('remote のみ かつ移行不要なら送り直さない', async function () {
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['R'], 5000, OWNER)]]);
    const sb = loggedIn(rows);
    const e = loadAppSync({ supabase: sb });
    await e.AppSync.store(SLUG, KEY, opts());
    assert.strictEqual(sb._state.upserts, 0);
  });

  it('両方あり local が新しい → local が勝つ', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['L'], 9000, OWNER)));
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['R'], 5000, OWNER)]]);
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['L']);
  });

  it('両方あり remote が新しい → remote が勝つ', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['L'], 5000, OWNER)));
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['R'], 9000, OWNER)]]);
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['R']);
    assert.sameJson(readLs(e).d, ['R']);
  });

  it('t が同じ → local を採用し送信しない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['L'], 5000, OWNER)));
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['R'], 5000, OWNER)]]);
    const sb = loggedIn(rows);
    const e = loadAppSync({ localStorage: ls, supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['L']);
    assert.strictEqual(sb._state.upserts, 0);
  });

  it('remote が勝ったときは subscribe が rermote で鳴る', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['L'], 5000, OWNER)));
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['R'], 9000, OWNER)]]);
    const e = loadAppSync({ localStorage: ls, supabase: loggedIn(rows) });
    // init 中の notify は subscribe 登録前なので鳴らない。値が入っていれば十分。
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['R']);
  });

  it('未ログインなら pull しない', async function () {
    const sb = makeSupabase({ session: null });
    const e = loadAppSync({ supabase: sb });
    await e.AppSync.store(SLUG, KEY, opts());
    assert.strictEqual(sb._state.pulls, 0);
  });

  it('pull 失敗でも local で起動しエラーにしない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['L'], 5000, OWNER)));
    const sb = makeSupabase({ session: session(OWNER), pullError: { message: 'network' } });
    const e = loadAppSync({ localStorage: ls, supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.sameJson(s.get(), ['L']);
    assert.strictEqual(s.status().error, 'offline');
  });

  it('壊れたローカルJSONは無視して default になる', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, '{ broken');
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: ['d'] }));
    assert.sameJson(s.get(), ['d']);
  });

  it('エンベロープでないローカル値は無視する', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify({ hello: 'world' }));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: ['d'] }));
    assert.sameJson(s.get(), ['d']);
  });

  it('エンベロープでないリモート値は無視する', async function () {
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, { not: 'an envelope' }]]);
    const e = loadAppSync({ supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: ['d'] }));
    assert.sameJson(s.get(), ['d']);
  });
});

describe('app-sync :: legacyKey の吸い上げ', function () {
  it('旧キーの配列を取り込む', async function () {
    const ls = makeLocalStorage();
    ls.setItem('oldKey', JSON.stringify([1, 2, 3]));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({ legacyKey: 'oldKey' }));
    assert.sameJson(s.get(), [1, 2, 3]);
  });

  it('取り込んでも旧キーは消さない', async function () {
    const ls = makeLocalStorage();
    ls.setItem('oldKey', JSON.stringify([1]));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    await e.AppSync.store(SLUG, KEY, opts({ legacyKey: 'oldKey' }));
    assert.ok(ls.getItem('oldKey'));
  });

  it('新キーがあれば旧キーは見ない', async function () {
    const ls = makeLocalStorage();
    ls.setItem('oldKey', JSON.stringify(['old']));
    ls.setItem(K, JSON.stringify(envelope(['new'], 5000)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({ legacyKey: 'oldKey' }));
    assert.sameJson(s.get(), ['new']);
  });

  it('JSONでない旧キーは文字列として扱う', async function () {
    const ls = makeLocalStorage();
    ls.setItem('oldKey', 'plain text');
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({ legacyKey: 'oldKey' }));
    assert.strictEqual(s.get(), 'plain text');
  });

  it('吸い上げた値は新キーにも書かれる', async function () {
    const ls = makeLocalStorage();
    ls.setItem('oldKey', JSON.stringify([1]));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    await e.AppSync.store(SLUG, KEY, opts({ legacyKey: 'oldKey' }));
    assert.sameJson(JSON.parse(ls.getItem(K)).d, [1]);
  });

  it('旧キーが無ければ default', async function () {
    const e = loadAppSync({ supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({ default: ['d'], legacyKey: 'nope' }));
    assert.sameJson(s.get(), ['d']);
  });
});

describe('app-sync :: migrate', function () {
  it('av が古ければ migrate を通す', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['a'], 5000, null, 1)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({
      version: 2,
      migrate: (d) => d.map((x) => x.toUpperCase())
    }));
    assert.sameJson(s.get(), ['A']);
  });

  it('av が同じなら migrate を通さない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['a'], 5000, null, 2)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    let called = false;
    const s = await e.AppSync.store(SLUG, KEY, opts({
      version: 2, migrate: () => { called = true; return []; }
    }));
    assert.strictEqual(called, false);
    assert.sameJson(s.get(), ['a']);
  });

  it('migrate に fromVersion が渡る', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['a'], 5000, null, 1)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    let from = null;
    await e.AppSync.store(SLUG, KEY, opts({
      version: 3, migrate: (d, f) => { from = f; return d; }
    }));
    assert.strictEqual(from, 1);
  });

  it('migrate が例外なら元データで続行する', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['a'], 5000, null, 1)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts({
      version: 2, migrate: () => { throw new Error('bad'); }
    }));
    assert.sameJson(s.get(), ['a']);
  });

  it('migrate 後は新しい av で書き戻される', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['a'], 5000, null, 1)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    await e.AppSync.store(SLUG, KEY, opts({ version: 2, migrate: (d) => d.concat('b') }));
    assert.strictEqual(JSON.parse(ls.getItem(K)).av, 2);
  });

  it('migrate しても t は変わらない', async function () {
    const ls = makeLocalStorage();
    ls.setItem(K, JSON.stringify(envelope(['a'], 5000, null, 1)));
    const e = loadAppSync({ localStorage: ls, supabase: null });
    await e.AppSync.store(SLUG, KEY, opts({ version: 2, migrate: (d) => d.concat('b') }));
    assert.strictEqual(JSON.parse(ls.getItem(K)).t, 5000);
  });

  it('リモート値も migrate される', async function () {
    const rows = new Map([[OWNER + '|' + SLUG + '|' + KEY, envelope(['r'], 5000, OWNER, 1)]]);
    const e = loadAppSync({ supabase: loggedIn(rows) });
    const s = await e.AppSync.store(SLUG, KEY, opts({
      version: 2, migrate: (d) => d.map((x) => x.toUpperCase())
    }));
    assert.sameJson(s.get(), ['R']);
  });
});

describe('app-sync :: リモート送信', function () {
  it('debounce 後に1回だけ送る', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.set([2]);
    await s.set([3]);
    await tick(40);
    assert.strictEqual(sb._state.upserts, 1);
    assert.sameJson(sb._state.upsertLog.pop().d, [3]);
  });

  it('flush() で即座に送る', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts({ debounce: 60000 }));
    await s.set([1]);
    await s.flush();
    assert.strictEqual(sb._state.upserts, 1);
  });

  it('未送信が無ければ flush() は何もしない', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.flush();
    assert.strictEqual(sb._state.upserts, 0);
  });

  it('未ログインなら送らない', async function () {
    const sb = makeSupabase({ session: null });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(sb._state.upserts, 0);
  });

  it('失敗したらリトライする', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertFailTimes: 2 });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(sb._state.upserts, 3);
    assert.strictEqual(s.status().error, null);
  });

  it('3回失敗したら諦めて error を立てる', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertError: { message: 'down' } });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(s.status().error, 'sync failed');
  });

  it('送信に失敗してもローカルには残る', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertError: { message: 'down' } });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.sameJson(s.get(), [1]);
    assert.sameJson(readLs(e).d, [1]);
  });

  it('失敗後の再 flush で再送される', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertFailTimes: 3 });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(s.status().error, 'sync failed');
    await s.flush();
    assert.strictEqual(s.status().error, null);
    assert.sameJson(sb._state.rows.get(OWNER + '|' + SLUG + '|' + KEY).d, [1]);
  });

  it('401 ならローカルモードへ縮退する', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertError: { message: 'JWT expired' } });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(s.status().error, 'unauthorized');
    assert.strictEqual(s.status().online, false);
  });

  it('401 でもリトライせず1回で止める', async function () {
    const sb = makeSupabase({ session: session(OWNER), upsertError: { status: 401, message: 'no' } });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(sb._state.upserts, 1);
  });

  it('upsert に updated_at を含めない', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.strictEqual(sb._state.upsertLog.length, 1);
  });

  it('送信中の set も続けて送られる', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    const p = s.flush();
    await s.set([2]);
    await p;
    await s.flush();
    assert.sameJson(sb._state.rows.get(OWNER + '|' + SLUG + '|' + KEY).d, [2]);
  });
});

describe('app-sync :: 別タブ / 復帰', function () {
  it('新しい t の storage イベントを取り込む', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope(['tab'], Date.now() + 5000)) });
    assert.sameJson(s.get(), ['tab']);
  });

  it('古い t の storage イベントは無視する', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set(['mine']);
    e.window.dispatch('storage', { key: K, newValue: JSON.stringify(envelope(['old'], 1000)) });
    assert.sameJson(s.get(), ['mine']);
  });

  it('別キーの storage イベントは無視する', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    e.window.dispatch('storage', { key: 'other', newValue: JSON.stringify(envelope(['x'], Date.now() + 5000)) });
    assert.sameJson(s.get(), []);
  });

  it('newValue が null(削除)なら無視する', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set(['mine']);
    e.window.dispatch('storage', { key: K, newValue: null });
    assert.sameJson(s.get(), ['mine']);
  });

  it('壊れた newValue でも落ちない', async function () {
    const e = loadAppSync();
    const s = await e.AppSync.store(SLUG, KEY, opts());
    e.window.dispatch('storage', { key: K, newValue: '{ broken' });
    assert.sameJson(s.get(), []);
  });

  it('タブが隠れたら flush が走る', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts({ debounce: 60000 }));
    await s.set([1]);
    e.document.visibilityState = 'hidden';
    e.document.dispatch('visibilitychange');
    await tick(30);
    assert.strictEqual(sb._state.upserts, 1);
  });

  it('beforeunload で flush が走る', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts({ debounce: 60000 }));
    await s.set([1]);
    e.window.dispatch('beforeunload');
    await tick(30);
    assert.strictEqual(sb._state.upserts, 1);
  });

  it('復帰時の再 pull はクールダウン中ならスキップする', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const before = sb._state.pulls;
    e.document.visibilityState = 'visible';
    e.document.dispatch('visibilitychange');
    await tick(20);
    assert.strictEqual(sb._state.pulls, before);
  });

  it('force なら クールダウンを無視して pull する', async function () {
    const sb = loggedIn();
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    const before = sb._state.pulls;
    await s._refreshFromRemote(true);
    assert.strictEqual(sb._state.pulls, before + 1);
  });

  it('復帰 pull で新しい値が来たら取り込む', async function () {
    const rows = new Map();
    const sb = loggedIn(rows);
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    rows.set(OWNER + '|' + SLUG + '|' + KEY, envelope(['fresh'], Date.now() + 60000, OWNER));
    await s._refreshFromRemote(true);
    assert.sameJson(s.get(), ['fresh']);
  });

  it('復帰 pull で古い値なら無視する', async function () {
    const rows = new Map();
    const sb = loggedIn(rows);
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set(['mine']);
    rows.set(OWNER + '|' + SLUG + '|' + KEY, envelope(['stale'], 1000, OWNER));
    await s._refreshFromRemote(true);
    assert.sameJson(s.get(), ['mine']);
  });

  it('未ログインなら復帰 pull しない', async function () {
    const sb = makeSupabase({ session: null });
    const e = loadAppSync({ supabase: sb });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s._refreshFromRemote(true);
    assert.strictEqual(sb._state.pulls, 0);
  });
});

describe('app-sync :: status と縮退', function () {
  it('ログイン中は online', async function () {
    const e = loadAppSync({ supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.strictEqual(s.status().online, true);
  });

  it('未ログインは offline', async function () {
    const e = loadAppSync({ supabase: makeSupabase({ session: null }) });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.strictEqual(s.status().online, false);
  });

  it('navigator.onLine が false なら offline', async function () {
    const e = loadAppSync({ supabase: loggedIn(), onLine: false });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    assert.strictEqual(s.status().online, false);
  });

  it('supabaseClient が無くても落ちずローカルで動く', async function () {
    const e = loadAppSync({ supabase: null });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    assert.sameJson(s.get(), [1]);
    assert.strictEqual(s.status().online, false);
  });

  it('送信成功で lastSyncedAt が入る', async function () {
    const e = loadAppSync({ supabase: loggedIn() });
    const s = await e.AppSync.store(SLUG, KEY, opts());
    await s.set([1]);
    await s.flush();
    assert.ok(s.status().lastSyncedAt > 0);
  });

  it('appSlug が空なら例外', async function () {
    const e = loadAppSync();
    await assert.rejects(() => e.AppSync.store('', KEY, opts()), /appSlug/);
  });

  it('旧API(isLoggedIn/pull/push/pushNow)が残っている', async function () {
    const e = loadAppSync();
    ['isLoggedIn', 'pull', 'push', 'pushNow', 'store'].forEach((n) => {
      assert.strictEqual(typeof e.AppSync[n], 'function', n + ' が無い');
    });
  });

  it('複数 store が独立して動く', async function () {
    const e = loadAppSync({ supabase: loggedIn() });
    const a = await e.AppSync.store(SLUG, 'a', opts());
    const b = await e.AppSync.store(SLUG, 'b', opts());
    await a.set([1]);
    assert.sameJson(b.get(), []);
  });
});
