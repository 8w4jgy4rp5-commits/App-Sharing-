// Travel Planner
//
// All trip data lives in Supabase (per-user, via the shared user_app_data table),
// not localStorage — trips should follow the signed-in user across devices.
// Sign-in is required before the app is usable (see #authGate below).

const APP_SLUG = 'travel-planner';
const DATA_KEY = 'trips';

let currentUser = null;
let trips = [];
let currentTripId = null;

// ---- Auth ----

async function signIn() {
  const cleanUrl = window.location.origin + window.location.pathname;
  await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cleanUrl } });
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

function updateAuthUI() {
  document.getElementById('authGate').hidden = !!currentUser;
  document.getElementById('app').hidden = !currentUser;
  if (currentUser) loadTrips();
}

async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session ? session.user : null;
  updateAuthUI();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
    updateAuthUI();
  });
}

// ---- Cloud data ----

async function loadTrips() {
  document.getElementById('loadingIndicator').hidden = false;
  document.getElementById('mainContent').hidden = true;

  const remote = await AppSync.pull(APP_SLUG, DATA_KEY);
  trips = (remote && Array.isArray(remote.value)) ? remote.value : [];

  document.getElementById('loadingIndicator').hidden = true;
  document.getElementById('mainContent').hidden = false;
  showListView();
}

function saveTrips() {
  if (window.AppSync) AppSync.push(APP_SLUG, DATA_KEY, trips, Date.now());
}

// ---- Helpers ----

function genId() {
  return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
}

function formatYen(n) {
  return '¥' + Math.round(Number(n) || 0).toLocaleString('en-US');
}

function tripTotalCost(trip) {
  return trip.days.reduce((sum, d) => sum + (Number(d.cost) || 0), 0);
}

// Days sorted for display: chronological, with no-date days pushed to the end
// (stable sort keeps their original order relative to each other).
function sortedDays(trip) {
  return [...trip.days].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
}

function isHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// ---- View switching ----

function showListView() {
  currentTripId = null;
  document.getElementById('tripDetailView').hidden = true;
  document.getElementById('tripListView').hidden = false;
  renderTripList();
}

function showDetailView(tripId) {
  currentTripId = tripId;
  document.getElementById('tripListView').hidden = true;
  document.getElementById('tripDetailView').hidden = false;
  renderTripDetail();
}

// ---- Trip actions ----

function createTrip(name) {
  const trip = { id: genId(), name: name, createdAt: Date.now(), days: [] };
  trips.unshift(trip);
  saveTrips();
  renderTripList();
}

function renameTrip(tripId, name) {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  trip.name = trimmed;
  saveTrips();
}

function deleteTrip(tripId) {
  if (!window.confirm('Delete this trip? This cannot be undone.')) return;
  trips = trips.filter((t) => t.id !== tripId);
  saveTrips();
  if (currentTripId === tripId) {
    showListView();
  } else {
    renderTripList();
  }
}

// ---- Day actions ----

function addDay(trip) {
  trip.days.push({
    id: genId(),
    date: '',
    location: '',
    memo: '',
    transport: '',
    cost: 0,
    accommodation: '',
    links: []
  });
  saveTrips();
  renderTripDetail();
}

function deleteDay(trip, dayId) {
  if (!window.confirm('Delete this day? This cannot be undone.')) return;
  trip.days = trip.days.filter((d) => d.id !== dayId);
  saveTrips();
  renderTripDetail();
}

function copyPreviousAccommodation(trip, day) {
  const sorted = sortedDays(trip);
  const index = sorted.findIndex((d) => d.id === day.id);
  if (index <= 0) return;
  day.accommodation = sorted[index - 1].accommodation;
  saveTrips();
  renderTripDetail();
}

// ---- Link actions ----

function addLink(trip, day) {
  day.links.push({ id: genId(), label: '', url: '' });
  saveTrips();
  renderTripDetail();
}

function removeLink(trip, day, linkId) {
  day.links = day.links.filter((l) => l.id !== linkId);
  saveTrips();
  renderTripDetail();
}

// ---- Rendering: trip list ----

function renderTripList() {
  const list = document.getElementById('tripList');
  const emptyState = document.getElementById('tripsEmptyState');
  clearChildren(list);

  if (trips.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  trips.forEach((trip) => list.appendChild(createTripCard(trip)));
}

function createTripCard(trip) {
  const card = document.createElement('div');
  card.className = 'trip-card';

  const main = document.createElement('div');
  main.className = 'trip-card-main';

  const nameRow = document.createElement('div');
  nameRow.className = 'trip-card-name-row';

  const nameEl = document.createElement('p');
  nameEl.className = 'trip-card-name';
  nameEl.textContent = trip.name;
  nameRow.appendChild(nameEl);
  main.appendChild(nameRow);

  const meta = document.createElement('p');
  meta.className = 'trip-card-meta';
  const dayCount = trip.days.length;
  meta.textContent = dayCount + (dayCount === 1 ? ' day' : ' days') + ' · ' + formatYen(tripTotalCost(trip));
  main.appendChild(meta);

  main.addEventListener('click', () => showDetailView(trip.id));

  const actions = document.createElement('div');
  actions.className = 'trip-card-actions';

  const renameBtn = document.createElement('button');
  renameBtn.type = 'button';
  renameBtn.className = 'icon-btn';
  renameBtn.textContent = '✏️';
  renameBtn.setAttribute('aria-label', 'Rename trip');
  renameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startRenameTrip(nameRow, nameEl, trip);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn danger';
  deleteBtn.textContent = '🗑️';
  deleteBtn.setAttribute('aria-label', 'Delete trip');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTrip(trip.id);
  });

  actions.appendChild(renameBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(main);
  card.appendChild(actions);
  return card;
}

function startRenameTrip(nameRow, nameEl, trip) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'trip-card-name-input';
  input.value = trip.name;

  const finish = () => {
    renameTrip(trip.id, input.value);
    renderTripList();
  };

  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
  input.addEventListener('blur', finish);

  nameRow.replaceChild(input, nameEl);
  input.focus();
  input.select();
}

// ---- Rendering: trip detail ----

function renderTripDetail() {
  const trip = trips.find((t) => t.id === currentTripId);
  if (!trip) {
    showListView();
    return;
  }

  const nameInput = document.getElementById('tripNameInput');
  nameInput.value = trip.name;
  nameInput.onblur = () => renameTrip(trip.id, nameInput.value);

  document.getElementById('tripTotalCost').textContent = formatYen(tripTotalCost(trip));

  const dayList = document.getElementById('dayList');
  clearChildren(dayList);

  const sorted = sortedDays(trip);

  if (sorted.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'day-empty-state';
    empty.textContent = 'No days yet. Add your first day below!';
    dayList.appendChild(empty);
  } else {
    sorted.forEach((day, index) => {
      dayList.appendChild(createDayCard(trip, day, index, sorted));
    });
  }

  document.getElementById('addDayBtn').onclick = () => addDay(trip);
  document.getElementById('deleteTripBtn').onclick = () => deleteTrip(trip.id);
}

function createDayCard(trip, day, index, sorted) {
  const card = document.createElement('div');
  card.className = 'day-card';

  // Header: "Day N" + subtotal + delete
  const header = document.createElement('div');
  header.className = 'day-card-header';

  const title = document.createElement('span');
  title.className = 'day-card-title';
  title.textContent = 'Day ' + (index + 1);
  const subtotal = document.createElement('span');
  subtotal.className = 'day-card-subtotal';
  subtotal.textContent = formatYen(day.cost);
  title.appendChild(subtotal);
  header.appendChild(title);

  const deleteDayBtn = document.createElement('button');
  deleteDayBtn.type = 'button';
  deleteDayBtn.className = 'icon-btn danger';
  deleteDayBtn.textContent = '🗑️';
  deleteDayBtn.setAttribute('aria-label', 'Delete day');
  deleteDayBtn.addEventListener('click', () => deleteDay(trip, day.id));
  header.appendChild(deleteDayBtn);

  card.appendChild(header);

  // Date + Location
  const row1 = document.createElement('div');
  row1.className = 'day-card-row';
  row1.appendChild(makeField('Date', 'date', day.date, (val) => { day.date = val; saveTrips(); renderTripDetail(); }));
  row1.appendChild(makeField('Location', 'text', day.location, (val) => { day.location = val; saveTrips(); }, 'e.g. Barcelona'));
  card.appendChild(row1);

  // Memo
  card.appendChild(makeField('Plans / notes', 'textarea', day.memo, (val) => { day.memo = val; saveTrips(); }, 'What are you doing this day?'));

  // Transport + Cost
  const row2 = document.createElement('div');
  row2.className = 'day-card-row';
  row2.appendChild(makeField('Transport', 'text', day.transport, (val) => { day.transport = val; saveTrips(); }, 'e.g. Train, rental car'));
  row2.appendChild(makeField('Cost (JPY)', 'number', day.cost, (val) => {
    day.cost = Number(val) || 0;
    saveTrips();
    // Update totals in place instead of a full re-render, so focus isn't stolen
    // from whatever field the user moves to right after editing cost.
    subtotal.textContent = formatYen(day.cost);
    document.getElementById('tripTotalCost').textContent = formatYen(tripTotalCost(trip));
  }));
  card.appendChild(row2);

  // Accommodation + copy button
  const accRow = document.createElement('div');
  accRow.className = 'accommodation-row';
  accRow.appendChild(makeField('Accommodation', 'text', day.accommodation, (val) => { day.accommodation = val; saveTrips(); }, 'e.g. Hotel Central'));
  if (index > 0) {
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy previous day';
    copyBtn.addEventListener('click', () => copyPreviousAccommodation(trip, day));
    accRow.appendChild(copyBtn);
  }
  card.appendChild(accRow);

  // Links
  card.appendChild(createLinksSection(trip, day));

  return card;
}

let fieldIdCounter = 0;

function makeField(labelText, type, value, onCommit, placeholder) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const id = 'field-' + (fieldIdCounter++);

  const label = document.createElement('label');
  label.textContent = labelText;
  label.setAttribute('for', id);
  group.appendChild(label);

  const input = type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
  if (type !== 'textarea') input.type = type;
  if (type === 'number') input.min = '0';
  if (placeholder) input.placeholder = placeholder;
  input.id = id;
  input.value = value || (type === 'number' ? 0 : '');

  const eventName = (type === 'date' || type === 'number') ? 'change' : 'input';
  input.addEventListener(eventName, () => onCommit(input.value));

  group.appendChild(input);
  return group;
}

function createLinksSection(trip, day) {
  const section = document.createElement('div');
  section.className = 'links-section';

  const label = document.createElement('span');
  label.className = 'links-label';
  label.textContent = 'Related links';
  section.appendChild(label);

  day.links.forEach((link) => {
    section.appendChild(createLinkRow(trip, day, link));
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-link-btn';
  addBtn.textContent = '+ Add link';
  addBtn.addEventListener('click', () => addLink(trip, day));
  section.appendChild(addBtn);

  return section;
}

function createLinkRow(trip, day, link) {
  const row = document.createElement('div');
  row.className = 'link-row';

  const fields = document.createElement('div');
  fields.className = 'link-row-fields';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'link-label-input';
  labelInput.placeholder = 'Label (e.g. Hotel booking)';
  labelInput.setAttribute('aria-label', 'Link label');
  labelInput.value = link.label;
  labelInput.addEventListener('input', () => { link.label = labelInput.value; saveTrips(); });

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'link-url-input';
  urlInput.placeholder = 'https://...';
  urlInput.setAttribute('aria-label', 'Link URL');
  urlInput.value = link.url;

  const error = document.createElement('span');
  error.className = 'field-error';
  error.hidden = true;
  error.textContent = 'Only http:// or https:// links are allowed';

  urlInput.addEventListener('blur', () => {
    const val = urlInput.value.trim();
    if (val === '') {
      link.url = '';
      error.hidden = true;
      saveTrips();
      return;
    }
    if (!isHttpUrl(val)) {
      error.hidden = false;
      urlInput.value = link.url || '';
      return;
    }
    error.hidden = true;
    link.url = val;
    saveTrips();
    renderTripDetail();
  });

  fields.appendChild(labelInput);
  fields.appendChild(urlInput);
  row.appendChild(fields);

  if (link.url && isHttpUrl(link.url)) {
    const openLink = document.createElement('a');
    openLink.href = link.url;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.className = 'link-open';
    openLink.textContent = 'Open ↗';
    row.appendChild(openLink);
  }

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'icon-btn danger';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', 'Remove link');
  removeBtn.addEventListener('click', () => removeLink(trip, day, link.id));
  row.appendChild(removeBtn);

  const wrapper = document.createElement('div');
  wrapper.appendChild(row);
  wrapper.appendChild(error);
  return wrapper;
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('signInBtn').addEventListener('click', signIn);
  document.getElementById('signOutBtn').addEventListener('click', signOut);
  document.getElementById('backToListBtn').addEventListener('click', showListView);

  document.getElementById('newTripForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newTripName');
    const name = input.value.trim();
    if (!name) return;
    createTrip(name);
    input.value = '';
  });

  initAuth();
});
