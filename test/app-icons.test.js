// app-icons.js のテスト。
// アプリ一覧のアイコンは「登録URLからフォルダ名を取り出して表を引く」だけの仕組みなので、
// URLの書かれ方が変わっても正しく引けること・引けないときは null を返すことを確かめる。

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// apps/ に実在するフォルダ名。ここに増えたアプリのアイコンが app-icons.js に
// 足されていないと、一覧でそのアプリだけ頭文字に戻ってしまう。
function appSlugsOnDisk() {
  const appsDir = path.join(__dirname, '..', 'apps');
  return fs.readdirSync(appsDir, { withFileTypes: true })
    .filter(function (e) { return e.isDirectory(); })
    .map(function (e) { return e.name; })
    .sort();
}

function loadAppIcons() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'app-icons.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.getAppIcon;
}

const BASE = 'https://8w4jgy4rp5-commits.github.io/App-Sharing-/apps/';

describe('app-icons :: getAppIcon', function () {
  const getAppIcon = loadAppIcons();

  it('本番の登録URL(末尾スラッシュ)からアイコンを引ける', function () {
    const icon = getAppIcon(BASE + 'idea-notebook/');
    assert.ok(icon, 'アイコンが見つからなかった');
    assert.strictEqual(icon.colorClass, 'app-avatar-c0');
    assert.ok(icon.svg.startsWith('<svg '), 'svg要素になっていない');
    assert.ok(icon.svg.endsWith('</svg>'), 'svg要素が閉じていない');
  });

  it('index.html 付きのURLでも引ける', function () {
    // forgetful-tracker は実際にこの形で登録されている
    assert.ok(getAppIcon(BASE + 'forgetful-tracker/index.html'));
  });

  it('相対URLでも引ける', function () {
    assert.ok(getAppIcon('apps/qr-generator/'));
  });

  it('リネーム前の company-watchlist はUS版のアイコンを返す', function () {
    const oldIcon = getAppIcon(BASE + 'company-watchlist/');
    const usIcon = getAppIcon(BASE + 'company-watchlist-us/');
    assert.ok(oldIcon);
    assert.strictEqual(oldIcon.svg, usIcon.svg);
    assert.strictEqual(oldIcon.colorClass, usIcon.colorClass);
  });

  it('日本版と米国版は同じ絵で色だけ違う', function () {
    const jp = getAppIcon(BASE + 'company-watchlist-jp/');
    const us = getAppIcon(BASE + 'company-watchlist-us/');
    assert.strictEqual(jp.svg, us.svg);
    assert.notStrictEqual(jp.colorClass, us.colorClass);
  });

  it('知らないアプリ・外部URL・空の値では null を返す(頭文字に戻す)', function () {
    assert.strictEqual(getAppIcon(BASE + 'no-such-app/'), null);
    assert.strictEqual(getAppIcon('https://example.com/my-app/'), null);
    assert.strictEqual(getAppIcon(''), null);
    assert.strictEqual(getAppIcon(null), null);
    assert.strictEqual(getAppIcon(undefined), null);
  });

  it('apps/ にある全アプリのアイコンが揃っている', function () {
    const missing = appSlugsOnDisk().filter(function (slug) {
      return !getAppIcon(BASE + slug + '/');
    });
    assert.strictEqual(missing.join(', '), '', 'アイコン未登録のアプリがある');
  });

  it('色は style.css にある4色のどれか', function () {
    const allowed = ['app-avatar-c0', 'app-avatar-c1', 'app-avatar-c2', 'app-avatar-c3'];
    appSlugsOnDisk().forEach(function (slug) {
      const icon = getAppIcon(BASE + slug + '/');
      assert.ok(allowed.indexOf(icon.colorClass) !== -1, slug + ' の色が想定外: ' + icon.colorClass);
    });
  });
});
