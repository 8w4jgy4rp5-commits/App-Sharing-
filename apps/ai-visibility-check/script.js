// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'aiVisibilityCheck:checks:v1';

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

/* ------------------------------------------------------------------
   採点ルール
   ------------------------------------------------------------------ */

// 中身のない売り文句。多いほど「何のサービスか分からないページ」になる。
const BUZZWORDS = [
  'all-in-one', 'all in one', 'unlock', 'revolutionize', 'revolutionise', 'revolutionary',
  'cutting-edge', 'cutting edge', 'next-generation', 'next generation', 'seamless', 'empower',
  'leverage', 'game-changing', 'game changer', 'world-class', 'best-in-class', 'synergy',
  'disrupt', 'supercharge', 'unleash', 'next level', 'take your', 'effortless', 'one-stop',
  'state-of-the-art', 'reimagine', 'elevate your'
];

// カテゴリごとの「人が実際に検索する言葉」
const CATEGORY_TERMS = {
  saas: ['software', 'app', 'tool', 'dashboard', 'saas', 'web app'],
  mobile: ['app', 'iphone', 'android', 'ios', 'mobile'],
  physical: ['buy', 'shop', 'shipping', 'order', 'product', 'size'],
  service: ['service', 'agency', 'consult', 'freelance', 'we work with', 'clients'],
  course: ['course', 'lesson', 'ebook', 'workshop', 'learn', 'chapter'],
  marketplace: ['marketplace', 'community', 'members', 'sellers', 'buyers', 'directory'],
  other: ['tool', 'service', 'product', 'app', 'kit']
};

const CATEGORY_LABELS = {
  saas: 'web software',
  mobile: 'mobile app',
  physical: 'physical product',
  service: 'service business',
  course: 'course or paid content',
  marketplace: 'marketplace or community',
  other: 'product'
};

function hasAny(text, list) {
  for (let i = 0; i < list.length; i++) {
    if (text.indexOf(list[i]) !== -1) return true;
  }
  return false;
}

function countAny(text, list) {
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    if (text.indexOf(list[i]) !== -1) n++;
  }
  return n;
}

// 10項目。1項目10点。fix の {name} {audience} {terms} は表示時に差し替える。
const CHECKS = [
  {
    id: 'plain',
    title: 'Says plainly what it is',
    good: 'One flat sentence tells a reader what this actually is.',
    fix: 'Open with a plain sentence: "{name} is a ___ that helps {audience} do ___." Cut the lines that could describe any company.',
    test: function (c) {
      const plain = /\b(is an? |helps you|lets you|so you can|makes it easy|use it to|we make|we build)/.test(c.text);
      return plain && countAny(c.text, BUZZWORDS) <= 2;
    }
  },
  {
    id: 'audience',
    title: 'Names who it is for',
    good: 'The page says out loud who should be buying this.',
    fix: 'Add "Built for {audience}" near the top. An assistant matches products to the person asking, so say who that is.',
    test: function (c) {
      if (/\b(built for|designed for|made for|perfect for|for teams|for people who|if you)\b/.test(c.text)) return true;
      return c.audienceWords.some(function (w) { return c.text.indexOf(w) !== -1; });
    }
  },
  {
    id: 'terms',
    title: 'Uses the words people search with',
    good: 'You use the everyday category words, so you land in the right aisle.',
    fix: 'Use the plain category word at least once — for example {terms}. "Platform" on its own tells nobody what aisle you are in.',
    test: function (c) { return hasAny(c.text, CATEGORY_TERMS[c.category] || CATEGORY_TERMS.other); }
  },
  {
    id: 'pricing',
    title: 'Pricing is on the page',
    good: 'Someone can find out what it costs without emailing you.',
    fix: 'Put a number on the page — a price, a free plan, or "from $9 a month". Products with no visible price get skipped in "best value" answers.',
    test: function (c) {
      return /(\$|€|£|¥)\s?\d|\d+\s?(usd|eur|gbp|yen)|\bpricing\b|\bfree plan\b|\bfree tier\b|\bfree trial\b|\bper month\b|\bper user\b|\/mo\b|\bstarts at\b|\bpay once\b/.test(c.text);
    }
  },
  {
    id: 'comparison',
    title: 'Compares itself to the alternatives',
    good: 'You already say how you differ from the obvious alternatives.',
    fix: 'Write one honest "{name} vs [competitor]" section. Comparison text is what gets quoted when someone asks which one to pick.',
    test: function (c) {
      return /\bvs\b|\bversus\b|\balternative/.test(c.text) || /\bcompared to\b|\bcomparison\b|\bswitch from\b|\bdifference between\b|\binstead of\b/.test(c.text);
    }
  },
  {
    id: 'questions',
    title: 'Answers real questions',
    good: 'There is question-and-answer text an assistant can lift directly.',
    fix: 'Add an FAQ using the five questions you keep answering by email, written as questions. Answers in that shape get reused word for word.',
    test: function (c) {
      if (/\bfaq\b|frequently asked|common questions/.test(c.text)) return true;
      return (c.raw.match(/\?/g) || []).length >= 3;
    }
  },
  {
    id: 'proof',
    title: 'Shows proof you can point to',
    good: 'There is evidence here beyond your own adjectives.',
    fix: 'Add one real customer quote with a name, or a real number of users. One named example beats ten adjectives.',
    test: function (c) {
      return /\breview|\btestimonial|\btrusted by\b|\bcase stud|\brating|\bcustomers\b|\d[\d,.]*\s?(k|m|\+)?\s?(users|customers|teams|downloads|members|businesses)/.test(c.text);
    }
  },
  {
    id: 'specifics',
    title: 'Gives specifics, not adjectives',
    good: 'There are concrete facts here, not only promises.',
    fix: 'Add hard facts — limits, sizes, how long it takes, what is included. A page with no specifics cannot be summarised.',
    test: function (c) { return (c.raw.match(/\d+/g) || []).length >= 4; }
  },
  {
    id: 'fit',
    title: 'Says where and how it works',
    good: 'A reader can tell whether it fits their setup.',
    fix: 'List what it runs on and what it connects to — browser, iPhone, Shopify, exports to CSV. "Works with ___" is how people phrase the question.',
    test: function (c) {
      return /\bintegrat|\bapi\b|\bchrome\b|\bios\b|\bandroid\b|\bwindows\b|\bmac\b|\bslack\b|\bshopify\b|\bwordpress\b|\bzapier\b|\bworks with\b|\bimport\b|\bexport\b|\boffline\b|\bbrowser\b/.test(c.text);
    }
  },
  {
    id: 'depth',
    title: 'Has more than one page to read',
    good: 'You point at other pages, so there is something to read past the pitch.',
    fix: 'Publish a few real pages — a guide, docs, a changelog, an about page. One thin homepage gives an assistant almost nothing to go on.',
    test: function (c) {
      return /\bblog\b|\bdocs\b|documentation|\bguide|\btutorial|\bchangelog\b|help cent|knowledge base|case stud|\bpress\b|about us|\bsupport\b/.test(c.text);
    }
  }
];

/* ------------------------------------------------------------------
   チャネル(宣伝先)の候補
   base は カテゴリ別の基礎点、gaps は「その項目が不合格なら加点」
   ------------------------------------------------------------------ */

const CHANNELS = [
  {
    id: 'directories',
    name: 'Get listed where products are compared',
    why: 'When someone asks for "the best tool for X", the answer is usually built from directories and review sites, not from your homepage.',
    step: 'Claim a free listing on AlternativeTo and one review site (G2, Capterra or the equivalent in your field), then ask three happy customers for a review.',
    base: { saas: 46, mobile: 42, marketplace: 38, physical: 26, service: 24, course: 20, other: 26 },
    gaps: { proof: 12, depth: 8 }
  },
  {
    id: 'comparison',
    name: 'Write your own comparison pages',
    why: '"X vs Y" pages are the most quoted kind of page there is, because that is exactly the question people ask.',
    step: 'Pick your two best-known competitors and publish one page each. Be honest about what they do better — that is what makes the page worth quoting.',
    base: { saas: 40, mobile: 34, physical: 30, course: 28, service: 26, marketplace: 28, other: 28 },
    gaps: { comparison: 22 }
  },
  {
    id: 'forums',
    name: 'Answer questions where your buyers already ask',
    why: 'Forum and Reddit threads are read, ranked and summarised constantly. A genuinely useful answer there keeps working for years.',
    step: 'Find three threads this week where somebody describes the problem you solve. Answer properly first; mention {name} only where it honestly fits.',
    base: { saas: 38, service: 36, course: 34, marketplace: 34, mobile: 30, physical: 24, other: 30 }
  },
  {
    id: 'faqpages',
    name: 'Turn your FAQ into its own pages',
    why: 'Question-shaped pages match question-shaped prompts almost word for word.',
    step: 'Take the five questions you answer most often and give each one its own short page with a direct answer in the first paragraph.',
    base: { saas: 26, mobile: 24, physical: 26, service: 26, course: 26, marketplace: 24, other: 26 },
    gaps: { questions: 20, terms: 8 }
  },
  {
    id: 'producthunt',
    name: 'Launch on Product Hunt',
    why: 'A launch page is a dated, third-party record that you exist — cheap to get and widely indexed.',
    step: 'Prepare a one-line description, three screenshots and a short demo clip, then launch on a Tuesday or Wednesday.',
    base: { saas: 32, mobile: 32, marketplace: 28, physical: 14, course: 12, service: 8, other: 14 }
  },
  {
    id: 'video',
    name: 'Post a short demo video',
    why: 'Video titles and transcripts are text too, and "how to do X" searches send people straight to them.',
    step: 'Record 60 seconds of the product doing the one thing people hire it for. Title it with the task, not your product name.',
    base: { physical: 38, mobile: 32, course: 30, saas: 24, marketplace: 24, service: 20, other: 24 }
  },
  {
    id: 'linkedin',
    name: 'Post as yourself on LinkedIn',
    why: 'For anything sold to businesses, a named founder posting regularly is the cheapest trust you can build.',
    step: 'Write one post a week about a problem you solved for a customer. No links in the post itself — put them in the first comment.',
    base: { service: 38, saas: 26, course: 26, marketplace: 18, mobile: 14, physical: 12, other: 18 },
    b2bBonus: 14
  },
  {
    id: 'newsletter',
    name: 'Sponsor or guest-write a niche newsletter',
    why: 'Small newsletters in your exact niche reach the buyer directly and usually leave a public archive page behind.',
    step: 'Find three newsletters your customers already read. Offer a useful guest piece first; buy a slot only if that goes well.',
    base: { course: 30, service: 26, physical: 26, saas: 24, marketplace: 22, mobile: 20, other: 24 }
  },
  {
    id: 'store',
    name: 'List it in the store people already browse',
    why: 'App stores and platform marketplaces come with built-in search traffic and public review counts.',
    step: 'Publish in the store that fits — App Store, Google Play, Chrome Web Store, Shopify, Notion — and write the listing around the task, not the features.',
    base: { mobile: 40, saas: 22, marketplace: 20, physical: 16, course: 12, service: 6, other: 12 }
  },
  {
    id: 'partners',
    name: 'Partner with someone who already has your audience',
    why: 'One mention from a person your buyers already trust does more than a month of posting alone.',
    step: 'List five people or small companies serving the same customers without competing with you. Offer one of them something useful before asking for anything.',
    base: { physical: 30, course: 30, marketplace: 26, service: 26, saas: 24, mobile: 22, other: 24 },
    b2bBonus: 6
  }
];

const B2B_WORDS = [
  'business', 'team', 'company', 'companies', 'agency', 'b2b', 'enterprise', 'startup',
  'founder', 'marketer', 'developer', 'freelanc', 'saas', 'manager', 'client', 'shop owner',
  'store owner', 'recruit', 'sales', 'accountant', 'consultant'
];

/* ------------------------------------------------------------------
   採点の本体
   ------------------------------------------------------------------ */

function analyse(input) {
  const raw = input.pageText;
  const text = raw.toLowerCase();
  const audienceLower = input.audience.toLowerCase();

  const ctx = {
    raw: raw,
    text: text,
    category: input.category,
    audienceWords: audienceLower.split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4; })
  };

  const checks = CHECKS.map(function (check) {
    let pass = false;
    try { pass = !!check.test(ctx); } catch (e) { console.error(e); }
    return { id: check.id, pass: pass };
  });

  const score = checks.filter(function (c) { return c.pass; }).length * 10;
  const b2b = hasAny(audienceLower + ' ' + text, B2B_WORDS);

  return {
    name: input.name,
    url: input.url,
    category: input.category,
    audience: input.audience,
    b2b: b2b,
    score: score,
    checks: checks,
    date: new Date().toISOString()
  };
}

function bandFor(score) {
  if (score >= 90) return 'Clear. Now go and get mentioned elsewhere.';
  if (score >= 70) return 'Readable. A few gaps are still costing you.';
  if (score >= 40) return 'Half readable. An assistant would hesitate to name you.';
  return 'Hard to place. Right now you are easy to leave out.';
}

function rankChannels(result) {
  const failed = {};
  result.checks.forEach(function (c) { if (!c.pass) failed[c.id] = true; });

  const scored = CHANNELS.map(function (channel, index) {
    let points = channel.base[result.category] || channel.base.other || 0;
    if (channel.gaps) {
      Object.keys(channel.gaps).forEach(function (id) {
        if (failed[id]) points += channel.gaps[id];
      });
    }
    if (channel.b2bBonus && result.b2b) points += channel.b2bBonus;
    return { channel: channel, points: points, index: index };
  });

  scored.sort(function (a, b) {
    if (b.points !== a.points) return b.points - a.points;
    return a.index - b.index;
  });

  return scored.slice(0, 5).map(function (s) { return s.channel; });
}

function fillTemplate(template, result) {
  const terms = (CATEGORY_TERMS[result.category] || CATEGORY_TERMS.other).slice(0, 3).join(', ');
  return template
    .replace(/\{name\}/g, result.name)
    .replace(/\{audience\}/g, result.audience)
    .replace(/\{terms\}/g, terms);
}

/* ------------------------------------------------------------------
   保存データ
   ------------------------------------------------------------------ */

function getSaved() {
  if (!store) return [];
  const v = store.get();
  return Array.isArray(v) ? v : [];
}

function saveAll(list) {
  if (!store) return;
  store.set(list).catch(function (e) {
    console.error('AI Visibility Check: 保存に失敗しました', e);
  });
}

// 同じ製品名で、指定日時より前に保存された一番新しい記録を探す。
function findPrevious(name, beforeIso) {
  const key = name.trim().toLowerCase();
  const earlier = getSaved().filter(function (r) {
    return r.name.trim().toLowerCase() === key && r.date < beforeIso;
  });
  earlier.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return earlier[0] || null;
}

/* ------------------------------------------------------------------
   画面
   ------------------------------------------------------------------ */

const form = document.getElementById('scan-form');
const nameInput = document.getElementById('product-name');
const urlInput = document.getElementById('product-url');
const categoryInput = document.getElementById('category');
const audienceInput = document.getElementById('audience');
const textInput = document.getElementById('page-text');
const charCount = document.getElementById('char-count');

const results = document.getElementById('results');
const scoreValue = document.getElementById('score-value');
const scoreBand = document.getElementById('score-band');
const scoreBarFill = document.getElementById('score-bar-fill');
const scoreDelta = document.getElementById('score-delta');
const checkList = document.getElementById('check-list');
const channelList = document.getElementById('channel-list');
const planNote = document.getElementById('plan-note');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');

const savedList = document.getElementById('saved-list');
const savedEmpty = document.getElementById('saved-empty');

// 画面に出ている結果。保存ボタンが使う。
let currentResult = null;
let currentIsSaved = false;

function formatDate(iso) {
  const date = new Date(iso);
  if (isNaN(date)) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function setError(fieldId, message) {
  const box = document.getElementById('error-' + fieldId);
  const input = document.getElementById(fieldId);
  if (box) box.textContent = message;
  if (input) {
    if (message) input.classList.add('invalid');
    else input.classList.remove('invalid');
  }
}

function clearErrors() {
  ['product-name', 'product-url', 'audience', 'page-text'].forEach(function (id) { setError(id, ''); });
}

function isSafeUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function renderChecks(result) {
  checkList.textContent = '';

  CHECKS.forEach(function (check) {
    const outcome = result.checks.find(function (c) { return c.id === check.id; });
    const pass = outcome ? outcome.pass : false;

    const li = document.createElement('li');

    const dot = document.createElement('span');
    dot.className = 'check-dot ' + (pass ? 'pass' : 'gap');
    dot.textContent = pass ? '✓' : '!';
    dot.setAttribute('aria-label', pass ? 'Clear' : 'Gap');
    li.appendChild(dot);

    const body = document.createElement('div');

    const title = document.createElement('span');
    title.className = 'check-title';
    title.textContent = check.title;
    body.appendChild(title);

    const note = document.createElement('span');
    note.className = 'check-note';
    note.textContent = pass ? check.good : fillTemplate(check.fix, result);
    body.appendChild(note);

    li.appendChild(body);
    checkList.appendChild(li);
  });
}

function renderChannels(result) {
  channelList.textContent = '';

  rankChannels(result).forEach(function (channel, i) {
    const box = document.createElement('div');
    box.className = 'channel';

    const rank = document.createElement('span');
    rank.className = 'channel-rank' + (i === 0 ? '' : ' plain');
    rank.textContent = i === 0 ? 'Start here' : String(i + 1);
    box.appendChild(rank);

    const name = document.createElement('p');
    name.className = 'channel-name';
    name.textContent = channel.name;
    box.appendChild(name);

    const why = document.createElement('p');
    why.className = 'channel-why';
    why.textContent = channel.why;
    box.appendChild(why);

    const step = document.createElement('p');
    step.className = 'channel-step';
    const label = document.createElement('b');
    label.textContent = 'First step: ';
    step.appendChild(label);
    step.appendChild(document.createTextNode(fillTemplate(channel.step, result)));
    box.appendChild(step);

    channelList.appendChild(box);
  });

  planNote.textContent =
    'Ordered for a ' + (CATEGORY_LABELS[result.category] || 'product') +
    ' aimed at ' + result.audience + '. Do the first one before you think about the rest.';
}

function renderDelta(result) {
  const previous = findPrevious(result.name, result.date);
  if (!previous) {
    scoreDelta.hidden = true;
    scoreDelta.textContent = '';
    return;
  }

  const change = result.score - previous.score;
  scoreDelta.textContent = '';
  scoreDelta.classList.toggle('down', change < 0);

  if (change === 0) {
    scoreDelta.appendChild(document.createTextNode('Same as your check on ' + formatDate(previous.date) + '.'));
  } else {
    const strong = document.createElement('b');
    strong.textContent = (change > 0 ? '+' : '') + change + ' points';
    scoreDelta.appendChild(strong);
    scoreDelta.appendChild(document.createTextNode(' since ' + formatDate(previous.date) + '.'));
  }
  scoreDelta.hidden = false;
}

function showResult(result, alreadySaved) {
  currentResult = result;
  currentIsSaved = !!alreadySaved;

  scoreValue.textContent = String(result.score);
  scoreBand.textContent = bandFor(result.score);
  scoreBarFill.style.width = result.score + '%';

  renderDelta(result);
  renderChecks(result);
  renderChannels(result);

  saveBtn.textContent = currentIsSaved ? 'Saved' : 'Save this check';
  saveBtn.disabled = currentIsSaved;

  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderSaved() {
  const list = getSaved().slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  savedList.textContent = '';
  savedEmpty.hidden = list.length > 0;

  list.forEach(function (record) {
    const li = document.createElement('li');

    const main = document.createElement('div');
    main.className = 'saved-main';

    const name = document.createElement('span');
    name.className = 'saved-name';
    name.textContent = record.name;
    main.appendChild(name);

    const meta = document.createElement('span');
    meta.className = 'saved-meta';
    meta.textContent = formatDate(record.date) + ' · ' + (CATEGORY_LABELS[record.category] || 'product');
    main.appendChild(meta);

    li.appendChild(main);

    const score = document.createElement('span');
    score.className = 'saved-score';
    score.textContent = String(record.score);
    li.appendChild(score);

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'icon-btn';
    openBtn.textContent = 'Open';
    openBtn.setAttribute('aria-label', 'Open the saved check for ' + record.name);
    openBtn.addEventListener('click', function () { showResult(record, true); });
    li.appendChild(openBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete the saved check for ' + record.name);
    deleteBtn.addEventListener('click', function () {
      saveAll(getSaved().filter(function (r) { return r.id !== record.id; }));
      if (currentResult && currentResult.id === record.id) {
        currentIsSaved = false;
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save this check';
      }
      renderSaved();
    });
    li.appendChild(deleteBtn);

    savedList.appendChild(li);
  });
}

/* ------------------------------------------------------------------
   イベント
   ------------------------------------------------------------------ */

textInput.addEventListener('input', function () {
  charCount.textContent = String(textInput.value.trim().length);
});

form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearErrors();

  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  const audience = audienceInput.value.trim();
  const pageText = textInput.value.trim();
  let firstBad = null;

  if (!name) {
    setError('product-name', 'Enter the name of your product.');
    firstBad = firstBad || nameInput;
  }
  if (url && !isSafeUrl(url)) {
    setError('product-url', 'Use a full address starting with http:// or https://');
    firstBad = firstBad || urlInput;
  }
  if (!audience) {
    setError('audience', 'Say who it is for, even roughly.');
    firstBad = firstBad || audienceInput;
  }
  if (pageText.length < 80) {
    setError('page-text', 'Paste at least 80 characters from your page — there is nothing to read yet.');
    firstBad = firstBad || textInput;
  }

  if (firstBad) {
    firstBad.focus();
    return;
  }

  const result = analyse({
    name: name,
    url: url,
    category: categoryInput.value,
    audience: audience,
    pageText: pageText
  });

  showResult(result, false);
});

saveBtn.addEventListener('click', function () {
  if (!currentResult || currentIsSaved) return;

  const record = Object.assign({}, currentResult, {
    id: 'check-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
  });

  const list = getSaved();
  list.push(record);
  saveAll(list);

  currentResult = record;
  currentIsSaved = true;
  saveBtn.textContent = 'Saved';
  saveBtn.disabled = true;

  renderSaved();
});

clearBtn.addEventListener('click', function () {
  results.hidden = true;
  currentResult = null;
  currentIsSaved = false;
  form.reset();
  clearErrors();
  charCount.textContent = '0';
  nameInput.focus();
});

/* ------------------------------------------------------------------
   起動
   ------------------------------------------------------------------ */

(async function init() {
  store = await openStore('ai-visibility-check', 'checks', {
    legacyKey: LEGACY_STORAGE_KEY,
    default: [],
    version: 1
  });

  renderSaved();
  if (store.subscribe) store.subscribe(function () { renderSaved(); });
})();
