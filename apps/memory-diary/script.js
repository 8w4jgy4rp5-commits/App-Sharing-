const STORAGE_KEY = 'memoryDiary:entries:v1';
const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.7;

function getEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function resizeImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const form = document.getElementById('entry-form');
const photoInput = document.getElementById('photo-input');
const previewWrap = document.getElementById('photo-preview-wrap');
const previewImg = document.getElementById('photo-preview');
const captionInput = document.getElementById('caption-input');
const dateInput = document.getElementById('date-input');
const topicInput = document.getElementById('topic-input');
const topicSuggestions = document.getElementById('topic-suggestions');
const topicFilters = document.getElementById('topic-filters');
const listEl = document.getElementById('entry-list');
const emptyState = document.getElementById('empty-state');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxDate = document.getElementById('lightbox-date');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxDelete = document.getElementById('lightbox-delete');

let pendingPhotoDataUrl = null;
let activeEntryId = null;
let activeTopicFilter = 'all';

dateInput.value = new Date().toISOString().slice(0, 10);

photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  if (!file) {
    previewWrap.hidden = true;
    pendingPhotoDataUrl = null;
    return;
  }
  try {
    pendingPhotoDataUrl = await resizeImage(file, MAX_DIMENSION, JPEG_QUALITY);
    previewImg.src = pendingPhotoDataUrl;
    previewWrap.hidden = false;
  } catch {
    alert('Could not read that image. Please try another photo.');
    photoInput.value = '';
    previewWrap.hidden = true;
    pendingPhotoDataUrl = null;
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!pendingPhotoDataUrl) {
    alert('Please choose a photo first.');
    return;
  }
  const entries = getEntries();
  entries.push({
    id: String(Date.now()),
    photo: pendingPhotoDataUrl,
    caption: captionInput.value.trim(),
    date: dateInput.value || new Date().toISOString().slice(0, 10),
    topic: topicInput.value.trim(),
  });
  saveEntries(entries);

  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  previewWrap.hidden = true;
  pendingPhotoDataUrl = null;

  render();
});

function getTopics(entries) {
  return [...new Set(entries.map((entry) => entry.topic).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function renderTopicSuggestions(topics) {
  topicSuggestions.innerHTML = '';
  for (const topic of topics) {
    const option = document.createElement('option');
    option.value = topic;
    topicSuggestions.appendChild(option);
  }
}

function renderTopicFilters(topics) {
  topicFilters.innerHTML = '';
  if (topics.length === 0) {
    topicFilters.hidden = true;
    return;
  }
  topicFilters.hidden = false;

  const options = ['all', ...topics];
  for (const topic of options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic-chip';
    btn.textContent = topic === 'all' ? 'All' : topic;
    btn.setAttribute('aria-pressed', String(topic === activeTopicFilter));
    if (topic === activeTopicFilter) btn.classList.add('active');
    btn.addEventListener('click', () => {
      activeTopicFilter = topic;
      render();
    });
    topicFilters.appendChild(btn);
  }
}

function render() {
  const allEntries = getEntries();
  const topics = getTopics(allEntries);

  renderTopicSuggestions(topics);
  if (activeTopicFilter !== 'all' && !topics.includes(activeTopicFilter)) {
    activeTopicFilter = 'all';
  }
  renderTopicFilters(topics);

  const entries = allEntries
    .filter((entry) => activeTopicFilter === 'all' || entry.topic === activeTopicFilter)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  listEl.innerHTML = '';

  if (entries.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('p').textContent =
      allEntries.length === 0
        ? 'No memories yet. Add your first favorite photo above.'
        : 'No memories in this topic yet.';
    return;
  }
  emptyState.hidden = true;

  for (const entry of entries) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open memory from ${formatDate(entry.date)}`);

    const img = document.createElement('img');
    img.src = entry.photo;
    img.alt = entry.caption || 'Favorite moment photo';
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'entry-card-body';

    const dateEl = document.createElement('p');
    dateEl.className = 'entry-date';
    dateEl.textContent = formatDate(entry.date);
    body.appendChild(dateEl);

    if (entry.topic) {
      const topicEl = document.createElement('span');
      topicEl.className = 'entry-topic';
      topicEl.textContent = entry.topic;
      body.appendChild(topicEl);
    }

    if (entry.caption) {
      const captionEl = document.createElement('p');
      captionEl.className = 'entry-caption';
      captionEl.textContent = entry.caption;
      body.appendChild(captionEl);
    }

    card.appendChild(body);

    const open = () => openLightbox(entry);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    listEl.appendChild(card);
  }
}

function openLightbox(entry) {
  activeEntryId = entry.id;
  lightboxImg.src = entry.photo;
  lightboxImg.alt = entry.caption || 'Favorite moment photo';
  lightboxCaption.textContent = entry.caption || '';
  lightboxCaption.hidden = !entry.caption;
  lightboxDate.textContent = entry.topic ? `${formatDate(entry.date)} · ${entry.topic}` : formatDate(entry.date);
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  activeEntryId = null;
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

lightboxDelete.addEventListener('click', () => {
  if (!activeEntryId) return;
  if (!confirm('Delete this memory? This cannot be undone.')) return;
  const entries = getEntries().filter((entry) => entry.id !== activeEntryId);
  saveEntries(entries);
  closeLightbox();
  render();
});

render();
