const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// Localization (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Unit Converter',
    subtitle: 'length · weight · temp · volume',
    categoryLabel: 'Category',
    categoryLength: 'Length',
    categoryWeight: 'Weight',
    categoryTemperature: 'Temperature',
    categoryVolume: 'Volume',
    fromLabel: 'From',
    fromPlaceholder: 'e.g. 1',
    toLabel: 'To',
    toPlaceholder: '—',
    swapUnits: 'Swap units',
    unitLabels: {
      length: {
        m: 'Meters (m)',
        km: 'Kilometers (km)',
        cm: 'Centimeters (cm)',
        mm: 'Millimeters (mm)',
        mile: 'Miles (mi)',
        yard: 'Yards (yd)',
        foot: 'Feet (ft)',
        inch: 'Inches (in)',
      },
      weight: {
        kg: 'Kilograms (kg)',
        g: 'Grams (g)',
        mg: 'Milligrams (mg)',
        ton: 'Metric tons (t)',
        lb: 'Pounds (lb)',
        oz: 'Ounces (oz)',
      },
      temperature: {
        celsius: 'Celsius (°C)',
        fahrenheit: 'Fahrenheit (°F)',
        kelvin: 'Kelvin (K)',
      },
      volume: {
        l: 'Liters (L)',
        ml: 'Milliliters (mL)',
        m3: 'Cubic meters (m³)',
        gallon: 'Gallons (gal)',
        quart: 'Quarts (qt)',
        cup: 'Cups',
      },
    },
  },
  ja: {
    title: '単位変換',
    subtitle: '長さ・重さ・温度・体積',
    categoryLabel: 'カテゴリー',
    categoryLength: '長さ',
    categoryWeight: '重さ',
    categoryTemperature: '温度',
    categoryVolume: '体積',
    fromLabel: '変換元',
    fromPlaceholder: '例: 1',
    toLabel: '変換先',
    toPlaceholder: '—',
    swapUnits: '単位を入れ替え',
    unitLabels: {
      length: {
        m: 'メートル (m)',
        km: 'キロメートル (km)',
        cm: 'センチメートル (cm)',
        mm: 'ミリメートル (mm)',
        mile: 'マイル (mi)',
        yard: 'ヤード (yd)',
        foot: 'フィート (ft)',
        inch: 'インチ (in)',
      },
      weight: {
        kg: 'キログラム (kg)',
        g: 'グラム (g)',
        mg: 'ミリグラム (mg)',
        ton: 'トン (t)',
        lb: 'ポンド (lb)',
        oz: 'オンス (oz)',
      },
      temperature: {
        celsius: '摂氏 (°C)',
        fahrenheit: '華氏 (°F)',
        kelvin: 'ケルビン (K)',
      },
      volume: {
        l: 'リットル (L)',
        ml: 'ミリリットル (mL)',
        m3: '立方メートル (m³)',
        gallon: 'ガロン (gal)',
        quart: 'クォート (qt)',
        cup: 'カップ',
      },
    },
  },
  es: {
    title: 'Conversor de Unidades',
    subtitle: 'longitud · peso · temp. · volumen',
    categoryLabel: 'Categoría',
    categoryLength: 'Longitud',
    categoryWeight: 'Peso',
    categoryTemperature: 'Temperatura',
    categoryVolume: 'Volumen',
    fromLabel: 'De',
    fromPlaceholder: 'ej. 1',
    toLabel: 'A',
    toPlaceholder: '—',
    swapUnits: 'Intercambiar unidades',
    unitLabels: {
      length: {
        m: 'Metros (m)',
        km: 'Kilómetros (km)',
        cm: 'Centímetros (cm)',
        mm: 'Milímetros (mm)',
        mile: 'Millas (mi)',
        yard: 'Yardas (yd)',
        foot: 'Pies (ft)',
        inch: 'Pulgadas (in)',
      },
      weight: {
        kg: 'Kilogramos (kg)',
        g: 'Gramos (g)',
        mg: 'Miligramos (mg)',
        ton: 'Toneladas métricas (t)',
        lb: 'Libras (lb)',
        oz: 'Onzas (oz)',
      },
      temperature: {
        celsius: 'Celsius (°C)',
        fahrenheit: 'Fahrenheit (°F)',
        kelvin: 'Kelvin (K)',
      },
      volume: {
        l: 'Litros (L)',
        ml: 'Mililitros (mL)',
        m3: 'Metros cúbicos (m³)',
        gallon: 'Galones (gal)',
        quart: 'Cuartos (qt)',
        cup: 'Tazas',
      },
    },
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

applyStaticTranslations();

const UNIT_GROUPS = {
  length: {
    label: t.categoryLength,
    units: {
      m: { label: t.unitLabels.length.m, toBase: 1 },
      km: { label: t.unitLabels.length.km, toBase: 1000 },
      cm: { label: t.unitLabels.length.cm, toBase: 0.01 },
      mm: { label: t.unitLabels.length.mm, toBase: 0.001 },
      mile: { label: t.unitLabels.length.mile, toBase: 1609.344 },
      yard: { label: t.unitLabels.length.yard, toBase: 0.9144 },
      foot: { label: t.unitLabels.length.foot, toBase: 0.3048 },
      inch: { label: t.unitLabels.length.inch, toBase: 0.0254 },
    },
  },
  weight: {
    label: t.categoryWeight,
    units: {
      kg: { label: t.unitLabels.weight.kg, toBase: 1 },
      g: { label: t.unitLabels.weight.g, toBase: 0.001 },
      mg: { label: t.unitLabels.weight.mg, toBase: 0.000001 },
      ton: { label: t.unitLabels.weight.ton, toBase: 1000 },
      lb: { label: t.unitLabels.weight.lb, toBase: 0.45359237 },
      oz: { label: t.unitLabels.weight.oz, toBase: 0.028349523125 },
    },
  },
  temperature: {
    label: t.categoryTemperature,
    units: {
      celsius: { label: t.unitLabels.temperature.celsius },
      fahrenheit: { label: t.unitLabels.temperature.fahrenheit },
      kelvin: { label: t.unitLabels.temperature.kelvin },
    },
  },
  volume: {
    label: t.categoryVolume,
    units: {
      l: { label: t.unitLabels.volume.l, toBase: 1 },
      ml: { label: t.unitLabels.volume.ml, toBase: 0.001 },
      m3: { label: t.unitLabels.volume.m3, toBase: 1000 },
      gallon: { label: t.unitLabels.volume.gallon, toBase: 3.785411784 },
      quart: { label: t.unitLabels.volume.quart, toBase: 0.946352946 },
      cup: { label: t.unitLabels.volume.cup, toBase: 0.2365882365 },
    },
  },
};

const categorySelect = document.getElementById('categorySelect');
const fromValueInput = document.getElementById('fromValue');
const toValueInput = document.getElementById('toValue');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const swapBtn = document.getElementById('swapBtn');

function celsiusToKelvin(c) {
  return c + 273.15;
}

function kelvinToCelsius(k) {
  return k - 273.15;
}

function convertTemperature(value, fromUnit, toUnit) {
  let celsius;
  if (fromUnit === 'celsius') celsius = value;
  else if (fromUnit === 'fahrenheit') celsius = ((value - 32) * 5) / 9;
  else celsius = kelvinToCelsius(value);

  if (toUnit === 'celsius') return celsius;
  if (toUnit === 'fahrenheit') return (celsius * 9) / 5 + 32;
  return celsiusToKelvin(celsius);
}

function convertLinear(value, fromUnit, toUnit, units) {
  const baseValue = value * units[fromUnit].toBase;
  return baseValue / units[toUnit].toBase;
}

function formatResult(value) {
  if (!Number.isFinite(value)) return '';
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

function populateUnitSelect(select, units) {
  select.innerHTML = '';
  Object.keys(units).forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = units[key].label;
    select.appendChild(option);
  });
}

function onCategoryChange() {
  const category = categorySelect.value;
  const units = UNIT_GROUPS[category].units;
  const keys = Object.keys(units);

  populateUnitSelect(fromUnitSelect, units);
  populateUnitSelect(toUnitSelect, units);

  fromUnitSelect.value = keys[0];
  toUnitSelect.value = keys.length > 1 ? keys[1] : keys[0];

  recalculate();
}

function recalculate() {
  const category = categorySelect.value;
  const units = UNIT_GROUPS[category].units;
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const rawValue = fromValueInput.value;

  if (rawValue === '' || Number.isNaN(Number(rawValue))) {
    toValueInput.value = '';
    return;
  }

  const value = Number(rawValue);
  const result =
    category === 'temperature'
      ? convertTemperature(value, fromUnit, toUnit)
      : convertLinear(value, fromUnit, toUnit, units);

  toValueInput.value = formatResult(result);
}

function swapUnits() {
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  fromUnitSelect.value = toUnit;
  toUnitSelect.value = fromUnit;

  const toValue = toValueInput.value;
  if (toValue !== '') {
    fromValueInput.value = toValue;
  }

  recalculate();
}

categorySelect.addEventListener('change', onCategoryChange);
fromUnitSelect.addEventListener('change', recalculate);
toUnitSelect.addEventListener('change', recalculate);
fromValueInput.addEventListener('input', recalculate);
swapBtn.addEventListener('click', swapUnits);

onCategoryChange();
