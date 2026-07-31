const PLACES_KEY = 'placePicks:places:v1';

function getPlaces() {
  const raw = localStorage.getItem(PLACES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePlaces(places) {
  localStorage.setItem(PLACES_KEY, JSON.stringify(places));
}

const placeForm = document.getElementById('place-form');
const nameInput = document.getElementById('place-name');
const recommenderInput = document.getElementById('place-recommender');
const noteInput = document.getElementById('place-note');
const formError = document.getElementById('form-error');
const placeList = document.getElementById('place-list');
const emptyState = document.getElementById('empty-state');

function renderPlaces() {
  const places = getPlaces();

  placeList.innerHTML = '';

  if (places.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  for (const place of places) {
    const li = document.createElement('li');
    li.className = 'place-entry' + (place.visited ? ' is-visited' : '');

    const top = document.createElement('div');
    top.className = 'place-top';

    const nameEl = document.createElement('div');
    nameEl.className = 'place-name';
    nameEl.textContent = place.name;
    top.appendChild(nameEl);

    if (place.visited) {
      const badge = document.createElement('span');
      badge.className = 'visited-badge';
      badge.textContent = 'Visited';
      top.appendChild(badge);
    }

    li.appendChild(top);

    if (place.recommendedBy) {
      const metaEl = document.createElement('div');
      metaEl.className = 'place-meta';
      metaEl.textContent = `Recommended by ${place.recommendedBy}`;
      li.appendChild(metaEl);
    }

    if (place.note) {
      const noteEl = document.createElement('div');
      noteEl.className = 'place-note';
      noteEl.textContent = place.note;
      li.appendChild(noteEl);
    }

    const actions = document.createElement('div');
    actions.className = 'place-actions';

    const visitBtn = document.createElement('button');
    visitBtn.className = 'visit-btn';
    visitBtn.textContent = place.visited ? 'Mark as not visited' : 'Mark as visited';
    visitBtn.addEventListener('click', () => {
      toggleVisited(place.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'place-delete';
    deleteBtn.setAttribute('aria-label', `Delete ${place.name}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const remaining = getPlaces().filter((p) => p.id !== place.id);
      savePlaces(remaining);
      renderPlaces();
    });

    actions.appendChild(visitBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);

    placeList.appendChild(li);
  }
}

function toggleVisited(placeId) {
  const places = getPlaces();
  const place = places.find((p) => p.id === placeId);
  if (!place) return;
  place.visited = !place.visited;
  savePlaces(places);
  renderPlaces();
}

placeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.textContent = '';

  const name = nameInput.value.trim();
  if (!name) {
    formError.textContent = 'Please enter a place name.';
    return;
  }

  const places = getPlaces();
  places.push({
    id: crypto.randomUUID(),
    name,
    recommendedBy: recommenderInput.value.trim(),
    note: noteInput.value.trim(),
    visited: false,
  });
  savePlaces(places);

  placeForm.reset();
  renderPlaces();
});

renderPlaces();
