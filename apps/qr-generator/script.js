// ===========================
// QR Code Generator - script
// ===========================

const MAX_LENGTH = 800;

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
  if (!libraryAvailable()) {
    generateBtn.disabled = true;
    showError('QR code library failed to load. Check your connection and reload the page.');
  }
});

qrForm.addEventListener('submit', function (event) {
  event.preventDefault();
  clearError();

  const text = qrInput.value.trim();

  if (!text) {
    showError('Please enter some text or a URL.');
    return;
  }

  if (text.length > MAX_LENGTH) {
    showError('Text is too long (' + text.length + '/' + MAX_LENGTH + ' characters). Please shorten it.');
    return;
  }

  if (!libraryAvailable()) {
    showError('QR code library failed to load. Check your connection and reload the page.');
    return;
  }

  try {
    drawQrToCanvas(text);
  } catch (err) {
    showError('Could not generate a QR code for this input. Try shorter text.');
    return;
  }

  emptyState.hidden = true;
  qrCanvas.hidden = false;
  downloadBtn.disabled = false;
  hasGenerated = true;
  setStatus('QR code generated.');
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
  setStatus('PNG downloaded.');
});
