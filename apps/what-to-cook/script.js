const STORAGE_KEY = 'whatToCook:meals:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization (reads the platform-wide language setting from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'What to Cook',
    subtitle: 'Stuck in front of the fridge? Get a random pick from your go-to meals.',
    suggestSectionTitle: "Tonight's Pick",
    filterLabel: 'Filter',
    filterAll: 'All meals',
    filterQuick: 'Quick (under 20 min)',
    filterVegetarian: 'Vegetarian',
    filterOven: 'Needs Oven',
    filterLeftovers: 'Uses Leftovers',
    filterComfort: 'Comfort Food',
    suggestBtn: 'Suggest Something',
    addSectionTitle: 'Add a Go-To Meal',
    mealNameLabel: 'Meal name',
    mealNamePlaceholder: 'e.g. Chicken stir-fry',
    tagsLabel: 'Tags (optional)',
    tagQuick: 'Quick',
    tagVegetarian: 'Vegetarian',
    tagOven: 'Needs Oven',
    tagLeftovers: 'Uses Leftovers',
    tagComfort: 'Comfort Food',
    addMealBtn: 'Add Meal',
    yourMealsTitle: 'Your Go-To Meals',
    emptyStateText: 'No meals yet. Add your first go-to meal above.',
    suggestEmptyNoMeals: 'Add some go-to meals below first.',
    suggestEmptyNoMatch: 'No saved meals match that filter yet.',
    errorNoName: 'Please enter a meal name.',
    deleteMealAriaLabel: function (name) { return 'Delete meal "' + name + '"'; },
    deleteMealConfirm: function (name) { return 'Delete "' + name + '"? This cannot be undone.'; },
  },
  ja: {
    title: '今夜なに作る？',
    subtitle: '冷蔵庫の前で固まってない？お気に入りメニューからランダムに1つ選びます。',
    suggestSectionTitle: '今夜のおすすめ',
    filterLabel: '絞り込み',
    filterAll: 'すべてのメニュー',
    filterQuick: '時短（20分以内）',
    filterVegetarian: 'ベジタリアン',
    filterOven: 'オーブン使用',
    filterLeftovers: '残り物活用',
    filterComfort: 'ほっとする料理',
    suggestBtn: 'おすすめを見る',
    addSectionTitle: 'お気に入りメニューを追加',
    mealNameLabel: 'メニュー名',
    mealNamePlaceholder: '例: 鶏肉の炒め物',
    tagsLabel: 'タグ（任意）',
    tagQuick: '時短',
    tagVegetarian: 'ベジタリアン',
    tagOven: 'オーブン使用',
    tagLeftovers: '残り物活用',
    tagComfort: 'ほっとする料理',
    addMealBtn: 'メニューを追加',
    yourMealsTitle: '登録済みのメニュー',
    emptyStateText: 'まだメニューがありません。上から最初の1つを追加しましょう。',
    suggestEmptyNoMeals: 'まずは下からお気に入りメニューを追加してください。',
    suggestEmptyNoMatch: 'その条件に合うメニューはまだありません。',
    errorNoName: 'メニュー名を入力してください。',
    deleteMealAriaLabel: function (name) { return '「' + name + '」を削除'; },
    deleteMealConfirm: function (name) { return '「' + name + '」を削除しますか？元に戻せません。'; },
  },
  es: {
    title: '¿Qué Cocino?',
    subtitle: '¿Atascado frente al refri? Elige al azar entre tus platos favoritos.',
    suggestSectionTitle: 'La Elección de Hoy',
    filterLabel: 'Filtro',
    filterAll: 'Todos los platos',
    filterQuick: 'Rápido (menos de 20 min)',
    filterVegetarian: 'Vegetariano',
    filterOven: 'Necesita horno',
    filterLeftovers: 'Con sobras',
    filterComfort: 'Comida reconfortante',
    suggestBtn: 'Sugerir Algo',
    addSectionTitle: 'Añadir un Plato Favorito',
    mealNameLabel: 'Nombre del plato',
    mealNamePlaceholder: 'ej. Pollo salteado',
    tagsLabel: 'Etiquetas (opcional)',
    tagQuick: 'Rápido',
    tagVegetarian: 'Vegetariano',
    tagOven: 'Necesita horno',
    tagLeftovers: 'Con sobras',
    tagComfort: 'Comida reconfortante',
    addMealBtn: 'Añadir Plato',
    yourMealsTitle: 'Tus Platos Favoritos',
    emptyStateText: 'Aún no hay platos. Añade el primero arriba.',
    suggestEmptyNoMeals: 'Primero añade algunos platos favoritos abajo.',
    suggestEmptyNoMatch: 'Ningún plato guardado coincide con ese filtro todavía.',
    errorNoName: 'Por favor, escribe el nombre de un plato.',
    deleteMealAriaLabel: function (name) { return 'Eliminar plato "' + name + '"'; },
    deleteMealConfirm: function (name) { return '¿Eliminar "' + name + '"? Esta acción no se puede deshacer.'; },
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

const TAG_LABELS = {
  quick: t.tagQuick,
  vegetarian: t.tagVegetarian,
  oven: t.tagOven,
  leftovers: t.tagLeftovers,
  comfort: t.tagComfort,
};

function getMeals() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMeals(meals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}

const filterSelect = document.getElementById('filter-select');
const suggestBtn = document.getElementById('suggest-btn');
const suggestionResult = document.getElementById('suggestion-result');
const suggestionName = document.getElementById('suggestion-name');
const suggestionTags = document.getElementById('suggestion-tags');
const suggestEmpty = document.getElementById('suggest-empty');

const addForm = document.getElementById('add-form');
const mealInput = document.getElementById('meal-input');
const errorMsg = document.getElementById('error-msg');
const mealList = document.getElementById('meal-list');
const emptyState = document.getElementById('empty-state');

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.hidden = true;
}

function buildTagRow(container, tags) {
  container.innerHTML = '';
  for (const tag of tags) {
    if (!TAG_LABELS[tag]) continue;
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = TAG_LABELS[tag];
    container.appendChild(chip);
  }
}

suggestBtn.addEventListener('click', () => {
  const meals = getMeals();
  const filter = filterSelect.value;
  const candidates = filter ? meals.filter((m) => m.tags.includes(filter)) : meals;

  if (candidates.length === 0) {
    suggestionResult.hidden = true;
    suggestEmpty.hidden = false;
    suggestEmpty.textContent =
      meals.length === 0
        ? t.suggestEmptyNoMeals
        : t.suggestEmptyNoMatch;
    return;
  }

  suggestEmpty.hidden = true;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  suggestionName.textContent = pick.name;
  buildTagRow(suggestionTags, pick.tags);
  suggestionResult.hidden = false;
});

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  const name = mealInput.value.trim();
  if (!name) {
    showError(t.errorNoName);
    return;
  }

  const tags = [...document.querySelectorAll('.tag-checkbox input:checked')].map((cb) => cb.value);

  const meals = getMeals();
  meals.unshift({
    id: String(Date.now()),
    name,
    tags,
    createdAt: new Date().toISOString(),
  });
  saveMeals(meals);
  addForm.reset();
  render();
});

function buildMealCard(meal) {
  const li = document.createElement('li');
  li.className = 'meal-card';

  const info = document.createElement('div');
  info.className = 'meal-info';

  const nameEl = document.createElement('p');
  nameEl.className = 'meal-name';
  nameEl.textContent = meal.name;
  info.appendChild(nameEl);

  if (meal.tags && meal.tags.length > 0) {
    const tagRow = document.createElement('div');
    tagRow.className = 'tag-row';
    buildTagRow(tagRow, meal.tags);
    info.appendChild(tagRow);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'meal-delete';
  deleteBtn.setAttribute('aria-label', t.deleteMealAriaLabel(meal.name));
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(t.deleteMealConfirm(meal.name))) return;
    const meals = getMeals().filter((m) => m.id !== meal.id);
    saveMeals(meals);
    render();
  });

  li.appendChild(info);
  li.appendChild(deleteBtn);
  return li;
}

function render() {
  const meals = getMeals();

  mealList.innerHTML = '';

  if (meals.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent = t.emptyStateText;
    suggestBtn.disabled = true;
  } else {
    emptyState.hidden = true;
    suggestBtn.disabled = false;
  }

  for (const meal of meals) {
    mealList.appendChild(buildMealCard(meal));
  }

  suggestionResult.hidden = true;
  suggestEmpty.hidden = true;
}

applyStaticTranslations();
render();
