// ===========================
// QR Code Generator - script
// ===========================

const MAX_LENGTH = 800;
const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// 多言語対応（プラットフォーム側の言語設定をlocalStorage経由で共有）
// -----------------------

const STRINGS = {
  en: {
    title: 'QR Code Generator',
    subtitle: 'text / URL → downloadable QR',
    textOrUrlLabel: 'Text or URL',
    textOrUrlPlaceholder: 'Enter text or a URL',
    generate: 'Generate',
    downloadPng: 'Download PNG',
    emptyStateMsg: 'Your QR code will appear here.',
    libraryFailedToLoad: 'QR code library failed to load. Check your connection and reload the page.',
    enterTextOrUrl: 'Please enter some text or a URL.',
    textTooLong: function (len, max) { return 'Text is too long (' + len + '/' + max + ' characters). Please shorten it.'; },
    couldNotGenerate: 'Could not generate a QR code for this input. Try shorter text.',
    qrGenerated: 'QR code generated.',
    pngDownloaded: 'PNG downloaded.',
  },
  ja: {
    title: 'QRコード生成',
    subtitle: 'テキスト・URL → ダウンロード可能なQRコード',
    textOrUrlLabel: 'テキストまたはURL',
    textOrUrlPlaceholder: 'テキストまたはURLを入力',
    generate: '生成',
    downloadPng: 'PNGをダウンロード',
    emptyStateMsg: 'ここにQRコードが表示されます。',
    libraryFailedToLoad: 'QRコードライブラリの読み込みに失敗しました。接続を確認してページを再読み込みしてください。',
    enterTextOrUrl: 'テキストまたはURLを入力してください。',
    textTooLong: function (len, max) { return 'テキストが長すぎます（' + len + '/' + max + '文字）。短くしてください。'; },
    couldNotGenerate: 'この入力ではQRコードを生成できませんでした。テキストを短くしてお試しください。',
    qrGenerated: 'QRコードを生成しました。',
    pngDownloaded: 'PNGをダウンロードしました。',
  },
  es: {
    title: 'Generador de códigos QR',
    subtitle: 'texto / URL → QR descargable',
    textOrUrlLabel: 'Texto o URL',
    textOrUrlPlaceholder: 'Introduce texto o una URL',
    generate: 'Generar',
    downloadPng: 'Descargar PNG',
    emptyStateMsg: 'Tu código QR aparecerá aquí.',
    libraryFailedToLoad: 'No se pudo cargar la librería de códigos QR. Comprueba tu conexión y recarga la página.',
    enterTextOrUrl: 'Introduce texto o una URL.',
    textTooLong: function (len, max) { return 'El texto es demasiado largo (' + len + '/' + max + ' caracteres). Acórtalo.'; },
    couldNotGenerate: 'No se pudo generar un código QR para esta entrada. Prueba con un texto más corto.',
    qrGenerated: 'Código QR generado.',
    pngDownloaded: 'PNG descargado.',
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

const qrForm = document.getElementById('qrForm');
const qrInput = document.getElementById('qrInput');
const errorMsg = document.getElementById('errorMsg');
const statusMsg = document.getElementById('statusMsg');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrCanvas = document.getElementById('qrCanvas');
const emptyState = document.getElementById('emptyState');

let hasGenerated = false;

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
  qrInput.classList.add('has-error');
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.hidden = true;
  qrInput.classList.remove('has-error');
}

function setStatus(message) {
  statusMsg.textContent = message;
}

function libraryAvailable() {
  return typeof qrcode !== 'undefined';
}

function drawQrToCanvas(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const quietZone = 4;
  const cellSize = Math.max(2, Math.floor(260 / (moduleCount + quietZone * 2)));
  const size = cellSize * (moduleCount + quietZone * 2);

  qrCanvas.width = size;
  qrCanvas.height = size;

  const ctx = qrCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect((col + quietZone) * cellSize, (row + quietZone) * cellSize, cellSize, cellSize);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  applyStaticTranslations();

  if (!libraryAvailable()) {
    generateBtn.disabled = true;
    showError(t.libraryFailedToLoad);
  }
});

qrForm.addEventListener('submit', function (event) {
  event.preventDefault();
  clearError();

  const text = qrInput.value.trim();

  if (!text) {
    showError(t.enterTextOrUrl);
    return;
  }

  if (text.length > MAX_LENGTH) {
    showError(t.textTooLong(text.length, MAX_LENGTH));
    return;
  }

  if (!libraryAvailable()) {
    showError(t.libraryFailedToLoad);
    return;
  }

  try {
    drawQrToCanvas(text);
  } catch (err) {
    showError(t.couldNotGenerate);
    return;
  }

  emptyState.hidden = true;
  qrCanvas.hidden = false;
  downloadBtn.disabled = false;
  hasGenerated = true;
  setStatus(t.qrGenerated);
});

downloadBtn.addEventListener('click', function () {
  if (!hasGenerated) return;

  const dataUrl = qrCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'qr-code.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setStatus(t.pngDownloaded);
});
