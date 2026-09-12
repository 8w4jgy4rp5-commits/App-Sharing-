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

  // The seedling hand. Planting used to be free and unlimited, so the winning
  // move was simply to tap the field as fast as you could and let volume decide.
  // Now every plant spends a seedling out of a small hand that grows back one at
  // a time: a burst is still allowed, an endless stream is not, and the seconds
  // you spend waiting on the hand are the seconds the meadow needed anyway.
  hand: {
    max: 3,         // seedlings you can hold at once
    refillMs: 2200  // ...and how long one takes to grow back. Shared by every
                    // stage: the difficulty comes from what a stage asks for,
                    // not from how often the player is allowed to act.
  },

  seedling: {
    growMs: 3000 // seedling -> grass
  },
  grass: {
    lifeMs: 12000,   // grass -> withered (removed)
    spreadMs: 7000,  // living grass seeds an empty neighbour this often
    crowdMax: 3,     // ...unless this many of its 4 neighbours are already taken
    spreadLimit: 1,  // ...and only this many times in its life. Without a cap a
                     // planted burst compounds into a meadow that feeds every
                     // rabbit forever, and the player stops mattering.
    scarMs: 9000     // how long a grazed/withered tile stays visibly worn
  },

  rabbit: {
    spawn: { grassMin: 5, cooldownMs: 5000, max: 6 },
    moveMs: 700,      // one step per this many ms while grazing
    fleeMs: 320,      // ...and while running. Faster than a fox on purpose:
                      // a rabbit with somewhere to run can escape, and giving
                      // it somewhere to run is the player's move.
    fleeRadius: 4,        // panics when a fox comes this close
    grazeSafeRadius: 8,   // ...and prefers to graze at least this far from one
    lureRadius: 10,   // a freshly planted seedling calls the nearest calm rabbit
                      // within this range. Unlimited range would send a rabbit
                      // on a walk longer than its own starve clock.
    lureMs: 9000,     // ...and it gives up waiting after this long. Comfortably
                      // longer than growMs, so an answered call pays off unless
                      // a fox interrupts it.
    starveMs: 10000,  // dies if it hasn't eaten for this long. Long values make
                      // a stage self-sustaining: at 24s an opening burst of
                      // seeds fed the rabbits through a whole 30s hold and the
                      // player could walk away and still clear it.
    eatPauseMs: 3000, // rest after eating. Also the brake on grazing: without
                      // it rabbits strip the whole meadow and everything starves
    headDownMs: 1600  // ...of which this much is oblivious. The hunting window.
  },
  fox: {
    spawn: { rabbitMin: 4, cooldownMs: 8000, max: 2 },
    moveMs: 550,
    sightRadius: 7,  // beyond this it loses the trail and casts about. Without
                     // a limit the fox is omniscient, no escape is ever
                     // permanent, and the player can only watch it end.
    giveUpMs: 9000,  // abandons a chase it has not closed in this long. A fox
                     // that never tires catches its rabbit essentially 100% of
                     // the time no matter what the player does — this is what
                     // makes staying ahead of one actually worth something.
    sulkMs: 6000,    // ...and ignores rabbits for this long afterwards
    starveMs: 22000, // shorter than it was, but foxes need slack that rabbits
                     // don't: they fail most hunts, so a tight clock just makes
                     // them churn — spawning and starving without ever hunting.
    eatPauseMs: 8000 // digestion — keeps foxes from wiping out rabbits
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
    holdSec: 8,
    seedlingLimit: null,
    timeLimitSec: 45
  },
  {
    id: 2,
    name: 'Grass & Rabbits',
    animals: ['rabbit'],
    conditions: [{ entity: 'rabbit', min: 3 }],
    holdSec: 20,
    seedlingLimit: null,
    timeLimitSec: 80
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
    holdSec: 20,
    seedlingLimit: null,
    timeLimitSec: 110
  }
];

// Seconds-left marks that get shouted across the field. A mark only counts
// if the stage is long enough to reach it from a running start — otherwise a
// 45s stage would open by announcing "60 seconds left".
const CALLOUT_MARKS = [60, 30, 10];

const TUTORIALS = {
  seedling: {
    emoji: '🌱',
    title: 'Seedling',
    body: 'Tap any empty tile to plant a seedling. After a moment it grows into grass. Planting is your only move — everything else happens naturally.'
  },
  hand: {
    emoji: '🌱',
    title: 'Your seedling hand',
    art: 'tplHandArt',
    body: 'You cannot plant your way out of trouble any more — so spend a seedling where it matters, and let the meadow do the rest.'
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
  lure: {
    emoji: '❗',
    title: 'The rabbit noticed',
    body: 'A rabbit spots your seedling the moment you plant it. The "!" marks the one that answered — it hops over and waits on the tile until the seedling grows. Only one rabbit answers each seedling, so plant where you want that rabbit to be.'
  },
  rabbit: {
    emoji: '🐰',
    title: 'Rabbit',
    body: 'Rabbits appear on their own when there is enough grass. They hop to the nearest grass and eat it — and the nearest free rabbit will come to a seedling the moment you plant it. Without grass, they starve.'
  },
  fox: {
    emoji: '🦊',
    title: 'Fox',
    body: 'Foxes appear when there are enough rabbits. They hunt the nearest rabbit, and they prefer one that is resting after a meal. Without rabbits, they starve.'
  },
  danger: {
    emoji: '⚠️',
    title: 'A rabbit is being hunted',
    body: 'The red line means a fox has locked on. A running rabbit is faster than a fox — but it needs somewhere to run. Plant a seedling away from the fox and the rabbit will bolt for it. You cannot fight the fox, but you can give the rabbit a way out.'
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
  seeds: 0,         // seedlings in hand right now
  seedProgress: 0,  // ms banked toward the next one
  holdMs: 0,
  calloutsDone: {},
  log: [],          // newest first: {text, n}
  logDirty: true,
  pops: [],         // canvas burst effects: {x, y, kind, born}
  started: false,   // false while the title screen is up: the field is drawn but frozen
  paused: false,
  cleared: false,
  failed: false,
  briefing: false,  // the mission card is up: the clock has not started yet
  witherAt: 0,      // performance.now() when the game-over wither began
  leaves: [],       // falling-leaf particles for that effect
  tutorialQueue: [],
  tutorialShowing: false
};

// Everything that should stop the clock. The stage is timed now, so any screen
// that covers the field has to stop time with it, or the player loses seconds
// to a popup they did not ask for.
function clockRunning() {
  return state.started && !state.paused && !state.cleared && !state.failed
    && !state.briefing && !state.tutorialShowing;
}

function idx(x, y) { return y * G + x; }

// The hand for the stage being played, falling back to the global default.
function handCfg() { return state.stage.hand || CONFIG.hand; }

function resetStage(stage) {
  state.stage = stage;
  state.cells = [];
  for (let i = 0; i < G * G; i++) {
    state.cells.push({ kind: 'EMPTY', since: 0, spreadAt: 0, spreads: 0, scarAt: -Infinity });
  }
  state.animals = [];
  state.gameNow = 0;
  state.lastSpawn = { rabbit: 0, fox: 0 };
  state.seedlingsUsed = 0;
  state.seeds = handCfg().max; // every stage opens with a full hand
  state.seedProgress = 0;
  state.holdMs = 0;
  state.calloutsDone = {};
  hideCallout();
  state.log = [];
  state.logDirty = true;
  state.pops = [];
  state.paused = false;
  state.cleared = false;
  state.failed = false;
  state.witherAt = 0;
  state.leaves = [];
  state.tutorialQueue = [];
  state.tutorialShowing = false;
  hideTutorial();
  el.clearOverlay.hidden = true;
  el.overOverlay.hidden = true;
  el.pauseOverlay.hidden = true;
  setPauseBtn(false);
  updateStatVisibility();
  renderStageBar();
  renderHud();
  maybeQueueTutorial('seedling'); // queued, but held back until the briefing closes
  maybeQueueTutorial('hand');
  showMission();
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
  if (!clockRunning()) return;
  state.gameNow += dt;
  const now = state.gameNow;

  // the hand grows back one seedling at a time, and only while the clock runs —
  // pausing or reading a tutorial must not quietly refill it
  const hand = handCfg();
  if (state.seeds < hand.max) {
    state.seedProgress += dt;
    while (state.seeds < hand.max && state.seedProgress >= hand.refillMs) {
      state.seedProgress -= hand.refillMs;
      state.seeds++;
    }
  }
  if (state.seeds >= hand.max) state.seedProgress = 0;

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
        c.spreads = 0;
        maybeQueueTutorial('grass');
      }
    } else if (c.kind === 'GRASS') {
      if (now - c.since >= CONFIG.grass.lifeMs) {
        c.kind = 'EMPTY';
        c.since = now;
        c.scarAt = now;
      } else if (now >= c.spreadAt && c.spreads < CONFIG.grass.spreadLimit) {
        c.spreadAt = now + CONFIG.grass.spreadMs;
        const spot = spreadSpot(i % G, Math.floor(i / G));
        if (spot) { c.spreads++; sprouts.push(spot); }
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

  // countdown call-outs: the clock in the corner is easy to tune out, so the
  // moments that change how you play get shouted across the field instead.
  const limit = state.stage.timeLimitSec;
  if (limit != null && !state.cleared && !state.failed) {
    const leftSec = Math.ceil((limit * 1000 - state.gameNow) / 1000);
    for (const mark of CALLOUT_MARKS) {
      if (leftSec <= mark && !state.calloutsDone[mark] && limit > mark + 10) {
        state.calloutsDone[mark] = true;
        showCallout(mark);
      }
    }
  }

  // time check: whatever the meadow looks like when the clock stops is the
  // verdict - holding the goal at that moment still counts as a clear.
  if (!state.cleared && limit != null && state.gameNow >= limit * 1000) {
    if (allConditionsMet()) stageClear();
    else gameOver();
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
    restUntil: 0,
    headDownUntil: 0,
    chaseSince: 0,
    ignoreUntil: 0,
    panic: false,
    closest: Infinity, // nearest a fox has got during the current panic
    lure: null,        // a seedling the player planted for this rabbit
    lureUntil: 0,
    noticeAt: 0        // when its "!" popped, for the draw pass
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
  if (now < a.restUntil) {
    // The first moment of a meal is head-down and oblivious — that is the
    // window foxes actually hunt in. After it the rabbit is still resting but
    // alert, and a fox coming inside fleeRadius startles it back to its feet.
    if (a.type !== 'rabbit' || now < a.headDownUntil) return;
    if (!threatTo(a)) return;
    a.restUntil = 0;
  }

  if (a.type === 'rabbit') {
    const threat = threatTo(a);
    if (threat) {
      a.panic = true;
      if (threat.d < a.closest) a.closest = threat.d;
      maybeQueueTutorial('danger');
      if (now - a.lastMoveAt < CONFIG.rabbit.fleeMs) return;
      a.lastMoveAt = now;
      tryEat(a, now); // a bite first if it is already standing on grass
      // With the fox still a few tiles off, a rabbit that reached food stays
      // put — otherwise it sprints straight past the tile the player planted
      // for it, and a seedling never gets the chance to finish growing.
      const here = state.cells[idx(a.x, a.y)].kind;
      if (threat.d >= 3 && (here === 'GRASS' || here === 'SEEDLING')) return;
      flee(a, threat.fox);
      tryEat(a, now); // ...or one snatched mid-flight
      return;
    }
    if (a.panic) {
      a.panic = false;
      if (a.closest <= 2) logEvent('🐰 escaped 🦊'); // only a real near miss
      a.closest = Infinity;
    }
  }

  if (now - a.lastMoveAt < CONFIG[a.type].moveMs) return;
  a.lastMoveAt = now;

  const target = nearestTarget(a);

  if (a.type === 'fox') {
    if (!target) {
      a.chaseSince = 0;
    } else if (!a.chaseSince) {
      a.chaseSince = now;
    } else if (now - a.chaseSince > CONFIG.fox.giveUpMs) {
      a.ignoreUntil = now + CONFIG.fox.sulkMs;
      a.chaseSince = 0;
      logEvent('🦊 gave up the chase');
      wander(a);
      return;
    }
  }

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
    // Grazing rabbits head for grown grass only. They chase seedlings when
    // fleeing (see refugeFor), but not while calm — a rabbit that camps on new
    // growth eats it the instant it matures, and no grass ever lives the 7s it
    // needs to spread. That quietly starves the whole meadow.
    // Eating means going head-down, so where a rabbit chooses to graze is a
    // life-or-death choice: it favours patches well clear of any fox. This is
    // the player's real lever — grass planted somewhere safe is where rabbits
    // will go to feed.
    // ...except a seedling the player planted for this rabbit: it answered that
    // call the moment the tile was tapped, and it keeps its word (callRabbitTo).
    const lure = lureTarget(a, state.gameNow);
    if (lure) return lure;
    const near = nearestFox(a);
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        if (state.cells[idx(x, y)].kind !== 'GRASS') continue;
        let d = Math.abs(x - a.x) + Math.abs(y - a.y);
        if (near) {
          const fromFox = Math.abs(x - near.fox.x) + Math.abs(y - near.fox.y);
          if (fromFox <= CONFIG.rabbit.fleeRadius) continue; // not in the fox's lap
          d += Math.max(0, CONFIG.rabbit.grazeSafeRadius - fromFox);
        }
        if (d < bestD) { bestD = d; best = { x: x, y: y }; }
      }
    }
  } else {
    if (state.gameNow < a.ignoreUntil) return null; // catching its breath
    for (const r of state.animals) {
      if (r.type !== 'rabbit') continue;
      let d = Math.abs(r.x - a.x) + Math.abs(r.y - a.y);
      if (d > CONFIG.fox.sightRadius) continue; // out of sight, out of mind
      if (state.gameNow < r.restUntil) d -= 3;  // a resting rabbit is easy prey
      if (d < bestD) { bestD = d; best = { x: r.x, y: r.y }; }
    }
  }
  return best;
}

// The tile a rabbit was called to, as long as that call still stands. The call
// dies with the seedling — grazed, withered, or simply waited out — and clearing
// it here means every caller can just ask and trust the answer.
function lureTarget(a, now) {
  if (!a.lure) return null;
  const kind = state.cells[idx(a.lure.x, a.lure.y)].kind;
  if (now > a.lureUntil || (kind !== 'SEEDLING' && kind !== 'GRASS')) {
    a.lure = null;
    return null;
  }
  return a.lure;
}

// The nearest fox and how far away it is, or null when there are none.
function nearestFox(a) {
  let fox = null, bestD = Infinity;
  for (const f of state.animals) {
    if (f.type !== 'fox') continue;
    const d = Math.abs(f.x - a.x) + Math.abs(f.y - a.y);
    if (d < bestD) { bestD = d; fox = f; }
  }
  return fox ? { fox: fox, d: bestD } : null;
}

// ...and whether it is close enough to make this rabbit run.
// A panic starts at fleeRadius but does not end until the rabbit is outside
// the fox's sight. Stopping any earlier is pointless — the fox simply
// re-acquires it, and no amount of running ever buys real safety.
function threatTo(a) {
  const near = nearestFox(a);
  if (!near) return null;
  const limit = a.panic ? CONFIG.fox.sightRadius + 1 : CONFIG.rabbit.fleeRadius;
  return near.d <= limit ? near : null;
}

// Where a frightened rabbit is heading. Not simply the nearest grass: the
// nearest patch is often on the fox's side, and running to it walks the rabbit
// straight into the jaws. A refuge is grass that is close to the rabbit AND
// well clear of the fox — which is exactly what the player plants.
function refugeFor(a, fox) {
  let best = null, bestScore = Infinity;
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const kind = state.cells[idx(x, y)].kind;
      if (kind !== 'GRASS' && kind !== 'SEEDLING') continue;
      const fromFox = Math.abs(x - fox.x) + Math.abs(y - fox.y);
      if (fromFox <= CONFIG.rabbit.fleeRadius) continue; // that patch is in its lap
      // ...and skip it if the fox would get there first: a rabbit covers a tile
      // per fleeMs, a fox per its moveMs, so compare the two arrival times.
      const toRabbit = Math.abs(x - a.x) + Math.abs(y - a.y);
      if (toRabbit * CONFIG.rabbit.fleeMs >= fromFox * CONFIG.fox.moveMs) continue;
      const score = toRabbit - fromFox * 0.5;
      if (score < bestScore) { bestScore = score; best = { x: x, y: y }; }
    }
  }
  return best;
}

// One panicked hop. A rabbit that only runs "away" pins itself against a wall
// and dies in the corner, so the score also avoids the edges and pulls toward
// the refuge — which is what makes the tile the player just planted an escape route.
function flee(a, fox) {
  const food = refugeFor(a, fox);
  let best = null, bestScore = -Infinity;
  for (const d of NEIGHBOURS) {
    const nx = a.x + d[0], ny = a.y + d[1];
    if (nx < 0 || nx >= G || ny < 0 || ny >= G) continue;
    const away = Math.abs(nx - fox.x) + Math.abs(ny - fox.y);
    const wall = Math.max(0, 3 - Math.min(nx, ny, G - 1 - nx, G - 1 - ny));
    let score = away * 6 - wall * 8; // outrunning a fox into a corner is no escape
    if (food) score -= (Math.abs(nx - food.x) + Math.abs(ny - food.y)) * 4;
    if (score > bestScore) { bestScore = score; best = { x: nx, y: ny }; }
  }
  if (best) { a.x = best.x; a.y = best.y; }
}

function wander(a) {
  const options = [];
  for (const d of NEIGHBOURS) {
    const nx = a.x + d[0], ny = a.y + d[1];
    if (nx < 0 || nx >= G || ny < 0 || ny >= G) continue;
    options.push({ x: nx, y: ny });
  }
  if (!options.length) return;

  // A rabbit with no grass left to walk to used to wander at random — including
  // straight into a fox standing next to it. Idle steps still avoid a fox in sight.
  let pool = options;
  const threat = a.type === 'rabbit' ? threatTo(a) : null;
  if (threat) {
    const here = Math.abs(a.x - threat.fox.x) + Math.abs(a.y - threat.fox.y);
    const safe = options.filter(function (o) {
      return Math.abs(o.x - threat.fox.x) + Math.abs(o.y - threat.fox.y) > here;
    });
    if (safe.length) pool = safe;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  a.x = pick.x;
  a.y = pick.y;
}

function tryEat(a, now) {
  if (a.type === 'rabbit') {
    const c = state.cells[idx(a.x, a.y)];
    if (c.kind === 'GRASS') {
      c.kind = 'EMPTY';
      c.since = now;
      c.scarAt = now;
      a.lastAteAt = now;
      a.restUntil = now + CONFIG.rabbit.eatPauseMs;
      a.headDownUntil = now + CONFIG.rabbit.headDownMs;
      addPop(a.x, a.y, 'eat');
      logEvent('🐰 ate 🌿');
    }
  } else {
    const prey = animalAt(a.x, a.y, 'rabbit');
    if (prey) {
      state.animals = state.animals.filter(function (x) { return x !== prey; });
      a.lastAteAt = now;
      a.restUntil = now + CONFIG.fox.eatPauseMs;
      a.chaseSince = 0;
      addPop(a.x, a.y, 'catch');
      logEvent('🦊 caught 🐰');
    }
  }
}

// ---------- Player input ----------

function plantAt(x, y) {
  if (!clockRunning()) return;
  const c = state.cells[idx(x, y)];
  if (c.kind !== 'EMPTY') return;
  const limit = state.stage.seedlingLimit;
  if (limit != null && state.seedlingsUsed >= limit) return;
  if (state.seeds < 1) { denyPlant(); return; } // empty hand: wait for the bar
  state.seeds--;
  c.kind = 'SEEDLING';
  c.since = state.gameNow;
  state.seedlingsUsed++;
  callRabbitTo(x, y);
  renderHud();
}

// A tap on an empty hand does nothing, and nothing looks exactly like a bug —
// so the hand shakes to say the tap was heard and the answer was "not yet".
function denyPlant() {
  el.seedHand.classList.remove('denied');
  void el.seedHand.offsetWidth; // reflow, so a second refusal replays the shake
  el.seedHand.classList.add('denied');
}

// Planting is the player's only move, so it has to land like one. The nearest
// free rabbit notices the seedling the instant it is tapped, sets off, and waits
// on the tile until it grows — luring becomes a plan you make rather than a
// coincidence you wait for. Only player-planted tiles call, and only one rabbit
// answers: grass that spreads on its own still gets the quiet time it needs to
// seed a meadow, and the rest of the warren grazes as before.
function callRabbitTo(x, y) {
  let best = null, bestD = Infinity;
  for (const a of state.animals) {
    if (a.type !== 'rabbit' || a.panic) continue;
    if (state.gameNow < a.restUntil) continue;   // head down in a meal
    if (lureTarget(a, state.gameNow)) continue;  // already has an errand
    const d = Math.abs(a.x - x) + Math.abs(a.y - y);
    if (d > CONFIG.rabbit.lureRadius || d >= bestD) continue;
    bestD = d; best = a;
  }
  if (!best) return;
  best.lure = { x: x, y: y };
  best.lureUntil = state.gameNow + CONFIG.rabbit.lureMs;
  best.noticeAt = performance.now();
  best.lastMoveAt = 0; // it sets off on the next tick, not after its usual beat
  maybeQueueTutorial('lure');
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

function gameOver() {
  state.failed = true;
  state.witherAt = performance.now();
  state.leaves = makeFallingLeaves();
  logEvent('🍂 The ecosystem collapsed');
  renderHud();
  const short = state.stage.conditions.filter(function (c) { return !conditionMet(c); });
  el.overBody.textContent = short.length
    ? 'The clock ran out with ' + short.map(function (c) { return EMOJI[c.entity]; }).join(' ') + ' short of the goal.'
    : 'The clock ran out before the meadow settled.';
  // let the wither play before the box lands on top of it
  setTimeout(function () {
    if (state.failed) el.overOverlay.hidden = false;
  }, 1500);
}

// ---------- Mission briefing ----------
// The clock only makes sense if the player has read the goal first, so every
// stage opens on its own card and time starts when they close it.

let calloutTimer = 0;

function showCallout(sec) {
  el.calloutNum.textContent = sec;
  el.timeCallout.hidden = false;
  // drop and re-add so a second call-out replays the animation from the top
  el.timeCallout.classList.remove('run');
  void el.timeCallout.offsetWidth;
  el.timeCallout.classList.add('run');
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(hideCallout, 1900);
  logEvent('⏳ ' + sec + 's left');
}

function hideCallout() {
  clearTimeout(calloutTimer);
  if (!el.timeCallout) return;
  el.timeCallout.hidden = true;
  el.timeCallout.classList.remove('run');
}

function fmtClock(ms) {
  const total = Math.ceil(ms / 1000);
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

// ---------- The goal, shown rather than spelled out ----------
// "3 or more rabbits" used to be a sentence the player had to re-read mid-game.
// Now every goal is a row of slots — one slot per creature the stage asks for,
// lit when the meadow has it and faint while it still owes it. Counting three
// lit rabbits beats reading three words, so the words are gone and the only
// text left is the row's aria-label, for players who cannot see the picture.
const SLOT_CAP = 10;   // past this, a row of dots stops being countable at a glance

function goalRows() {
  return state.stage.conditions.map(function (cond) {
    const target = cond.min != null ? cond.min : cond.max;
    const have = entityCount(cond.entity);
    return {
      cond: cond,
      target: target,
      have: have,
      lit: Math.min(have, target),
      over: Math.max(0, have - target),
      ok: conditionMet(cond),
      // a max condition is the one case where spare creatures are the problem
      capped: cond.max != null
    };
  });
}

function renderGoalBoard(host) {
  host.textContent = '';
  for (const r of goalRows()) {
    const row = document.createElement('div');
    row.className = 'goal-row' + (r.ok ? ' ok' : '');
    row.setAttribute('role', 'img');
    row.setAttribute('aria-label', condLabel(r.cond) + ' — now ' + r.have);

    const face = document.createElement('span');
    face.className = 'goal-face';
    face.textContent = EMOJI[r.cond.entity];
    row.appendChild(face);

    const slots = document.createElement('span');
    slots.className = 'goal-slots';
    if (r.target > SLOT_CAP) {
      // too many to count: the one place a number still beats a picture
      const big = document.createElement('span');
      big.className = 'goal-fraction';
      big.textContent = r.have + ' / ' + r.target;
      slots.appendChild(big);
    } else {
      for (let i = 0; i < r.target; i++) {
        const s = document.createElement('span');
        s.className = 'goal-slot' + (i < r.lit ? ' lit' : '');
        s.textContent = EMOJI[r.cond.entity];
        slots.appendChild(s);
      }
      // spares sit past the asked-for slots: quietly for a minimum, in red for
      // a maximum, where they are the reason the goal is not met
      for (let i = 0; i < Math.min(r.over, SLOT_CAP); i++) {
        const s = document.createElement('span');
        s.className = 'goal-slot lit ' + (r.capped ? 'over' : 'spare');
        s.textContent = EMOJI[r.cond.entity];
        slots.appendChild(s);
      }
    }
    row.appendChild(slots);

    const mark = document.createElement('span');
    mark.className = 'goal-mark';
    mark.textContent = r.ok ? '✓' : '';
    row.appendChild(mark);
    host.appendChild(row);
  }
}

function condLabel(cond) {
  let text = EMOJI[cond.entity] + ' ';
  if (cond.min != null && cond.max != null) text += cond.min + '\–' + cond.max;
  else if (cond.min != null) text += cond.min + ' or more';
  else text += cond.max + ' or fewer';
  return text;
}

function showMission() {
  state.briefing = true;
  el.missionTitle.textContent = 'Stage ' + state.stage.id + ': ' + state.stage.name;
  renderGoalBoard(el.missionList);
  // the rule as three pictures rather than two sentences: fill it, hold it, win
  el.missionHoldWord.textContent = 'Hold ' + state.stage.holdSec + 's';
  const limit = state.stage.timeLimitSec;
  el.missionNote.hidden = limit == null;
  if (limit != null) el.missionNote.textContent = '⏳ ' + fmtClock(limit * 1000);
  renderMissionHand();
  el.missionOverlay.hidden = false;
}

// The hand, shown rather than spelled out. A refill measured in seconds means
// nothing to a player — what they need to know is whether seedlings come back
// quickly or slowly, so that is what the card says.
const HAND_SPEEDS = [
  { upToMs: 2400, word: 'quickly', level: 3 },
  { upToMs: 3600, word: 'steadily', level: 2 },
  { upToMs: Infinity, word: 'slowly', level: 1 }
];

function handSpeed() {
  const ms = handCfg().refillMs;
  return HAND_SPEEDS.find(function (s) { return ms <= s.upToMs; });
}

function renderMissionHand() {
  const hand = handCfg();
  const speed = handSpeed();
  el.missionHand.textContent = '';

  const pots = document.createElement('div');
  pots.className = 'mission-pots';
  for (let i = 0; i < hand.max; i++) {
    const pot = cloneTpl('tplPot');
    if (pot) {
      pot.firstElementChild.classList.add('held');
      pots.appendChild(pot);
    }
  }
  el.missionHand.appendChild(pots);

  const pill = document.createElement('span');
  pill.className = 'speed-pill';
  const bars = document.createElement('span');
  bars.className = 'speed-bars lv' + speed.level;
  for (let i = 0; i < 3; i++) bars.appendChild(document.createElement('i'));
  const label = document.createElement('span');
  label.textContent = 'Seedlings grow back ' + speed.word;
  pill.appendChild(bars);
  pill.appendChild(label);
  el.missionHand.appendChild(pill);
}

function closeMission() {
  state.briefing = false;
  el.missionOverlay.hidden = true;
  showNextTutorial();
}

// ---------- Title screen ----------

function highestUnlockedStage() {
  let start = STAGES[0];
  for (const s of STAGES) if (isUnlocked(s.id)) start = s;
  return start;
}

function renderTitleProgress() {
  const p = getProgress();
  let done = 0;
  for (const s of STAGES) if (p.cleared[s.id]) done++;
  const next = highestUnlockedStage();
  el.titleProgress.textContent = done === 0
    ? STAGES.length + ' stages to grow'
    : 'Stage ' + next.id + ' · ' + done + ' of ' + STAGES.length + ' cleared';
  el.startBtn.querySelector('.btn-label').textContent = done === 0 ? 'Start' : 'Continue';
}

function showTitle() {
  state.started = false;
  state.paused = false;
  state.briefing = false;
  state.failed = false;
  state.witherAt = 0;
  el.pauseOverlay.hidden = true;
  el.missionOverlay.hidden = true;
  el.overOverlay.hidden = true;
  setPauseBtn(false);
  hideTutorial();
  state.stage = highestUnlockedStage();
  renderTitleProgress();
  renderStageBar();
  el.titleScreen.hidden = false;
  document.body.classList.add('title-open');
}

function startGame() {
  el.titleScreen.hidden = true;
  document.body.classList.remove('title-open');
  state.started = true;         // set first, so resetStage may queue the intro tutorial
  resetStage(state.stage);
  window.scrollTo(0, 0);        // the page may still be scrolled from the last play
}

// ---------- Tutorials ----------

function maybeQueueTutorial(key) {
  if (!state.started) return; // don't burn a tutorial behind the title screen
  const p = getProgress();
  if (p.seen[key]) return;
  if (state.tutorialQueue.includes(key)) return;
  p.seen[key] = true; // mark immediately so it never re-queues
  saveProgress(p);
  state.tutorialQueue.push(key);
  showNextTutorial();
}

function showNextTutorial() {
  if (state.tutorialShowing || state.briefing) return;
  const key = state.tutorialQueue.shift();
  if (!key) return;
  const t = TUTORIALS[key];
  el.tutorialEmoji.textContent = t.emoji;
  el.tutorialTitle.textContent = t.title;
  el.tutorialBody.textContent = t.body;
  // a tutorial with a drawing does not also need the emoji standing over it
  el.tutorialArt.textContent = '';
  const art = t.art ? cloneTpl(t.art) : null;
  if (art) el.tutorialArt.appendChild(art);
  el.tutorialArt.hidden = !art;
  el.tutorialEmoji.hidden = !!art;
  el.tutorial.hidden = false;
  state.tutorialShowing = true; // the clock stops while this is up (see clockRunning)
}

function hideTutorial() {
  el.tutorial.hidden = true;
  el.tutorialArt.textContent = '';
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

// ---------- "!" notice ----------
// The only sign of which rabbit answered a planted seedling. It pops before the
// rabbit has taken a step, which is the point: the player should see the plan
// land at the moment of the tap, not infer it from a hop three ticks later.

const NOTICE_MS = 1200;

function drawNotice(cx, cy, u, a, t) {
  if (!a.noticeAt) return;
  const k = (t - a.noticeAt) / NOTICE_MS;
  if (k >= 1) { a.noticeAt = 0; return; }
  const rise = Math.min(1, k / 0.16);                   // springs up out of the ears
  const bob = Math.sin(k * Math.PI * 2.6) * u * 0.045;  // ...then bobs
  const y = cy - u * (0.34 + 0.26 * rise) + bob;
  const size = u * 0.44 * (0.45 + 0.55 * rise) * (1 + 0.3 * (1 - rise));
  ctx.save();
  ctx.globalAlpha = k > 0.72 ? (1 - k) / 0.28 : 1;
  ctx.font = '900 ' + size + 'px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255, 253, 244, 0.95)';        // halo, so it reads on grass
  ctx.strokeText('!', cx, y);
  ctx.fillStyle = '#e8a01c';
  ctx.fillText('!', cx, y);
  ctx.restore();
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

// ---------- Game-over effect ----------
// The meadow dries out: colour drains from the whole field and the last of it
// lets go as falling leaves.

const WITHER_MS = 1300;

function makeFallingLeaves() {
  const out = [];
  for (let i = 0; i < 20; i++) {
    out.push({
      x: Math.random(),
      delay: Math.random() * 800,
      dur: 1500 + Math.random() * 1300,
      drift: (Math.random() - 0.5) * 0.22,
      spin: (Math.random() - 0.5) * 0.011,
      size: 0.5 + Math.random() * 0.6,
      tone: Math.random() < 0.5 ? '#c8993f' : '#a8712c'
    });
  }
  return out;
}

function drawWither(t) {
  if (!state.witherAt) return;
  const size = el.field.width;
  const e = t - state.witherAt;

  ctx.globalAlpha = Math.min(1, e / WITHER_MS) * 0.7;
  ctx.fillStyle = '#c3a969';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  for (const lf of state.leaves) {
    const age = e - lf.delay;
    if (age <= 0) continue;
    const q = age / lf.dur;
    if (q >= 1) continue;
    const x = (lf.x + lf.drift * q + Math.sin(age / 300 + lf.x * 9) * 0.022) * size;
    const y = (-0.08 + q * 1.16) * size;
    const w = size * 0.011 * lf.size;
    const hh = size * 0.026 * lf.size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(age * lf.spin);
    ctx.globalAlpha = 0.9 * Math.min(1, (1 - q) * 4);
    ctx.fillStyle = lf.tone;
    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.quadraticCurveTo(w, -hh * 0.1, 0, hh);
    ctx.quadraticCurveTo(-w, -hh * 0.1, 0, -hh);
    ctx.fill();
    ctx.restore();
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
    'clearRetryBtn', 'clearNextBtn', 'pauseOverlay', 'pauseBtn', 'retryBtn', 'eventLog',
    'titleScreen', 'titleProgress', 'startBtn', 'titleBtn',
    'seedHand', 'handSlots', 'handFill', 'handRunner', 'handNote', 'tutorialArt', 'missionHand',
    'timeLeft', 'timeCallout', 'calloutNum', 'missionOverlay', 'missionTitle', 'missionList', 'missionNote',
    'missionHoldWord', 'missionOkBtn', 'overOverlay', 'overBody', 'overRetryBtn', 'overTitleBtn'];
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

// Artwork is authored in index.html as <template> markup and cloned from
// there, so the drawings live with the rest of the markup.
function cloneTpl(id) {
  const tpl = document.getElementById(id);
  return tpl ? tpl.content.cloneNode(true) : null;
}

// The hand: a pot per seedling you can hold, and a soil track for the next one.
// The pot at the front of the queue grows its sprout in step with the track, so
// the two read as one thing happening rather than two meters to watch.
function renderHand() {
  const hand = handCfg();
  if (el.handSlots.childElementCount !== hand.max) {
    el.handSlots.textContent = '';
    for (let i = 0; i < hand.max; i++) {
      const pot = cloneTpl('tplPot');
      if (pot) el.handSlots.appendChild(pot);
    }
  }

  const full = state.seeds >= hand.max;
  const grow = full ? 1 : Math.min(1, state.seedProgress / hand.refillMs);
  const slots = el.handSlots.children;
  for (let i = 0; i < slots.length; i++) {
    slots[i].className = 'hand-slot ' +
      (i < state.seeds ? 'held' : i === state.seeds ? 'growing' : 'empty');
    slots[i].style.setProperty('--grow', i === state.seeds ? grow.toFixed(3) : '0');
  }

  const pct = full ? 100 : grow * 100;
  el.handFill.style.width = pct + '%';
  el.handRunner.style.left = pct + '%';
  el.seedHand.classList.toggle('full-hand', full);
  el.seedHand.classList.toggle('empty-hand', state.seeds < 1);
  el.handNote.textContent = full ? 'Hand full'
    : state.seeds < 1 ? 'Out of seedlings'
    : 'Growing back…';
}

function renderHud() {
  el.stageName.textContent = 'Stage ' + state.stage.id + ': ' + state.stage.name;
  el.statSeedling.textContent = countSeedlings();
  el.statGrass.textContent = countGrass();
  el.statRabbit.textContent = countAnimals('rabbit');
  el.statFox.textContent = countAnimals('fox');
  if (state.stage.seedlingLimit != null) {
    el.statSeedsLeft.textContent = Math.max(0, state.stage.seedlingLimit - state.seedlingsUsed);
  }

  renderHand();

  // the goal, as one row of slots per condition
  renderGoalBoard(el.conditionList);

  // hold progress
  const holdTotal = state.stage.holdSec * 1000;
  const pct = Math.min(100, (state.holdMs / holdTotal) * 100);
  el.holdFill.style.width = pct + '%';
  // countdown, pinned to the field so it is in view the whole time
  const limit = state.stage.timeLimitSec;
  if (limit == null) {
    el.timeLeft.hidden = true;
  } else {
    const leftMs = Math.max(0, limit * 1000 - state.gameNow);
    const live = !state.cleared && !state.failed;
    el.timeLeft.hidden = false;
    el.timeLeft.textContent = fmtClock(leftMs);
    el.timeLeft.classList.toggle('low', live && leftMs <= 30000);
    el.timeLeft.classList.toggle('critical', live && leftMs <= 10000);
  }

  // the bar already shows how far the hold has come, so the label only has to
  // name the state — two words at most, never a running count
  if (state.failed) {
    el.holdText.textContent = '⏳ Out of time';
  } else if (state.cleared) {
    el.holdText.textContent = '🏆 Clear!';
  } else if (state.holdMs > 0) {
    el.holdText.textContent = '⏱️ Holding…';
  } else {
    el.holdText.textContent = '⏱️ Hold ' + state.stage.holdSec + 's';
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

// Worn ground where grass was grazed or withered. Starvation is now the main
// way animals die, so the player needs to see which stretches of the meadow
// have been eaten bare — that is where planting stops helping.
function drawScars(cell, t) {
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const c = state.cells[idx(x, y)];
      const age = state.gameNow - c.scarAt;
      if (!(age >= 0) || age >= CONFIG.grass.scarMs) continue;
      const k = 1 - age / CONFIG.grass.scarMs;
      const seed = cellSeeds[idx(x, y)] || 0;
      const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
      ctx.fillStyle = 'rgba(152, 126, 84, ' + (0.34 * k).toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(cx, cy + cell * 0.08, cell * (0.3 + 0.06 * Math.sin(seed)),
        cell * (0.22 + 0.05 * Math.cos(seed)), seed, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// A fullness arc at each animal's feet: green when fed, red when close to
// starving. Without it a rabbit simply vanishes and the player has no way to
// know which one to plant for.
function drawHunger(cx, cy, u, a, t) {
  const k = Math.max(0, Math.min(1,
    1 - (state.gameNow - a.lastAteAt) / CONFIG[a.type].starveMs));
  const r = u * 0.33, y = cy + u * 0.36;
  const a1 = Math.PI * 0.16, a2 = Math.PI * 0.84;

  ctx.lineWidth = Math.max(1.6, u * 0.08);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(40, 50, 25, 0.15)';
  ctx.beginPath();
  ctx.arc(cx, y, r, a1, a2);
  ctx.stroke();

  if (k <= 0) return;
  ctx.strokeStyle = k > 0.5 ? '#4e9440' : (k > 0.22 ? '#d9a125' : '#cf4426');
  // the last sliver pulses, so a rabbit about to starve catches the eye
  ctx.globalAlpha = k > 0.15 ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(t / 180));
  ctx.beginPath();
  ctx.arc(cx, y, r, a1, a1 + (a2 - a1) * k);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Draws the fox -> rabbit lock-on so the player gets a few seconds of warning.
// Without this the chase is invisible until it is already over.
function drawThreats(cell, t) {
  for (const f of state.animals) {
    if (f.type !== 'fox') continue;
    let prey = null, bestD = Infinity;
    for (const r of state.animals) {
      if (r.type !== 'rabbit') continue;
      const d = Math.abs(r.x - f.x) + Math.abs(r.y - f.y);
      if (d < bestD) { bestD = d; prey = r; }
    }
    if (!prey || bestD > CONFIG.rabbit.fleeRadius) continue;

    const fx = f.rx * cell + cell / 2, fy = f.ry * cell + cell / 2;
    const rx = prey.rx * cell + cell / 2, ry = prey.ry * cell + cell / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(206, 66, 36, 0.7)';
    ctx.lineWidth = cell * 0.06;
    ctx.setLineDash([cell * 0.16, cell * 0.15]);
    ctx.lineDashOffset = -(t / 45) % 1000; // dashes march toward the rabbit
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.restore();

    const pulse = 0.5 + 0.5 * Math.sin(t / 150);
    ctx.strokeStyle = 'rgba(206, 66, 36, ' + (0.4 + 0.4 * pulse) + ')';
    ctx.lineWidth = cell * 0.055;
    ctx.beginPath();
    ctx.arc(rx, ry, cell * (0.4 + 0.08 * pulse), 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------- Animal sprites ----------
// The animals used to be bare canvas ellipses, so the only thing they could do
// was bounce. They are now assembled from separate body-part images, which lets
// every part move on its own: ears flatten in a panic, legs swing, tails sway,
// a hunting fox crouches. If any image fails to load we keep the old vector
// drawing below, so the game never ends up with invisible animals.

const SPRITE_FILES = {
  rabbitHeadCalm: 'rabbit-head-calm.png',
  rabbitHeadPanic: 'rabbit-head-panic.png',
  rabbitHeadEat: 'rabbit-head-eat.png',
  rabbitEar: 'rabbit-ear.png',
  rabbitBody: 'rabbit-body.png',
  rabbitLegHind: 'rabbit-leg-hind.png',
  rabbitLegFront: 'rabbit-leg-front.png',
  rabbitTail: 'rabbit-tail.png',
  foxHeadCalm: 'fox-head-calm.png',
  foxHeadHunt: 'fox-head-hunt.png',
  foxHeadSulk: 'fox-head-sulk.png',
  foxBody: 'fox-body.png',
  foxLegHind: 'fox-leg-hind.png',
  foxLegFront: 'fox-leg-front.png',
  foxTail: 'fox-tail.png'
};

const sprites = {};
let spritesReady = false;

// The source art is ~200px per part but a part is drawn at 4-18px. Letting the
// canvas make that jump every frame gives ragged line art, so each image is
// halved down once at load time and the small copy is what gets drawn.
function shrinkSprite(img, maxDim) {
  let c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  while (Math.max(c.width, c.height) > maxDim * 2) {
    const n = document.createElement('canvas');
    n.width = Math.max(1, Math.round(c.width / 2));
    n.height = Math.max(1, Math.round(c.height / 2));
    const g = n.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(c, 0, 0, n.width, n.height);
    c = n;
  }
  return c;
}

function loadSprites() {
  const keys = Object.keys(SPRITE_FILES);
  let left = keys.length;
  for (const key of keys) {
    const img = new Image();
    img.onload = function () {
      sprites[key] = { img: shrinkSprite(img, 64), w: img.width, h: img.height };
      left -= 1;
      if (left === 0) spritesReady = true;
    };
    // one missing file means a half-built animal, so fall back to vectors
    img.onerror = function () { left = -1; };
    img.src = 'img/' + SPRITE_FILES[key];
  }
}

// Where each part sits and how wide it is drawn, in "40px cell" units measured
// from the animal's centre. Tuning the look means touching only this table.
//
// `w` is the drawn width, NOT a multiplier on the image: the height follows the
// image's own aspect ratio. Re-exporting the art at a different resolution then
// changes nothing on screen — an earlier version scaled by the file's pixel
// size and every animal silently halved when the PNGs were optimised.
const RIG = {
  rabbit: {
    body: { w: 21.5, x: -1.2, y: 3.2, px: 0.5, py: 0.5 },
    // the head is pulled back and down into the body: drawn further out it
    // reads as a separate blob floating next to the torso
    head: { w: 18.7, x: 6.2, y: -1.6, px: 0.5, py: 0.5 },
    ear: { w: 7.5, x: 6.0, y: -7.4, px: 0.5, py: 0.95 },
    tail: { w: 10.0, x: -11.0, y: 1.4, px: 0.5, py: 0.5 },
    legHind: { w: 10.8, x: -3.4, y: 5.6, px: 0.5, py: 0.12 },
    legFront: { w: 5.9, x: 6.4, y: 5.6, px: 0.5, py: 0.10 }
  },
  fox: {
    body: { w: 23.5, x: -1.2, y: 3.2, px: 0.5, py: 0.5 },
    head: { w: 19.5, x: 6.8, y: -2.2, px: 0.5, py: 0.5 },
    // the tail art lies horizontally with its thick base on the left edge, so
    // the pivot is that edge and the part gets mirrored to trail behind
    tail: { w: 21.7, x: -8.6, y: 1.4, px: 0.06, py: 0.55 },
    legHind: { w: 6.1, x: -3.8, y: 5.4, px: 0.5, py: 0.10 },
    legFront: { w: 3.6, x: 6.4, y: 5.4, px: 0.5, py: 0.10 }
  }
};

// Draws one part with its pivot at (x, y) and rotated around that pivot.
// `dw` is the drawn width; the height comes from the image's aspect ratio.
function drawPart(p, x, y, dw, rot, px, py, flip) {
  if (!p) return;
  const w = dw, h = dw * (p.h / p.w);
  ctx.save();
  ctx.translate(x, y);
  // a mirrored part turns the other way on screen, so undo that here and let
  // callers keep thinking in one direction
  if (rot) ctx.rotate(flip ? -rot : rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(p.img, -w * px, -h * py, w, h);
  ctx.restore();
}

function place(p, c, rot, dx, dy, wm, flip) {
  drawPart(p, c.x + (dx || 0), c.y + (dy || 0), c.w * (wm || 1),
    rot || 0, c.px, c.py, flip);
}

// How full the animal is, 1 = just ate, 0 = starving. Same figure the hunger
// arc uses, reused here so a hungry animal visibly sags.
function fullness(a) {
  return Math.max(0, Math.min(1,
    1 - (state.gameNow - a.lastAteAt) / CONFIG[a.type].starveMs));
}

function isMoving(a) {
  return Math.abs(a.x - a.rx) + Math.abs(a.y - a.ry) > 0.06;
}

function drawRabbitSprite(cx, cy, u, a, t) {
  const s = u / 40;
  const seed = a.seed || 0;
  const now = state.gameNow;
  const eating = now < a.headDownUntil || now < a.restUntil;
  const moving = isMoving(a);
  const fed = fullness(a);

  // hop cycle: fast and high when running, a slow breath when standing still
  const period = a.panic ? 120 : (moving ? 260 : 900);
  const swing = Math.sin(t / period + seed);
  const hop = (moving || a.panic) ? Math.abs(swing) * (a.panic ? 3.6 : 2.4) : 0;
  const breath = moving ? 0 : Math.sin(t / 900 + seed) * 0.35;
  const sag = (1 - fed) * 1.2; // a starving rabbit sits lower

  ctx.save();
  ctx.translate(cx, cy + (sag - hop) * s);
  ctx.scale((a.face || 1) * s, s); // from here on, coordinates are cell units
  if (a.panic) ctx.rotate(0.10);   // lean into the run

  const R = RIG.rabbit;
  const legRot = (moving || a.panic) ? swing * 0.55 : Math.sin(t / 900 + seed) * 0.05;
  const tailRot = Math.sin(t / 300 + seed) * (moving ? 0.35 : 0.12);
  const headRot = eating ? 0.45 : (a.panic ? -0.06 : Math.sin(t / 800 + seed) * 0.05);
  const headDx = eating ? -0.6 : 0;
  const headDy = (eating ? 3.4 : 0) + breath * 0.6;
  // ears: splayed and flicking at rest, pinned flat back while running
  const earRot = a.panic ? -1.05 : (Math.sin(t / 620 + seed) * 0.10);

  // far pair of legs first, dimmed so the near pair reads as being in front
  ctx.globalAlpha = 0.72;
  place(sprites.rabbitLegHind, R.legHind, -legRot, -1.4, -0.3, 0.9);
  place(sprites.rabbitLegFront, R.legFront, legRot, -1.2, -0.3, 0.9);
  ctx.globalAlpha = 1;

  place(sprites.rabbitTail, R.tail, tailRot);
  place(sprites.rabbitBody, R.body, 0, 0, breath);
  place(sprites.rabbitLegHind, R.legHind, legRot);
  place(sprites.rabbitLegFront, R.legFront, -legRot);

  // ears go under the head so their cut-off base stays hidden
  ctx.globalAlpha = 0.85;
  place(sprites.rabbitEar, R.ear, earRot - 0.22 + headRot, headDx - 1.1, headDy + 0.2, 0.92);
  ctx.globalAlpha = 1;
  place(sprites.rabbitEar, R.ear, earRot + 0.18 + headRot, headDx + 0.4, headDy);

  const head = eating ? sprites.rabbitHeadEat
    : (a.panic ? sprites.rabbitHeadPanic : sprites.rabbitHeadCalm);
  place(head, R.head, headRot, headDx, headDy);

  ctx.restore();
}

function drawFoxSprite(cx, cy, u, a, t) {
  const s = u / 40;
  const seed = a.seed || 0;
  const now = state.gameNow;
  const sulking = now < a.ignoreUntil;
  const hunting = !sulking && a.chaseSince > 0;
  const resting = now < a.restUntil;
  const moving = isMoving(a);
  const fed = fullness(a);

  const period = hunting ? 200 : (moving ? 340 : 1000);
  const swing = Math.sin(t / period + seed);
  const bob = moving ? Math.abs(swing) * (hunting ? 2.2 : 1.4) : 0;
  const breath = moving ? 0 : Math.sin(t / 1000 + seed) * 0.3;
  const sag = (1 - fed) * 1.2 + (sulking ? 1.2 : 0);

  ctx.save();
  ctx.translate(cx, cy + (sag - bob) * s);
  ctx.scale((a.face || 1) * s, s);
  if (hunting) ctx.rotate(0.10); // shoulders down, stalking

  const F = RIG.fox;
  const legRot = moving ? swing * (hunting ? 0.7 : 0.45) : Math.sin(t / 1000 + seed) * 0.04;
  // tail tells the story: streamed out behind on a chase, dropped when sulking
  const tailRot = sulking ? 0.75
    : (hunting ? -0.30 + Math.sin(t / 200 + seed) * 0.08
      : Math.sin(t / 420 + seed) * 0.30);
  const headImg = sulking ? sprites.foxHeadSulk
    : (hunting ? sprites.foxHeadHunt : sprites.foxHeadCalm);
  const headRot = sulking ? 0.30
    : (resting ? 0.35 : (hunting ? 0.10 : Math.sin(t / 850 + seed) * 0.05));
  const headDy = (sulking ? 1.6 : (resting ? 2.6 : 0)) + breath * 0.6;

  ctx.globalAlpha = 0.72;
  place(sprites.foxLegHind, F.legHind, -legRot, -1.4, -0.3, 0.9);
  place(sprites.foxLegFront, F.legFront, legRot, -1.2, -0.3, 0.9);
  ctx.globalAlpha = 1;

  place(sprites.foxTail, F.tail, tailRot, 0, 0, 1, true);
  place(sprites.foxBody, F.body, 0, 0, breath);
  place(sprites.foxLegHind, F.legHind, legRot);
  place(sprites.foxLegFront, F.legFront, -legRot);
  place(headImg, F.head, headRot, 0, headDy);

  ctx.restore();
}

function drawRabbit(cx, cy, u, t, seed, panic) {
  const s = u / 40;
  // running rabbits bounce faster and flatten their ears back
  const hop = Math.abs(Math.sin(t / (panic ? 120 : 260) + seed)) * (panic ? 3.4 : 2.4) * s;
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
  ear(-3.4, panic ? -1.15 : -0.18);
  ear(3.4, panic ? 1.15 : 0.18);
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

  drawScars(cell, t);

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
    // sprites are drawn facing right, so remember the last horizontal step and
    // mirror the whole animal when it is heading the other way
    if (a.face == null) a.face = 1;
    if (a.x > a.rx + 0.02) a.face = 1;
    else if (a.x < a.rx - 0.02) a.face = -1;
    a.rx += (a.x - a.rx) * (a.panic ? 0.3 : 0.18);
    a.ry += (a.y - a.ry) * (a.panic ? 0.3 : 0.18);
  }

  drawThreats(cell, t);

  for (const a of state.animals) {
    const cx = a.rx * cell + cell / 2;
    const cy = a.ry * cell + cell / 2;
    drawHunger(cx, cy, cell, a, t);
    if (a.type === 'rabbit') {
      if (spritesReady) drawRabbitSprite(cx, cy, cell, a, t);
      else drawRabbit(cx, cy, cell, t, a.seed || 0, a.panic);
      drawNotice(cx, cy, cell, a, t);
    } else if (spritesReady) {
      drawFoxSprite(cx, cy, cell, a, t);
    } else {
      drawFox(cx, cy, cell, t, a.seed || 0);
    }
  }

  drawPops(t);
  drawWither(t);

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

// Paused shows two leaves standing still; running shows a sprout, so the icon
// itself says what the button will do next.
function setPauseBtn(paused) {
  el.pauseBtn.classList.toggle('is-paused', paused);
  el.pauseBtn.querySelector('.btn-label').textContent = paused ? 'Resume' : 'Pause';
}

function togglePause() {
  if (state.cleared || state.failed || state.briefing) return;
  state.paused = !state.paused;
  el.pauseOverlay.hidden = !state.paused;
  setPauseBtn(state.paused);
}

document.addEventListener('DOMContentLoaded', async function () {
  cacheEls();
  ctx = el.field.getContext('2d');
  readTheme();
  initFieldDecor();

  progressStore = await openStore('ecosystem-puzzle', 'progress', {
    default: { cleared: {}, seen: {} }
  });
  progressStore.subscribe(function () {
    renderStageBar();
    if (!state.started) renderTitleProgress();
  });

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
  el.missionOkBtn.addEventListener('click', closeMission);
  el.overRetryBtn.addEventListener('click', function () { resetStage(state.stage); });
  el.overTitleBtn.addEventListener('click', showTitle);
  el.startBtn.addEventListener('click', startGame);
  el.titleBtn.addEventListener('click', showTitle);

  // Switching browser tabs used to leave the meadow running unwatched; with a
  // clock on the stage that silently costs the player the run.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state.started && !state.paused && !state.briefing
      && !state.cleared && !state.failed) togglePause();
  });

  loadSprites();

  // set the board up at the highest unlocked stage, then wait on the title screen
  resetStage(highestUnlockedStage());
  showTitle();

  setInterval(tick, CONFIG.tickMs);
  requestAnimationFrame(drawField);
});
