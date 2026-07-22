const UNIT_GROUPS = {
  length: {
    label: 'Length',
    units: {
      m: { label: 'Meters (m)', toBase: 1 },
      km: { label: 'Kilometers (km)', toBase: 1000 },
      cm: { label: 'Centimeters (cm)', toBase: 0.01 },
      mm: { label: 'Millimeters (mm)', toBase: 0.001 },
      mile: { label: 'Miles (mi)', toBase: 1609.344 },
      yard: { label: 'Yards (yd)', toBase: 0.9144 },
      foot: { label: 'Feet (ft)', toBase: 0.3048 },
      inch: { label: 'Inches (in)', toBase: 0.0254 },
    },
  },
  weight: {
    label: 'Weight',
    units: {
      kg: { label: 'Kilograms (kg)', toBase: 1 },
      g: { label: 'Grams (g)', toBase: 0.001 },
      mg: { label: 'Milligrams (mg)', toBase: 0.000001 },
      ton: { label: 'Metric tons (t)', toBase: 1000 },
      lb: { label: 'Pounds (lb)', toBase: 0.45359237 },
      oz: { label: 'Ounces (oz)', toBase: 0.028349523125 },
    },
  },
  temperature: {
    label: 'Temperature',
    units: {
      celsius: { label: 'Celsius (°C)' },
      fahrenheit: { label: 'Fahrenheit (°F)' },
      kelvin: { label: 'Kelvin (K)' },
    },
  },
  volume: {
    label: 'Volume',
    units: {
      l: { label: 'Liters (L)', toBase: 1 },
      ml: { label: 'Milliliters (mL)', toBase: 0.001 },
      m3: { label: 'Cubic meters (m³)', toBase: 1000 },
      gallon: { label: 'Gallons (gal)', toBase: 3.785411784 },
      quart: { label: 'Quarts (qt)', toBase: 0.946352946 },
      cup: { label: 'Cups', toBase: 0.2365882365 },
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
