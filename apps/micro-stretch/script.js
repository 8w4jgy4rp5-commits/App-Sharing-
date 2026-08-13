// ===========================
// Micro Stretch - script
// ===========================

// 同期対応前に使っていたキー。AppSync.store() が初回起動時にここから
// データを吸い上げる(元のキーは切り戻せるよう削除されない)。
const LEGACY_STORAGE_KEY = 'microStretch:records:v1';

// AppSync.store() のインスタンス。起動時に初期化される。
let store = null;

// app-sync.js が読み込めなかったときの保険。localStorage だけで動き、同期はしない。
// app-sync と同じキー・同じエンベロープ形式で書くので、次に正常に読み込めた
// 起動でそのまま拾われ、クラウドへ上がる。
async function openStore(slug, key, opts) {
  try { if (window.AppSync) return await window.AppSync.store(slug, key, opts); } catch (e) { console.error(e); }
  const o = opts || {}, k = 'appdata:' + slug + ':' + key;
  const read = function (s) { try { return JSON.parse(localStorage.getItem(s)); } catch (e) { return null; } };
  const cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  const env = read(k);
  let c = env && 'd' in env ? env.d : ((o.legacyKey && read(o.legacyKey)) ?? o.default ?? null);
  return {
    get: function () { return cp(c); },
    set: function (v) {
      c = cp(v);
      try { localStorage.setItem(k, JSON.stringify({ v: 1, av: o.version || 1, t: Date.now(), o: null, d: c })); } catch (e) {}
      return Promise.resolve();
    },
    subscribe: function () { return function () {}; },
    flush: function () { return Promise.resolve(); },
    status: function () { return { online: false, syncing: false, lastSyncedAt: null, error: null }; }
  };
}

const LANG_KEY = 'cobbleworks:lang:v1';

// -----------------------
// i18n (reads the platform-wide language choice from localStorage)
// -----------------------

const STRINGS = {
  en: {
    title: 'Micro Stretch',
    subtitle: 'Quick stretches you can do in a spare moment.',
    showStretch: 'Show me a stretch',
    done: 'Done ✓',
    showAnother: 'Show another',
    doneConfirmation: 'Nice! Recorded ✓',
    recordsHeading: 'Records',
    todayLabel: function (n) { return 'Today: ' + n; },
    totalLabel: function (n) { return 'Total: ' + n; },
    // Fixed, hardcoded stretch list (not user-editable, not stored in localStorage)
    stretches: [
      { name: 'Shoulder rolls', duration: '30 sec', steps: ['Sit or stand tall', 'Roll shoulders forward 5 times', 'Roll shoulders backward 5 times'] },
      { name: 'Neck side stretch', duration: '20 sec', steps: ['Sit or stand tall', 'Tilt head toward one shoulder gently', 'Hold, then switch sides'] },
      { name: 'Wrist and finger stretch', duration: '20 sec', steps: ['Extend one arm forward, palm up', 'Gently pull fingers back with other hand', 'Hold, then switch hands'] },
      { name: 'Seated spinal twist', duration: '30 sec', steps: ['Sit tall with feet flat on floor', 'Twist upper body to one side, hand on chair back', 'Hold, then twist to the other side'] },
      { name: 'Standing forward fold', duration: '30 sec', steps: ['Stand with feet hip-width apart', 'Hinge at hips and let arms hang toward the floor', 'Relax neck and hold'] },
      { name: 'Calf raises', duration: '20 reps', steps: ['Stand with feet hip-width apart', 'Rise up onto your toes', 'Lower slowly and repeat'] },
      { name: 'Ankle circles', duration: '20 sec', steps: ['Lift one foot slightly off the floor', 'Rotate ankle in circles', 'Switch direction, then switch feet'] },
      { name: 'Chest opener stretch', duration: '20 sec', steps: ['Clasp hands behind your back', 'Straighten arms and lift chest', 'Hold and breathe'] },
      { name: 'Standing side bend', duration: '20 sec', steps: ['Stand with feet hip-width apart', 'Raise one arm overhead and lean sideways', 'Hold, then switch sides'] },
      { name: 'Deep breathing (box breathing)', duration: '1 min', steps: ['Inhale slowly for 4 counts', 'Hold for 4 counts', 'Exhale slowly for 4 counts, repeat'] },
      { name: 'Standing quad stretch', duration: '20 sec each leg', steps: ['Stand tall, hold onto something for balance', 'Bend one knee and grab your ankle behind you', 'Hold, then switch legs'] },
      { name: 'Cat-cow stretch', duration: '30 sec', steps: ['Place hands on a desk or chair, hinge forward', 'Arch your back and look up', 'Round your back and tuck chin, repeat'] },
      { name: 'Neck forward and back tilt', duration: '20 sec', steps: ['Sit or stand tall', 'Gently tilt chin toward chest', 'Slowly tilt head back and look up'] },
      { name: 'Shoulder blade squeeze', duration: '15 reps', steps: ['Sit or stand with arms relaxed', 'Squeeze shoulder blades together', 'Release slowly and repeat'] },
      { name: 'Toe touches', duration: '20 sec', steps: ['Stand with feet hip-width apart', 'Slowly reach toward your toes', 'Hold, keeping knees soft'] },
      { name: 'Hip circles', duration: '20 sec', steps: ['Stand with hands on hips', 'Rotate hips in a circle', 'Switch direction halfway through'] },
      { name: 'Arm circles', duration: '20 sec', steps: ['Extend both arms out to the sides', 'Make small circles forward', 'Reverse direction halfway through'] },
      { name: 'Standing torso twist', duration: '20 sec', steps: ['Stand with feet hip-width apart', 'Twist upper body side to side', 'Let arms swing loosely'] },
      { name: '20-20-20 eye rest', duration: '20 sec', steps: ['Look away from your screen', 'Focus on something 20 feet away', 'Hold for 20 seconds'] },
      { name: 'Jaw and face relax stretch', duration: '15 sec', steps: ['Open your mouth wide', 'Move jaw gently side to side', 'Relax face muscles and breathe'] },
    ],
  },
  ja: {
    title: 'マイクロストレッチ',
    subtitle: 'ちょっとした空き時間にできる簡単なストレッチ。',
    showStretch: 'ストレッチを表示',
    done: '完了 ✓',
    showAnother: '別のストレッチを表示',
    doneConfirmation: 'いいね！記録しました ✓',
    recordsHeading: '記録',
    todayLabel: function (n) { return '本日: ' + n; },
    totalLabel: function (n) { return '合計: ' + n; },
    stretches: [
      { name: '肩回し', duration: '30秒', steps: ['座るか立って背筋を伸ばす', '肩を前に5回回す', '肩を後ろに5回回す'] },
      { name: '首の横伸ばし', duration: '20秒', steps: ['座るか立って背筋を伸ばす', '頭を片方の肩へゆっくり傾ける', 'そのまま保ち、反対側も行う'] },
      { name: '手首と指のストレッチ', duration: '20秒', steps: ['片腕を前に伸ばし、手のひらを上に向ける', 'もう片方の手で指をやさしく引く', 'そのまま保ち、反対の手も行う'] },
      { name: '座ったまま体幹ひねり', duration: '30秒', steps: ['足を床につけて背筋を伸ばして座る', '椅子の背もたれに手を置き、上半身を片側へひねる', 'そのまま保ち、反対側へもひねる'] },
      { name: '立位前屈', duration: '30秒', steps: ['足を腰幅に開いて立つ', '股関節から曲げて腕を床へ垂らす', '首の力を抜いて保つ'] },
      { name: 'カーフレイズ', duration: '20回', steps: ['足を腰幅に開いて立つ', 'つま先立ちになる', 'ゆっくり下ろして繰り返す'] },
      { name: '足首回し', duration: '20秒', steps: ['片足を床から少し浮かせる', '足首を円を描くように回す', '逆回転にし、反対の足も行う'] },
      { name: '胸を開くストレッチ', duration: '20秒', steps: ['背中で両手を組む', '腕を伸ばして胸を持ち上げる', 'そのまま保ち呼吸する'] },
      { name: '立位サイドベンド', duration: '20秒', steps: ['足を腰幅に開いて立つ', '片腕を頭上に上げて横に傾ける', 'そのまま保ち、反対側も行う'] },
      { name: '深呼吸（ボックスブリージング）', duration: '1分', steps: ['4カウントかけてゆっくり息を吸う', '4カウント止める', '4カウントかけてゆっくり吐き、繰り返す'] },
      { name: '立位大腿四頭筋ストレッチ', duration: '各脚20秒', steps: ['バランスを取れるものに掴まり立つ', '片膝を曲げ、後ろで足首を掴む', 'そのまま保ち、反対の脚も行う'] },
      { name: 'キャットカウストレッチ', duration: '30秒', steps: ['机や椅子に手を置き、前傾する', '背中を反らして上を見る', '背中を丸めてあごを引き、繰り返す'] },
      { name: '首の前後傾け', duration: '20秒', steps: ['座るか立って背筋を伸ばす', 'あごを胸に向けてゆっくり傾ける', 'ゆっくり頭を後ろに倒し上を見る'] },
      { name: '肩甲骨寄せ', duration: '15回', steps: ['座るか立って腕をリラックスさせる', '肩甲骨を中央に寄せる', 'ゆっくり戻して繰り返す'] },
      { name: 'つま先タッチ', duration: '20秒', steps: ['足を腰幅に開いて立つ', 'ゆっくりつま先に向かって手を伸ばす', '膝を軽く緩めたまま保つ'] },
      { name: '腰回し', duration: '20秒', steps: ['手を腰に当てて立つ', '腰を円を描くように回す', '途中で逆回転にする'] },
      { name: '腕回し', duration: '20秒', steps: ['両腕を横に伸ばす', '前方向に小さく円を描く', '途中で逆回転にする'] },
      { name: '立位体幹ひねり', duration: '20秒', steps: ['足を腰幅に開いて立つ', '上半身を左右にひねる', '腕は力を抜いて振らせる'] },
      { name: '20-20-20 眼の休憩', duration: '20秒', steps: ['画面から目を離す', '20フィート先の物を見つめる', '20秒間そのまま保つ'] },
      { name: 'あごと顔のリラックスストレッチ', duration: '15秒', steps: ['口を大きく開ける', 'あごを左右にゆっくり動かす', '顔の力を抜いて呼吸する'] },
    ],
  },
  es: {
    title: 'Micro Estiramiento',
    subtitle: 'Estiramientos rápidos que puedes hacer en un momento libre.',
    showStretch: 'Mostrar un estiramiento',
    done: 'Hecho ✓',
    showAnother: 'Mostrar otro',
    doneConfirmation: '¡Genial! Registrado ✓',
    recordsHeading: 'Registros',
    todayLabel: function (n) { return 'Hoy: ' + n; },
    totalLabel: function (n) { return 'Total: ' + n; },
    stretches: [
      { name: 'Rotación de hombros', duration: '30 seg', steps: ['Siéntate o ponte de pie con la espalda recta', 'Rota los hombros hacia adelante 5 veces', 'Rota los hombros hacia atrás 5 veces'] },
      { name: 'Estiramiento lateral del cuello', duration: '20 seg', steps: ['Siéntate o ponte de pie con la espalda recta', 'Inclina suavemente la cabeza hacia un hombro', 'Mantén y cambia de lado'] },
      { name: 'Estiramiento de muñeca y dedos', duration: '20 seg', steps: ['Extiende un brazo hacia adelante con la palma hacia arriba', 'Con la otra mano, tira suavemente de los dedos hacia atrás', 'Mantén y cambia de mano'] },
      { name: 'Torsión de columna sentado', duration: '30 seg', steps: ['Siéntate con la espalda recta y los pies apoyados en el suelo', 'Gira el torso hacia un lado, apoyando la mano en el respaldo', 'Mantén y gira hacia el otro lado'] },
      { name: 'Flexión de pie hacia adelante', duration: '30 seg', steps: ['Ponte de pie con los pies al ancho de las caderas', 'Dobla desde las caderas y deja caer los brazos hacia el suelo', 'Relaja el cuello y mantén la posición'] },
      { name: 'Elevación de talones', duration: '20 reps', steps: ['Ponte de pie con los pies al ancho de las caderas', 'Levántate sobre las puntas de los pies', 'Baja lentamente y repite'] },
      { name: 'Círculos de tobillo', duration: '20 seg', steps: ['Levanta un pie ligeramente del suelo', 'Gira el tobillo describiendo círculos', 'Cambia de dirección y luego de pie'] },
      { name: 'Estiramiento de apertura de pecho', duration: '20 seg', steps: ['Junta las manos detrás de la espalda', 'Estira los brazos y levanta el pecho', 'Mantén y respira'] },
      { name: 'Flexión lateral de pie', duration: '20 seg', steps: ['Ponte de pie con los pies al ancho de las caderas', 'Levanta un brazo por encima de la cabeza e inclínate hacia un lado', 'Mantén y cambia de lado'] },
      { name: 'Respiración profunda (respiración cuadrada)', duration: '1 min', steps: ['Inhala lentamente contando hasta 4', 'Retén el aire contando hasta 4', 'Exhala lentamente contando hasta 4 y repite'] },
      { name: 'Estiramiento de cuádriceps de pie', duration: '20 seg por pierna', steps: ['Ponte de pie y sujétate de algo para mantener el equilibrio', 'Dobla una rodilla y sujeta el tobillo detrás de ti', 'Mantén y cambia de pierna'] },
      { name: 'Estiramiento gato-vaca', duration: '30 seg', steps: ['Apoya las manos en un escritorio o silla e inclínate hacia adelante', 'Arquea la espalda y mira hacia arriba', 'Redondea la espalda y baja la barbilla, repite'] },
      { name: 'Inclinación de cuello adelante y atrás', duration: '20 seg', steps: ['Siéntate o ponte de pie con la espalda recta', 'Inclina suavemente la barbilla hacia el pecho', 'Inclina lentamente la cabeza hacia atrás y mira hacia arriba'] },
      { name: 'Aprieta los omóplatos', duration: '15 reps', steps: ['Siéntate o ponte de pie con los brazos relajados', 'Junta los omóplatos', 'Suelta lentamente y repite'] },
      { name: 'Toques de punta de pie', duration: '20 seg', steps: ['Ponte de pie con los pies al ancho de las caderas', 'Estira lentamente las manos hacia los dedos de los pies', 'Mantén las rodillas ligeramente flexionadas'] },
      { name: 'Círculos de cadera', duration: '20 seg', steps: ['Ponte de pie con las manos en la cintura', 'Gira las caderas describiendo un círculo', 'Cambia de dirección a la mitad'] },
      { name: 'Círculos de brazos', duration: '20 seg', steps: ['Extiende ambos brazos hacia los lados', 'Haz pequeños círculos hacia adelante', 'Cambia de dirección a la mitad'] },
      { name: 'Torsión de torso de pie', duration: '20 seg', steps: ['Ponte de pie con los pies al ancho de las caderas', 'Gira el torso de lado a lado', 'Deja que los brazos se muevan sueltos'] },
      { name: 'Descanso visual 20-20-20', duration: '20 seg', steps: ['Aparta la vista de la pantalla', 'Enfoca algo a unos 6 metros de distancia', 'Mantén la mirada 20 segundos'] },
      { name: 'Estiramiento de mandíbula y cara', duration: '15 seg', steps: ['Abre bien la boca', 'Mueve la mandíbula suavemente de lado a lado', 'Relaja los músculos de la cara y respira'] },
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

// Index of the stretch currently shown (null = none shown yet)
let currentIndex = null;

// -----------------------
// Date helpers
// -----------------------

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function todayStr() {
  return formatDate(new Date());
}

// -----------------------
// localStorage read/write
// -----------------------

// store.get() は毎回コピーを返すので、結果をそのまま書き換えて saveRecords() してよい。
// 中身の検証は残す。別デバイスや旧バージョンが書いた値も通るため。
function getRecords() {
  const parsed = store ? store.get() : null;
  const records =
    parsed && typeof parsed === 'object'
      ? {
          date: typeof parsed.date === 'string' ? parsed.date : todayStr(),
          todayCount: Number.isFinite(parsed.todayCount) ? parsed.todayCount : 0,
          totalCount: Number.isFinite(parsed.totalCount) ? parsed.totalCount : 0
        }
      : { date: todayStr(), todayCount: 0, totalCount: 0 };

  return normalizeRecords(records);
}

// If the stored date isn't today, reset todayCount but keep totalCount
function normalizeRecords(records) {
  const today = todayStr();
  if (records.date !== today) {
    records.date = today;
    records.todayCount = 0;
  }
  return records;
}

function saveRecords(records) {
  if (!store) return;
  store.set(records).catch(function (e) {
    console.error('Micro Stretch: 保存に失敗しました', e);
  });
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', async function () {
  // データ層の準備ができるまで描画も操作もさせない
  store = await openStore('micro-stretch', 'records', {
    default: null,
    legacyKey: LEGACY_STORAGE_KEY
  });

  // subscribe は他デバイス・他タブ由来の変更でしか呼ばれない
  store.subscribe(function () { renderRecords(getRecords()); });

  applyStaticTranslations();

  const records = getRecords();
  saveRecords(records); // persist normalized date/counts
  renderRecords(records);

  document.getElementById('showStretchBtn').addEventListener('click', handleShow);
  document.getElementById('anotherBtn').addEventListener('click', handleAnother);
  document.getElementById('doneBtn').addEventListener('click', handleDone);
});

// -----------------------
// Records rendering
// -----------------------

function renderRecords(records) {
  document.getElementById('todayRecord').textContent = t.todayLabel(records.todayCount);
  document.getElementById('totalRecord').textContent = t.totalLabel(records.totalCount);
}

// -----------------------
// Stretch picking / rendering
// -----------------------

// Picks a random index, avoiding excludeIndex when there's more than 1 stretch
function pickRandomIndex(excludeIndex) {
  if (t.stretches.length <= 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * t.stretches.length);
  } while (idx === excludeIndex);
  return idx;
}

function renderStretch(index) {
  const stretch = t.stretches[index];
  document.getElementById('stretchName').textContent = stretch.name;
  document.getElementById('stretchDuration').textContent = stretch.duration;

  const stepsList = document.getElementById('stretchSteps');
  stepsList.replaceChildren();
  stretch.steps.forEach(function (step) {
    const li = document.createElement('li');
    li.textContent = step;
    stepsList.appendChild(li);
  });

  document.getElementById('stretchCard').hidden = false;
  document.getElementById('stretchActions').hidden = false;
  document.getElementById('doneConfirmation').hidden = true;
}

function handleShow() {
  currentIndex = pickRandomIndex(null);
  renderStretch(currentIndex);
}

function handleAnother() {
  currentIndex = pickRandomIndex(currentIndex);
  renderStretch(currentIndex);
}

function handleDone() {
  const records = getRecords();
  records.todayCount += 1;
  records.totalCount += 1;
  saveRecords(records);
  renderRecords(records);

  document.getElementById('doneConfirmation').hidden = false;
}
