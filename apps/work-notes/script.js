// Work Notes — one private note per work topic, grown by adding short entries over time.

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

// 表示言語はプラットフォームの設定を借りる(端末ごとの設定なので同期しない)
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization
// -----------------------

const STRINGS = {
  en: {
    locale: 'en-US',
    title: 'Work Notes',
    subtitle:
      'Keep one private note per work topic and add what you learn each day, so scattered lessons pile up into your own handbook.',
    guideSummary: 'How to use',
    guideStep1: 'Create a note for a topic you keep running into — not for a single day.',
    guideStep2: 'Whenever you notice something, open that note and add one line to it.',
    guideStep3: 'Each note shows how many times you added to it, so you can see which ones are growing.',
    guideStep4: 'Pin the notes you rely on, and search when the list gets long.',
    guidePrivacy:
      'Your notes are private to you. They are saved in this browser, and synced to your other devices while you are signed in to CobbleWorks.',
    newNoteHeading: 'New Note',
    titleLabel: 'Topic',
    titlePlaceholder: 'e.g. Running a good handover meeting',
    titleRequired: 'Please enter a topic for this note.',
    firstEntryLabel: 'First insight (optional)',
    firstEntryPlaceholder: 'What did you notice today?',
    createBtn: 'Create Note',
    yourNotesHeading: 'Your Notes',
    searchLabel: 'Search your notes',
    searchPlaceholder: 'Search notes',
    noteCount: function (n) { return n === 1 ? '1 note' : n + ' notes'; },
    entryCount: function (n) { return n === 1 ? '1 entry' : n + ' entries'; },
    updatedOn: function (date) { return 'updated ' + date; },
    startedOn: function (date) { return 'started ' + date; },
    pinBtn: 'Pin',
    unpinBtn: 'Unpin',
    pinAria: function (title) { return 'Pin "' + title + '" to the top'; },
    unpinAria: function (title) { return 'Unpin "' + title + '"'; },
    pinnedBadge: 'Pinned',
    earlierEntries: function (n) { return 'Earlier entries (' + n + ')'; },
    noEntriesYet: 'Nothing added to this note yet.',
    addEntryPlaceholder: 'Add what you learned...',
    addEntryAria: function (title) { return 'Add an entry to "' + title + '"'; },
    addEntryBtn: 'Add',
    deleteNoteAria: function (title) { return 'Delete note "' + title + '"'; },
    confirmDeleteNote: function (title) { return 'Delete "' + title + '" and everything in it? This cannot be undone.'; },
    deleteEntryAria: 'Delete this entry',
    confirmDeleteEntry: 'Delete this entry? This cannot be undone.',
    emptyNoNotes: 'No notes yet. Start one above with a topic you deal with often.',
    emptyNoMatch: 'No notes match your search.',
    backupHeading: 'Backup',
    backupNote:
      'Export your notes as a file to keep a copy of your own, or to move them into another browser. Importing the same file twice will not create duplicates.',
    exportBtn: '⬇ Export backup',
    importBtn: '⬆ Import backup',
    importInvalidJson: 'Import failed: not a valid JSON file',
    importBadFormat: 'Import failed: unexpected file format',
    importedCount: function (n) { return n === 1 ? 'Imported 1 note' : 'Imported ' + n + ' notes'; },
    saveFailed: 'Could not save your change. Please try again.'
  },
  ja: {
    locale: 'ja-JP',
    title: 'ワークノート',
    subtitle:
      '仕事のテーマごとに自分だけのノートを持ち、気づいたことを書き足していくと、ばらばらの学びが自分の手引きになります。',
    guideSummary: '使い方',
    guideStep1: '「その日」ではなく、繰り返し出会うテーマごとにノートを作ります。',
    guideStep2: '気づいたことがあったら、そのノートを開いて1行だけ書き足します。',
    guideStep3: '各ノートに書き足した回数が出るので、育っているノートが一目で分かります。',
    guideStep4: 'よく使うノートはピン留め。増えてきたら検索で探せます。',
    guidePrivacy:
      'ノートはあなただけのものです。このブラウザに保存され、CobbleWorksにログイン中は他の端末にも同期されます。',
    newNoteHeading: '新しいノート',
    titleLabel: 'テーマ',
    titlePlaceholder: '例: 引き継ぎミーティングの進め方',
    titleRequired: 'ノートのテーマを入力してください。',
    firstEntryLabel: '最初の気づき（任意）',
    firstEntryPlaceholder: '今日、気づいたことは？',
    createBtn: 'ノートを作成',
    yourNotesHeading: 'あなたのノート',
    searchLabel: 'ノートを検索',
    searchPlaceholder: 'ノートを検索',
    noteCount: function (n) { return n + '件のノート'; },
    entryCount: function (n) { return n + '件の書き足し'; },
    updatedOn: function (date) { return '最終更新 ' + date; },
    startedOn: function (date) { return '作成 ' + date; },
    pinBtn: 'ピン留め',
    unpinBtn: 'ピンを外す',
    pinAria: function (title) { return `「${title}」を一番上に固定`; },
    unpinAria: function (title) { return `「${title}」のピンを外す`; },
    pinnedBadge: 'ピン留め',
    earlierEntries: function (n) { return `これまでの書き足し（${n}件）`; },
    noEntriesYet: 'このノートにはまだ何も書かれていません。',
    addEntryPlaceholder: '学んだことを書き足す...',
    addEntryAria: function (title) { return `「${title}」に書き足す`; },
    addEntryBtn: '追加',
    deleteNoteAria: function (title) { return `ノート「${title}」を削除`; },
    confirmDeleteNote: function (title) { return `「${title}」を中身ごと削除しますか？元に戻せません。`; },
    deleteEntryAria: 'この書き足しを削除',
    confirmDeleteEntry: 'この書き足しを削除しますか？元に戻せません。',
    emptyNoNotes: 'まだノートがありません。よく向き合うテーマで1つ作ってみましょう。',
    emptyNoMatch: '検索に一致するノートがありません。',
    backupHeading: 'バックアップ',
    backupNote:
      'ノートをファイルに書き出して手元に保管したり、別のブラウザへ移したりできます。同じファイルを2回読み込んでも重複しません。',
    exportBtn: '⬇ バックアップを書き出す',
    importBtn: '⬆ バックアップを読み込む',
    importInvalidJson: 'インポート失敗: 正しいJSONファイルではありません',
    importBadFormat: 'インポート失敗: ファイル形式が想定と異なります',
    importedCount: function (n) { return n + '件のノートをインポートしました'; },
    saveFailed: '保存できませんでした。もう一度お試しください。'
  },
  es: {
    locale: 'es-ES',
    title: 'Notas de Trabajo',
    subtitle:
      'Ten una nota privada por cada tema de tu trabajo y añade lo que aprendes cada día, para que las lecciones sueltas se conviertan en tu propio manual.',
    guideSummary: 'Cómo usarlo',
    guideStep1: 'Crea una nota para un tema recurrente, no para un solo día.',
    guideStep2: 'Cuando notes algo, abre esa nota y añade una línea.',
    guideStep3: 'Cada nota muestra cuántas veces has añadido algo, así ves cuáles están creciendo.',
    guideStep4: 'Fija las notas que más usas y busca cuando la lista crezca.',
    guidePrivacy:
      'Tus notas son privadas. Se guardan en este navegador y se sincronizan con tus otros dispositivos mientras tengas la sesión iniciada en CobbleWorks.',
    newNoteHeading: 'Nueva nota',
    titleLabel: 'Tema',
    titlePlaceholder: 'ej. Cómo llevar una reunión de traspaso',
    titleRequired: 'Escribe un tema para esta nota.',
    firstEntryLabel: 'Primera idea (opcional)',
    firstEntryPlaceholder: '¿Qué has notado hoy?',
    createBtn: 'Crear nota',
    yourNotesHeading: 'Tus notas',
    searchLabel: 'Buscar en tus notas',
    searchPlaceholder: 'Buscar notas',
    noteCount: function (n) { return n === 1 ? '1 nota' : n + ' notas'; },
    entryCount: function (n) { return n === 1 ? '1 entrada' : n + ' entradas'; },
    updatedOn: function (date) { return 'actualizada ' + date; },
    startedOn: function (date) { return 'creada ' + date; },
    pinBtn: 'Fijar',
    unpinBtn: 'Quitar',
    pinAria: function (title) { return 'Fijar "' + title + '" arriba'; },
    unpinAria: function (title) { return 'Quitar "' + title + '" de arriba'; },
    pinnedBadge: 'Fijada',
    earlierEntries: function (n) { return 'Entradas anteriores (' + n + ')'; },
    noEntriesYet: 'Todavía no has añadido nada a esta nota.',
    addEntryPlaceholder: 'Añade lo que has aprendido...',
    addEntryAria: function (title) { return 'Añadir una entrada a "' + title + '"'; },
    addEntryBtn: 'Añadir',
    deleteNoteAria: function (title) { return 'Eliminar la nota "' + title + '"'; },
    confirmDeleteNote: function (title) { return '¿Eliminar "' + title + '" y todo su contenido? No se puede deshacer.'; },
    deleteEntryAria: 'Eliminar esta entrada',
    confirmDeleteEntry: '¿Eliminar esta entrada? No se puede deshacer.',
    emptyNoNotes: 'Aún no hay notas. Empieza una arriba con un tema que trates a menudo.',
    emptyNoMatch: 'Ninguna nota coincide con tu búsqueda.',
    backupHeading: 'Copia de seguridad',
    backupNote:
      'Exporta tus notas a un archivo para guardar tu propia copia o llevarlas a otro navegador. Importar el mismo archivo dos veces no crea duplicados.',
    exportBtn: '⬇ Exportar copia',
    importBtn: '⬆ Importar copia',
    importInvalidJson: 'Error al importar: el archivo no es un JSON válido',
    importBadFormat: 'Error al importar: formato de archivo inesperado',
    importedCount: function (n) { return n === 1 ? 'Se importó 1 nota' : 'Se importaron ' + n + ' notas'; },
    saveFailed: 'No se pudo guardar el cambio. Inténtalo de nuevo.'
  }
};

function getLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch (e) {
    // localStorage が使えない環境でも英語で動かす
  }
  return 'en';
}

const lang = getLang();
const t = STRINGS[lang];

function applyStaticTranslations() {
  document.documentElement.lang = lang;
  document.title = t.title + ' | CobbleWorks';
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const value = t[el.dataset.i18n];
    if (typeof value === 'string') el.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const value = t[el.dataset.i18nPlaceholder];
    if (typeof value === 'string') el.placeholder = value;
  });
}

// -----------------------
// Data layer
// -----------------------

function getNotes() {
  if (!store) return [];
  const notes = store.get();
  return Array.isArray(notes) ? notes : [];
}

function saveNotes(notes) {
  if (!store) return;
  store.set(notes).catch(function (e) {
    console.error('Work Notes: 保存に失敗しました', e);
    alert(t.saveFailed);
  });
}

function newId() {
  return String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);
}

function getEntries(note) {
  return Array.isArray(note.entries) ? note.entries : [];
}

// 最後に書き足した日時。1件も無ければ作成日時を使う。
function lastTouchedAt(note) {
  const entries = getEntries(note);
  return entries.length ? entries[entries.length - 1].createdAt : note.createdAt;
}

function formatDate(iso) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(t.locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

// -----------------------
// DOM
// -----------------------

const addForm = document.getElementById('add-form');
const titleInput = document.getElementById('title-input');
const titleError = document.getElementById('title-error');
const firstEntryInput = document.getElementById('first-entry');
const searchInput = document.getElementById('search-input');
const noteList = document.getElementById('note-list');
const noteCountEl = document.getElementById('note-count');
const emptyState = document.getElementById('empty-state');

function buildEntryItem(note, entry) {
  const li = document.createElement('li');
  li.className = 'entry';

  const text = document.createElement('p');
  text.className = 'entry-text';
  text.textContent = entry.text;
  li.appendChild(text);

  const foot = document.createElement('div');
  foot.className = 'entry-foot';

  const time = document.createElement('time');
  time.dateTime = entry.createdAt;
  time.textContent = formatDate(entry.createdAt);
  foot.appendChild(time);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'entry-delete';
  del.textContent = '×';
  del.setAttribute('aria-label', t.deleteEntryAria);
  del.addEventListener('click', function () {
    if (!confirm(t.confirmDeleteEntry)) return;
    const notes = getNotes();
    const target = notes.find(function (n) { return n.id === note.id; });
    if (target) {
      target.entries = getEntries(target).filter(function (e) { return e.id !== entry.id; });
      saveNotes(notes);
    }
    render();
  });
  foot.appendChild(del);

  li.appendChild(foot);
  return li;
}

function buildNoteCard(note) {
  const li = document.createElement('li');
  li.className = 'note-card map-card' + (note.pinned ? ' note-card--pinned' : '');

  const top = document.createElement('div');
  top.className = 'note-top';

  const heading = document.createElement('h3');
  heading.className = 'note-title';
  heading.textContent = note.title;
  top.appendChild(heading);

  const actions = document.createElement('div');
  actions.className = 'note-actions';

  const pinBtn = document.createElement('button');
  pinBtn.type = 'button';
  pinBtn.className = 'pin-btn' + (note.pinned ? ' pin-btn--on' : '');
  pinBtn.textContent = note.pinned ? t.unpinBtn : t.pinBtn;
  pinBtn.setAttribute('aria-pressed', note.pinned ? 'true' : 'false');
  pinBtn.setAttribute('aria-label', note.pinned ? t.unpinAria(note.title) : t.pinAria(note.title));
  pinBtn.addEventListener('click', function () {
    const notes = getNotes();
    const target = notes.find(function (n) { return n.id === note.id; });
    if (target) {
      target.pinned = !target.pinned;
      saveNotes(notes);
    }
    render();
  });
  actions.appendChild(pinBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'note-delete';
  deleteBtn.textContent = '×';
  deleteBtn.setAttribute('aria-label', t.deleteNoteAria(note.title));
  deleteBtn.addEventListener('click', function () {
    if (!confirm(t.confirmDeleteNote(note.title))) return;
    saveNotes(getNotes().filter(function (n) { return n.id !== note.id; }));
    render();
  });
  actions.appendChild(deleteBtn);

  top.appendChild(actions);
  li.appendChild(top);

  const entries = getEntries(note);

  const meta = document.createElement('p');
  meta.className = 'note-meta';
  const growth = document.createElement('span');
  growth.className = 'growth-badge';
  growth.textContent = t.entryCount(entries.length);
  meta.appendChild(growth);
  const when = document.createElement('span');
  when.textContent = entries.length
    ? t.updatedOn(formatDate(lastTouchedAt(note)))
    : t.startedOn(formatDate(note.createdAt));
  meta.appendChild(when);
  if (note.pinned) {
    const badge = document.createElement('span');
    badge.className = 'pinned-badge';
    badge.textContent = t.pinnedBadge;
    meta.appendChild(badge);
  }
  li.appendChild(meta);

  if (entries.length === 0) {
    const none = document.createElement('p');
    none.className = 'note-empty';
    none.textContent = t.noEntriesYet;
    li.appendChild(none);
  } else {
    // 最新の1件は開いたまま、それ以前は折りたたむ
    const latestList = document.createElement('ul');
    latestList.className = 'entry-list';
    latestList.appendChild(buildEntryItem(note, entries[entries.length - 1]));
    li.appendChild(latestList);

    if (entries.length > 1) {
      const details = document.createElement('details');
      details.className = 'earlier';
      const summary = document.createElement('summary');
      summary.textContent = t.earlierEntries(entries.length - 1);
      details.appendChild(summary);

      const earlierList = document.createElement('ul');
      earlierList.className = 'entry-list';
      for (let i = entries.length - 2; i >= 0; i--) {
        earlierList.appendChild(buildEntryItem(note, entries[i]));
      }
      details.appendChild(earlierList);
      li.appendChild(details);
    }
  }

  const entryForm = document.createElement('form');
  entryForm.className = 'entry-form';

  const textarea = document.createElement('textarea');
  textarea.className = 'map-input';
  textarea.rows = 2;
  textarea.maxLength = 600;
  textarea.placeholder = t.addEntryPlaceholder;
  textarea.setAttribute('aria-label', t.addEntryAria(note.title));
  entryForm.appendChild(textarea);

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'btn-outline';
  addBtn.textContent = t.addEntryBtn;
  entryForm.appendChild(addBtn);

  entryForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;
    const notes = getNotes();
    const target = notes.find(function (n) { return n.id === note.id; });
    if (target) {
      target.entries = getEntries(target);
      target.entries.push({ id: newId(), text: text, createdAt: new Date().toISOString() });
      saveNotes(notes);
    }
    render();
  });

  li.appendChild(entryForm);
  return li;
}

function render() {
  const allNotes = getNotes();
  const query = searchInput.value.trim().toLowerCase();

  const filtered = query
    ? allNotes.filter(function (note) {
        if (note.title.toLowerCase().includes(query)) return true;
        return getEntries(note).some(function (e) {
          return String(e.text).toLowerCase().includes(query);
        });
      })
    : allNotes;

  // ピン留めを先頭に、その中では最後に書き足した順
  const sorted = filtered.slice().sort(function (a, b) {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return String(lastTouchedAt(b)).localeCompare(String(lastTouchedAt(a)));
  });

  noteCountEl.textContent = allNotes.length ? t.noteCount(allNotes.length) : '';

  noteList.textContent = '';

  if (sorted.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent = allNotes.length === 0 ? t.emptyNoNotes : t.emptyNoMatch;
    return;
  }
  emptyState.hidden = true;

  sorted.forEach(function (note) {
    noteList.appendChild(buildNoteCard(note));
  });
}

// -----------------------
// Actions
// -----------------------

addForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleError.hidden = false;
    titleInput.focus();
    return;
  }
  titleError.hidden = true;

  const now = new Date().toISOString();
  const firstText = firstEntryInput.value.trim();
  const note = {
    id: newId(),
    title: title,
    pinned: false,
    createdAt: now,
    entries: firstText ? [{ id: newId(), text: firstText, createdAt: now }] : []
  };

  const notes = getNotes();
  notes.push(note);
  saveNotes(notes);

  addForm.reset();
  titleInput.focus();
  render();
});

titleInput.addEventListener('input', function () {
  if (titleInput.value.trim()) titleError.hidden = true;
});

searchInput.addEventListener('input', render);

// -----------------------
// Backup (export / import)
// -----------------------

function exportBackup() {
  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    notes: getNotes()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'work-notes-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();

  reader.onload = function () {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      alert(t.importInvalidJson);
      return;
    }

    if (!data || !Array.isArray(data.notes)) {
      alert(t.importBadFormat);
      return;
    }

    // すでにあるIDは飛ばすので、同じファイルを2回読んでも重複しない
    const notes = getNotes();
    const existingIds = notes.map(function (n) { return n.id; });
    let added = 0;
    data.notes.forEach(function (n) {
      if (n && n.id != null && typeof n.title === 'string' && existingIds.indexOf(n.id) === -1) {
        notes.push({
          id: n.id,
          title: n.title,
          pinned: !!n.pinned,
          createdAt: n.createdAt || new Date().toISOString(),
          entries: Array.isArray(n.entries)
            ? n.entries
                .filter(function (e) { return e && typeof e.text === 'string'; })
                .map(function (e) {
                  return {
                    id: e.id != null ? String(e.id) : newId(),
                    text: e.text,
                    createdAt: e.createdAt || n.createdAt || new Date().toISOString()
                  };
                })
            : []
        });
        existingIds.push(n.id);
        added++;
      }
    });
    saveNotes(notes);
    render();
    alert(t.importedCount(added));
  };

  reader.onerror = function () { alert(t.importInvalidJson); };
  reader.readAsText(file);
}

document.getElementById('export-btn').addEventListener('click', exportBackup);
document.getElementById('import-btn').addEventListener('click', function () {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', function () {
  if (this.files && this.files[0]) importBackup(this.files[0]);
  this.value = '';
});

// -----------------------
// Start
// -----------------------

applyStaticTranslations();

// データ層の準備ができてから描画する
(async function () {
  store = await openStore('work-notes', 'notes', { default: [] });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { render(); });
  render();
})();
