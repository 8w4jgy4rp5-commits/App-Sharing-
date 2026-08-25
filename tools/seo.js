// ミニアプリが検索から見つかるようにするための生成スクリプト。
//
//   node tools/seo.js
//
// やること:
//   1. apps/ の各アプリの <head> に説明文・正規URL・OGPを入れる（アプリ名は各自の<title>から）
//   2. 各アプリの末尾に CobbleWorks へ戻るリンクを入れる
//   3. apps.html（JavaScript無しで全アプリへリンクする一覧）を作る
//   4. sitemap.xml と robots.txt を作る
//
// 何度実行しても同じ結果になる（目印コメントを見て、すでに入っていれば置き換える）。
// アプリを追加したら、このスクリプトを実行し直すこと。

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://8w4jgy4rp5-commits.github.io/App-Sharing-/';
const OG_IMAGE = BASE + 'og-image.jpg';

// HTMLから良い説明文が取り出せないアプリを、ここで補う。
// 検索結果に同じ説明文が並ぶと評価が下がるので、似ているアプリ同士は必ず書き分ける。
const DESCRIPTION_OVERRIDES = {
  'fan-activity-tracker':
    'Track what you spend on fan activities — idols, artists, athletes — or just your everyday spending.',
  // UIの断片しか拾えないもの
  'qr-generator':
    'Turn any text or link into a QR code and download it as an image. Free, and nothing leaves your browser.',
  'unit-converter':
    'Convert length, weight, temperature and volume in one place. Free, and it keeps working offline.',
  // 対になっているアプリ同士（説明文が同じにならないよう書き分ける）
  'company-watchlist-us':
    'Track the US-listed companies you are watching — notes, status and ticker, with a link straight to the price.',
  'company-watchlist-jp':
    'Track the Japan-listed companies you are watching — notes, status and securities code, with a link to the price.',
  // サブタイトルが155字を超えて途中で切れてしまうもの
  'investment-report':
    'Keep one research report per company — the basics up top, then dated notes you add as you learn more.',
  'flashcards-en':
    'Build your own English flashcards, then flip each card to check the definition and an example sentence.',
  'flashcards-es':
    'Build your own Spanish flashcards, then flip each card to check the meaning and an example sentence.'
};

// 説明文として拾ってはいけない段落（注意書きや、最初は隠れている文言）
const SKIP_PARAGRAPH_CLASSES = /auth-note|empty-note|guide-text|error|hint|disclaimer/;

const START = '<!-- cobbleworks:seo:start -->';
const END = '<!-- cobbleworks:seo:end -->';
const FOOTER_START = '<!-- cobbleworks:footer:start -->';
const FOOTER_END = '<!-- cobbleworks:footer:end -->';

// HTMLから読んだ文字列は &amp; のような実体参照を含む。
// これを戻さずに escapeHtml すると、実行のたびに &amp;amp;amp; と増えていくので、
// 変化しなくなるまで戻してから使う（すでに壊れているタイトルもこれで直る）。
function unescapeHtml(text) {
  let before;
  let after = text;
  do {
    before = after;
    after = before
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0*39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  } while (after !== before);
  return after;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 検索結果に収まる長さ（およそ155文字）で、単語の途中で切らないように短くする
function trimForSearch(text) {
  const clean = unescapeHtml(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 155);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:—-]$/, '') + '…';
}

function readAppName(html, slug) {
  const title = html.match(/<title>([^<]+)<\/title>/);
  if (title) return unescapeHtml(title[1]).replace(/\s*\|\s*CobbleWorks\s*$/, '').trim();
  return slug;
}

function readAppDescription(html, slug) {
  if (DESCRIPTION_OVERRIDES[slug]) return DESCRIPTION_OVERRIDES[slug];

  const subtitle = html.match(/<p[^>]*data-i18n="subtitle"[^>]*>([^<]{10,})<\/p>/);
  if (subtitle) return subtitle[1];

  // 見出し直後の説明文らしい段落を探す（注意書き・隠し要素は除く）
  const paragraphs = html.matchAll(/<p([^>]*)>([^<]{25,200})<\/p>/g);
  for (const p of paragraphs) {
    const attrs = p[1];
    if (/hidden/.test(attrs)) continue;
    if (SKIP_PARAGRAPH_CLASSES.test(attrs)) continue;
    return p[2];
  }
  return null;
}

// <head> の中の生成ブロックを入れ替える（無ければ </head> の直前に足す）
// 差し込むブロックは自前の字下げを持っているので、すでに入っている分は
// 行頭の空白ごと置き換える。そうしないと実行のたびに字下げが2文字ずつ深くなり、
// 中身は同じなのに毎回差分が出てしまう。
function replaceBlock(html, startMarker, endMarker, block, closingTag) {
  const existing = new RegExp('[ \\t]*' + startMarker + '[\\s\\S]*?' + endMarker);
  if (existing.test(html)) return html.replace(existing, block);
  return html.replace(closingTag, block + '\n  ' + closingTag);
}

function applyHeadBlock(html, block) {
  return replaceBlock(html, START, END, block, '</head>');
}

function applyFooter(html, block) {
  return replaceBlock(html, FOOTER_START, FOOTER_END, block, '</body>');
}

const appDirs = fs
  .readdirSync(path.join(ROOT, 'apps'))
  .filter(function (dir) {
    return fs.existsSync(path.join(ROOT, 'apps', dir, 'index.html'));
  })
  .sort();

const catalog = [];
const problems = [];

appDirs.forEach(function (slug) {
  const file = path.join(ROOT, 'apps', slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');

  const name = readAppName(html, slug);
  const rawDescription = readAppDescription(html, slug);

  if (!rawDescription) {
    problems.push(slug + ': 説明文が見つからないので DESCRIPTION_OVERRIDES に追記が必要');
    return;
  }

  const description = trimForSearch(rawDescription);
  const url = BASE + 'apps/' + slug + '/';
  const pageTitle = name + ' | CobbleWorks';

  // タイトルは毎回組み立て直す（すでに " | CobbleWorks" が付いていても二重にならない）
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(pageTitle) + '</title>');

  const head = [
    '  ' + START,
    '    <meta name="description" content="' + escapeHtml(description) + '" />',
    '    <link rel="canonical" href="' + url + '" />',
    '    <link rel="stylesheet" href="../../app-footer.css" />',
    '    <meta property="og:type" content="website" />',
    '    <meta property="og:title" content="' + escapeHtml(name) + '" />',
    '    <meta property="og:description" content="' + escapeHtml(description) + '" />',
    '    <meta property="og:url" content="' + url + '" />',
    '    <meta property="og:image" content="' + OG_IMAGE + '" />',
    '    <meta name="twitter:card" content="summary_large_image" />',
    '  ' + END
  ].join('\n');

  const footer = [
    '  ' + FOOTER_START,
    '    <footer class="cw-footer">',
    '      <a href="../../">Made on CobbleWorks — browse other mini apps</a>',
    '    </footer>',
    '  ' + FOOTER_END
  ].join('\n');

  html = applyHeadBlock(html, head);
  html = applyFooter(html, footer);

  fs.writeFileSync(file, html);
  catalog.push({ slug: slug, name: name, description: description, url: url });
});

// --- apps.html: JavaScriptを使わない静的なアプリ一覧 ---------------------------

const listItems = catalog
  .map(function (app) {
    return [
      '        <li class="all-apps-item">',
      '          <a class="all-apps-link" href="apps/' + app.slug + '/">' + escapeHtml(app.name) + '</a>',
      '          <p class="all-apps-text">' + escapeHtml(app.description) + '</p>',
      '        </li>'
    ].join('\n');
  })
  .join('\n');

const appsHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>All mini apps | CobbleWorks</title>
    <meta name="description" content="Every free mini app on CobbleWorks — ${catalog.length} small, focused tools that each solve one everyday problem. No sign-up needed to try them." />
    <link rel="canonical" href="${BASE}apps.html" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="All mini apps | CobbleWorks" />
    <meta property="og:description" content="Every free mini app on CobbleWorks — ${catalog.length} small, focused tools that each solve one everyday problem." />
    <meta property="og:url" content="${BASE}apps.html" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <link rel="stylesheet" href="tokens.css" />
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <!-- このページは tools/seo.js が生成する。直接編集しても次の実行で上書きされる。
         JavaScriptを一切使わずに全アプリへリンクするのが目的（検索エンジンにたどってもらうため）。 -->
    <header>
      <div class="header-top">
        <div class="site-logo">
          <span class="logo-mark" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" opacity="0.85" />
            </svg>
          </span>
          <div class="site-logo-text">
            <h1>All mini apps</h1>
            <p>Every small, free tool built on CobbleWorks.</p>
          </div>
        </div>
      </div>

      <!-- 全ページ共通の移動タブ。このページはJavaScript無しで動くので、印は静的に付けている -->
      <nav class="site-nav" aria-label="Main">
        <a href="index.html" class="site-nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.5V20h13V9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Home</span>
        </a>
        <a href="requests.html" class="site-nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-3.8 3.2c-.45.38-1.13.06-1.13-.53V16H4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Requests</span>
        </a>
        <a href="apps.html" class="site-nav-item" aria-current="page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" stroke-width="2"/></svg>
          <span>Mini Apps</span>
        </a>
        <a href="profile.html" class="site-nav-item site-nav-item--mobile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="2"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>You</span>
        </a>
      </nav>
    </header>

    <main>
      <section>
        <h2>${catalog.length} mini apps</h2>
        <p class="data-note">
          Each one solves a single everyday problem, and none of them need an account to try.
        </p>

        <ul class="all-apps-list">
${listItems}
        </ul>
      </section>
    </main>
  </body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'apps.html'), appsHtml);

// --- sitemap.xml / robots.txt -------------------------------------------------

const pages = [BASE, BASE + 'apps.html', BASE + 'requests.html'].concat(
  catalog.map(function (app) {
    return app.url;
  })
);

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages
    .map(function (url) {
      return '  <url><loc>' + url + '</loc></url>';
    })
    .join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

fs.writeFileSync(
  path.join(ROOT, 'robots.txt'),
  ['User-agent: *', 'Allow: /', '', 'Sitemap: ' + BASE + 'sitemap.xml', ''].join('\n')
);

// --- 結果 ---------------------------------------------------------------------

console.log('アプリ ' + catalog.length + '/' + appDirs.length + ' 件を更新');
console.log('apps.html / sitemap.xml (' + pages.length + ' URL) / robots.txt を書き出し');
if (problems.length) {
  console.log('\n要対応:');
  problems.forEach(function (p) {
    console.log('  - ' + p);
  });
  process.exitCode = 1;
}
