// ===========================
// Bring List
// 集まりで「誰が何を持ってくるか」を1画面で決めるアプリ。
// 未定の行には「I'll bring it」ボタンがあり、名前を入れると担当が埋まる。
// サーバーは無いので他人の端末とは自動共有されない。代わりに
// 「Copy the list for the group chat」でテキストにしてチャットへ貼る。
// ===========================

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

// 自分の名前だけは端末ごとの設定。同期させると他の端末に他人の名前が入ってしまう。
const MY_NAME_KEY = 'bringList:myName:v1';

const MAX_EVENT = 70;
const MAX_ITEM = 60;
const MAX_NOTE = 80;
const MAX_PERSON = 30;

// 画面の状態
let claimingId = null;    // 名前入力を開いている行
let armedDeleteId = null; // 「もう一度押すと削除」状態の行
let armedTimer = null;
let eventTimer = null;
let toastTimer = null;

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
const toast = document.getElementById('toast');

// -----------------------
// データ
// -----------------------

function getData() {
  const raw = store ? store.get() : null;
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    event: typeof data.event === 'string' ? data.event : '',
    items: Array.isArray(data.items) ? data.items : []
  };
}

function saveData(data) {
  if (!store) return;
  store.set(data).catch(function (e) {
    console.error('Bring List: 保存に失敗しました', e);
    showToast('Could not save. Try again.');
  });
}

function makeId() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

addForm.addEventListener('submit', function (event) {
  event.preventDefault();
  clearAddErrors();

  const data = getData();
  const name = itemInput.value.trim();
  const note = noteInput.value.trim();
  let bad = null;

  if (name === '') {
    showFieldError(itemInput, itemError, 'h-item', 'e-item', 'Write what is needed, like "Paper plates".');
    bad = bad || itemInput;
  } else if (name.length > MAX_ITEM) {
    showFieldError(itemInput, itemError, 'h-item', 'e-item', 'Keep it to ' + MAX_ITEM + ' characters or fewer.');
    bad = bad || itemInput;
  } else {
    const clash = data.items.some(function (item) {
      return item.name.trim().toLowerCase() === name.toLowerCase();
    });
    if (clash) {
      showFieldError(itemInput, itemError, 'h-item', 'e-item', 'That is already on the list.');
      bad = bad || itemInput;
    }
  }

  if (note.length > MAX_NOTE) {
    showFieldError(noteInput, noteError, 'h-note', 'e-note', 'Keep the notes to ' + MAX_NOTE + ' characters or fewer.');
    bad = bad || noteInput;
  }

  if (bad) {
    bad.focus();
    return;
  }

  data.items.push({ id: makeId(), name: name, note: note, claimedBy: null, createdAt: Date.now() });
  saveData(data);
  addForm.reset();
  renderAll();
  itemInput.focus();
  showToast('Added to the list.');
});

// -----------------------
// イベント名
// -----------------------

eventInput.addEventListener('input', function () {
  if (eventTimer) clearTimeout(eventTimer);
  // 1文字ごとに保存すると同期が忙しくなるので、少し待ってからまとめて保存する
  eventTimer = setTimeout(function () {
    const data = getData();
    data.event = eventInput.value.trim().slice(0, MAX_EVENT);
    saveData(data);
    renderHero(data);
  }, 400);
});

// -----------------------
// 担当を決める / 外す / 消す
// -----------------------

function claimItem(id, person) {
  const data = getData();
  const item = data.items.find(function (x) { return x.id === id; });
  if (!item) return false;
  item.claimedBy = person;
  saveData(data);
  writeMyName(person);
  claimingId = null;
  renderAll();
  showToast('Thanks — you are down for ' + item.name + '.');
  return true;
}

function releaseItem(id) {
  const data = getData();
  const item = data.items.find(function (x) { return x.id === id; });
  if (!item) return;
  item.claimedBy = null;
  saveData(data);
  renderAll();
  showToast('That is open again.');
}

function armDelete(id) {
  armedDeleteId = id;
  if (armedTimer) clearTimeout(armedTimer);
  armedTimer = setTimeout(function () {
    armedDeleteId = null;
    renderAll();
  }, 4000);
  renderAll();
}

function removeItem(id) {
  const data = getData();
  data.items = data.items.filter(function (x) { return x.id !== id; });
  saveData(data);
  armedDeleteId = null;
  if (armedTimer) clearTimeout(armedTimer);
  if (claimingId === id) claimingId = null;
  renderAll();
  showToast('Removed from the list.');
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

  // 消すボタンは行の右端に小さく置く。1回目は構え、2回目で消える。
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn-icon';
  const armed = armedDeleteId === item.id;
  if (armed) del.classList.add('is-armed');
  del.setAttribute(
    'aria-label',
    armed ? 'Press again to remove ' + item.name : 'Remove ' + item.name
  );
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

// 保存のたびに呼ぶ、唯一の再描画の入口。
function renderAll() {
  const data = getData();

  // 入力中に上書きすると打った字が消えるので、触っていないときだけ入れ直す
  if (document.activeElement !== eventInput) eventInput.value = data.event;

  renderHero(data);

  list.textContent = '';
  emptyState.hidden = data.items.length > 0;

  let focusTarget = null;
  data.items.forEach(function (item) {
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
  const data = getData();
  if (data.items.length === 0) {
    showToast('Add something to the list first.');
    return;
  }
  copyText(buildText(data)).then(function () {
    showToast('Copied. Paste it into your chat.');
  }).catch(function () {
    showToast('This browser would not let the page copy.');
  });
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
  // データ層を先に用意する(読み込み途中の画面で操作させない)
  store = await openStore('bring-list', 'list', { default: { event: '', items: [] } });

  store.subscribe(function () { renderAll(); });
  renderAll();
});
