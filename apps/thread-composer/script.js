const STORAGE_KEY = 'threadComposer:draft:v1';
const X_LIMIT = 280;
const URL_WEIGHT = 23;
const URL_REGEX = /https?:\/\/\S+/g;
const TEXT_FIELDS = ['hook', 'summary', 'points', 'reflection'];

// Ranges of code points X counts as "wide" (weight 2): CJK, Hiragana/Katakana,
// Hangul, fullwidth forms, and common emoji blocks. Half-width/Latin text is weight 1.
function isWideCodePoint(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1faff) ||
    (cp >= 0x2600 && cp <= 0x27bf)
  );
}

function weightedLength(text) {
  const urls = text.match(URL_REGEX) || [];
  const withoutUrls = text.replace(URL_REGEX, '');
  let count = urls.length * URL_WEIGHT;
  for (const ch of withoutUrls) {
    count += isWideCodePoint(ch.codePointAt(0)) ? 2 : 1;
  }
  return count;
}

function isValidHttpUrl(value) {
  return /^https?:\/\/\S+$/.test(value.trim());
}

// Reads the saved draft from localStorage; returns {} if missing or corrupted
function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function updateCounter(fieldName, text) {
  const count = weightedLength(text);
  const el = document.getElementById(`count-${fieldName}`);
  el.textContent = `${count} / ${X_LIMIT}`;
  el.classList.toggle('char-count--warning', count > X_LIMIT - 20 && count <= X_LIMIT);
  el.classList.toggle('char-count--error', count > X_LIMIT);

  const copyBtn = document.querySelector(`.copy-btn[data-target="${fieldName}"]`);
  if (copyBtn) copyBtn.disabled = text.trim() === '';

  return count;
}

function setupTextField(fieldName) {
  const textarea = document.getElementById(`input-${fieldName}`);
  const draft = loadDraft();
  if (draft[fieldName]) textarea.value = draft[fieldName];
  updateCounter(fieldName, textarea.value);

  textarea.addEventListener('input', () => {
    updateCounter(fieldName, textarea.value);
    const current = loadDraft();
    current[fieldName] = textarea.value;
    saveDraft(current);
  });
}

const urlInput = document.getElementById('input-url');
const urlErrorEl = document.getElementById('url-error');
const linkPreviewEl = document.getElementById('preview-link');

function renderLink() {
  const value = urlInput.value.trim();
  let text = '';
  if (value === '') {
    urlErrorEl.hidden = true;
  } else if (!isValidHttpUrl(value)) {
    urlErrorEl.hidden = false;
  } else {
    urlErrorEl.hidden = true;
    text = `元記事はこちら👇\n${value}`;
  }
  linkPreviewEl.textContent = text;
  updateCounter('link', text);
}

function setupLinkField() {
  const draft = loadDraft();
  if (draft.url) urlInput.value = draft.url;
  renderLink();

  urlInput.addEventListener('input', () => {
    renderLink();
    const current = loadDraft();
    current.url = urlInput.value;
    saveDraft(current);
  });
}

function getBlockText(fieldName) {
  if (fieldName === 'link') return linkPreviewEl.textContent;
  return document.getElementById(`input-${fieldName}`).value;
}

function setupCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = getBlockText(btn.dataset.target);
      if (!text.trim()) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      } catch {
        alert('Copy failed. Please select and copy the text manually.');
      }
    });
  });
}

function setupReset() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Clear all fields? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    TEXT_FIELDS.forEach((field) => {
      document.getElementById(`input-${field}`).value = '';
      updateCounter(field, '');
    });
    urlInput.value = '';
    renderLink();
  });
}

function setupHowTo() {
  const btn = document.getElementById('howto-btn');
  const modal = document.getElementById('howto-modal');
  const scrim = document.getElementById('howto-scrim');
  const closeBtn = document.getElementById('howto-close');

  function open() {
    modal.hidden = false;
    scrim.hidden = false;
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    scrim.hidden = true;
    btn.focus();
  }

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
}

TEXT_FIELDS.forEach(setupTextField);
setupLinkField();
setupCopyButtons();
setupReset();
setupHowTo();
