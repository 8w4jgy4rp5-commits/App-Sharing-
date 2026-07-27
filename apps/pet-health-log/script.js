const STORAGE_KEY = 'petHealthLog:pets:v1';
const ONBOARDING_KEY = 'petHealthLog:onboardingSeen:v1';
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'Pet Health Log',
    subtitle: "Track your pet's weight and health notes over time, so nothing gets forgotten.",
    addPetBtn: '+ Add Pet',
    newPetHeading: 'New Pet',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Mochi',
    speciesLabel: 'Species (optional)',
    speciesPlaceholder: 'e.g. Cat',
    weightUnitLabel: 'Weight unit',
    unitKg: 'kg',
    unitLb: 'lb',
    addPetSubmit: 'Add Pet',
    cancel: 'Cancel',
    noPetsMessage: 'No pets yet. Add your first pet above.',
    weightTrendHeading: 'Weight Trend',
    chartEmptyMessage: 'Log at least two weight entries to see a trend graph.',
    newEntryHeading: 'New Entry',
    dateLabel: 'Date',
    weightLabelPrefix: 'Weight (',
    weightLabelSuffix: ', optional)',
    weightPlaceholder: 'e.g. 4.2',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'e.g. Seemed less energetic today',
    addEntrySubmit: 'Add Entry',
    historyHeading: 'History',
    noEntriesMessage: 'No entries yet. Log your first weight or note above.',
    howToUse: 'How to Use',
    close: 'Close',
    back: '← Back',
    next: 'Next →',
    gotIt: 'Got it',
    petNameRequired: 'Please enter a name for your pet.',
    entryRequired: 'Please enter a weight or a note.',
    invalidWeight: 'Please enter a valid weight.',
    confirmDeleteEntry: 'Delete this entry? This cannot be undone.',
    deleteEntryAriaLabel: function (dateStr) { return 'Delete entry from ' + dateStr; },
    weightTrendChartAriaLabel: 'Weight trend chart',
    onboardingSlides: [
      {
        title: 'Welcome to Pet Health Log',
        text: "Keep track of each pet's weight and health notes over time, right in this browser.",
      },
      {
        title: 'Add a pet',
        text: 'Tap "+ Add Pet" above to create a profile, then log entries with a date, weight, and/or a note.',
      },
      {
        title: 'Watch the trend',
        text: "Once a pet has at least two weight entries, a simple chart appears showing how their weight is changing.",
      },
      {
        title: 'Switch between pets',
        text: 'Use the tabs at the top to jump between pets — each one keeps its own separate history.',
      },
    ],
  },
  ja: {
    title: 'ペット健康記録',
    subtitle: 'ペットの体重や健康メモを記録して、忘れないように管理できます。',
    addPetBtn: '+ ペットを追加',
    newPetHeading: '新しいペット',
    nameLabel: '名前',
    namePlaceholder: '例: もち',
    speciesLabel: '種類（任意）',
    speciesPlaceholder: '例: 猫',
    weightUnitLabel: '体重の単位',
    unitKg: 'kg',
    unitLb: 'lb',
    addPetSubmit: 'ペットを追加',
    cancel: 'キャンセル',
    noPetsMessage: 'ペットがまだ登録されていません。上から最初のペットを追加しましょう。',
    weightTrendHeading: '体重の推移',
    chartEmptyMessage: '体重の記録が2件以上になると、推移グラフが表示されます。',
    newEntryHeading: '新しい記録',
    dateLabel: '日付',
    weightLabelPrefix: '体重（',
    weightLabelSuffix: '、任意）',
    weightPlaceholder: '例: 4.2',
    noteLabel: 'メモ（任意）',
    notePlaceholder: '例: 今日は元気がなさそうだった',
    addEntrySubmit: '記録を追加',
    historyHeading: '履歴',
    noEntriesMessage: 'まだ記録がありません。上から体重やメモを記録しましょう。',
    howToUse: '使い方',
    close: '閉じる',
    back: '← 戻る',
    next: '次へ →',
    gotIt: 'わかりました',
    petNameRequired: 'ペットの名前を入力してください。',
    entryRequired: '体重またはメモを入力してください。',
    invalidWeight: '正しい体重を入力してください。',
    confirmDeleteEntry: 'この記録を削除しますか？この操作は取り消せません。',
    deleteEntryAriaLabel: function (dateStr) { return dateStr + 'の記録を削除'; },
    weightTrendChartAriaLabel: '体重推移グラフ',
    onboardingSlides: [
      {
        title: 'ペット健康記録へようこそ',
        text: 'このブラウザ上で、ペットごとの体重や健康メモを時系列で記録できます。',
      },
      {
        title: 'ペットを追加しよう',
        text: '上の「+ ペットを追加」をタップしてプロフィールを作成し、日付・体重・メモを記録しましょう。',
      },
      {
        title: '推移を確認しよう',
        text: '体重の記録が2件以上になると、変化がわかるシンプルなグラフが表示されます。',
      },
      {
        title: 'ペットを切り替えよう',
        text: '上部のタブを使ってペットを切り替えられます。それぞれ別々の履歴が保存されます。',
      },
    ],
  },
  es: {
    title: 'Registro de Salud de Mascotas',
    subtitle: 'Registra el peso y las notas de salud de tu mascota a lo largo del tiempo, para que nada se olvide.',
    addPetBtn: '+ Añadir mascota',
    newPetHeading: 'Nueva mascota',
    nameLabel: 'Nombre',
    namePlaceholder: 'ej. Mochi',
    speciesLabel: 'Especie (opcional)',
    speciesPlaceholder: 'ej. Gato',
    weightUnitLabel: 'Unidad de peso',
    unitKg: 'kg',
    unitLb: 'lb',
    addPetSubmit: 'Añadir mascota',
    cancel: 'Cancelar',
    noPetsMessage: 'Aún no hay mascotas. Añade tu primera mascota arriba.',
    weightTrendHeading: 'Evolución del peso',
    chartEmptyMessage: 'Registra al menos dos pesos para ver un gráfico de evolución.',
    newEntryHeading: 'Nuevo registro',
    dateLabel: 'Fecha',
    weightLabelPrefix: 'Peso (',
    weightLabelSuffix: ', opcional)',
    weightPlaceholder: 'ej. 4.2',
    noteLabel: 'Nota (opcional)',
    notePlaceholder: 'ej. Hoy la noté con menos energía',
    addEntrySubmit: 'Añadir registro',
    historyHeading: 'Historial',
    noEntriesMessage: 'Aún no hay registros. Anota el primer peso o nota arriba.',
    howToUse: 'Cómo usar',
    close: 'Cerrar',
    back: '← Atrás',
    next: 'Siguiente →',
    gotIt: 'Entendido',
    petNameRequired: 'Por favor, introduce un nombre para tu mascota.',
    entryRequired: 'Por favor, introduce un peso o una nota.',
    invalidWeight: 'Por favor, introduce un peso válido.',
    confirmDeleteEntry: '¿Eliminar este registro? Esta acción no se puede deshacer.',
    deleteEntryAriaLabel: function (dateStr) { return 'Eliminar registro del ' + dateStr; },
    weightTrendChartAriaLabel: 'Gráfico de evolución del peso',
    onboardingSlides: [
      {
        title: 'Bienvenido a Registro de Salud de Mascotas',
        text: 'Lleva un seguimiento del peso y las notas de salud de cada mascota, todo en este navegador.',
      },
      {
        title: 'Añade una mascota',
        text: 'Toca "+ Añadir mascota" arriba para crear un perfil y luego registra entradas con fecha, peso y/o una nota.',
      },
      {
        title: 'Observa la evolución',
        text: 'Cuando una mascota tenga al menos dos registros de peso, aparecerá un gráfico sencillo que muestra cómo cambia su peso.',
      },
      {
        title: 'Cambia entre mascotas',
        text: 'Usa las pestañas de arriba para cambiar entre mascotas — cada una guarda su propio historial.',
      },
    ],
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

const ONBOARDING_SLIDES = t.onboardingSlides;

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

const howToUseBtn = document.getElementById('how-to-use-btn');
const onboardingOverlay = document.getElementById('onboarding-overlay');
const onboardingTitle = document.getElementById('onboarding-title');
const onboardingText = document.getElementById('onboarding-text');
const onboardingDots = document.getElementById('onboarding-dots');
const onboardingPrev = document.getElementById('onboarding-prev');
const onboardingNext = document.getElementById('onboarding-next');
const onboardingClose = document.getElementById('onboarding-close');

let selectedPetId = null;
let onboardingIndex = 0;

function renderOnboardingSlide() {
  const slide = ONBOARDING_SLIDES[onboardingIndex];
  onboardingTitle.textContent = slide.title;
  onboardingText.textContent = slide.text;
  onboardingPrev.hidden = onboardingIndex === 0;
  onboardingNext.textContent = onboardingIndex === ONBOARDING_SLIDES.length - 1 ? t.gotIt : t.next;

  onboardingDots.innerHTML = '';
  ONBOARDING_SLIDES.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'onboarding-dot' + (i === onboardingIndex ? ' active' : '');
    onboardingDots.appendChild(dot);
  });
}

function openOnboarding() {
  onboardingIndex = 0;
  renderOnboardingSlide();
  onboardingOverlay.hidden = false;
}

function closeOnboarding() {
  onboardingOverlay.hidden = true;
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

onboardingNext.addEventListener('click', () => {
  if (onboardingIndex < ONBOARDING_SLIDES.length - 1) {
    onboardingIndex += 1;
    renderOnboardingSlide();
  } else {
    closeOnboarding();
  }
});

onboardingPrev.addEventListener('click', () => {
  if (onboardingIndex > 0) {
    onboardingIndex -= 1;
    renderOnboardingSlide();
  }
});

onboardingClose.addEventListener('click', closeOnboarding);
howToUseBtn.addEventListener('click', openOnboarding);

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
    showPetError(t.petNameRequired);
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
  svg.setAttribute('aria-label', t.weightTrendChartAriaLabel);

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
  deleteBtn.setAttribute('aria-label', t.deleteEntryAriaLabel(formatDate(entry.date)));
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => {
    if (!confirm(t.confirmDeleteEntry)) return;
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
    showEntryError(t.entryRequired);
    return;
  }

  const weight = weightRaw ? Number(weightRaw) : null;
  if (weightRaw && (Number.isNaN(weight) || weight < 0)) {
    showEntryError(t.invalidWeight);
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

applyStaticTranslations();
render();

if (!localStorage.getItem(ONBOARDING_KEY)) {
  openOnboarding();
}
