// ===========================
// Bring List
// 集まりで「誰が何を持ってくるか」を1画面で決めるアプリ。
//
// 2つのモードがある。画面の描き方は同じで、データの出し入れだけ差し替える。
//   local  … URLに合言葉が無いとき。自分のブラウザだけ(ログイン不要・オフラインOK)
//   shared … #l=<リストID>&k=<合言葉> 付きで開いたとき。クラウドの同じリストを
//             全員で読み書きする。合言葉はリクエストヘッダ x-list-token に載せ、
//             Supabase 側の RLS が「その行だけ」に絞る(0034_bring_list.sql)
// ===========================

// AppSync.store() のインスタンス(local モード用)。起動時に初期化される。
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

// 自分の名前だけは端末ごとの設定。同期させると他の端末に他人の名前が入ってしまう。
const MY_NAME_KEY = 'bringList:myName:v1';

const MAX_EVENT = 70;
const MAX_ITEM = 60;
const MAX_NOTE = 80;
const MAX_PERSON = 30;
const MAX_ROWS = 60;
const POLL_MS = 8000;

// 画面の状態
let view = { event: '', items: [] }; // 描画はいつもこれを見る
let link = null;                     // 共有モードなら { id, token }
let cloud = null;                    // 合言葉ヘッダ付きの Supabase クライアント
let cloudBroken = false;             // クラウドに届かないとき true
let claimingId = null;               // 名前入力を開いている行
let armedDeleteId = null;            // 「もう一度押すと削除」状態の行
let armedTimer = null;
let eventTimer = null;
let toastTimer = null;
let pollTimer = null;
let busy = false;                    // 通信中の二重送信よけ

// -----------------------
// 要素
// -----------------------
const eventInput = document.getElementById('f-event');
const hero = document.getElementById('hero');
const heroEvent = document.getElementById('hero-event');
const heroBig = document.getElementById('hero-big');
const heroSmall = document.getElementById('hero-small');
const emptyState = document.getElementById('empty-state');
const list = document.getElementById('items');
const addForm = document.getElementById('add-form');
const itemInput = document.getElementById('f-item');
const noteInput = document.getElementById('f-note');
const itemError = document.getElementById('e-item');
const noteError = document.getElementById('e-note');
const copyBtn = document.getElementById('copy-btn');
const shareOffer = document.getElementById('share-offer');
const shareLive = document.getElementById('share-live');
const shareBtn = document.getElementById('share-btn');
const shareLink = document.getElementById('share-link');
const shareCopy = document.getElementById('share-copy');
const shareLeave = document.getElementById('share-leave');
const shareProblem = document.getElementById('share-problem');
const toast = document.getElementById('toast');

// -----------------------
// 共有リンク
// -----------------------

// #l=<uuid>&k=<合言葉> を読む。形が違うものは無視する。
function readLink() {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const id = params.get('l');
  const token = params.get('k');
  if (!id || !token) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  if (token.length < 20 || token.length > 100 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  return { id: id, token: token };
}

function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let out = '';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function linkUrl(l) {
  return location.origin + location.pathname + '#l=' + l.id + '&k=' + l.token;
}

// 合言葉をヘッダに載せた専用クライアントを作る。
function openCloud(token) {
  if (typeof supabase === 'undefined' || typeof SUPABASE_URL === 'undefined') return null;
  try {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { 'x-list-token': token } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (e) {
    console.error('Bring List: クラウドに接続できません', e);
    return null;
  }
}

function showProblem(message) {
  cloudBroken = true;
  shareProblem.textContent = message;
  shareProblem.hidden = false;
}

function clearProblem() {
  cloudBroken = false;
  shareProblem.hidden = true;
  shareProblem.textContent = '';
}

// -----------------------
// データ: local モード
// -----------------------

function localRead() {
  const raw = store ? store.get() : null;
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    event: typeof data.event === 'string' ? data.event : '',
    items: Array.isArray(data.items) ? data.items : []
  };
}

function localWrite(data) {
  if (!store) return Promise.resolve();
  return store.set(data).catch(function (e) {
    console.error('Bring List: 保存に失敗しました', e);
    showToast('Could not save. Try again.');
  });
}

function makeId() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// -----------------------
// データ: shared モード
// -----------------------

async function cloudLoad() {
  if (!cloud || !link) return;
  const listResult = await cloud.from('bring_lists').select('event').eq('id', link.id).maybeSingle();
  if (listResult.error) throw listResult.error;
  if (!listResult.data) {
    showProblem('This shared list is gone, or the link is wrong. Check the link you were sent.');
    return;
  }
  const itemsResult = await cloud
    .from('bring_list_items')
    .select('id, name, note, claimed_by, sort_key')
    .eq('list_id', link.id)
    .order('sort_key', { ascending: true });
  if (itemsResult.error) throw itemsResult.error;

  clearProblem();
  view = {
    event: listResult.data.event || '',
    items: (itemsResult.data || []).map(function (row) {
      return { id: row.id, name: row.name, note: row.note || '', claimedBy: row.claimed_by || null };
    })
  };
}

// クラウドの操作をまとめて包む。失敗しても画面が固まらないようにする。
async function withCloud(work, failMessage) {
  if (busy) return false;
  busy = true;
  try {
    await work();
    await cloudLoad();
    renderAll();
    return true;
  } catch (e) {
    console.error('Bring List:', e);
    showProblem(failMessage + ' (' + (e && e.message ? e.message : 'unknown error') + ')');
    showToast(failMessage);
    return false;
  } finally {
    busy = false;
  }
}

// -----------------------
// 読み書きの入り口(モードで切り替わる)
// -----------------------

async function refresh() {
  if (link) {
    try {
      await cloudLoad();
    } catch (e) {
      console.error('Bring List:', e);
      showProblem('Could not reach the shared list. It may not be set up yet, or you are offline.');
    }
  } else {
    view = localRead();
  }
  renderAll();
}

async function setEvent(name) {
  if (link) {
    await withCloud(async function () {
      const r = await cloud.from('bring_lists').update({ event: name }).eq('id', link.id);
      if (r.error) throw r.error;
    }, 'Could not save the event name.');
    return;
  }
  const data = localRead();
  data.event = name;
  await localWrite(data);
  view = data;
  renderHero(view);
}

async function addItem(name, note) {
  if (link) {
    return withCloud(async function () {
      const r = await cloud.from('bring_list_items').insert({
        list_id: link.id, name: name, note: note, sort_key: Date.now()
      });
      if (r.error) throw r.error;
    }, 'Could not add that to the shared list.');
  }
  const data = localRead();
  data.items.push({ id: makeId(), name: name, note: note, claimedBy: null, createdAt: Date.now() });
  await localWrite(data);
  await refresh();
  return true;
}

async function claimItem(id, person) {
  if (link) {
    let taken = false;
    const ok = await withCloud(async function () {
      // 誰かに先を越されていたら 0 件更新になる(is null の条件で守る)
      const r = await cloud
        .from('bring_list_items')
        .update({ claimed_by: person })
        .eq('id', id)
        .eq('list_id', link.id)
        .is('claimed_by', null)
        .select('id');
      if (r.error) throw r.error;
      taken = !r.data || r.data.length === 0;
    }, 'Could not claim that one.');
    if (ok) {
      writeMyName(person);
      showToast(taken ? 'Someone else just took that one.' : 'Thanks — your name is on it.');
    }
    return;
  }
  const data = localRead();
  const item = data.items.find(function (x) { return x.id === id; });
  if (!item) return;
  item.claimedBy = person;
  await localWrite(data);
  writeMyName(person);
  await refresh();
  showToast('Thanks — you are down for ' + item.name + '.');
}

async function releaseItem(id) {
  if (link) {
    const ok = await withCloud(async function () {
      const r = await cloud.from('bring_list_items')
        .update({ claimed_by: null }).eq('id', id).eq('list_id', link.id);
      if (r.error) throw r.error;
    }, 'Could not free that one up.');
    if (ok) showToast('That is open again.');
    return;
  }
  const data = localRead();
  const item = data.items.find(function (x) { return x.id === id; });
  if (!item) return;
  item.claimedBy = null;
  await localWrite(data);
  await refresh();
  showToast('That is open again.');
}

async function removeItem(id) {
  armedDeleteId = null;
  if (armedTimer) clearTimeout(armedTimer);
  if (claimingId === id) claimingId = null;

  if (link) {
    const ok = await withCloud(async function () {
      const r = await cloud.from('bring_list_items').delete().eq('id', id).eq('list_id', link.id);
      if (r.error) throw r.error;
    }, 'Could not remove that one.');
    if (ok) showToast('Removed from the list.');
    return;
  }
  const data = localRead();
  data.items = data.items.filter(function (x) { return x.id !== id; });
  await localWrite(data);
  await refresh();
  showToast('Removed from the list.');
}

function readMyName() {
  try {
    const value = localStorage.getItem(MY_NAME_KEY);
    return typeof value === 'string' ? value : '';
  } catch (e) {
    return '';
  }
}

function writeMyName(name) {
  try { localStorage.setItem(MY_NAME_KEY, name); } catch (e) {}
}

// -----------------------
// 入力チェック(追加フォーム)
// -----------------------

function clearAddErrors() {
  [[itemInput, itemError, 'h-item', 'e-item'], [noteInput, noteError, 'h-note', 'e-note']]
    .forEach(function (pair) {
      pair[1].hidden = true;
      pair[1].textContent = '';
      pair[0].removeAttribute('aria-invalid');
      pair[0].setAttribute('aria-describedby', pair[2]);
    });
}

function showFieldError(input, errorEl, hintId, errorId, message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', hintId + ' ' + errorId);
}

addForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  clearAddErrors();

  const name = itemInput.value.trim();
  const note = noteInput.value.trim();
  let bad = null;

  if (name === '') {
    showFieldError(itemInput, itemError, 'h-item', 'e-item', 'Write what is needed, like "Paper plates".');
    bad = bad || itemInput;
  } else if (name.length > MAX_ITEM) {
    showFieldError(itemInput, itemError, 'h-item', 'e-item', 'Keep it to ' + MAX_ITEM + ' characters or fewer.');
    bad = bad || itemInput;
  } else if (view.items.some(function (item) { return item.name.trim().toLowerCase() === name.toLowerCase(); })) {
    showFieldError(itemInput, itemError, 'h-item', 'e-item', 'That is already on the list.');
    bad = bad || itemInput;
  } else if (view.items.length >= MAX_ROWS) {
    showFieldError(itemInput, itemError, 'h-item', 'e-item', 'This list already has ' + MAX_ROWS + ' things on it.');
    bad = bad || itemInput;
  }

  if (note.length > MAX_NOTE) {
    showFieldError(noteInput, noteError, 'h-note', 'e-note', 'Keep the notes to ' + MAX_NOTE + ' characters or fewer.');
    bad = bad || noteInput;
  }

  if (bad) {
    bad.focus();
    return;
  }

  const ok = await addItem(name, note);
  if (ok === false) return;
  addForm.reset();
  itemInput.focus();
  showToast('Added to the list.');
});

// -----------------------
// イベント名
// -----------------------

eventInput.addEventListener('input', function () {
  if (eventTimer) clearTimeout(eventTimer);
  // 1文字ごとに保存すると通信が忙しくなるので、少し待ってからまとめて保存する
  eventTimer = setTimeout(function () {
    setEvent(eventInput.value.trim().slice(0, MAX_EVENT));
  }, 500);
});

// -----------------------
// 削除の身構え
// -----------------------

function armDelete(id) {
  armedDeleteId = id;
  if (armedTimer) clearTimeout(armedTimer);
  armedTimer = setTimeout(function () {
    armedDeleteId = null;
    renderAll();
  }, 4000);
  renderAll();
}

// -----------------------
// 表示
// -----------------------

function renderHero(data) {
  const total = data.items.length;
  const claimed = data.items.filter(function (item) { return item.claimedBy; }).length;
  const open = total - claimed;

  heroEvent.textContent = data.event;

  if (total === 0) {
    hero.classList.remove('is-done');
    heroBig.textContent = 'Nothing on the list yet';
    heroSmall.textContent = 'Add the first thing below.';
    return;
  }

  if (open === 0) {
    hero.classList.add('is-done');
    heroBig.textContent = 'All sorted';
    heroSmall.textContent = total === 1 ? '1 thing, and it has a name on it' : total + ' things, all claimed';
    return;
  }

  hero.classList.remove('is-done');
  heroBig.textContent = open === 1 ? '1 still open' : open + ' still open';
  heroSmall.textContent = claimed + ' of ' + total + ' already sorted';
}

// 名前を入れる小さいフォームを作る
function buildClaimForm(item) {
  const wrap = document.createElement('div');
  wrap.className = 'claim-form';

  const inputId = 'claim-input-' + item.id;
  const errorId = 'claim-error-' + item.id;

  const label = document.createElement('label');
  label.setAttribute('for', inputId);
  label.textContent = 'Your name';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = inputId;
  input.maxLength = MAX_PERSON;
  input.autocomplete = 'off';
  input.placeholder = 'Aya';
  input.value = readMyName();

  const error = document.createElement('p');
  error.className = 'error';
  error.id = errorId;
  error.hidden = true;

  const actions = document.createElement('div');
  actions.className = 'claim-actions';

  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn-claim';
  save.textContent = 'Save';

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn-quiet';
  cancel.textContent = 'Cancel';

  function fail(message) {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorId);
    input.focus();
  }

  function submit() {
    const person = input.value.trim();
    if (person === '') return fail('Type the name to put on this line.');
    if (person.length > MAX_PERSON) return fail('Keep the name to ' + MAX_PERSON + ' characters or fewer.');
    claimingId = null;
    claimItem(item.id, person);
  }

  save.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
  cancel.addEventListener('click', function () {
    claimingId = null;
    renderAll();
  });

  actions.appendChild(save);
  actions.appendChild(cancel);
  wrap.appendChild(label);
  wrap.appendChild(input);
  wrap.appendChild(error);
  wrap.appendChild(actions);
  return { wrap: wrap, input: input };
}

function buildRow(item) {
  const li = document.createElement('li');

  const main = document.createElement('div');
  main.className = 'item-main';

  const text = document.createElement('div');
  text.className = 'item-text';

  const name = document.createElement('span');
  name.className = 'item-name';
  name.textContent = item.name;
  text.appendChild(name);

  if (item.claimedBy) {
    const who = document.createElement('span');
    who.className = 'item-who';
    who.textContent = item.claimedBy + ' is bringing this';
    text.appendChild(who);
  } else if (item.note) {
    const note = document.createElement('span');
    note.className = 'item-note';
    note.textContent = item.note;
    text.appendChild(note);
  }

  main.appendChild(text);

  if (item.claimedBy) {
    // 誰が持ってくるかは緑の文字で分かるので、ここは「外す」ボタンにする
    const free = document.createElement('button');
    free.type = 'button';
    free.className = 'btn-quiet';
    free.textContent = 'Free it up';
    const freeSr = document.createElement('span');
    freeSr.className = 'sr-only';
    freeSr.textContent = ' — ' + item.name;
    free.appendChild(freeSr);
    free.addEventListener('click', function () { releaseItem(item.id); });
    main.appendChild(free);
  } else {
    const claim = document.createElement('button');
    claim.type = 'button';
    claim.className = 'btn-claim';
    claim.textContent = "I'll bring it";
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ' — ' + item.name;
    claim.appendChild(sr);
    claim.addEventListener('click', function () {
      claimingId = item.id;
      renderAll();
    });
    main.appendChild(claim);
  }

  // 消すボタンは行の右端に小さく置く。1回目は身構え、2回目で消える。
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn-icon';
  const armed = armedDeleteId === item.id;
  if (armed) del.classList.add('is-armed');
  del.setAttribute('aria-label', armed ? 'Press again to remove ' + item.name : 'Remove ' + item.name);
  const cross = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  cross.setAttribute('viewBox', '0 0 24 24');
  cross.setAttribute('aria-hidden', 'true');
  const crossPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  crossPath.setAttribute('d', 'M6 6l12 12M18 6L6 18');
  crossPath.setAttribute('stroke', 'currentColor');
  crossPath.setAttribute('stroke-width', '2.4');
  crossPath.setAttribute('stroke-linecap', 'round');
  cross.appendChild(crossPath);
  del.appendChild(cross);
  del.addEventListener('click', function () {
    if (armedDeleteId === item.id) removeItem(item.id);
    else {
      armDelete(item.id);
      showToast('Press the cross again to remove ' + item.name + '.');
    }
  });
  main.appendChild(del);

  li.appendChild(main);

  // 担当が決まっている行でも、メモは下に残しておく
  if (item.claimedBy && item.note) {
    const note = document.createElement('p');
    note.className = 'item-note';
    note.style.margin = '4px 0 0';
    note.textContent = item.note;
    li.appendChild(note);
  }

  let claimInput = null;
  if (claimingId === item.id && !item.claimedBy) {
    const form = buildClaimForm(item);
    li.appendChild(form.wrap);
    claimInput = form.input;
  }

  return { li: li, claimInput: claimInput };
}

function renderShare() {
  if (link) {
    shareOffer.hidden = true;
    shareLive.hidden = false;
    shareLink.value = linkUrl(link);
  } else {
    shareOffer.hidden = false;
    shareLive.hidden = true;
  }
}

// 保存のたびに呼ぶ、唯一の再描画の入口。
function renderAll() {
  // 入力中に上書きすると打った字が消えるので、触っていないときだけ入れ直す
  if (document.activeElement !== eventInput) eventInput.value = view.event;

  renderHero(view);
  renderShare();

  list.textContent = '';
  emptyState.hidden = view.items.length > 0;

  let focusTarget = null;
  view.items.forEach(function (item) {
    const row = buildRow(item);
    list.appendChild(row.li);
    if (row.claimInput) focusTarget = row.claimInput;
  });

  if (focusTarget) {
    focusTarget.focus();
    focusTarget.select();
  }
}

// -----------------------
// チャットに貼るためのテキスト
// -----------------------

function buildText(data) {
  const lines = [];
  lines.push(data.event || 'Bring List');

  const claimed = data.items.filter(function (item) { return item.claimedBy; });
  const open = data.items.filter(function (item) { return !item.claimedBy; });

  lines.push('');
  claimed.forEach(function (item) {
    lines.push('[x] ' + item.name + (item.note ? ' (' + item.note + ')' : '') + ' - ' + item.claimedBy);
  });
  open.forEach(function (item) {
    lines.push('[ ] ' + item.name + (item.note ? ' (' + item.note + ')' : ''));
  });
  lines.push('');
  lines.push(open.length === 0
    ? 'Everything is sorted.'
    : open.length + ' still open of ' + data.items.length + '.');

  if (link) {
    lines.push('');
    lines.push(linkUrl(link));
  }

  return lines.join('\n');
}

// クリップボードは環境によって使えないので、古いやり方も用意しておく
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    if (ok) resolve();
    else reject(new Error('copy failed'));
  });
}

copyBtn.addEventListener('click', function () {
  if (view.items.length === 0) {
    showToast('Add something to the list first.');
    return;
  }
  copyText(buildText(view)).then(function () {
    showToast('Copied. Paste it into your chat.');
  }).catch(function () {
    showToast('This browser would not let the page copy.');
  });
});

// -----------------------
// 共有リストを作る / やめる
// -----------------------

shareBtn.addEventListener('click', async function () {
  if (busy) return;
  const token = makeToken();
  const client = openCloud(token);
  if (!client) {
    showProblem('The page could not load the cloud part, so it cannot share right now. Check your connection and reload.');
    return;
  }

  busy = true;
  shareBtn.disabled = true;
  try {
    const created = await client
      .from('bring_lists')
      .insert({ token: token, event: view.event })
      .select('id')
      .single();
    if (created.error) throw created.error;

    const rows = view.items.slice(0, MAX_ROWS).map(function (item, index) {
      return {
        list_id: created.data.id,
        name: item.name,
        note: item.note || '',
        claimed_by: item.claimedBy || null,
        sort_key: index
      };
    });
    if (rows.length > 0) {
      const inserted = await client.from('bring_list_items').insert(rows);
      if (inserted.error) throw inserted.error;
    }

    cloud = client;
    link = { id: created.data.id, token: token };
    history.replaceState(null, '', linkUrl(link));
    clearProblem();
    startPolling();
    await refresh();
    showToast('Shared. Send the link to everyone.');
  } catch (e) {
    console.error('Bring List:', e);
    showProblem('Could not create the shared list. If this is the first time, the database part may not be set up yet. (' + (e && e.message ? e.message : 'unknown error') + ')');
  } finally {
    busy = false;
    shareBtn.disabled = false;
  }
});

shareCopy.addEventListener('click', function () {
  if (!link) return;
  copyText(linkUrl(link)).then(function () {
    showToast('Link copied. Send it to everyone.');
  }).catch(function () {
    shareLink.select();
    showToast('Copy the link from the box above.');
  });
});

shareLeave.addEventListener('click', async function () {
  link = null;
  cloud = null;
  stopPolling();
  clearProblem();
  history.replaceState(null, '', location.origin + location.pathname);
  await refresh();
  showToast('Back to your own list. The shared one is still there if you kept the link.');
});

// -----------------------
// 他の人の変更を取り込む
// -----------------------

function startPolling() {
  stopPolling();
  pollTimer = setInterval(function () {
    // 見ていないタブ・入力中・通信中は取りに行かない
    if (document.hidden || busy || claimingId) return;
    if (document.activeElement === eventInput) return;
    refresh();
  }, POLL_MS);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

document.addEventListener('visibilitychange', function () {
  if (!document.hidden && link && !busy) refresh();
});

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
}

// -----------------------
// 起動
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  link = readLink();

  if (link) {
    cloud = openCloud(link.token);
    if (!cloud) {
      link = null;
      showProblem('The page could not load the cloud part, so the shared list cannot open. Check your connection and reload.');
    } else {
      startPolling();
    }
  }

  // 共有モードでも、リンクを外したときのために自分のリストは読めるようにしておく
  store = await openStore('bring-list', 'list', { default: { event: '', items: [] } });
  store.subscribe(function () { if (!link) refresh(); });

  await refresh();
});
