/* ===========================================================
   Rate Pocket — one-stop currency check for travellers.

   Rates come from a free, key-less API and are cached in
   localStorage, so the app still answers with no signal.
   Everything else (the pair, the amount, saved pairs, any
   hand-typed rate) lives in the synced prefs document.
   =========================================================== */

const LANG_KEY = 'cobbleworks:lang:v1';
const APP_SLUG = 'rate-pocket';
const RATES_KEY = 'ratePocket:rates:v1';
const PREFS_FALLBACK_KEY = 'ratePocket:prefs:v1';

const STALE_MS = 6 * 60 * 60 * 1000; // refresh quietly if older than 6h
const LIVE_MS = 24 * 60 * 60 * 1000; // still counts as "live" for a day

// -----------------------
// Localization (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Rate Pocket',
    statusChecking: 'Checking…',
    statusLive: 'Live',
    statusSaved: 'Saved rate',
    statusManual: 'Your rate',
    statusNone: 'No rate',
    ratePending: 'No rate yet',
    rateUpdated: 'Updated {date} · saved on this phone',
    rateManual: 'Rate you typed in · tap “Back to live rate” to undo',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    refreshFailed: 'Could not reach the rate service. The saved rate is still being used.',
    refreshOffline: 'No connection. Using the rate saved on this phone.',
    pairLabel: 'From / To',
    fromLabel: 'Your currency',
    toLabel: 'Currency you are spending',
    swapLabel: 'Swap currencies',
    amountLabel: 'Amount on the price tag',
    amountPlaceholder: 'e.g. 1200',
    amountError: 'Type a number, like 1200.',
    outLabel: 'That is',
    outHint: 'Type an amount above',
    outNoRate: 'No rate for this pair yet',
    outIs: '{amount} {code}',
    emptyTitle: 'No rate saved on this phone yet.',
    emptyBody: 'Tap Refresh while you have signal, or open “Set the rate by hand” below and type the rate from the airport board.',
    glanceLabel: 'Quick glance',
    glanceEmpty: 'The table fills in once there is a rate.',
    savedLabel: 'Saved pairs',
    savedEmpty: 'Nothing saved yet. Tap “Save this pair” to keep the one you check most.',
    savePair: 'Save this pair',
    savedPair: 'Saved',
    removePair: 'Remove {pair}',
    usePair: 'Use {pair}',
    manualSummary: 'Set the rate by hand',
    manualHint: 'Useful when you have no signal, or when the counter gives you a worse rate than the market one.',
    manualLabel: 'Rate',
    manualPlaceholder: 'e.g. 150',
    manualSave: 'Use this rate',
    manualClear: 'Back to live rate',
    manualError: 'Type a rate bigger than zero, like 150.',
    howTitle: 'How to use',
    howStep1: 'Pick your home currency on the left and the local one on the right.',
    howStep2: 'Type the number written on the price tag. The big figure underneath is what it costs you.',
    howStep3: 'Rates are saved on this phone, so the app still answers on the plane or with no signal. Tap Refresh when you are back online.',
    disclaimer: 'Market rates, for orientation only. Banks, cards and exchange counters add their own fee, so the amount you are actually charged will differ.',
  },
  ja: {
    title: 'レートポケット',
    statusChecking: '確認中…',
    statusLive: '最新',
    statusSaved: '保存したレート',
    statusManual: '手入力レート',
    statusNone: 'レートなし',
    ratePending: 'まだレートがありません',
    rateUpdated: '{date} 更新 · この端末に保存済み',
    rateManual: '手入力したレートです ·「自動レートに戻す」で解除できます',
    refresh: '更新',
    refreshing: '更新中…',
    refreshFailed: 'レートを取得できませんでした。保存済みのレートを使っています。',
    refreshOffline: 'オフラインです。この端末に保存したレートを使っています。',
    pairLabel: '通貨のペア',
    fromLabel: '自分の通貨',
    toLabel: '支払う通貨',
    swapLabel: '通貨を入れ替える',
    amountLabel: '値札の金額',
    amountPlaceholder: '例: 1200',
    amountError: '1200 のように数字を入れてください。',
    outLabel: '自分の通貨だと',
    outHint: '上に金額を入れてください',
    outNoRate: 'このペアのレートがありません',
    outIs: '{amount} {code}',
    emptyTitle: 'この端末にはまだレートがありません。',
    emptyBody: '電波があるうちに「更新」を押すか、下の「レートを手で入れる」に空港の掲示板の数字を入れてください。',
    glanceLabel: 'ざっくり早見表',
    glanceEmpty: 'レートが入ると表が出ます。',
    savedLabel: '保存したペア',
    savedEmpty: 'まだありません。よく使うペアは「このペアを保存」で残せます。',
    savePair: 'このペアを保存',
    savedPair: '保存済み',
    removePair: '{pair} を削除',
    usePair: '{pair} に切り替える',
    manualSummary: 'レートを手で入れる',
    manualHint: '電波がないときや、両替所のレートが市場より悪いときに使えます。',
    manualLabel: 'レート',
    manualPlaceholder: '例: 150',
    manualSave: 'このレートを使う',
    manualClear: '自動レートに戻す',
    manualError: '150 のように0より大きい数字を入れてください。',
    howTitle: '使い方',
    howStep1: '左に自分の通貨、右に現地の通貨を選びます。',
    howStep2: '値札の数字をそのまま入力します。下の大きい数字が自分の通貨での金額です。',
    howStep3: 'レートは端末に保存されるので、機内や電波がない場所でも答えが出ます。オンラインに戻ったら「更新」を押してください。',
    disclaimer: '市場レートの目安です。銀行・カード・両替所は独自の手数料を上乗せするため、実際の請求額とは差が出ます。',
  },
  es: {
    title: 'Rate Pocket',
    statusChecking: 'Comprobando…',
    statusLive: 'Al día',
    statusSaved: 'Tasa guardada',
    statusManual: 'Tu tasa',
    statusNone: 'Sin tasa',
    ratePending: 'Todavía no hay tasa',
    rateUpdated: 'Actualizado el {date} · guardado en este teléfono',
    rateManual: 'Tasa que escribiste · pulsa “Volver a la tasa automática” para deshacer',
    refresh: 'Actualizar',
    refreshing: 'Actualizando…',
    refreshFailed: 'No se pudo conectar con el servicio de tasas. Se usa la tasa guardada.',
    refreshOffline: 'Sin conexión. Se usa la tasa guardada en este teléfono.',
    pairLabel: 'De / A',
    fromLabel: 'Tu moneda',
    toLabel: 'Moneda que vas a gastar',
    swapLabel: 'Intercambiar monedas',
    amountLabel: 'Importe de la etiqueta',
    amountPlaceholder: 'p. ej. 1200',
    amountError: 'Escribe un número, como 1200.',
    outLabel: 'Son',
    outHint: 'Escribe un importe arriba',
    outNoRate: 'Aún no hay tasa para este par',
    outIs: '{amount} {code}',
    emptyTitle: 'Todavía no hay ninguna tasa guardada en este teléfono.',
    emptyBody: 'Pulsa Actualizar mientras tengas cobertura, o abre “Poner la tasa a mano” y escribe la del panel del aeropuerto.',
    glanceLabel: 'De un vistazo',
    glanceEmpty: 'La tabla se rellena en cuanto haya una tasa.',
    savedLabel: 'Pares guardados',
    savedEmpty: 'Nada guardado aún. Pulsa “Guardar este par” para tener a mano el que más consultas.',
    savePair: 'Guardar este par',
    savedPair: 'Guardado',
    removePair: 'Quitar {pair}',
    usePair: 'Usar {pair}',
    manualSummary: 'Poner la tasa a mano',
    manualHint: 'Útil cuando no hay cobertura, o cuando la casa de cambio te da una tasa peor que la del mercado.',
    manualLabel: 'Tasa',
    manualPlaceholder: 'p. ej. 150',
    manualSave: 'Usar esta tasa',
    manualClear: 'Volver a la tasa automática',
    manualError: 'Escribe una tasa mayor que cero, como 150.',
    howTitle: 'Cómo se usa',
    howStep1: 'Elige tu moneda a la izquierda y la local a la derecha.',
    howStep2: 'Escribe el número de la etiqueta. La cifra grande de abajo es lo que te cuesta.',
    howStep3: 'Las tasas se guardan en el teléfono, así que la app responde en el avión o sin cobertura. Pulsa Actualizar cuando vuelvas a tener conexión.',
    disclaimer: 'Tasas de mercado, solo como orientación. Bancos, tarjetas y casas de cambio añaden su propia comisión, así que el cargo real será distinto.',
  },
};

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return (stored === 'ja' || stored === 'es') ? stored : 'en';
}

const LANG = getLang();
const t = STRINGS[LANG];
const LOCALE = { en: 'en-US', ja: 'ja-JP', es: 'es-ES' }[LANG];

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, function (whole, key) {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : whole;
  });
}

function applyStaticTranslations() {
  document.documentElement.setAttribute('lang', LANG);
  document.title = t.title + ' | CobbleWorks';

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

// The h1 is drawn in two pieces, so it is not translated by data-i18n.
applyStaticTranslations();

// -----------------------
// Currencies
// -----------------------

// Travel-relevant currencies. Names come from the browser, so the list
// follows whichever language the platform is set to.
const CURRENCIES = [
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'TWD',
  'KRW', 'SGD', 'THB', 'VND', 'IDR', 'MYR', 'PHP', 'INR', 'NPR', 'LKR',
  'AED', 'SAR', 'QAR', 'ILS', 'TRY', 'EGP', 'MAD', 'ZAR', 'KES', 'NGN',
  'RUB', 'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'SEK', 'NOK',
  'DKK', 'ISK', 'NZD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU',
];

let currencyNames = null;
try {
  if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
    currencyNames = new Intl.DisplayNames([LOCALE], { type: 'currency' });
  }
} catch (e) {
  currencyNames = null;
}

function currencyLabel(code) {
  let name = '';
  try {
    if (currencyNames) name = currencyNames.of(code) || '';
  } catch (e) {
    name = '';
  }
  return name && name !== code ? code + ' — ' + name : code;
}

// -----------------------
// Prefs (synced) and rate cache (local to this device)
// -----------------------

const DEFAULT_PREFS = {
  from: 'USD',
  to: 'JPY',
  amount: '',
  saved: [{ from: 'USD', to: 'JPY' }],
  manual: {},
};

let prefs = JSON.parse(JSON.stringify(DEFAULT_PREFS));
let store = null;
let rateCache = null; // { base:'USD', rates:{}, updated: ms, source: '' }

function isCode(value) {
  return typeof value === 'string' && CURRENCIES.indexOf(value) !== -1;
}

function normalizePrefs(raw) {
  const clean = JSON.parse(JSON.stringify(DEFAULT_PREFS));
  if (!raw || typeof raw !== 'object') return clean;

  if (isCode(raw.from)) clean.from = raw.from;
  if (isCode(raw.to)) clean.to = raw.to;
  if (typeof raw.amount === 'string') clean.amount = raw.amount.slice(0, 20);

  if (Array.isArray(raw.saved)) {
    clean.saved = [];
    raw.saved.forEach(function (pair) {
      if (!pair || !isCode(pair.from) || !isCode(pair.to)) return;
      if (pair.from === pair.to) return;
      const exists = clean.saved.some(function (p) {
        return p.from === pair.from && p.to === pair.to;
      });
      if (!exists && clean.saved.length < 12) {
        clean.saved.push({ from: pair.from, to: pair.to });
      }
    });
  }

  clean.manual = {};
  if (raw.manual && typeof raw.manual === 'object') {
    Object.keys(raw.manual).forEach(function (key) {
      const parts = key.split('>');
      const value = Number(raw.manual[key]);
      if (parts.length === 2 && isCode(parts[0]) && isCode(parts[1]) && isFinite(value) && value > 0) {
        clean.manual[key] = value;
      }
    });
  }

  return clean;
}

function savePrefs() {
  if (store) {
    try {
      store.set(prefs);
      return;
    } catch (e) {
      console.error('Rate Pocket: could not sync prefs', e);
    }
  }
  try {
    localStorage.setItem(PREFS_FALLBACK_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Rate Pocket: could not save prefs', e);
  }
}

function loadRateCache() {
  let raw = null;
  try {
    raw = localStorage.getItem(RATES_KEY);
  } catch (e) {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.rates || typeof parsed.rates !== 'object') return null;
    if (!isFinite(Number(parsed.updated))) return null;
    return {
      base: parsed.base === 'USD' ? 'USD' : 'USD',
      rates: parsed.rates,
      updated: Number(parsed.updated),
      source: typeof parsed.source === 'string' ? parsed.source : '',
    };
  } catch (e) {
    return null;
  }
}

function saveRateCache(cache) {
  try {
    localStorage.setItem(RATES_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Rate Pocket: could not save rates', e);
  }
}

// -----------------------
// Rates
// -----------------------

const SOURCES = [
  {
    name: 'open.er-api.com',
    url: 'https://open.er-api.com/v6/latest/USD',
    read: function (data) {
      if (!data || data.result !== 'success' || !data.rates) return null;
      const updated = Number(data.time_last_update_unix);
      return {
        rates: data.rates,
        updated: isFinite(updated) && updated > 0 ? updated * 1000 : Date.now(),
      };
    },
  },
  {
    name: 'frankfurter.dev',
    url: 'https://api.frankfurter.dev/v1/latest?base=USD',
    read: function (data) {
      if (!data || !data.rates) return null;
      const stamp = Date.parse(data.date);
      return {
        rates: data.rates,
        updated: isFinite(stamp) ? stamp : Date.now(),
      };
    },
  },
];

async function fetchRates() {
  for (let i = 0; i < SOURCES.length; i += 1) {
    const source = SOURCES[i];
    try {
      const response = await fetch(source.url, { cache: 'no-store' });
      if (!response.ok) continue;
      const parsed = source.read(await response.json());
      if (!parsed) continue;

      const rates = {};
      CURRENCIES.forEach(function (code) {
        const value = Number(parsed.rates[code]);
        if (isFinite(value) && value > 0) rates[code] = value;
      });
      rates.USD = 1;
      if (Object.keys(rates).length < 5) continue;

      return { base: 'USD', rates: rates, updated: parsed.updated, source: source.name };
    } catch (e) {
      // try the next source
    }
  }
  return null;
}

function manualKey(from, to) {
  return from + '>' + to;
}

// Returns { rate, manual } or null when this pair cannot be converted.
function rateFor(from, to) {
  if (from === to) return { rate: 1, manual: false };

  const typed = prefs.manual[manualKey(from, to)];
  if (isFinite(typed) && typed > 0) return { rate: typed, manual: true };

  if (!rateCache) return null;
  const a = Number(rateCache.rates[from]);
  const b = Number(rateCache.rates[to]);
  if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) return null;
  return { rate: b / a, manual: false };
}

// -----------------------
// Formatting
// -----------------------

function formatMoney(value, code) {
  const abs = Math.abs(value);
  const options = { style: 'currency', currency: code };
  if (abs > 0 && abs < 0.1) {
    options.minimumFractionDigits = 3;
    options.maximumFractionDigits = 4;
  }
  try {
    return new Intl.NumberFormat(LOCALE, options).format(value);
  } catch (e) {
    return value.toFixed(2) + ' ' + code;
  }
}

function formatRate(rate) {
  const digits = rate >= 100 ? 2 : rate >= 1 ? 3 : 5;
  try {
    return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(rate);
  } catch (e) {
    return String(rate);
  }
}

function formatDate(ms) {
  try {
    return new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' }).format(new Date(ms));
  } catch (e) {
    return new Date(ms).toDateString();
  }
}

function parseAmount(raw) {
  const cleaned = String(raw).replace(/[\s, '’]/g, '').replace(/[，]/g, '');
  if (cleaned === '') return { empty: true };
  if (!/^\d*\.?\d*$/.test(cleaned)) return { error: true };
  const value = Number(cleaned);
  if (!isFinite(value) || value < 0) return { error: true };
  return { value: value };
}

// -----------------------
// Elements
// -----------------------

const el = {
  status: document.getElementById('statusBadge'),
  rateText: document.getElementById('rateText'),
  rateMeta: document.getElementById('rateMeta'),
  refresh: document.getElementById('refreshBtn'),
  from: document.getElementById('fromCur'),
  to: document.getElementById('toCur'),
  swap: document.getElementById('swapBtn'),
  amount: document.getElementById('amount'),
  amountErr: document.getElementById('amountErr'),
  outBlock: document.getElementById('outBlock'),
  outLabel: document.getElementById('outLabel'),
  result: document.getElementById('result'),
  resultSub: document.getElementById('resultSub'),
  emptyState: document.getElementById('emptyState'),
  glanceHeadLeft: document.getElementById('glanceHeadFrom'),
  glanceHeadRight: document.getElementById('glanceHeadTo'),
  glanceBody: document.getElementById('glanceBody'),
  glanceEmpty: document.getElementById('glanceEmpty'),
  chips: document.getElementById('chips'),
  savedEmpty: document.getElementById('savedEmpty'),
  savePair: document.getElementById('savePairBtn'),
  manualRate: document.getElementById('manualRate'),
  manualErr: document.getElementById('manualErr'),
  manualSave: document.getElementById('manualSaveBtn'),
  manualClear: document.getElementById('manualClearBtn'),
  manualLabel: document.getElementById('manualLabel'),
};

function buildSelects() {
  [el.from, el.to].forEach(function (select) {
    select.textContent = '';
    CURRENCIES.forEach(function (code) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = currencyLabel(code);
      select.appendChild(option);
    });
  });
}

function syncControls() {
  el.from.value = prefs.from;
  el.to.value = prefs.to;
  if (document.activeElement !== el.amount) el.amount.value = prefs.amount;

  const typed = prefs.manual[manualKey(prefs.from, prefs.to)];
  if (document.activeElement !== el.manualRate) {
    el.manualRate.value = isFinite(typed) && typed > 0 ? String(typed) : '';
  }
  el.manualLabel.textContent = t.manualLabel + ' — 1 ' + prefs.from + ' = ? ' + prefs.to;
  el.manualClear.hidden = !(isFinite(typed) && typed > 0);
}

// -----------------------
// Rendering
// -----------------------

function renderStatus(info) {
  el.status.classList.remove('is-live', 'is-manual');

  if (info && info.manual) {
    el.status.textContent = t.statusManual;
    el.status.classList.add('is-manual');
    return;
  }
  if (!rateCache) {
    el.status.textContent = t.statusNone;
    return;
  }
  if (Date.now() - rateCache.updated < LIVE_MS) {
    el.status.textContent = t.statusLive;
    el.status.classList.add('is-live');
    return;
  }
  el.status.textContent = t.statusSaved;
}

function renderRateBar(info) {
  if (!info) {
    el.rateText.textContent = t.ratePending;
    el.rateMeta.textContent = '';
    return;
  }

  el.rateText.textContent = '';
  const head = document.createTextNode('1 ' + prefs.from + ' = ');
  const value = document.createElement('b');
  value.textContent = formatRate(info.rate);
  el.rateText.appendChild(head);
  el.rateText.appendChild(value);
  el.rateText.appendChild(document.createTextNode(' ' + prefs.to));

  if (info.manual) {
    el.rateMeta.textContent = t.rateManual;
  } else if (rateCache) {
    el.rateMeta.textContent = fill(t.rateUpdated, { date: formatDate(rateCache.updated) });
  } else {
    el.rateMeta.textContent = '';
  }
}

function renderResult(info) {
  const parsed = parseAmount(el.amount.value);

  el.amountErr.hidden = true;
  el.amountErr.textContent = '';

  if (!info) {
    el.outBlock.classList.add('is-idle');
    el.result.textContent = '—';
    el.resultSub.textContent = t.outNoRate;
    return;
  }

  if (parsed.error) {
    el.amountErr.hidden = false;
    el.amountErr.textContent = t.amountError;
    el.outBlock.classList.add('is-idle');
    el.result.textContent = '—';
    el.resultSub.textContent = t.outHint;
    return;
  }

  if (parsed.empty) {
    el.outBlock.classList.add('is-idle');
    el.result.textContent = '—';
    el.resultSub.textContent = t.outHint;
    return;
  }

  el.outBlock.classList.remove('is-idle');
  el.result.textContent = formatMoney(parsed.value * info.rate, prefs.to);
  el.resultSub.textContent = formatMoney(parsed.value, prefs.from);
}

// Round numbers sized to the currency: 100/500/1,000… for yen,
// 1/5/10… for euros, 10,000/50,000… for dong.
function glanceTicks(rate) {
  let power = 0;
  if (isFinite(rate) && rate > 0) power = Math.round(Math.log(rate) / Math.LN10);
  if (power < 0) power = 0;
  if (power > 6) power = 6;
  const step = Math.pow(10, power);
  return [1, 5, 10, 50, 100].map(function (n) {
    return n * step;
  });
}

function renderGlance(info) {
  el.glanceBody.textContent = '';

  if (!info) {
    el.glanceEmpty.hidden = false;
    el.glanceHeadLeft.textContent = '—';
    el.glanceHeadRight.textContent = '—';
    return;
  }

  el.glanceEmpty.hidden = true;
  el.glanceHeadLeft.textContent = prefs.to;
  el.glanceHeadRight.textContent = prefs.from;

  glanceTicks(info.rate).forEach(function (tick) {
    const row = document.createElement('tr');
    const left = document.createElement('td');
    const right = document.createElement('td');
    left.textContent = formatMoney(tick, prefs.to);
    right.textContent = formatMoney(tick / info.rate, prefs.from);
    row.appendChild(left);
    row.appendChild(right);
    el.glanceBody.appendChild(row);
  });
}

function pairLabel(pair) {
  return pair.from + ' → ' + pair.to;
}

function renderChips() {
  el.chips.textContent = '';

  prefs.saved.forEach(function (pair) {
    const label = pairLabel(pair);
    const chip = document.createElement('div');
    chip.className = 'chip';
    if (pair.from === prefs.from && pair.to === prefs.to) chip.classList.add('is-current');

    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'chip-go';
    go.textContent = label;
    go.setAttribute('aria-label', fill(t.usePair, { pair: label }));
    go.addEventListener('click', function () {
      prefs.from = pair.from;
      prefs.to = pair.to;
      savePrefs();
      syncControls();
      render();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'chip-del';
    del.textContent = '×';
    del.setAttribute('aria-label', fill(t.removePair, { pair: label }));
    del.addEventListener('click', function () {
      prefs.saved = prefs.saved.filter(function (p) {
        return !(p.from === pair.from && p.to === pair.to);
      });
      savePrefs();
      render();
    });

    chip.appendChild(go);
    chip.appendChild(del);
    el.chips.appendChild(chip);
  });

  el.savedEmpty.hidden = prefs.saved.length > 0;

  const alreadySaved = prefs.saved.some(function (p) {
    return p.from === prefs.from && p.to === prefs.to;
  });
  el.savePair.disabled = alreadySaved || prefs.from === prefs.to || prefs.saved.length >= 12;
  el.savePair.textContent = alreadySaved ? t.savedPair : t.savePair;
}

function render() {
  const info = rateFor(prefs.from, prefs.to);

  el.emptyState.hidden = !!rateCache || !!info;

  renderStatus(info);
  renderRateBar(info);
  renderResult(info);
  renderGlance(info);
  renderChips();
}

// -----------------------
// Refreshing
// -----------------------

let refreshing = false;

async function refresh(showProgress) {
  if (refreshing) return;

  if (navigator.onLine === false) {
    el.rateMeta.textContent = t.refreshOffline;
    return;
  }

  refreshing = true;
  if (showProgress) {
    el.refresh.disabled = true;
    el.refresh.textContent = t.refreshing;
  }

  const fresh = await fetchRates();

  refreshing = false;
  el.refresh.disabled = false;
  el.refresh.textContent = t.refresh;

  if (!fresh) {
    if (showProgress || !rateCache) el.rateMeta.textContent = t.refreshFailed;
    return;
  }

  rateCache = fresh;
  saveRateCache(fresh);
  render();
}

// -----------------------
// Events
// -----------------------

el.from.addEventListener('change', function () {
  prefs.from = el.from.value;
  savePrefs();
  syncControls();
  render();
});

el.to.addEventListener('change', function () {
  prefs.to = el.to.value;
  savePrefs();
  syncControls();
  render();
});

el.swap.addEventListener('click', function () {
  const previous = prefs.from;
  prefs.from = prefs.to;
  prefs.to = previous;
  savePrefs();
  syncControls();
  render();
});

el.amount.addEventListener('input', function () {
  prefs.amount = el.amount.value;
  savePrefs();
  render();
});

el.refresh.addEventListener('click', function () {
  refresh(true);
});

el.savePair.addEventListener('click', function () {
  if (prefs.from === prefs.to) return;
  const exists = prefs.saved.some(function (p) {
    return p.from === prefs.from && p.to === prefs.to;
  });
  if (exists || prefs.saved.length >= 12) return;
  prefs.saved.push({ from: prefs.from, to: prefs.to });
  savePrefs();
  render();
});

el.manualSave.addEventListener('click', function () {
  const parsed = parseAmount(el.manualRate.value);
  if (parsed.empty || parsed.error || !(parsed.value > 0)) {
    el.manualErr.hidden = false;
    el.manualErr.textContent = t.manualError;
    el.manualRate.focus();
    return;
  }
  el.manualErr.hidden = true;
  el.manualErr.textContent = '';
  prefs.manual[manualKey(prefs.from, prefs.to)] = parsed.value;
  savePrefs();
  syncControls();
  render();
});

el.manualClear.addEventListener('click', function () {
  delete prefs.manual[manualKey(prefs.from, prefs.to)];
  el.manualErr.hidden = true;
  el.manualErr.textContent = '';
  savePrefs();
  syncControls();
  render();
});

window.addEventListener('online', function () {
  refresh(false);
});

// -----------------------
// Start
// -----------------------

(async function start() {
  buildSelects();

  try {
    if (window.AppSync && typeof AppSync.store === 'function') {
      store = await AppSync.store(APP_SLUG, 'prefs', {
        default: DEFAULT_PREFS,
        version: 1,
      });
      prefs = normalizePrefs(store.get());
      store.subscribe(function (value) {
        prefs = normalizePrefs(value);
        syncControls();
        render();
      });
    } else {
      throw new Error('AppSync unavailable');
    }
  } catch (e) {
    try {
      const raw = localStorage.getItem(PREFS_FALLBACK_KEY);
      prefs = normalizePrefs(raw ? JSON.parse(raw) : null);
    } catch (err) {
      prefs = normalizePrefs(null);
    }
  }

  rateCache = loadRateCache();
  syncControls();
  render();

  if (!rateCache || Date.now() - rateCache.updated > STALE_MS) {
    refresh(!rateCache);
  }
})();
