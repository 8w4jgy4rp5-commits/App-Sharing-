const STORAGE_KEY = 'routeNotes:routes:v1';

const TIME_SLOT_LABELS = {
  'weekday-morning': 'Weekday Morning',
  'weekday-evening': 'Weekday Evening',
  weekend: 'Weekend',
  other: 'Other',
};

function getRoutes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRoutes(routes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

const addForm = document.getElementById('add-form');
const timeSlotSelect = document.getElementById('time-slot-select');
const routeInput = document.getElementById('route-input');
const errorMsg = document.getElementById('error-msg');
const routeGroups = document.getElementById('route-groups');
const emptyState = document.getElementById('empty-state');

let editingId = null;

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.hidden = true;
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  const route = routeInput.value.trim();
  if (!route) {
    showError('Please describe the route.');
    return;
  }

  const routes = getRoutes();
  routes.unshift({
    id: String(Date.now()),
    timeSlot: timeSlotSelect.value,
    route,
    createdAt: new Date().toISOString(),
  });
  saveRoutes(routes);
  addForm.reset();
  render();
});

function buildRouteCard(item) {
  const li = document.createElement('li');
  li.className = 'route-card';

  if (editingId === item.id) {
    const form = document.createElement('form');
    form.className = 'route-edit-form';

    const textarea = document.createElement('textarea');
    textarea.rows = 2;
    textarea.maxLength = 400;
    textarea.value = item.route;
    textarea.setAttribute('aria-label', 'Edit route');

    const actions = document.createElement('div');
    actions.className = 'route-edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      render();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      if (!text) return;
      const routes = getRoutes();
      const target = routes.find((r) => r.id === item.id);
      if (target) {
        target.route = text;
        saveRoutes(routes);
      }
      editingId = null;
      render();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(textarea);
    form.appendChild(actions);
    li.appendChild(form);
    return li;
  }

  const textEl = document.createElement('p');
  textEl.className = 'route-text';
  textEl.textContent = item.route;
  li.appendChild(textEl);

  const actions = document.createElement('div');
  actions.className = 'route-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => {
    editingId = item.id;
    render();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => {
    if (!confirm('Delete this route? This cannot be undone.')) return;
    const routes = getRoutes().filter((r) => r.id !== item.id);
    saveRoutes(routes);
    render();
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(actions);

  return li;
}

function render() {
  const routes = getRoutes();
  routeGroups.innerHTML = '';

  if (routes.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent = 'No routes yet. Add your first one above.';
    return;
  }
  emptyState.hidden = true;

  for (const slot of Object.keys(TIME_SLOT_LABELS)) {
    const items = routes.filter((r) => r.timeSlot === slot);
    if (items.length === 0) continue;

    const group = document.createElement('div');
    group.className = 'time-group';

    const heading = document.createElement('h2');
    heading.className = 'section-title';
    heading.textContent = TIME_SLOT_LABELS[slot];
    group.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'route-list';
    for (const item of items) {
      list.appendChild(buildRouteCard(item));
    }
    group.appendChild(list);

    routeGroups.appendChild(group);
  }
}

render();
