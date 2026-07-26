const STORAGE_KEY = 'petHealthLog:pets:v1';

function getPets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePets(pets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const petTabs = document.getElementById('pet-tabs');
const addPetBtn = document.getElementById('add-pet-btn');
const addPetSection = document.getElementById('add-pet-section');
const addPetForm = document.getElementById('add-pet-form');
const petNameInput = document.getElementById('pet-name-input');
const petSpeciesInput = document.getElementById('pet-species-input');
const petUnitSelect = document.getElementById('pet-unit-select');
const petErrorMsg = document.getElementById('pet-error-msg');
const cancelAddPetBtn = document.getElementById('cancel-add-pet-btn');
const noPetsState = document.getElementById('no-pets-state');
const petDetail = document.getElementById('pet-detail');

const chartContainer = document.getElementById('chart-container');
const chartEmpty = document.getElementById('chart-empty');

const addEntryForm = document.getElementById('add-entry-form');
const entryDateInput = document.getElementById('entry-date-input');
const entryWeightInput = document.getElementById('entry-weight-input');
const entryNoteInput = document.getElementById('entry-note-input');
const entryErrorMsg = document.getElementById('entry-error-msg');
const unitLabel = document.getElementById('unit-label');

const entryList = document.getElementById('entry-list');
const noEntriesState = document.getElementById('no-entries-state');

let selectedPetId = null;

function showPetError(message) {
  petErrorMsg.textContent = message;
  petErrorMsg.hidden = false;
}

function clearPetError() {
  petErrorMsg.textContent = '';
  petErrorMsg.hidden = true;
}

function showEntryError(message) {
  entryErrorMsg.textContent = message;
  entryErrorMsg.hidden = false;
}

function clearEntryError() {
  entryErrorMsg.textContent = '';
  entryErrorMsg.hidden = true;
}

addPetBtn.addEventListener('click', () => {
  clearPetError();
  addPetForm.reset();
  petUnitSelect.value = 'kg';
  addPetSection.hidden = false;
  petNameInput.focus();
});

cancelAddPetBtn.addEventListener('click', () => {
  addPetSection.hidden = true;
  clearPetError();
});

addPetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearPetError();

  const name = petNameInput.value.trim();
  if (!name) {
    showPetError('Please enter a name for your pet.');
    return;
  }

  const pets = getPets();
  const newPet = {
    id: String(Date.now()),
    name,
    species: petSpeciesInput.value.trim(),
    unit: petUnitSelect.value,
    entries: [],
  };
  pets.push(newPet);
  savePets(pets);
  selectedPetId = newPet.id;
  addPetSection.hidden = true;
  render();
});

function buildPetTabs(pets) {
  petTabs.innerHTML = '';
  for (const pet of pets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pet-tab' + (pet.id === selectedPetId ? ' active' : '');
    btn.textContent = pet.name;
    btn.addEventListener('click', () => {
      selectedPetId = pet.id;
      render();
    });
    petTabs.appendChild(btn);
  }
}

function buildChart(entries, unit) {
  const points = entries
    .filter((e) => typeof e.weight === 'number')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length < 2) {
    chartContainer.innerHTML = '';
    chartEmpty.hidden = false;
    return;
  }
  chartEmpty.hidden = true;

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const width = 300;
  const height = 130;
  const offsetX = 16;
  const offsetY = 26;
  const chartWidth = width - offsetX * 2;
  const chartHeight = 68;

  const coords = points.map((p, i) => {
    const x = offsetX + (points.length === 1 ? 0 : (i / (points.length - 1)) * chartWidth);
    const y = offsetY + chartHeight - ((p.weight - minW) / range) * chartHeight;
    return { x, y, weight: p.weight, date: p.date };
  });

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Weight trend chart');

  const polyline = document.createElementNS(svgNs, 'polyline');
  polyline.setAttribute('points', coords.map((c) => `${c.x},${c.y}`).join(' '));
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', '#2F9C95');
  polyline.setAttribute('stroke-width', '2.5');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  coords.forEach((c, i) => {
    const circle = document.createElementNS(svgNs, 'circle');
    circle.setAttribute('cx', String(c.x));
    circle.setAttribute('cy', String(c.y));
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', '#2F9C95');
    svg.appendChild(circle);

    if (i === 0 || i === coords.length - 1) {
      const label = document.createElementNS(svgNs, 'text');
      label.setAttribute('x', String(c.x));
      label.setAttribute('y', String(c.y - 8));
      label.setAttribute('text-anchor', i === 0 ? 'start' : 'end');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-weight', '800');
      label.setAttribute('fill', '#3D3229');
      label.textContent = `${c.weight} ${unit}`;
      svg.appendChild(label);

      const dateLabel = document.createElementNS(svgNs, 'text');
      dateLabel.setAttribute('x', String(c.x));
      dateLabel.setAttribute('y', String(height - 8));
      dateLabel.setAttribute('text-anchor', i === 0 ? 'start' : 'end');
      dateLabel.setAttribute('font-size', '9');
      dateLabel.setAttribute('fill', '#8C7F70');
      dateLabel.textContent = formatDate(c.date);
      svg.appendChild(dateLabel);
    }
  });

  chartContainer.innerHTML = '';
  chartContainer.appendChild(svg);
}

function buildEntryCard(pet, entry) {
  const li = document.createElement('li');
  li.className = 'entry-card';

  const main = document.createElement('div');
  main.className = 'entry-main';

  const dateEl = document.createElement('p');
  dateEl.className = 'entry-date';
  dateEl.textContent = formatDate(entry.date);
  main.appendChild(dateEl);

  if (typeof entry.weight === 'number') {
    const weightEl = document.createElement('p');
    weightEl.className = 'entry-weight';
    weightEl.textContent = `${entry.weight} ${pet.unit}`;
    main.appendChild(weightEl);
  }

  if (entry.note) {
    const noteEl = document.createElement('p');
    noteEl.className = 'entry-note';
    noteEl.textContent = entry.note;
    main.appendChild(noteEl);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'entry-delete';
  deleteBtn.setAttribute('aria-label', `Delete entry from ${formatDate(entry.date)}`);
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    const pets = getPets();
    const target = pets.find((p) => p.id === pet.id);
    if (target) {
      target.entries = target.entries.filter((e) => e.id !== entry.id);
      savePets(pets);
    }
    render();
  });

  li.appendChild(main);
  li.appendChild(deleteBtn);
  return li;
}

addEntryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearEntryError();

  const date = entryDateInput.value || todayISO();
  const weightRaw = entryWeightInput.value.trim();
  const note = entryNoteInput.value.trim();

  if (!weightRaw && !note) {
    showEntryError('Please enter a weight or a note.');
    return;
  }

  const weight = weightRaw ? Number(weightRaw) : null;
  if (weightRaw && (Number.isNaN(weight) || weight < 0)) {
    showEntryError('Please enter a valid weight.');
    return;
  }

  const pets = getPets();
  const target = pets.find((p) => p.id === selectedPetId);
  if (!target) return;

  target.entries.push({
    id: String(Date.now()),
    date,
    weight,
    note,
    createdAt: new Date().toISOString(),
  });
  savePets(pets);
  addEntryForm.reset();
  render();
});

function render() {
  const pets = getPets();

  if (pets.length === 0) {
    petTabs.innerHTML = '';
    noPetsState.hidden = false;
    petDetail.hidden = true;
    return;
  }
  noPetsState.hidden = true;

  if (!selectedPetId || !pets.some((p) => p.id === selectedPetId)) {
    selectedPetId = pets[0].id;
  }

  buildPetTabs(pets);

  const pet = pets.find((p) => p.id === selectedPetId);
  petDetail.hidden = false;
  unitLabel.textContent = pet.unit;
  entryDateInput.value = todayISO();
  clearEntryError();

  buildChart(pet.entries, pet.unit);

  const sortedEntries = [...pet.entries].sort((a, b) => b.date.localeCompare(a.date));
  entryList.innerHTML = '';
  if (sortedEntries.length === 0) {
    noEntriesState.hidden = false;
  } else {
    noEntriesState.hidden = true;
    for (const entry of sortedEntries) {
      entryList.appendChild(buildEntryCard(pet, entry));
    }
  }
}

render();
