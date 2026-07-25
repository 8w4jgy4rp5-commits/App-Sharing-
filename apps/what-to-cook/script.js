const STORAGE_KEY = 'whatToCook:meals:v1';

const TAG_LABELS = {
  quick: 'Quick',
  vegetarian: 'Vegetarian',
  oven: 'Needs Oven',
  leftovers: 'Uses Leftovers',
  comfort: 'Comfort Food',
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
        ? 'Add some go-to meals below first.'
        : "No saved meals match that filter yet.";
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
    showError('Please enter a meal name.');
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
  deleteBtn.setAttribute('aria-label', `Delete meal "${meal.name}"`);
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(`Delete "${meal.name}"? This cannot be undone.`)) return;
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
    emptyState.querySelector('p').textContent = 'No meals yet. Add your first go-to meal above.';
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

render();
