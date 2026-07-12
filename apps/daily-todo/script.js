// ===========================
// Daily To-Do - スクリプト
// ===========================

const STORAGE_KEY = 'dailyTodo:tasks:v1';
const THEME_KEY = 'dailyTodo:theme:v1';

let sortByPriority = false;

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
  initTheme();
  renderAll();

  document.getElementById('taskForm').addEventListener('submit', handleAddTask);
  document.getElementById('sortPriorityBtn').addEventListener('click', function () {
    sortByPriority = !sortByPriority;
    this.classList.toggle('active', sortByPriority);
    this.textContent = sortByPriority ? 'Sorted by priority' : 'Sort by priority';
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
      alert('Import failed: not a valid JSON file');
      return;
    }

    if (!data || !Array.isArray(data.tasks)) {
      alert('Import failed: unexpected file format');
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
    alert('Imported ' + added + ' task(s)');
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
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

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
    empty.textContent = '✨ No tasks yet. Add one above!';
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
  checkbox.setAttribute('aria-label', task.completed ? 'Mark as not done' : 'Mark as done');
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
  priorityBadge.textContent = PRIORITY_LABEL[task.priority];
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
      ? '🔥 Day ' + task.streakCount
      : 'Daily — complete today to start a streak';
    meta.appendChild(streakBadge);
  }

  body.appendChild(meta);

  // 削除ボタン
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'task-delete-btn';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.addEventListener('click', function () { deleteTask(task.id); });

  card.appendChild(checkbox);
  card.appendChild(body);
  card.appendChild(deleteBtn);

  return card;
}

function formatDueLabel(daysLeft, dueDate) {
  if (daysLeft < 0) return 'Overdue (' + dueDate + ')';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  return 'Due ' + dueDate;
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
