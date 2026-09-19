// forgetful-tracker の「毎日くりかえす」仕組みのテスト。
//
// このアプリの肝は、ユーザーが何も操作しなくても翌日また鳴ることと、
// 日付が変わるとチェックが自動で外れること。つまり時刻と日付の計算が
// 全ての土台なので、そこを実ファイルから読み込んで直接確かめる。
//
// クライアント(apps/forgetful-tracker/script.js)とサーバー
// (supabase/functions/forgetful-tracker-push/index.ts)は同じreminderの
// notify_atを別々に進めるため、両者の計算が一致していないと通知時刻が
// 少しずつずれていく。最後のブロックでその一致を実コードどうしで突き合わせる。

const fs = require('fs');
const path = require('path');
const { loadForgetfulTracker } = require('./harness');

const DAY = 24 * 60 * 60 * 1000;

// アプリが実際に書き込む形(秒とミリ秒は0)のタイムスタンプを作る
function stamp(offsetMs) {
  const d = new Date(Date.now() + offsetMs);
  d.setSeconds(0, 0);
  return d.getTime();
}

function hhmmOf(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function item(over) {
  return Object.assign({
    id: 'i1', name: 'Umbrella', time: '07:30',
    notifyAt: stamp(DAY), forgottenCount: 0,
    checked: false, checkedOn: null, lastNotifiedOn: null, paused: false,
    createdAt: 1
  }, over || {});
}

// store の偽物。渡した配列をそのまま保持する。
function makeStore(items) {
  let data = JSON.parse(JSON.stringify(items));
  return {
    get: () => JSON.parse(JSON.stringify(data)),
    set: (v) => { data = JSON.parse(JSON.stringify(v)); return Promise.resolve(); },
    subscribe: () => () => {},
    flush: () => Promise.resolve(),
    status: () => ({ online: false, syncing: false, lastSyncedAt: null, error: null }),
    peek: () => data
  };
}

function withItems(items) {
  const env = loadForgetfulTracker();
  const store = makeStore(items);
  env.setStore(store);
  return { env, store };
}

// サーバー側(Edge Function)の nextOccurrence を実ファイルから取り出す。
// 型注釈だけ落として素のJSとして評価するので、サーバーの計算が変われば
// このテストが落ちる。
function loadServerNextOccurrence() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'functions', 'forgetful-tracker-push', 'index.ts'),
    'utf8'
  );
  const m = src.match(/function nextOccurrence[\s\S]*?\n}/);
  if (!m) throw new Error('index.ts から nextOccurrence を取り出せませんでした');
  const js = m[0]
    .replace(/:\s*string\s*\|\s*null/g, '')
    .replace(/\)\s*:\s*string\s*\{/, ') {');
  return new Function('DAY_MS', js + '\nreturn nextOccurrence;')(DAY);
}

describe('forgetful-tracker :: 時刻の計算', function () {
  it('次の予定時刻は必ず未来になる', function () {
    const { env } = withItems([]);
    ['00:00', '07:30', '12:00', '23:59'].forEach(function (hhmm) {
      assert.ok(env.call('computeNotifyAt', hhmm) > Date.now(), hhmm + ' が未来でない');
    });
  });

  it('指定した時刻そのものが保たれる', function () {
    const { env } = withItems([]);
    ['00:00', '07:30', '12:00', '23:59'].forEach(function (hhmm) {
      assert.strictEqual(hhmmOf(env.call('computeNotifyAt', hhmm)), hhmm);
    });
  });

  it('次の予定時刻は24時間以内に来る', function () {
    const { env } = withItems([]);
    ['00:00', '07:30', '12:00', '23:59'].forEach(function (hhmm) {
      assert.ok(env.call('computeNotifyAt', hhmm) - Date.now() <= DAY + 1000, hhmm);
    });
  });

  it('秒とミリ秒は必ず0になる', function () {
    // サーバーは「+24時間」で進めるので、秒が入ると両者がずれる
    const { env } = withItems([]);
    ['00:00', '07:30', '23:59'].forEach(function (hhmm) {
      const d = new Date(env.call('computeNotifyAt', hhmm));
      assert.strictEqual(d.getSeconds(), 0, hhmm + ' の秒が0でない');
      assert.strictEqual(d.getMilliseconds(), 0, hhmm + ' のミリ秒が0でない');
    });
  });

  it('壊れた時刻でも落ちず、未来を返す', function () {
    const { env } = withItems([]);
    [undefined, null, '', 'abc', '99:99:99'].forEach(function (bad) {
      const at = env.call('computeNotifyAt', bad);
      assert.ok(isFinite(at) && at > Date.now(), String(bad));
    });
  });
});

describe('forgetful-tracker :: 翌日への繰り越し', function () {
  it('予定時刻を過ぎると「今日鳴った」印が付く', function () {
    const firedAt = stamp(-60 * 1000);
    const { env, store } = withItems([item({ time: hhmmOf(firedAt), notifyAt: firedAt })]);
    env.call('rollOverDaily');
    assert.strictEqual(store.peek()[0].lastNotifiedOn, env.call('todayKey'));
  });

  it('予定時刻が翌日へ進む', function () {
    const firedAt = stamp(-60 * 1000);
    const { env, store } = withItems([item({ time: hhmmOf(firedAt), notifyAt: firedAt })]);
    env.call('rollOverDaily');
    const next = store.peek()[0].notifyAt;
    assert.ok(next > Date.now(), '未来になっていない');
    assert.ok(Math.abs(next - firedAt - DAY) < 2000, '約24時間後になっていない');
  });

  it('何日も開かなかった分を溜め込まず、次の1回だけにする', function () {
    const staleAt = stamp(-5 * DAY);
    const { env, store } = withItems([item({ time: hhmmOf(staleAt), notifyAt: staleAt })]);
    env.call('rollOverDaily');
    const it0 = store.peek()[0];
    assert.ok(it0.notifyAt > Date.now());
    assert.ok(it0.notifyAt - Date.now() <= DAY + 2000, '次の1回に畳まれていない');
  });

  it('5日前に鳴った分は「今日鳴った」扱いにしない', function () {
    const staleAt = stamp(-5 * DAY);
    const { env, store } = withItems([item({ time: hhmmOf(staleAt), notifyAt: staleAt })]);
    env.call('rollOverDaily');
    assert.notStrictEqual(store.peek()[0].lastNotifiedOn, env.call('todayKey'));
  });

  it('20秒ごとに呼ばれても2回目以降は何も変えない', function () {
    const firedAt = stamp(-60 * 1000);
    const { env, store } = withItems([item({ time: hhmmOf(firedAt), notifyAt: firedAt })]);
    env.call('rollOverDaily');
    const after = JSON.stringify(store.peek());
    env.call('rollOverDaily');
    env.call('rollOverDaily');
    assert.strictEqual(JSON.stringify(store.peek()), after);
  });

  it('notifyAt が欠けていても補われる', function () {
    const { env, store } = withItems([item({ notifyAt: undefined })]);
    env.call('rollOverDaily');
    assert.ok(store.peek()[0].notifyAt > Date.now());
  });
});

describe('forgetful-tracker :: チェックの自動リセット', function () {
  it('日付が変わったらチェックが外れる', function () {
    const { env, store } = withItems([item({ checked: true, checkedOn: '2020-01-01' })]);
    env.call('rollOverDaily');
    const it0 = store.peek()[0];
    assert.strictEqual(it0.checked, false);
    assert.strictEqual(it0.checkedOn, null);
  });

  it('同じ日のチェックは残る', function () {
    const env0 = loadForgetfulTracker();
    const today = env0.call('todayKey');
    const { env, store } = withItems([item({ checked: true, checkedOn: today })]);
    env.call('rollOverDaily');
    assert.strictEqual(store.peek()[0].checked, true);
  });

  it('チェックを付けると今日の日付が記録される', function () {
    const { env, store } = withItems([item({ id: 'x1' })]);
    env.call('toggleChecked', 'x1');
    const it0 = store.peek()[0];
    assert.strictEqual(it0.checked, true);
    assert.strictEqual(it0.checkedOn, env.call('todayKey'));
  });

  it('チェックを外すと日付も消える', function () {
    const { env, store } = withItems([item({ id: 'x1', checked: true, checkedOn: '2020-01-01' })]);
    env.call('toggleChecked', 'x1');
    assert.strictEqual(store.peek()[0].checkedOn, null);
  });
});

describe('forgetful-tracker :: 休止', function () {
  it('休止中は予定時刻が進まない', function () {
    const past = stamp(-60 * 1000);
    const { env, store } = withItems([item({ notifyAt: past, paused: true })]);
    env.call('rollOverDaily');
    assert.strictEqual(store.peek()[0].notifyAt, past);
  });

  it('休止中は「鳴った」印も付かない', function () {
    const { env, store } = withItems([item({ notifyAt: stamp(-60 * 1000), paused: true })]);
    env.call('rollOverDaily');
    assert.strictEqual(store.peek()[0].lastNotifiedOn, null);
  });

  it('再開すると次の予定時刻が未来に入る', function () {
    const { env, store } = withItems([item({ id: 'x1', notifyAt: stamp(-5 * DAY), paused: true })]);
    env.call('togglePaused', 'x1');
    const it0 = store.peek()[0];
    assert.strictEqual(it0.paused, false);
    assert.ok(it0.notifyAt > Date.now());
  });

  it('休止すると paused が立つ', function () {
    const { env, store } = withItems([item({ id: 'x1' })]);
    env.call('togglePaused', 'x1');
    assert.strictEqual(store.peek()[0].paused, true);
  });
});

describe('forgetful-tracker :: 旧データの移行', function () {
  it('恒久フラグの notified を捨てる', function () {
    const { env, store } = withItems([{
      id: 'old1', name: 'Wallet', time: '08:00', notifyAt: stamp(DAY),
      forgottenCount: 2, checked: false, notified: true, createdAt: 1
    }]);
    env.call('rollOverDaily');
    assert.ok(!('notified' in store.peek()[0]), 'notified が残っている');
  });

  it('paused を false で補う', function () {
    const { env, store } = withItems([{
      id: 'old1', name: 'Wallet', time: '08:00', notifyAt: stamp(DAY),
      forgottenCount: 2, checked: false, notified: true, createdAt: 1
    }]);
    env.call('rollOverDaily');
    assert.strictEqual(store.peek()[0].paused, false);
  });

  it('忘れた回数は保たれる', function () {
    const { env, store } = withItems([{
      id: 'old1', name: 'Wallet', time: '08:00', notifyAt: stamp(DAY),
      forgottenCount: 2, checked: false, notified: true, createdAt: 1
    }]);
    env.call('rollOverDaily');
    assert.strictEqual(store.peek()[0].forgottenCount, 2);
  });
});

describe('forgetful-tracker :: 通知の案内に出す時刻', function () {
  it('休止中を除いたいちばん早い時刻を選ぶ', function () {
    const { env } = withItems([]);
    const list = [
      { time: '09:15', paused: false },
      { time: '06:40', paused: true },
      { time: '07:05', paused: false }
    ];
    assert.strictEqual(env.call('earliestActiveTime', list), '07:05');
  });

  it('全部休止なら null', function () {
    const { env } = withItems([]);
    assert.strictEqual(env.call('earliestActiveTime', [{ time: '08:00', paused: true }]), null);
  });

  it('持ち物が無ければ null', function () {
    const { env } = withItems([]);
    assert.strictEqual(env.call('earliestActiveTime', []), null);
  });
});

describe('forgetful-tracker :: サーバーとの繰り越し一致', function () {
  it('サーバーの nextOccurrence を index.ts から取り出せる', function () {
    assert.strictEqual(typeof loadServerNextOccurrence(), 'function');
  });

  it('同じreminderに対して両者が同じ次回時刻を出す', function () {
    // 夏時間の無い地域では、クライアントの再計算とサーバーの+24時間が一致する。
    // ずれるとアプリを開いた瞬間に通知時刻が飛ぶので、ここを固定しておく。
    const nextOccurrence = loadServerNextOccurrence();
    const { env } = withItems([]);
    const firedAt = stamp(-60 * 1000);
    const serverNext = new Date(nextOccurrence(new Date(firedAt).toISOString())).getTime();
    const clientNext = env.call('computeNotifyAt', hhmmOf(firedAt));
    assert.ok(
      Math.abs(serverNext - clientNext) < 2000,
      'server ' + new Date(serverNext).toString() + ' / client ' + new Date(clientNext).toString()
    );
  });

  it('サーバー側も溜まった分を次の1回に畳む', function () {
    const nextOccurrence = loadServerNextOccurrence();
    const next = new Date(nextOccurrence(new Date(stamp(-5 * DAY)).toISOString())).getTime();
    assert.ok(next > Date.now());
    assert.ok(next - Date.now() <= DAY + 2000);
  });

  it('サーバー側は notify_at が空でも未来を返す', function () {
    const nextOccurrence = loadServerNextOccurrence();
    assert.ok(new Date(nextOccurrence(null)).getTime() > Date.now());
  });

  it('サーバーは送信後も notified を false のままにする(翌日また鳴らすため)', function () {
    // notified: true に戻すと、アプリを開かない人には二度と届かなくなる。
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'functions', 'forgetful-tracker-push', 'index.ts'),
      'utf8'
    );
    const after = src.slice(src.indexOf('成功・失敗どちらでも'));
    assert.ok(after.includes('notify_at: nextOccurrence('), '送信後にnotify_atを進めていない');
    assert.ok(after.includes('notified: false'), '送信後にnotifiedをfalseへ戻していない');
  });
});
