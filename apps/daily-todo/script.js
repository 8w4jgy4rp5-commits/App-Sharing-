// ===========================
// Daily To-Do - スクリプト
// ===========================

const STORAGE_KEY = 'dailyTodo:tasks:v1';
const TASKS_UPDATED_KEY = 'dailyTodo:tasksUpdatedAt:v1';
const THEME_KEY = 'dailyTodo:theme:v1';
const LANG_KEY = 'cobbleworks:lang:v1';
const APP_SLUG = 'daily-todo';

let sortByPriority = false;

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'Daily To-Do',
    subtitle: 'Track tasks by priority, due date, and daily streaks.',
    toggleDarkMode: 'Toggle dark mode',
    taskLabel: 'Task',
    taskPlaceholder: 'e.g. Write the weekly report',
    priorityLabel: 'Priority',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    dueDateLabel: 'Due date',
    optional: 'Optional',
    repeatDaily: 'Repeat daily (track as a streak)',
    addTask: 'Add task',
    tasksHeading: 'Tasks',
    sortByPriority: 'Sort by priority',
    sortedByPriority: 'Sorted by priority',
    completedHeading: 'Completed',
    backupHeading: 'Backup',
    backupNote: 'Tasks are stored in this browser (and synced to your account if signed in). If you clear your browser data while signed out, they will be lost — export a backup file first, or import one to restore.',
    exportBackup: '⬇ Export backup',
    importBackup: '⬆ Import backup',
    emptyMessage: '✨ No tasks yet. Add one above!',
    markAsDone: 'Mark as done',
    markAsNotDone: 'Mark as not done',
    deleteTask: 'Delete task',
    streakDay: function (n) { return '🔥 Day ' + n; },
    streakStart: 'Daily — complete today to start a streak',
    overdue: function (date) { return 'Overdue (' + date + ')'; },
    dueToday: 'Due today',
    dueTomorrow: 'Due tomorrow',
    dueOn: function (date) { return 'Due ' + date; },
    importInvalidJson: 'Import failed: not a valid JSON file',
    importBadFormat: 'Import failed: unexpected file format',
    importedCount: function (n) { return 'Imported ' + n + ' task(s)'; },
    uploadConfirm: 'Sync these tasks to your account so they follow you across devices?',
  },
  ja: {
    title: 'デイリーToDo',
    subtitle: '優先度・期限・継続日数でタスクを管理できます。',
    toggleDarkMode: 'ダークモード切り替え',
    taskLabel: 'タスク',
    taskPlaceholder: '例: 週次レポートを書く',
    priorityLabel: '優先度',
    priorityHigh: '高',
    priorityMedium: '中',
    priorityLow: '低',
    dueDateLabel: '期限日',
    optional: '任意',
    repeatDaily: '毎日繰り返す（継続日数を記録）',
    addTask: 'タスクを追加',
    tasksHeading: 'タスク',
    sortByPriority: '優先度で並び替え',
    sortedByPriority: '優先度順に表示中',
    completedHeading: '完了済み',
    backupHeading: 'バックアップ',
    backupNote: 'タスクはこのブラウザに保存されます(サインインしている場合はアカウントにも同期されます)。サインアウトした状態でブラウザのデータを消去すると失われるため、事前にバックアップを書き出すか、復元したい場合は読み込んでください。',
    exportBackup: '⬇ バックアップを書き出す',
    importBackup: '⬆ バックアップを読み込む',
    emptyMessage: '✨ タスクはまだありません。上から追加しましょう！',
    markAsDone: '完了にする',
    markAsNotDone: '未完了に戻す',
    deleteTask: 'タスクを削除',
    streakDay: function (n) { return '🔥 ' + n + '日目'; },
    streakStart: '毎日タスク — 今日完了すると継続日数がスタートします',
    overdue: function (date) { return '期限超過（' + date + '）'; },
    dueToday: '今日が期限',
    dueTomorrow: '明日が期限',
    dueOn: function (date) { return '期限: ' + date; },
    importInvalidJson: 'インポート失敗: 正しいJSONファイルではありません',
    importBadFormat: 'インポート失敗: ファイル形式が想定と異なります',
    importedCount: function (n) { return n + '件のタスクをインポートしました'; },
    uploadConfirm: 'このタスクをアカウントに同期しますか？他の端末でも同じタスクが使えるようになります。',
  },
  es: {
    title: 'Tareas Diarias',
    subtitle: 'Organiza tareas por prioridad, fecha límite y rachas diarias.',
    toggleDarkMode: 'Cambiar modo oscuro',
    taskLabel: 'Tarea',
    taskPlaceholder: 'ej. Escribir el informe semanal',
    priorityLabel: 'Prioridad',
    priorityHigh: 'Alta',
    priorityMedium: 'Media',
    priorityLow: 'Baja',
    dueDateLabel: 'Fecha límite',
    optional: 'Opcional',
    repeatDaily: 'Repetir cada día (seguir como racha)',
    addTask: 'Añadir tarea',
    tasksHeading: 'Tareas',
    sortByPriority: 'Ordenar por prioridad',
    sortedByPriority: 'Ordenado por prioridad',
    completedHeading: 'Completadas',
    backupHeading: 'Copia de seguridad',
    backupNote: 'Las tareas se guardan en este navegador (y se sincronizan con tu cuenta si has iniciado sesión). Si borras los datos del navegador estando desconectado, se perderán — exporta una copia de seguridad primero, o importa una para restaurarlas.',
    exportBackup: '⬇ Exportar copia',
    importBackup: '⬆ Importar copia',
    emptyMessage: '✨ Aún no hay tareas. ¡Añade una arriba!',
    markAsDone: 'Marcar como hecha',
    markAsNotDone: 'Marcar como no hecha',
    deleteTask: 'Eliminar tarea',
    streakDay: function (n) { return '🔥 Día ' + n; },
    streakStart: 'Tarea diaria — complétala hoy para empezar una racha',
    overdue: function (date) { return 'Vencida (' + date + ')'; },
    dueToday: 'Vence hoy',
    dueTomorrow: 'Vence mañana',
    dueOn: function (date) { return 'Vence ' + date; },
    importInvalidJson: 'Error al importar: el archivo no es un JSON válido',
    importBadFormat: 'Error al importar: formato de archivo inesperado',
    importedCount: function (n) { return 'Se importaron ' + n + ' tarea(s)'; },
    uploadConfirm: '¿Sincronizar estas tareas con tu cuenta para usarlas en otros dispositivos?',
  },
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const t = STRINGS[getLang()];

function applyStaticTranslations() {
  document.documentElement.setAttribute('lang', getLang());
  document.title = t.title;

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-aria-label');
    if (t[key]) el.setAttribute('aria-label', t[key]);
  });
}

// -----------------------
// 日付ヘルパー
// -----------------------

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function todayStr() {
  return formatDate(new Date());
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

// 期限日までの残り日数(負数なら期限超過)
function daysUntil(dueDate) {
  const today = new Date(todayStr());
  const due = new Date(dueDate);
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// -----------------------
// localStorage read/write
// -----------------------

function getTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  const now = Date.now();
  localStorage.setItem(TASKS_UPDATED_KEY, String(now));
  if (window.AppSync) AppSync.push(APP_SLUG, 'tasks', tasks, now);
}

// -----------------------
// クラウド同期(ログイン済みの場合のみ)
// -----------------------

// 起動時に1回呼ぶ。クラウドの方が新しければローカルへ反映して再描画し、
// クラウドが空でローカルにデータがあれば初回アップロードを確認する。
async function initSync() {
  if (!window.AppSync) return;

  const loggedIn = await AppSync.isLoggedIn();
  if (!loggedIn) return;

  const remote = await AppSync.pull(APP_SLUG, 'tasks');
  const localUpdatedAt = Number(localStorage.getItem(TASKS_UPDATED_KEY) || 0);

  if (!remote) {
    const localTasks = getTasks();
    if (localTasks.length > 0 && window.confirm(t.uploadConfirm)) {
      const now = Date.now();
      await AppSync.pushNow(APP_SLUG, 'tasks', localTasks, now);
      localStorage.setItem(TASKS_UPDATED_KEY, String(now));
    }
    return;
  }

  if (remote.updatedAt > localUpdatedAt) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote.value));
    localStorage.setItem(TASKS_UPDATED_KEY, String(remote.updatedAt));
    renderAll();
  }
}

// 毎日タスクの状態を「今日」の視点に合わせて更新する
// (日をまたいだらチェックを外し、前日にチェックしていなければストリークをリセット)
function normalizeDailyTasks(tasks) {
  const today = todayStr();
  const yesterday = yesterdayStr();
  let changed = false;

  tasks.forEach(function (task) {
    if (!task.isDaily) return;

    if (task.lastCompletedDate === today) {
      if (!task.completed) {
        task.completed = true;
        changed = true;
      }
      return;
    }

    if (task.completed) {
      task.completed = false;
      changed = true;
    }

    if (task.lastCompletedDate && task.lastCompletedDate !== yesterday && task.streakCount !== 0) {
      task.streakCount = 0;
      changed = true;
    }
  });

  if (changed) saveTasks(tasks);
  return tasks;
}

// -----------------------
// 初期化
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();
  initTheme();
  renderAll();
  initSync();

  document.getElementById('taskForm').addEventListener('submit', handleAddTask);
  document.getElementById('sortPriorityBtn').addEventListener('click', function () {
    sortByPriority = !sortByPriority;
    this.classList.toggle('active', sortByPriority);
    this.textContent = sortByPriority ? t.sortedByPriority : t.sortByPriority;
    renderAll();
  });
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  document.getElementById('exportBtn').addEventListener('click', exportBackup);
  document.getElementById('importBtn').addEventListener('click', function () {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', function () {
    if (this.files.length > 0) {
      importBackup(this.files[0]);
      this.value = ''; // 同じファイルをもう一度選べるようにリセット
    }
  });
});

// -----------------------
// バックアップ（エクスポート／インポート）
// -----------------------

// タスクをJSONファイルとしてダウンロードする
function exportBackup() {
  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    tasks: getTasks()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-todo-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

// JSONファイルを読み込んで既存タスクと合体する
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

    if (!data || !Array.isArray(data.tasks)) {
      alert(t.importBadFormat);
      return;
    }

    // 既に同じIDのタスクがあるものはスキップして追加する
    const tasks = getTasks();
    const existingIds = tasks.map(function (t) { return t.id; });
    let added = 0;
    data.tasks.forEach(function (t) {
      if (t && t.id != null && existingIds.indexOf(t.id) === -1) {
        tasks.push(t);
        added++;
      }
    });
    saveTasks(tasks);

    renderAll();
    alert(t.importedCount(added));
  };

  reader.readAsText(file);
}

function renderAll() {
  const tasks = normalizeDailyTasks(getTasks());
  renderTaskList(tasks);
  renderCompletedList(tasks);
}

// -----------------------
// タスク追加
// -----------------------

function handleAddTask(e) {
  e.preventDefault();

  const textInput = document.getElementById('taskText');
  const text = textInput.value.trim();
  if (!text) return;

  const task = {
    id: Date.now(),
    text: text,
    priority: document.getElementById('taskPriority').value,
    dueDate: document.getElementById('taskDueDate').value || null,
    isDaily: document.getElementById('taskDaily').checked,
    completed: false,
    streakCount: 0,
    lastCompletedDate: null,
    createdAt: Date.now()
  };

  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);

  this.reset();
  document.getElementById('taskPriority').value = 'medium';
  renderAll();
}

// -----------------------
// 完了トグル
// -----------------------

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;

  if (task.isDaily) {
    const today = todayStr();
    const yesterday = yesterdayStr();

    if (task.completed) {
      // チェックを取り消す(同日中の訂正)
      task.completed = false;
      task.streakCount = Math.max(0, task.streakCount - 1);
      task.lastCompletedDate = task.streakCount > 0 ? yesterday : null;
    } else {
      task.streakCount = task.lastCompletedDate === yesterday ? task.streakCount + 1 : 1;
      task.lastCompletedDate = today;
      task.completed = true;
    }
  } else {
    task.completed = !task.completed;
  }

  saveTasks(tasks);
  renderAll();
}

function deleteTask(id) {
  const tasks = getTasks().filter(function (t) { return t.id !== id; });
  saveTasks(tasks);
  renderAll();
}

// -----------------------
// 描画
// -----------------------

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function renderTaskList(tasks) {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  // 毎日タスク(常に表示) + 未完了の通常タスク
  let active = tasks.filter(function (t) { return t.isDaily || !t.completed; });

  if (sortByPriority) {
    active = [...active].sort(function (a, b) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  } else {
    active = [...active].sort(function (a, b) { return a.createdAt - b.createdAt; });
  }

  if (active.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = t.emptyMessage;
    list.appendChild(empty);
    return;
  }

  active.forEach(function (task) {
    list.appendChild(createTaskCard(task));
  });
}

function renderCompletedList(tasks) {
  const section = document.getElementById('completed-section');
  const list = document.getElementById('completedList');
  list.innerHTML = '';

  const completed = tasks
    .filter(function (t) { return !t.isDaily && t.completed; })
    .sort(function (a, b) { return b.createdAt - a.createdAt; });

  if (completed.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  completed.forEach(function (task) {
    list.appendChild(createTaskCard(task));
  });
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card priority-' + task.priority;
  if (task.completed) card.classList.add('completed');

  const dueInfo = (task.dueDate && !task.isDaily) ? daysUntil(task.dueDate) : null;
  const isDueWarning = dueInfo !== null && dueInfo <= 1 && !task.completed;
  if (isDueWarning) card.classList.add('due-warning');

  // チェックボックス
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? t.markAsNotDone : t.markAsDone);
  checkbox.addEventListener('change', function () { toggleTask(task.id); });

  // 本文エリア
  const body = document.createElement('div');
  body.className = 'task-body';

  const text = document.createElement('p');
  text.className = 'task-text';
  text.textContent = task.text;
  body.appendChild(text);

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const priorityBadge = document.createElement('span');
  priorityBadge.className = 'badge badge-priority-' + task.priority;
  priorityBadge.textContent = t['priority' + task.priority.charAt(0).toUpperCase() + task.priority.slice(1)];
  meta.appendChild(priorityBadge);

  if (task.dueDate && !task.isDaily) {
    const dueBadge = document.createElement('span');
    dueBadge.className = 'badge ' + (isDueWarning ? 'badge-due-warning' : 'badge-due');
    dueBadge.textContent = formatDueLabel(dueInfo, task.dueDate);
    meta.appendChild(dueBadge);
  }

  if (task.isDaily) {
    const streakBadge = document.createElement('span');
    streakBadge.className = 'badge badge-streak';
    streakBadge.textContent = task.streakCount > 0
      ? t.streakDay(task.streakCount)
      : t.streakStart;
    meta.appendChild(streakBadge);
  }

  body.appendChild(meta);

  // 削除ボタン
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'task-delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', t.deleteTask);
  deleteBtn.addEventListener('click', function () { deleteTask(task.id); });

  card.appendChild(checkbox);
  card.appendChild(body);
  card.appendChild(deleteBtn);

  return card;
}

function formatDueLabel(daysLeft, dueDate) {
  if (daysLeft < 0) return t.overdue(dueDate);
  if (daysLeft === 0) return t.dueToday;
  if (daysLeft === 1) return t.dueTomorrow;
  return t.dueOn(dueDate);
}

// -----------------------
// ダークモード
// -----------------------

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}
