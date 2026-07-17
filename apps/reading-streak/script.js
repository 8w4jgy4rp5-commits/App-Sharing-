// ===========================
// Reading Streak - Logic
// ===========================

const DAYS_STORAGE_KEY = 'readingStreak:days:v1';
const BOOKS_STORAGE_KEY = 'readingStreak:books:v1';

// Reads all recorded reading days ('YYYY-MM-DD' strings); returns [] if missing or corrupted
function getDays() {
  const raw = localStorage.getItem(DAYS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDays(days) {
  localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(days));
}

// Reads all tracked books; returns [] if missing or corrupted
function getBooks() {
  const raw = localStorage.getItem(BOOKS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
}

function formatDate(date) {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function todayStr() {
  return formatDate(new Date());
}

function toggleToday() {
  const days = getDays();
  const today = todayStr();
  const index = days.indexOf(today);

  if (index === -1) {
    days.push(today);
  } else {
    days.splice(index, 1);
  }
  saveDays(days);
  render();
}

function computeCurrentStreak(daySet) {
  let streak = 0;
  const cursor = new Date();
  if (!daySet.has(todayStr())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daySet.has(formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeLongestStreak(daySet) {
  const sortedDates = [...daySet].sort();
  let longest = 0;
  let current = 0;
  let prevTime = null;

  for (const dayStr of sortedDates) {
    const time = new Date(`${dayStr}T00:00:00`).getTime();
    if (prevTime !== null && Math.round((time - prevTime) / 86400000) === 1) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prevTime = time;
  }
  return longest;
}

function addBook(title, totalPages) {
  const books = getBooks();
  books.unshift({
    id: crypto.randomUUID(),
    title,
    totalPages: totalPages || null,
    currentPage: 0,
    status: 'reading',
    createdAt: new Date().toISOString(),
    finishedAt: null,
  });
  saveBooks(books);
}

function updateCurrentPage(id, value) {
  const books = getBooks();
  const book = books.find((b) => b.id === id);
  if (!book) return;

  let page = Math.max(0, Math.floor(Number(value)) || 0);
  if (book.totalPages) page = Math.min(page, book.totalPages);
  book.currentPage = page;
  saveBooks(books);
  render();
}

function finishBook(id) {
  const books = getBooks();
  const book = books.find((b) => b.id === id);
  if (!book) return;

  book.status = 'finished';
  book.finishedAt = new Date().toISOString();
  if (book.totalPages) book.currentPage = book.totalPages;
  saveBooks(books);
  render();
}

function deleteBook(id) {
  const books = getBooks().filter((b) => b.id !== id);
  saveBooks(books);
  render();
}

const todayDateEl = document.getElementById('todayDate');
const todayBtn = document.getElementById('todayBtn');
const currentStreakEl = document.getElementById('currentStreak');
const longestStreakEl = document.getElementById('longestStreak');
const booksReadEl = document.getElementById('booksRead');
const historyGrid = document.getElementById('historyGrid');
const calendarMonthLabel = document.getElementById('calendarMonthLabel');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const bookForm = document.getElementById('bookForm');
const bookTitleInput = document.getElementById('bookTitle');
const bookTotalPagesInput = document.getElementById('bookTotalPages');
const bookList = document.getElementById('bookList');

const now = new Date();
let viewedYear = now.getFullYear();
let viewedMonth = now.getMonth(); // 0-indexed

todayBtn.addEventListener('click', toggleToday);

prevMonthBtn.addEventListener('click', () => {
  viewedMonth--;
  if (viewedMonth < 0) {
    viewedMonth = 11;
    viewedYear--;
  }
  render();
});

nextMonthBtn.addEventListener('click', () => {
  const current = new Date();
  const isCurrentMonth = viewedYear === current.getFullYear() && viewedMonth === current.getMonth();
  if (isCurrentMonth) return;

  viewedMonth++;
  if (viewedMonth > 11) {
    viewedMonth = 0;
    viewedYear++;
  }
  render();
});

bookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = bookTitleInput.value.trim();
  if (!title) return;

  const totalPages = bookTotalPagesInput.value ? Number(bookTotalPagesInput.value) : null;
  addBook(title, totalPages);
  bookForm.reset();
  render();
});

function buildBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';

  const title = document.createElement('p');
  title.className = 'book-title';
  title.textContent = book.title;
  card.appendChild(title);

  if (book.totalPages) {
    const percent = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
    const barTrack = document.createElement('div');
    barTrack.className = 'progress-track';
    const barFill = document.createElement('div');
    barFill.className = 'progress-fill';
    barFill.style.width = `${percent}%`;
    barTrack.appendChild(barFill);
    card.appendChild(barTrack);

    const progressText = document.createElement('p');
    progressText.className = 'progress-text';
    progressText.textContent = `${book.currentPage} / ${book.totalPages} pages (${percent}%)`;
    card.appendChild(progressText);
  } else {
    const progressText = document.createElement('p');
    progressText.className = 'progress-text';
    progressText.textContent = `${book.currentPage} pages read`;
    card.appendChild(progressText);
  }

  const controls = document.createElement('div');
  controls.className = 'book-controls';

  const pageLabel = document.createElement('label');
  pageLabel.textContent = 'Current page';
  pageLabel.setAttribute('for', `page-${book.id}`);
  pageLabel.className = 'page-input-label';

  const pageInput = document.createElement('input');
  pageInput.type = 'number';
  pageInput.id = `page-${book.id}`;
  pageInput.min = '0';
  if (book.totalPages) pageInput.max = String(book.totalPages);
  pageInput.value = book.currentPage;
  pageInput.className = 'page-input';
  pageInput.addEventListener('change', () => updateCurrentPage(book.id, pageInput.value));

  const finishBtn = document.createElement('button');
  finishBtn.type = 'button';
  finishBtn.className = 'finish-book-btn';
  finishBtn.textContent = 'Finished';
  finishBtn.addEventListener('click', () => finishBook(book.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-book-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', `Delete ${book.title}`);
  deleteBtn.addEventListener('click', () => deleteBook(book.id));

  controls.append(pageLabel, pageInput, finishBtn, deleteBtn);
  card.appendChild(controls);

  return card;
}

function render() {
  const days = getDays();
  const daySet = new Set(days);
  const today = todayStr();
  const readToday = daySet.has(today);

  todayDateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  todayBtn.textContent = readToday ? 'Read Today ✓ (tap to undo)' : 'Mark Today as Read';
  todayBtn.classList.toggle('done', readToday);

  currentStreakEl.textContent = computeCurrentStreak(daySet);
  longestStreakEl.textContent = computeLongestStreak(daySet);

  calendarMonthLabel.textContent = new Date(viewedYear, viewedMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const isCurrentMonth = viewedYear === now.getFullYear() && viewedMonth === now.getMonth();
  nextMonthBtn.disabled = isCurrentMonth;

  historyGrid.innerHTML = '';

  const firstWeekday = new Date(viewedYear, viewedMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();

  for (let i = 0; i < firstWeekday; i++) {
    const filler = document.createElement('div');
    filler.className = 'history-cell empty';
    historyGrid.appendChild(filler);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewedYear, viewedMonth, day);
    const dayStr = formatDate(date);

    const cell = document.createElement('div');
    cell.className = 'history-cell';
    if (daySet.has(dayStr)) cell.classList.add('read');
    if (dayStr === today) cell.classList.add('is-today');
    cell.textContent = day;
    cell.setAttribute(
      'aria-label',
      `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${daySet.has(dayStr) ? 'read' : 'not read'}`
    );
    cell.title = cell.getAttribute('aria-label');

    historyGrid.appendChild(cell);
  }

  const books = getBooks();
  booksReadEl.textContent = books.filter((b) => b.status === 'finished').length;

  const activeBooks = books.filter((b) => b.status === 'reading');
  bookList.innerHTML = '';
  if (activeBooks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = "No books in progress. Add one you're currently reading!";
    bookList.appendChild(empty);
  } else {
    activeBooks.forEach((book) => bookList.appendChild(buildBookCard(book)));
  }
}

render();
