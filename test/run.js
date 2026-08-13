// 素の Node で動く極小テストランナー(依存ゼロ)。
//   node test/run.js            全部
//   node test/run.js app-sync   名前で絞り込み

const assert = require('assert');

const suites = [];
let current = null;

global.describe = function (name, fn) {
  current = { name, tests: [] };
  suites.push(current);
  fn();
  current = null;
};

global.it = function (name, fn) {
  current.tests.push({ name, fn });
};

// テスト対象は vm コンテキスト内で動くので、そこで作られた配列やオブジェクトは
// Node 側の Array/Object とは別のプロトタイプを持つ。deepStrictEqual は
// プロトタイプまで見るため、中身が同じでも落ちてしまう。
// 構造の比較は JSON に落としてから行う。
assert.sameJson = function (actual, expected, msg) {
  assert.strictEqual(
    JSON.stringify(actual), JSON.stringify(expected),
    msg || 'JSON が一致しません'
  );
};

global.assert = assert;

require('./app-sync.test.js');
require('./daily-todo.test.js');

(async function main() {
  const filter = process.argv[2];
  let pass = 0, fail = 0;
  const failures = [];

  for (const suite of suites) {
    if (filter && !suite.name.includes(filter)) continue;
    console.log('\n' + suite.name);
    for (const t of suite.tests) {
      try {
        await t.fn();
        pass++;
        console.log('  ✓ ' + t.name);
      } catch (e) {
        fail++;
        failures.push({ suite: suite.name, test: t.name, err: e });
        console.log('  ✗ ' + t.name);
      }
    }
  }

  if (failures.length) {
    console.log('\n--- failures ---');
    failures.forEach((f) => {
      console.log('\n' + f.suite + ' > ' + f.test);
      console.log('  ' + (f.err && f.err.message));
    });
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed, ' + (pass + fail) + ' total');
  process.exit(fail ? 1 : 0);
})();
