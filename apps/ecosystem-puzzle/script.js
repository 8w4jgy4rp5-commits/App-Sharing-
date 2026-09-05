// ============================================================
// Ecosystem Puzzle — plant grass, let nature do the rest.
//
// All tuning numbers live in CONFIG / STAGES below so difficulty
// can be adjusted without touching the game logic.
// ============================================================

'use strict';

// ---------- Tuning ----------

const CONFIG = {
  gridSize: 16,
  tickMs: 100, // logic tick

  seedling: {
    growMs: 3000 // seedling -> grass
  },
  grass: {
    lifeMs: 18000,   // grass -> withered (removed)
    spreadMs: 7000,  // living grass seeds an empty neighbour this often
    crowdMax: 3      // ...unless this many of its 4 neighbours are already taken
  },

  rabbit: {
    spawn: { grassMin: 5, cooldownMs: 5000, max: 6 },
    moveMs: 700,     // one step per this many ms
    starveMs: 24000, // dies if it hasn't eaten for this long
    eatPauseMs: 5500 // rest after eating before hunting again
  },
  fox: {
    spawn: { rabbitMin: 4, cooldownMs: 8000, max: 2 },
    moveMs: 550,
    starveMs: 25000,
    eatPauseMs: 10000 // digestion — keeps foxes from wiping out rabbits
  }
};

// Condition types supported: min / max (range = both on one entity).
// holdSec: the conditions must stay true this long, continuously.
// seedlingLimit: max seedlings the player may plant (null = unlimited).
// timeLimitSec: stage fails after this long (null = no limit).
const STAGES = [
  {
    id: 1,
    name: 'Grow the Grass',
    animals: [],
    conditions: [{ entity: 'grass', min: 5 }],
    holdSec: 10,
    seedlingLimit: null,
    timeLimitSec: null
  },
  {
    id: 2,
    name: 'Grass & Rabbits',
    animals: ['rabbit'],
    conditions: [{ entity: 'rabbit', min: 3 }],
    holdSec: 30,
    seedlingLimit: null,
    timeLimitSec: null
  },
  {
    id: 3,
    name: 'Food Chain',
    animals: ['rabbit', 'fox'],
    conditions: [
      { entity: 'grass', min: 5 },
      { entity: 'rabbit', min: 3 },
      { entity: 'fox', min: 1 }
    ],
    holdSec: 30,
    seedlingLimit: null,
    timeLimitSec: null
  }
];

const TUTORIALS = {
  seedling: {
    emoji: '🌱',
    title: 'Seedling',
    body: 'Tap any empty tile to plant a seedling. After a moment it grows into grass. Planting is your only move — everything else happens naturally.'
  },
  grass: {
    emoji: '🌿',
    title: 'Grass',
    body: 'Grass is food for rabbits. It withers after a while, so keep planting new seedlings before the old grass disappears.'
  },
  spread: {
    emoji: '🌾',
    title: 'Grass spreads by itself',
    body: 'Living grass seeds an empty tile next to it every few seconds — so you do not have to plant everything yourself. Sometimes the smartest move is to plant nothing and let the meadow grow.'
  },
  rabbit: {
    emoji: '🐰',
    title: 'Rabbit',
    body: 'Rabbits appear on their own when there is enough grass. They hop to the nearest grass and eat it. Without grass, they starve.'
  },
  fox: {
    emoji: '🦊',
    title: 'Fox',
    body: 'Foxes appear when there are enough rabbits. They hunt the nearest rabbit. Without rabbits, they starve.'
  }
};

// ---------- Data layer (AppSync) ----------

let progressStore = null;

// Fallback for when app-sync.js fails to load. localStorage only, no sync.
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

function getProgress() {
  const p = progressStore ? progressStore.get() : null;
  const out = (p && typeof p === 'object') ? p : {};
  if (!out.cleared || typeof out.cleared !== 'object') out.cleared = {};
  if (!out.seen || typeof out.seen !== 'object') out.seen = {};
  return out;
}

function saveProgress(p) {
  if (!progressStore) return;
  progressStore.set(p).catch(function (e) { console.error('Ecosystem Puzzle: save failed', e); });
}

// ---------- Game state ----------

const G = CONFIG.gridSize;

const state = {
  stage: STAGES[0],
  cells: [],        // {kind:'EMPTY'|'SEEDLING'|'GRASS', since: gameNow when it entered that state, spreadAt}
  animals: [],      // {type:'rabbit'|'fox', x, y, lastMoveAt, lastAteAt, restUntil}
  gameNow: 0,       // paused-aware clock (ms)
  lastSpawn: { rabbit: 0, fox: 0 },
  seedlingsUsed: 0,
  holdMs: 0,
  log: [],          // newest first: {text, n}
  logDirty: true,
  pops: [],         // canvas burst effects: {x, y, kind, born}
  paused: false,
  cleared: false,
  tutorialQueue: [],
  tutorialShowing: false
};

function idx(x, y) { return y * G + x; }

function resetStage(stage) {
  state.stage = stage;
  state.cells = [];
  for (let i = 0; i < G * G; i++) state.cells.push({ kind: 'EMPTY', since: 0, spreadAt: 0 });
  state.animals = [];
  state.gameNow = 0;
  state.lastSpawn = { rabbit: 0, fox: 0 };
  state.seedlingsUsed = 0;
  state.holdMs = 0;
  state.log = [];
  state.logDirty = true;
  state.pops = [];
  state.paused = false;
  state.cleared = false;
  state.tutorialQueue = [];
  state.tutorialShowing = false;
  hideTutorial();
  el.clearOverlay.hidden = true;
  el.pauseOverlay.hidden = true;
  el.pauseBtn.textContent = '⏸ Pause';
  updateStatVisibility();
  renderStageBar();
  renderHud();
  maybeQueueTutorial('seedling');
}

// ---------- Counting & conditions ----------

function countGrass() {
  let n = 0;
  for (const c of state.cells) if (c.kind === 'GRASS') n++;
  return n;
}
function countSeedlings() {
  let n = 0;
  for (const c of state.cells) if (c.kind === 'SEEDLING') n++;
  return n;
}
function countAnimals(type) {
  let n = 0;
  for (const a of state.animals) if (a.type === type) n++;
  return n;
}
function entityCount(entity) {
  if (entity === 'grass') return countGrass();
  if (entity === 'rabbit') return countAnimals('rabbit');
  if (entity === 'fox') return countAnimals('fox');
  return 0;
}
function conditionMet(cond) {
  const n = entityCount(cond.entity);
  if (cond.min != null && n < cond.min) return false;
  if (cond.max != null && n > cond.max) return false;
  return true;
}
function allConditionsMet() {
  return state.stage.conditions.every(conditionMet);
}

// ---------- Simulation ----------

let lastRealTick = null;

function tick() {
  // real elapsed time, so the game keeps pace even when the browser
  // throttles timers (capped so a long-suspended tab doesn't jump ahead)
  const real = performance.now();
  const dt = lastRealTick == null ? CONFIG.tickMs : Math.min(1000, real - lastRealTick);
  lastRealTick = real;
  if (state.paused || state.cleared) return;
  state.gameNow += dt;
  const now = state.gameNow;

  // plants. Spreading is collected first and applied after the loop, so a
  // tile seeded this tick can't immediately spread again in the same tick.
  const sprouts = [];
  for (let i = 0; i < state.cells.length; i++) {
    const c = state.cells[i];
    if (c.kind === 'SEEDLING') {
      if (now - c.since >= CONFIG.seedling.growMs) {
        c.kind = 'GRASS';
        c.since = now;
        c.spreadAt = now + CONFIG.grass.spreadMs;
        maybeQueueTutorial('grass');
      }
    } else if (c.kind === 'GRASS') {
      if (now - c.since >= CONFIG.grass.lifeMs) {
        c.kind = 'EMPTY';
        c.since = now;
      } else if (now >= c.spreadAt) {
        c.spreadAt = now + CONFIG.grass.spreadMs;
        const spot = spreadSpot(i % G, Math.floor(i / G));
        if (spot) sprouts.push(spot);
      }
    }
  }
  for (const s of sprouts) {
    const c = state.cells[idx(s.x, s.y)];
    if (c.kind !== 'EMPTY') continue; // another patch already claimed this tile
    c.kind = 'SEEDLING';
    c.since = now;
    addPop(s.x, s.y, 'spread');
    maybeQueueTutorial('spread');
  }

  // spawning
  if (state.stage.animals.includes('rabbit')) trySpawn('rabbit');
  if (state.stage.animals.includes('fox')) trySpawn('fox');

  // animals
  for (const a of state.animals.slice()) {
    stepAnimal(a, now);
  }
  // starvation
  state.animals = state.animals.filter(function (a) {
    if (now - a.lastAteAt < CONFIG[a.type].starveMs) return true;
    addPop(a.x, a.y, 'die');
    logEvent('💀 ' + EMOJI[a.type] + ' starved');
    return false;
  });

  // win check: hold the conditions
  if (allConditionsMet()) {
    state.holdMs += dt;
    if (state.holdMs >= state.stage.holdSec * 1000) stageClear();
  } else {
    state.holdMs = 0;
  }

  renderHud();
}

function trySpawn(type) {
  const cfg = CONFIG[type].spawn;
  const now = state.gameNow;
  if (now - state.lastSpawn[type] < cfg.cooldownMs) return;
  if (countAnimals(type) >= cfg.max) return;
  const food = type === 'rabbit' ? countGrass() : countAnimals('rabbit');
  const need = type === 'rabbit' ? cfg.grassMin : cfg.rabbitMin;
  if (food < need) return;

  const spot = randomFreeCell();
  if (!spot) return;
  state.animals.push({
    type: type,
    x: spot.x,
    y: spot.y,
    rx: spot.x,
    ry: spot.y,
    seed: Math.random() * Math.PI * 2,
    lastMoveAt: now,
    lastAteAt: now,
    restUntil: 0
  });
  state.lastSpawn[type] = now;
  logEvent(EMOJI[type] + ' appeared');
  maybeQueueTutorial(type);
}

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Where a patch of grass at (x,y) will drop its next seed, or null when it is
// too boxed in to spread. Off-field edges count as "taken", so the meadow
// thins out at the borders instead of filling the whole board solid.
function spreadSpot(x, y) {
  const empty = [];
  let taken = 0;
  for (const d of NEIGHBOURS) {
    const nx = x + d[0], ny = y + d[1];
    if (nx < 0 || nx >= G || ny < 0 || ny >= G) { taken++; continue; }
    if (state.cells[idx(nx, ny)].kind === 'EMPTY') empty.push({ x: nx, y: ny });
    else taken++;
  }
  if (taken >= CONFIG.grass.crowdMax || !empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function randomFreeCell() {
  const free = [];
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      if (!animalAt(x, y)) free.push({ x: x, y: y });
    }
  }
  if (!free.length) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function animalAt(x, y, type) {
  return state.animals.find(function (a) {
    return a.x === x && a.y === y && (!type || a.type === type);
  }) || null;
}

function stepAnimal(a, now) {
  if (now < a.restUntil) return;
  if (now - a.lastMoveAt < CONFIG[a.type].moveMs) return;
  a.lastMoveAt = now;

  const target = nearestTarget(a);
  if (target) {
    // step one cell toward the target (larger axis first)
    const dx = target.x - a.x, dy = target.y - a.y;
    if (dx !== 0 || dy !== 0) {
      if (Math.abs(dx) >= Math.abs(dy)) a.x += Math.sign(dx);
      else a.y += Math.sign(dy);
    }
  } else {
    wander(a);
  }
  tryEat(a, now);
}

function nearestTarget(a) {
  let best = null, bestD = Infinity;
  if (a.type === 'rabbit') {
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        if (state.cells[idx(x, y)].kind !== 'GRASS') continue;
        const d = Math.abs(x - a.x) + Math.abs(y - a.y);
        if (d < bestD) { bestD = d; best = { x: x, y: y }; }
      }
    }
  } else {
    for (const r of state.animals) {
      if (r.type !== 'rabbit') continue;
      const d = Math.abs(r.x - a.x) + Math.abs(r.y - a.y);
      if (d < bestD) { bestD = d; best = { x: r.x, y: r.y }; }
    }
  }
  return best;
}

function wander(a) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const d = dirs[Math.floor(Math.random() * dirs.length)];
  const nx = a.x + d[0], ny = a.y + d[1];
  if (nx >= 0 && nx < G && ny >= 0 && ny < G) { a.x = nx; a.y = ny; }
}

function tryEat(a, now) {
  if (a.type === 'rabbit') {
    const c = state.cells[idx(a.x, a.y)];
    if (c.kind === 'GRASS') {
      c.kind = 'EMPTY';
      c.since = now;
      a.lastAteAt = now;
      a.restUntil = now + CONFIG.rabbit.eatPauseMs;
      addPop(a.x, a.y, 'eat');
      logEvent('🐰 ate 🌿');
    }
  } else {
    const prey = animalAt(a.x, a.y, 'rabbit');
    if (prey) {
      state.animals = state.animals.filter(function (x) { return x !== prey; });
      a.lastAteAt = now;
      a.restUntil = now + CONFIG.fox.eatPauseMs;
      addPop(a.x, a.y, 'catch');
      logEvent('🦊 caught 🐰');
    }
  }
}

// ---------- Player input ----------

function plantAt(x, y) {
  if (state.paused || state.cleared) return;
  const c = state.cells[idx(x, y)];
  if (c.kind !== 'EMPTY') return;
  const limit = state.stage.seedlingLimit;
  if (limit != null && state.seedlingsUsed >= limit) return;
  c.kind = 'SEEDLING';
  c.since = state.gameNow;
  state.seedlingsUsed++;
  renderHud();
}

// ---------- Stage flow ----------

function isUnlocked(stageId) {
  if (stageId === 1) return true;
  return !!getProgress().cleared[stageId - 1];
}

function stageClear() {
  state.cleared = true;
  const p = getProgress();
  p.cleared[state.stage.id] = true;
  saveProgress(p);
  renderStageBar();

  const last = state.stage.id === STAGES.length;
  el.clearEmoji.textContent = last ? '🏆' : '🎉';
  el.clearTitle.textContent = last ? 'All stages clear!' : 'Stage ' + state.stage.id + ' clear!';
  el.clearBody.textContent = last
    ? 'You kept a whole food chain alive. More stages will come in a future version!'
    : 'You held the ecosystem steady. Ready for the next challenge?';
  el.clearNextBtn.hidden = last;
  el.clearOverlay.hidden = false;
}

// ---------- Tutorials ----------

function maybeQueueTutorial(key) {
  const p = getProgress();
  if (p.seen[key]) return;
  if (state.tutorialQueue.includes(key)) return;
  p.seen[key] = true; // mark immediately so it never re-queues
  saveProgress(p);
  state.tutorialQueue.push(key);
  showNextTutorial();
}

function showNextTutorial() {
  if (state.tutorialShowing) return;
  const key = state.tutorialQueue.shift();
  if (!key) return;
  const t = TUTORIALS[key];
  el.tutorialEmoji.textContent = t.emoji;
  el.tutorialTitle.textContent = t.title;
  el.tutorialBody.textContent = t.body;
  el.tutorial.hidden = false;
  state.tutorialShowing = true; // game keeps running behind the window
}

function hideTutorial() {
  el.tutorial.hidden = true;
  state.tutorialShowing = false;
}

// ---------- Event log ----------
// The counters alone don't show *why* a number moved, so every link in the
// chain announces itself here. Repeats collapse into "xN" to stay readable
// when several animals act in the same tick.

const LOG_MAX = 4;

function logEvent(text) {
  const last = state.log[0];
  if (last && last.text === text) last.n++;
  else state.log.unshift({ text: text, n: 1 });
  if (state.log.length > LOG_MAX) state.log.length = LOG_MAX;
  state.logDirty = true;
}

function renderLog() {
  if (!state.logDirty) return;
  state.logDirty = false;
  el.eventLog.textContent = '';
  if (!state.log.length) {
    const li = document.createElement('li');
    li.className = 'quiet';
    li.textContent = 'Nothing yet — plant a seedling.';
    el.eventLog.appendChild(li);
    return;
  }
  for (let i = 0; i < state.log.length; i++) {
    const e = state.log[i];
    const li = document.createElement('li');
    li.textContent = e.text + (e.n > 1 ? ' ×' + e.n : '');
    if (i === 0) li.className = 'fresh';
    el.eventLog.appendChild(li);
  }
}

// ---------- Burst effects ----------

const POP_STYLE = {
  eat: { color: '#3e8f3a', ms: 550 },
  catch: { color: '#d2621f', ms: 700 },
  die: { color: '#6f6f5e', ms: 800 },
  spread: { color: '#7fc46a', ms: 700 }
};

function addPop(x, y, kind) {
  state.pops.push({ x: x, y: y, kind: kind, born: performance.now() });
  if (state.pops.length > 40) state.pops.shift();
}

function drawPops(t) {
  state.pops = state.pops.filter(function (p) { return t - p.born < POP_STYLE[p.kind].ms; });
  const cell = el.field.width / G;
  for (const p of state.pops) {
    const st = POP_STYLE[p.kind];
    const k = (t - p.born) / st.ms; // 0 -> 1 over the pop's life
    ctx.strokeStyle = st.color;
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = cell * 0.11 * (1 - k);
    ctx.beginPath();
    ctx.arc(p.x * cell + cell / 2, p.y * cell + cell / 2, cell * (0.15 + k * 0.55), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------- Rendering: HUD ----------

const el = {};

function cacheEls() {
  const ids = ['stageBar', 'stageName', 'holdText', 'conditionList', 'holdFill',
    'statSeedling', 'statGrass', 'statRabbit', 'statFox', 'statRabbitWrap', 'statFoxWrap',
    'statSeedsLeftWrap', 'statSeedsLeft', 'field', 'tutorial', 'tutorialEmoji', 'tutorialTitle',
    'tutorialBody', 'tutorialOk', 'clearOverlay', 'clearEmoji', 'clearTitle', 'clearBody',
    'clearRetryBtn', 'clearNextBtn', 'pauseOverlay', 'pauseBtn', 'retryBtn', 'guideBtn',
    'guideModal', 'guideCloseBtn', 'eventLog'];
  for (const id of ids) el[id] = document.getElementById(id);
}

function updateStatVisibility() {
  el.statRabbitWrap.hidden = !state.stage.animals.includes('rabbit');
  el.statFoxWrap.hidden = !state.stage.animals.includes('fox');
  el.statSeedsLeftWrap.hidden = state.stage.seedlingLimit == null;
}

function renderStageBar() {
  el.stageBar.textContent = '';
  const p = getProgress();
  for (const s of STAGES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stage-btn';
    const unlocked = isUnlocked(s.id);
    if (!unlocked) btn.classList.add('locked');
    if (s.id === state.stage.id) btn.classList.add('active');
    if (p.cleared[s.id]) btn.classList.add('done');
    btn.textContent = (unlocked ? '' : '🔒 ') + 'Stage ' + s.id + (p.cleared[s.id] ? ' ✓' : '');
    btn.disabled = !unlocked;
    btn.addEventListener('click', function () { resetStage(s); });
    el.stageBar.appendChild(btn);
  }
}

const EMOJI = { grass: '🌿', rabbit: '🐰', fox: '🦊' };

function renderHud() {
  el.stageName.textContent = 'Stage ' + state.stage.id + ': ' + state.stage.name;
  el.statSeedling.textContent = countSeedlings();
  el.statGrass.textContent = countGrass();
  el.statRabbit.textContent = countAnimals('rabbit');
  el.statFox.textContent = countAnimals('fox');
  if (state.stage.seedlingLimit != null) {
    el.statSeedsLeft.textContent = Math.max(0, state.stage.seedlingLimit - state.seedlingsUsed);
  }

  // condition checklist
  el.conditionList.textContent = '';
  for (const cond of state.stage.conditions) {
    const li = document.createElement('li');
    const ok = conditionMet(cond);
    li.className = ok ? 'ok' : '';
    let text = EMOJI[cond.entity] + ' ';
    if (cond.min != null && cond.max != null) text += cond.min + '–' + cond.max;
    else if (cond.min != null) text += cond.min + ' or more';
    else text += cond.max + ' or fewer';
    text += ' (now: ' + entityCount(cond.entity) + ')';
    li.textContent = (ok ? '✓ ' : '· ') + text;
    el.conditionList.appendChild(li);
  }

  // hold progress
  const holdTotal = state.stage.holdSec * 1000;
  const pct = Math.min(100, (state.holdMs / holdTotal) * 100);
  el.holdFill.style.width = pct + '%';
  if (state.cleared) {
    el.holdText.textContent = 'CLEAR!';
  } else if (state.holdMs > 0) {
    el.holdText.textContent = 'Hold: ' + Math.floor(state.holdMs / 1000) + ' / ' + state.stage.holdSec + 's';
  } else {
    el.holdText.textContent = 'Hold for ' + state.stage.holdSec + 's';
  }

  renderLog();
}

// ---------- Rendering: field (canvas) ----------

let ctx = null;
let theme = {
  fieldBg: '#b9db7c',
  speckle: '#a3c968',
  line: 'rgba(255,255,255,0.10)'
};

// static decoration: random little marks so the meadow isn't a flat color
let speckles = [];
// per-cell random seed so each grass tuft looks slightly different
let cellSeeds = [];

function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = function (name, fb) {
    const x = cs.getPropertyValue(name).trim();
    return x || fb;
  };
  theme.fieldBg = v('--field-bg', theme.fieldBg);
  theme.speckle = v('--field-speckle', theme.speckle);
  theme.line = v('--field-line', theme.line);
}

function initFieldDecor() {
  speckles = [];
  const size = el.field.width;
  for (let i = 0; i < 130; i++) {
    speckles.push({
      x: Math.random() * size,
      y: Math.random() * size,
      r: 1 + Math.random() * 2,
      tall: Math.random() < 0.35 // some are tiny blades instead of dots
    });
  }
  cellSeeds = [];
  for (let i = 0; i < G * G; i++) cellSeeds.push(Math.random() * Math.PI * 2);
}

// --- sprites (u = cell size in px) ---

function drawSeedling(cx, cy, u, t) {
  const s = u / 40;
  ctx.strokeStyle = '#4e9440';
  ctx.lineWidth = 2.4 * s;
  ctx.lineCap = 'round';
  // stem
  ctx.beginPath();
  ctx.moveTo(cx, cy + 9 * s);
  ctx.quadraticCurveTo(cx, cy + 2 * s, cx, cy - 2 * s);
  ctx.stroke();
  // two leaves
  ctx.fillStyle = '#69b957';
  ctx.beginPath();
  ctx.ellipse(cx - 4.5 * s, cy - 4 * s, 5 * s, 2.6 * s, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 4.5 * s, cy - 4 * s, 5 * s, 2.6 * s, 0.7, 0, Math.PI * 2);
  ctx.fill();
  // soil mound
  ctx.fillStyle = '#a58a5a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10 * s, 6 * s, 2.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lerpColor(c1, c2, k) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * k),
    Math.round(c1[1] + (c2[1] - c1[1]) * k),
    Math.round(c1[2] + (c2[2] - c1[2]) * k)
  ];
}

function drawGrass(cx, cy, u, t, seed, age) {
  const s = u / 40;
  // color shifts from fresh green to dry yellow as it withers
  const k = age < 0.6 ? 0 : (age - 0.6) / 0.4;
  const col = lerpColor([46, 125, 50], [176, 148, 60], k);
  ctx.strokeStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
  ctx.lineWidth = 2.6 * s;
  ctx.lineCap = 'round';
  const sway = Math.sin(t / 700 + seed) * 2.2 * s * (1 - k * 0.7);
  const base = cy + 11 * s;
  const blades = [
    { dx: -6, h: 13, lean: -3 },
    { dx: -2, h: 18, lean: -1 },
    { dx: 2, h: 16, lean: 2 },
    { dx: 6, h: 12, lean: 4 }
  ];
  for (const b of blades) {
    ctx.beginPath();
    ctx.moveTo(cx + b.dx * s, base);
    ctx.quadraticCurveTo(
      cx + b.dx * s + sway * 0.4, base - b.h * s * 0.55,
      cx + (b.dx + b.lean) * s + sway, base - b.h * s
    );
    ctx.stroke();
  }
}

function drawRabbit(cx, cy, u, t, seed) {
  const s = u / 40;
  const hop = Math.abs(Math.sin(t / 260 + seed)) * 2.4 * s;
  cy -= hop;
  ctx.lineWidth = 1.2 * s;
  ctx.strokeStyle = 'rgba(90,80,70,0.35)';
  // ears
  const ear = function (dx, rot) {
    ctx.save();
    ctx.translate(cx + dx * s, cy - 11 * s);
    ctx.rotate(rot);
    ctx.fillStyle = '#fbf7f2';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3c2cb';
    ctx.beginPath();
    ctx.ellipse(0, 0.6 * s, 1.2 * s, 4.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  ear(-3.4, -0.18);
  ear(3.4, 0.18);
  // body
  ctx.fillStyle = '#fbf7f2';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6 * s, 8.5 * s, 6.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // head
  ctx.beginPath();
  ctx.arc(cx, cy - 2.5 * s, 6.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // face
  ctx.fillStyle = '#4a4038';
  ctx.beginPath();
  ctx.arc(cx - 2.4 * s, cy - 3.2 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.arc(cx + 2.4 * s, cy - 3.2 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e89aa7';
  ctx.beginPath();
  ctx.moveTo(cx - 1.2 * s, cy - 1 * s);
  ctx.lineTo(cx + 1.2 * s, cy - 1 * s);
  ctx.lineTo(cx, cy + 0.6 * s);
  ctx.closePath();
  ctx.fill();
}

function drawFox(cx, cy, u, t, seed) {
  const s = u / 40;
  const bob = Math.sin(t / 320 + seed) * 1.2 * s;
  cy -= bob;
  ctx.lineWidth = 1.2 * s;
  ctx.strokeStyle = 'rgba(120,60,20,0.35)';
  // tail (behind the body, white tip)
  ctx.fillStyle = '#e8823c';
  ctx.beginPath();
  ctx.ellipse(cx + 9.5 * s, cy + 6 * s, 6 * s, 3.2 * s, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fbf3ea';
  ctx.beginPath();
  ctx.ellipse(cx + 12.5 * s, cy + 3.6 * s, 2.6 * s, 2 * s, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // ears (pointed)
  const ear = function (dx) {
    ctx.fillStyle = '#e8823c';
    ctx.beginPath();
    ctx.moveTo(cx + (dx - 2.6) * s, cy - 8 * s);
    ctx.lineTo(cx + dx * s, cy - 14.5 * s);
    ctx.lineTo(cx + (dx + 2.6) * s, cy - 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5c3a22';
    ctx.beginPath();
    ctx.moveTo(cx + (dx - 1) * s, cy - 10.5 * s);
    ctx.lineTo(cx + dx * s, cy - 13.2 * s);
    ctx.lineTo(cx + (dx + 1) * s, cy - 10.5 * s);
    ctx.closePath();
    ctx.fill();
  };
  ear(-4);
  ear(4);
  // body
  ctx.fillStyle = '#e8823c';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6 * s, 9 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // head
  ctx.beginPath();
  ctx.arc(cx, cy - 3 * s, 6.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // white muzzle
  ctx.fillStyle = '#fbf3ea';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 0.5 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // face
  ctx.fillStyle = '#3c2a1a';
  ctx.beginPath();
  ctx.arc(cx - 2.6 * s, cy - 4.2 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.arc(cx + 2.6 * s, cy - 4.2 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy - 0.8 * s, 1.1 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawField(frameTime) {
  const size = el.field.width;
  const cell = size / G;
  const t = frameTime || performance.now();

  // meadow: one flat yellow-green field
  ctx.fillStyle = theme.fieldBg;
  ctx.fillRect(0, 0, size, size);

  // scattered marks for texture
  ctx.fillStyle = theme.speckle;
  ctx.strokeStyle = theme.speckle;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (const sp of speckles) {
    if (sp.tall) {
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(sp.x + 1.5, sp.y - 4 - sp.r);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // very faint grid so taps are easy to aim
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < G; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
  }
  ctx.stroke();

  // plants
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const c = state.cells[idx(x, y)];
      if (c.kind === 'EMPTY') continue;
      const cx = x * cell + cell / 2;
      const cy = y * cell + cell / 2;
      if (c.kind === 'SEEDLING') {
        drawSeedling(cx, cy, cell, t);
      } else {
        const age = Math.min(1, (state.gameNow - c.since) / CONFIG.grass.lifeMs);
        drawGrass(cx, cy, cell, t, cellSeeds[idx(x, y)], age);
      }
    }
  }

  // animals — render position eases toward the logical cell for smooth hops
  for (const a of state.animals) {
    if (a.rx == null) { a.rx = a.x; a.ry = a.y; }
    a.rx += (a.x - a.rx) * 0.18;
    a.ry += (a.y - a.ry) * 0.18;
    const cx = a.rx * cell + cell / 2;
    const cy = a.ry * cell + cell / 2;
    if (a.type === 'rabbit') drawRabbit(cx, cy, cell, t, a.seed || 0);
    else drawFox(cx, cy, cell, t, a.seed || 0);
  }

  drawPops(t);

  requestAnimationFrame(drawField);
}

function fieldPointer(ev) {
  const rect = el.field.getBoundingClientRect();
  const px = (ev.clientX - rect.left) / rect.width;
  const py = (ev.clientY - rect.top) / rect.height;
  const x = Math.floor(px * G);
  const y = Math.floor(py * G);
  if (x < 0 || x >= G || y < 0 || y >= G) return;
  plantAt(x, y);
}

// ---------- Wiring ----------

function togglePause() {
  if (state.cleared) return;
  state.paused = !state.paused;
  el.pauseOverlay.hidden = !state.paused;
  el.pauseBtn.textContent = state.paused ? '▶ Resume' : '⏸ Pause';
}

document.addEventListener('DOMContentLoaded', async function () {
  cacheEls();
  ctx = el.field.getContext('2d');
  readTheme();
  initFieldDecor();

  progressStore = await openStore('ecosystem-puzzle', 'progress', {
    default: { cleared: {}, seen: {} }
  });
  progressStore.subscribe(function () { renderStageBar(); });

  el.field.addEventListener('pointerdown', fieldPointer);
  el.pauseBtn.addEventListener('click', togglePause);
  el.retryBtn.addEventListener('click', function () { resetStage(state.stage); });
  el.tutorialOk.addEventListener('click', function () {
    hideTutorial();
    showNextTutorial();
  });
  el.clearRetryBtn.addEventListener('click', function () { resetStage(state.stage); });
  el.clearNextBtn.addEventListener('click', function () {
    const next = STAGES.find(function (s) { return s.id === state.stage.id + 1; });
    if (next) resetStage(next);
  });
  el.guideBtn.addEventListener('click', function () { el.guideModal.hidden = false; });
  el.guideCloseBtn.addEventListener('click', function () { el.guideModal.hidden = true; });
  el.guideModal.addEventListener('click', function (ev) {
    if (ev.target === el.guideModal) el.guideModal.hidden = true;
  });

  // start at the highest unlocked stage
  let start = STAGES[0];
  for (const s of STAGES) if (isUnlocked(s.id)) start = s;
  resetStage(start);

  setInterval(tick, CONFIG.tickMs);
  requestAnimationFrame(drawField);
});
