// ============================================================
// Ecosystem Puzzle — grow a food chain, then keep it fed.
//
// Turn-based and endless. There are no stages and no clock: one tap is
// one turn, and every turn resolves in a fixed order, so the same board
// and the same tap always produce the same result. That is deliberate.
// The previous version was a real-time simulation split into stages,
// and each new stage meant re-tuning numbers in two files and hunting
// the emergent bugs that fell out. Here the only randomness is which
// tile the hand deals, and the only content is the one rule set below.
//
// The shape of the game: merging costs nothing and scores nothing, it
// only builds. Points come from animals eating. An animal that is not
// fed dies and leaves bones that take a square out of play for good —
// so reaching the fox is not the finish line, it is a standing bill.
// ============================================================

'use strict';

// ---------- Tuning ----------
// Everything that decides difficulty lives here.

// Every knob is a plain named number so the harness in sim.js can rewrite
// it and sweep. Anything folded into an object literal below is not a
// knob — it is wiring.

const SIZE = 5;                 // board is SIZE x SIZE
const CELLS = SIZE * SIZE;

// How many touching alike tiles it takes to grow up. Plants take three;
// rabbits take two, because three was not a difficulty setting, it was a
// wall — the bot reached a fox in 4 runs out of 200, and an apex nobody
// ever meets cannot be the thing the game is about.
const MERGE_SPROUT = 3;
const MERGE_GRASS = 3;
const MERGE_RABBIT = 2;

// An animal eats at EAT_AT and dies at STARVE_AT, both counted in turns
// since its last meal. The gap between those two numbers is the whole
// balance of the game, and it took three tries to get right.
//
// Eating early (2 of 6) made a rabbit consume everything the player could
// produce — grass costs three turns to grow and the rabbit swallowed one
// every other turn — so a second rabbit was arithmetically impossible and
// the fox never happened.
//
// Eating in the middle (5 of 11) fixed the arithmetic but left a worse
// problem: a rabbit still took grass whenever grass happened to be next
// to it, so the best play was to keep food out of your own animal's
// reach. A game about growing a food chain should not reward hiding the
// food, and a player who works that out feels like they are fighting the
// rules rather than using them.
//
// So both animals now eat only once they are nearly dead — at 82% and 81%
// of their lifespan, which is exactly where the meter turns red. That
// makes one visible rule cover everything: an animal takes what is beside
// it only when its bar is red, and at that point you wanted it fed
// anyway. Grass sitting next to a rabbit is otherwise safe, and can be
// built into the next rabbit in peace.
//
// It costs score — the casual bot's median fell from 900 to 700, since
// meals are the only points — and buys back a game whose best strategy is
// not a trick. The fox turns up slightly more often, too.
const RABBIT_EAT_AT = 9;
const RABBIT_STARVE_AT = 11;
const RABBIT_POINTS = 100;

const FOX_EAT_AT = 13;
const FOX_STARVE_AT = 16;
const FOX_POINTS = 500;

// Plants run down on the same clock. Long enough to be built with, short
// enough that hoarding is not a strategy.
const SPROUT_WITHER_AT = 14;
const GRASS_WITHER_AT = 18;

// Percent of the hand dealt as grass rather than sprouts. Grass shows up
// often enough that a run can get off the ground; any more and sprouts
// stop mattering.
const GRASS_IN_HAND = 22;

const MERGE_AT = { sprout: MERGE_SPROUT, grass: MERGE_GRASS, rabbit: MERGE_RABBIT };

// The ladder. Order matters: each kind grows into the next one.
const GROWS_INTO = {
  sprout: 'grass',
  grass: 'rabbit',
  rabbit: 'fox'
  // fox is the top — it has nothing to grow into, only mouths to feed
};

const ANIMALS = {
  rabbit: { prey: 'grass', eatAt: RABBIT_EAT_AT, starveAt: RABBIT_STARVE_AT, points: RABBIT_POINTS },
  fox: { prey: 'rabbit', eatAt: FOX_EAT_AT, starveAt: FOX_STARVE_AT, points: FOX_POINTS }
};

// Plants run down too, and this is what makes the run end.
//
// Merging removes two tiles and adds one, and a grazing animal removes
// another, so a player who merges competently sheds tiles faster than
// the one-a-turn the hand supplies: without this the board never fills
// and there is no run to score. Giving plants the same clock the animals
// already have turns "keep the chain eating" from a scoring strategy
// into the survival condition — ungrazed growth goes to scrub, and
// scrub takes the square out of play.
const PLANTS = {
  sprout: { witherAt: SPROUT_WITHER_AT },
  grass: { witherAt: GRASS_WITHER_AT }
};

// Inert tiles. Nothing grows them, nothing eats them; only new growth
// beside them clears them away.
const BLOCKERS = ['scrub', 'bones', 'stone'];

// What actually fills the board.
//
// Withering alone cannot end a run: merging is a tile sink — three tiles
// in, one out — so a player who keeps merging sheds squares faster than
// the one-a-turn the hand deals, and the meadow just empties. A bot left
// to play five thousand turns finished with eighteen squares still bare.
// So the ground pushes back on a fixed cadence, and a merge only ever
// reclaims one square beside it.
//
// The cadence came out of the harness rather than out of feel. Over 300
// runs of the casual bot each: at 2 a run is 51 turns and 3% of them
// score nothing at all; at 4 the average run is 193 turns and stops being
// a sitting. At 3 a run is ~97 turns, no run scores zero, and a fox turns
// up in 85% of them around turn 41 — early enough that most of the run is
// spent keeping it fed, which is the part worth playing.
const STONE_EVERY = 3;      // a stone surfaces this often, on a bare square
const CLEAR_PER_MERGE = 1;  // ...and one growth buys back one dead square

const HAND_ODDS = [
  { kind: 'sprout', weight: 100 - GRASS_IN_HAND },
  { kind: 'grass', weight: GRASS_IN_HAND }
];

const SLUG = 'ecosystem-puzzle';

// Bumped whenever the rules or the point values change. A best score set
// under different arithmetic is not a record, it is a leftover, so one
// from an older ruleset is ignored rather than left standing as a target
// that cannot be compared to anything the player can score now.
const RULES_VERSION = 3;

// ---------- Data layer (AppSync) ----------

let scoreStore = null;

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

function readBest() {
  const v = scoreStore ? scoreStore.get() : null;
  if (!v || typeof v !== 'object') return 0;
  if (Number(v.rules) !== RULES_VERSION) return 0;
  const n = Number(v.best);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function writeBest(n) {
  if (!scoreStore) return;
  scoreStore.set({ best: Math.floor(n), rules: RULES_VERSION })
    .catch(function (e) { console.error('Ecosystem Puzzle: save failed', e); });
}

// ---------- State ----------

const state = {
  cells: new Array(CELLS).fill(null), // null = empty ground
  hand: 'sprout',
  next: 'sprout',
  score: 0,
  best: 0,
  turn: 0,
  over: false,
  topKind: 'sprout'   // the highest thing this run has grown, for the end card
};

// A tile is `{ kind, clock }`. `clock` counts turns since the tile last
// had what it needs: a meal for an animal, and simply being planted for
// a plant. Blockers ignore it.
function makeTile(kind) {
  return { kind: kind, clock: 0 };
}

function isAnimal(kind) { return !!ANIMALS[kind]; }
function isPlant(kind) { return !!PLANTS[kind]; }
function isBlocker(kind) { return BLOCKERS.indexOf(kind) >= 0; }

// 1 just after a meal (or a planting) and 0 at the moment it is lost.
function vitality(cell) {
  const limit = isAnimal(cell.kind) ? ANIMALS[cell.kind].starveAt
    : isPlant(cell.kind) ? PLANTS[cell.kind].witherAt
      : 0;
  if (!limit) return 1;
  return Math.max(0, 1 - cell.clock / limit);
}

function rollHand() {
  let total = 0;
  for (const o of HAND_ODDS) total += o.weight;
  let r = Math.random() * total;
  for (const o of HAND_ODDS) {
    r -= o.weight;
    if (r < 0) return o.kind;
  }
  return HAND_ODDS[0].kind;
}

function neighbours(i) {
  const x = i % SIZE, y = (i / SIZE) | 0, out = [];
  if (x > 0) out.push(i - 1);
  if (x < SIZE - 1) out.push(i + 1);
  if (y > 0) out.push(i - SIZE);
  if (y < SIZE - 1) out.push(i + SIZE);
  return out;
}

function newGame() {
  state.cells = new Array(CELLS).fill(null);
  state.hand = rollHand();
  state.next = rollHand();
  state.score = 0;
  state.turn = 0;
  state.over = false;
  state.topKind = 'sprout';
  el.gameover.hidden = true;
  setTicker('Tap an empty square to plant.');
  render();
}

// ---------- One turn ----------
//
// Fixed order, every time:
//   place -> grow (repeating) -> everyone gets hungrier -> feeding -> deaths
//
// Feeding runs after hunger so an animal that just appeared waits its
// turn, and deaths run after feeding so a meal always saves a life.

function takeTurn(i) {
  if (state.over || state.cells[i]) return;

  state.cells[i] = makeTile(state.hand);
  state.turn += 1;

  const grew = growFrom(i);
  bumpClocks();
  const meals = feedEveryone();
  const deaths = collectDeaths();
  const withered = witherPlants();
  const stone = surfaceStone();

  state.hand = state.next;
  state.next = rollHand();

  const gained = scoreMeals(meals);
  if (state.score > state.best) {
    state.best = state.score;
    writeBest(state.best);
  }

  const full = state.cells.every(function (c) { return c; });
  if (full) endRun();

  const lost = deaths.concat(withered);
  if (stone) lost.push(stone);
  render(grew, meals, lost);
  setTicker(turnMessage(grew, meals, deaths, withered, stone, gained));
}

// Grows the tile at `i` as far up the ladder as it can reach, then
// returns one entry per growth. A growth can complete a bigger group,
// which is why this loops instead of checking once.
function growFrom(i) {
  const events = [];
  for (;;) {
    const cell = state.cells[i];
    if (!cell) break;
    const up = GROWS_INTO[cell.kind];
    if (!up) break;

    const group = sameGroup(i, cell.kind);
    if (group.length < MERGE_AT[cell.kind]) break;

    // life returning to the patch pushes dead ground back — but only so
    // far. Letting one merge clear everything around it made the board
    // impossible to fill, and the run never ended.
    const cleared = [];
    for (const g of group) {
      if (cleared.length >= CLEAR_PER_MERGE) break;
      for (const n of neighbours(g)) {
        const c = state.cells[n];
        if (!c || !isBlocker(c.kind) || cleared.indexOf(n) >= 0) continue;
        cleared.push(n);
        if (cleared.length >= CLEAR_PER_MERGE) break;
      }
    }
    for (const n of cleared) state.cells[n] = null;

    for (const g of group) state.cells[g] = null;
    state.cells[i] = makeTile(up);

    if (rank(up) > rank(state.topKind)) state.topKind = up;
    events.push({ at: i, kind: up, size: group.length, bones: cleared });
  }
  return events;
}

// Every tile of the same kind reachable from `i` through shared edges.
function sameGroup(i, kind) {
  const seen = new Set([i]), queue = [i], out = [];
  while (queue.length) {
    const at = queue.pop();
    out.push(at);
    for (const n of neighbours(at)) {
      if (seen.has(n)) continue;
      const c = state.cells[n];
      if (!c || c.kind !== kind) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return out;
}

function bumpClocks() {
  for (const c of state.cells) {
    if (c && (isAnimal(c.kind) || isPlant(c.kind))) c.clock += 1;
  }
}

// Foxes eat first. A rabbit the fox takes is a rabbit that does not get
// to strip a patch of grass on the same turn, which is the whole reason
// a fox is worth keeping around.
function feedEveryone() {
  const meals = [];
  for (const kind of ['fox', 'rabbit']) {
    const cfg = ANIMALS[kind];
    for (let i = 0; i < CELLS; i++) {
      const me = state.cells[i];
      if (!me || me.kind !== kind || me.clock < cfg.eatAt) continue;

      // take whichever neighbour is closest to running out: grass about
      // to wither, or a rabbit about to starve, was lost either way
      let target = -1, worst = -1;
      for (const n of neighbours(i)) {
        const p = state.cells[n];
        if (!p || p.kind !== cfg.prey) continue;
        if (p.clock > worst) { worst = p.clock; target = n; }
      }
      if (target < 0) continue;

      state.cells[target] = null;
      me.clock = 0;
      meals.push({ at: i, ate: target, kind: kind, points: cfg.points });
    }
  }
  return meals;
}

function collectDeaths() {
  const dead = [];
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (!c || !isAnimal(c.kind) || c.clock < ANIMALS[c.kind].starveAt) continue;
    dead.push({ at: i, kind: c.kind });
    state.cells[i] = makeTile('bones');
  }
  return dead;
}

// The ground's own move. It lands on bare soil only, so it never takes
// a living tile — it takes the room the player was going to use.
function surfaceStone() {
  if (state.turn % STONE_EVERY !== 0) return null;
  const open = [];
  for (let i = 0; i < CELLS; i++) if (!state.cells[i]) open.push(i);
  if (!open.length) return null;
  const at = open[(Math.random() * open.length) | 0];
  state.cells[at] = makeTile('stone');
  return { at: at, kind: 'stone' };
}

// Runs last, so anything grazed this turn is already gone and only
// growth nobody came for goes to scrub.
function witherPlants() {
  const gone = [];
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (!c || !isPlant(c.kind) || c.clock < PLANTS[c.kind].witherAt) continue;
    gone.push({ at: i, kind: c.kind });
    state.cells[i] = makeTile('scrub');
  }
  return gone;
}

// Several mouths fed on one turn multiply each other: the point of the
// game is a chain that runs, not a single animal kept alive in a corner.
function scoreMeals(meals) {
  if (!meals.length) return 0;
  let base = 0;
  for (const m of meals) base += m.points;
  const gained = base * meals.length;
  state.score += gained;
  return gained;
}

function rank(kind) {
  let n = 0, k = 'sprout';
  while (k && k !== kind) { k = GROWS_INTO[k]; n += 1; }
  return k === kind ? n : -1;
}

function endRun() {
  state.over = true;
  el.goScore.textContent = state.score.toLocaleString();
  el.goNote.textContent = endNote();
  el.gameover.hidden = false;
  el.goAgain.focus();
}

function endNote() {
  if (state.score === 0) return 'Nothing ever ate. Grow grass into a rabbit first — animals are the only way to score.';
  if (state.topKind === 'fox') return 'You raised a fox and it cost you. Try keeping rabbits coming before the next one arrives.';
  if (state.topKind === 'rabbit') return 'Rabbits came. A fox needs two of them alive and touching.';
  return 'Three touching sprouts make grass, and three patches of grass bring a rabbit.';
}

function turnMessage(grew, meals, deaths, withered, stone, gained) {
  const bits = [];

  if (meals.length) {
    const foxes = meals.filter(function (m) { return m.kind === 'fox'; }).length;
    const rabbits = meals.length - foxes;
    const who = [];
    if (foxes) who.push(foxes === 1 ? 'A fox ate a rabbit' : foxes + ' foxes ate');
    if (rabbits) who.push(rabbits === 1 ? 'a rabbit grazed' : rabbits + ' rabbits grazed');
    let line = who.join(', ') + ' +' + gained.toLocaleString();
    if (meals.length > 1) line += ' (×' + meals.length + ')';
    bits.push(line[0].toUpperCase() + line.slice(1));
  } else if (grew.length) {
    const last = grew[grew.length - 1];
    bits.push(last.kind === 'fox' ? 'A fox moved in. Keep the rabbits coming.'
      : last.kind === 'rabbit' ? 'A rabbit found the meadow.'
        : 'The sprouts filled in.');
  }

  const bones = grew.reduce(function (n, g) { return n + g.bones.length; }, 0);
  if (bones) bits.push(bones === 1 ? 'One dead square came back.' : bones + ' dead squares came back.');

  if (deaths.length) {
    bits.push(deaths.length === 1
      ? 'A ' + deaths[0].kind + ' starved.'
      : deaths.length + ' animals starved.');
  }

  if (withered.length) {
    bits.push(withered.length === 1
      ? 'Ungrazed growth went to scrub.'
      : withered.length + ' patches went to scrub.');
  }

  if (stone) bits.push('A stone surfaced.');

  if (!bits.length) return 'Planted.';
  return bits.join(' ');
}

// ============================================================
// Animal art — the hand-painted parts in img/, composed into a
// still portrait. If any file is missing the tiles fall back to the
// inline SVG silhouettes in index.html instead.
// ============================================================

const SPRITE_FILES = {
  rabbitHeadCalm: 'rabbit-head-calm.png',
  rabbitHeadPanic: 'rabbit-head-panic.png',
  rabbitEar: 'rabbit-ear.png',
  rabbitBody: 'rabbit-body.png',
  rabbitLegHind: 'rabbit-leg-hind.png',
  rabbitLegFront: 'rabbit-leg-front.png',
  rabbitTail: 'rabbit-tail.png',
  foxHeadCalm: 'fox-head-calm.png',
  foxHeadHunt: 'fox-head-hunt.png',
  foxBody: 'fox-body.png',
  foxLegHind: 'fox-leg-hind.png',
  foxLegFront: 'fox-leg-front.png',
  foxTail: 'fox-tail.png'
};

// Where each part sits and how wide it is drawn, in units measured from
// the animal's centre. `w` is the drawn width; height follows the
// image's own aspect ratio, so re-exporting the art at another
// resolution changes nothing on screen.
const RIG = {
  rabbit: {
    fit: { span: 38, ox: 0, oy: 2 },
    parts: [
      ['rabbitLegHind', { w: 10.8, x: -4.8, y: 5.3, px: 0.5, py: 0.12 }, 0.72],
      ['rabbitLegFront', { w: 5.9, x: 5.2, y: 5.3, px: 0.5, py: 0.10 }, 0.72],
      ['rabbitTail', { w: 10.0, x: -11.0, y: 1.4, px: 0.5, py: 0.5 }, 1],
      ['rabbitBody', { w: 21.5, x: -1.2, y: 3.2, px: 0.5, py: 0.5 }, 1],
      ['rabbitLegHind', { w: 10.8, x: -3.4, y: 5.6, px: 0.5, py: 0.12 }, 1],
      ['rabbitLegFront', { w: 5.9, x: 6.4, y: 5.6, px: 0.5, py: 0.10 }, 1],
      ['rabbitEar', { w: 7.5, x: 4.9, y: -7.2, px: 0.5, py: 0.95 }, 0.85],
      ['rabbitEar', { w: 7.5, x: 6.6, y: -7.4, px: 0.5, py: 0.95 }, 1],
      ['@head', { w: 18.7, x: 6.2, y: -1.6, px: 0.5, py: 0.5 }, 1]
    ],
    head: { calm: 'rabbitHeadCalm', hungry: 'rabbitHeadPanic' }
  },
  fox: {
    fit: { span: 36, ox: 3, oy: 2 },
    parts: [
      ['foxLegHind', { w: 6.1, x: -5.0, y: 5.1, px: 0.5, py: 0.10 }, 0.72],
      ['foxLegFront', { w: 3.6, x: 5.2, y: 5.1, px: 0.5, py: 0.10 }, 0.72],
      // the tail art lies horizontally with its thick base on the left
      // edge, so that edge is the pivot and the part gets mirrored
      ['foxTail', { w: 21.7, x: -8.6, y: 1.4, px: 0.06, py: 0.55, flip: true }, 1],
      ['foxBody', { w: 23.5, x: -1.2, y: 3.2, px: 0.5, py: 0.5 }, 1],
      ['foxLegHind', { w: 6.1, x: -3.8, y: 5.4, px: 0.5, py: 0.10 }, 1],
      ['foxLegFront', { w: 3.6, x: 6.4, y: 5.4, px: 0.5, py: 0.10 }, 1],
      ['@head', { w: 19.5, x: 6.8, y: -2.2, px: 0.5, py: 0.5 }, 1]
    ],
    head: { calm: 'foxHeadCalm', hungry: 'foxHeadHunt' }
  }
};

const sprites = {};
let spritesReady = false;
let spritesFailed = false;

// The source art is ~200px per part but a part lands on screen at
// 4-20px. Letting the canvas make that jump gives ragged line art, so
// each image is halved down once at load time.
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
      sprites[key] = { img: shrinkSprite(img, 72), w: img.width, h: img.height };
      left -= 1;
      if (left === 0) { spritesReady = true; render(); }
    };
    // one missing file means a half-built animal, so drop the whole set
    img.onerror = function () {
      if (spritesFailed) return;
      spritesFailed = true;
      left = -1;
      render();
    };
    img.src = 'img/' + SPRITE_FILES[key];
  }
}

// Paints one animal, still, into a canvas sized `px` on a side.
// `fed` is 1 just after a meal and 0 at death: a hungry animal sags and
// wears its other face, so the tile reads before the meter does.
function paintAnimal(canvas, type, fed) {
  const rig = RIG[type];
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = canvas.clientWidth || 44;
  canvas.width = Math.round(px * dpr);
  canvas.height = Math.round(px * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, px, px);

  const s = px / rig.fit.span;
  const sag = (1 - fed) * 1.1;
  ctx.save();
  ctx.translate(px / 2 - rig.fit.ox * s, px / 2 + (rig.fit.oy + sag) * s);
  ctx.scale(s, s);

  const headKey = rig.head[fed < 0.34 ? 'hungry' : 'calm'];
  for (const [name, p, alpha] of rig.parts) {
    const sprite = sprites[name === '@head' ? headKey : name];
    if (!sprite) continue;
    const w = p.w, h = p.w * (sprite.h / sprite.w);
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.flip) ctx.scale(-1, 1);
    ctx.drawImage(sprite.img, -w * p.px, -h * p.py, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---------- Rendering ----------

const el = {};
let cellNodes = [];

function tileArt(kind) {
  // plants and bones are the inline symbols; animals get a canvas,
  // unless the art never loaded
  const useSvg = !isAnimal(kind) || spritesFailed || !spritesReady;
  if (useSvg) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tile-art');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#art' + kind[0].toUpperCase() + kind.slice(1));
    svg.appendChild(use);
    return svg;
  }
  const canvas = document.createElement('canvas');
  canvas.className = 'tile-art tile-art--paint';
  canvas.dataset.animal = kind;
  return canvas;
}

// Fills a `.tile` span with the art for `kind` (or empties it).
function paintTile(node, kind, fed) {
  node.textContent = '';
  node.className = node.className.replace(/ ?tile--\w+-art/g, '');
  if (!kind) return;
  node.classList.add('tile--' + kind + '-art');
  const art = tileArt(kind);
  node.appendChild(art);
  if (art.tagName === 'CANVAS') {
    // the canvas needs its laid-out size, which only exists after paint
    requestAnimationFrame(function () { paintAnimal(art, kind, fed == null ? 1 : fed); });
  }
}

function buildBoard() {
  el.board.textContent = '';
  cellNodes = [];
  for (let i = 0; i < CELLS; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.i = String(i);
    el.board.appendChild(btn);
    cellNodes.push(btn);
  }
}

const KIND_LABEL = {
  sprout: 'sprout', grass: 'grass', rabbit: 'rabbit', fox: 'fox',
  bones: 'bones, blocked', scrub: 'scrub, blocked', stone: 'stone, blocked'
};

const VITAL_WORD = { rabbit: ['starving', 'hungry', 'fed'], fox: ['starving', 'hungry', 'fed'] };
const PLANT_WORD = ['going to seed', 'past its best', 'fresh'];

// Squares a starving animal will take on the coming turn. Animals only
// eat in the red, so this is rare and means something when it shows: a
// mouth beside this tile is one turn from dying and is going to take it.
// A marked square is not doomed — growth resolves before anyone eats, so
// a tile that completes a merge still gets away.
function inReach() {
  const risk = new Set();
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (!c || !isAnimal(c.kind)) continue;
    if (c.clock + 1 < ANIMALS[c.kind].eatAt) continue;
    for (const n of neighbours(i)) {
      const p = state.cells[n];
      if (p && p.kind === ANIMALS[c.kind].prey) risk.add(n);
    }
  }
  return risk;
}

function render(grew, meals, deaths) {
  const risk = inReach();
  const popped = new Set((grew || []).map(function (g) { return g.at; }));
  const eaten = new Set((meals || []).map(function (m) { return m.ate; }));
  const died = new Set((deaths || []).map(function (d) { return d.at; }));

  for (let i = 0; i < CELLS; i++) {
    const node = cellNodes[i];
    const cell = state.cells[i];
    node.className = 'cell';
    node.textContent = '';
    node.disabled = state.over || !!cell;

    if (!cell) {
      node.setAttribute('aria-label', 'Empty square, row ' + (((i / SIZE) | 0) + 1) + ' column ' + ((i % SIZE) + 1));
      if (eaten.has(i)) node.classList.add('cell--eaten');
      continue;
    }

    node.classList.add('cell--taken', 'cell--' + cell.kind);

    const art = tileArt(cell.kind);
    node.appendChild(art);

    let label = KIND_LABEL[cell.kind];

    // Everything alive carries the same meter, because everything alive
    // is on the same kind of clock. No numbers on it — the bar and the
    // word are what the player is meant to read.
    if (isAnimal(cell.kind) || isPlant(cell.kind)) {
      const left = vitality(cell);
      const meter = document.createElement('span');
      meter.className = 'meter';
      const fill = document.createElement('span');
      fill.className = 'meter-fill';
      fill.style.width = Math.round(left * 100) + '%';
      if (left <= 0.34) fill.classList.add('is-low');
      else if (left <= 0.67) fill.classList.add('is-mid');
      meter.appendChild(fill);
      node.appendChild(meter);

      const words = VITAL_WORD[cell.kind] || PLANT_WORD;
      label += ', ' + (left <= 0.34 ? words[0] : left <= 0.67 ? words[1] : words[2]);

      if (art.tagName === 'CANVAS') {
        requestAnimationFrame(function () { paintAnimal(art, cell.kind, left); });
      }
      if (left <= 0.34) node.classList.add('cell--fading');
    }
    if (risk.has(i)) {
      node.classList.add('cell--inreach');
      label += ', about to be eaten';
    }
    node.setAttribute('aria-label', label);

    if (popped.has(i)) node.classList.add('cell--grew');
    if (died.has(i)) node.classList.add('cell--died');
  }

  paintTile(el.handTile, state.hand);
  paintTile(el.nextTile, state.next);
  el.goal.textContent = nextGoal();
  el.scoreValue.textContent = state.score.toLocaleString();
  el.bestValue.textContent = state.best.toLocaleString();
}

function setTicker(text) { el.ticker.textContent = text; }

function countKind(kind) {
  let n = 0;
  for (const c of state.cells) if (c && c.kind === kind) n += 1;
  return n;
}

// One line saying what the board is one step away from. The rules are all
// in the guide, but nobody reads a guide while playing, and a player who
// cannot see the next rung does not know the ladder is there at all.
function nextGoal() {
  const fox = countKind('fox'), rabbit = countKind('rabbit'), grass = countKind('grass');

  if (fox) {
    // is one of them actually about to go hungry?
    for (let i = 0; i < CELLS; i++) {
      const c = state.cells[i];
      if (!c || c.kind !== 'fox' || c.clock < ANIMALS.fox.eatAt - 2) continue;
      let hasPrey = false;
      for (const n of neighbours(i)) {
        const p = state.cells[n];
        if (p && p.kind === 'rabbit') hasPrey = true;
      }
      if (!hasPrey) return 'Your fox needs a rabbit beside it, or it starves.';
    }
    return 'A fed fox is most of your score. Keep rabbits coming to it.';
  }

  if (rabbit >= MERGE_RABBIT) return 'Two rabbits side by side draw a fox.';

  // The one rung people get stuck on: a second rabbit. Say how close it is.
  if (rabbit) {
    if (grass >= MERGE_GRASS - 1) return 'One more grass makes a second rabbit — put the two rabbits side by side.';
    return 'Another rabbit draws a fox. ' + (MERGE_GRASS - grass) + ' more grass makes one.';
  }

  if (grass >= MERGE_GRASS) return 'Bring your grass together — ' + MERGE_GRASS + ' touching makes a rabbit.';
  if (grass) return (MERGE_GRASS - grass) + ' more grass, side by side, makes a rabbit.';
  return MERGE_SPROUT + ' sprouts side by side become grass.';
}

// ---------- Wiring ----------

function openHow() {
  el.howModal.hidden = false;
  document.body.classList.add('is-modal');
  el.howClose.focus();
}

function closeHow() {
  el.howModal.hidden = true;
  document.body.classList.remove('is-modal');
  el.howBtn.focus();
}

// "New game" mid-run asks once, in the button itself, rather than
// throwing a browser dialog at the player.
let armedNew = false;
let armedTimer = 0;
function onNewGame() {
  const midRun = !state.over && state.score > 0;
  if (midRun && !armedNew) {
    armedNew = true;
    el.newBtn.textContent = 'Sure? Tap again';
    el.newBtn.classList.add('btn--armed');
    clearTimeout(armedTimer);
    armedTimer = setTimeout(disarmNew, 4000);
    return;
  }
  disarmNew();
  newGame();
}

function disarmNew() {
  armedNew = false;
  clearTimeout(armedTimer);
  el.newBtn.textContent = 'New game';
  el.newBtn.classList.remove('btn--armed');
}

async function init() {
  const ids = ['board', 'handTile', 'nextTile', 'scoreValue', 'bestValue', 'ticker',
    'goal', 'gameover', 'goScore', 'goNote', 'goAgain', 'howBtn', 'newBtn',
    'howModal', 'howClose', 'howDone'];
  for (const id of ids) el[id] = document.getElementById(id);

  buildBoard();

  el.board.addEventListener('click', function (e) {
    const btn = e.target.closest('.cell');
    if (!btn || btn.disabled) return;
    disarmNew();
    takeTurn(Number(btn.dataset.i));
  });

  el.howBtn.addEventListener('click', openHow);
  el.howClose.addEventListener('click', closeHow);
  el.howDone.addEventListener('click', closeHow);
  el.howModal.addEventListener('click', function (e) {
    if (e.target === el.howModal) closeHow();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !el.howModal.hidden) closeHow();
  });

  el.newBtn.addEventListener('click', onNewGame);
  el.goAgain.addEventListener('click', function () { disarmNew(); newGame(); });

  // the little reference row under the board
  for (const node of document.querySelectorAll('.tile--mini')) {
    paintTile(node, node.dataset.art);
  }

  loadSprites();
  newGame();

  try {
    scoreStore = await openStore(SLUG, 'score', { version: 1, default: { best: 0 } });
    state.best = readBest();
    render();
    if (scoreStore.subscribe) {
      scoreStore.subscribe(function () {
        const b = readBest();
        if (b > state.best) { state.best = b; render(); }
      });
    }
  } catch (e) {
    console.error('Ecosystem Puzzle: store unavailable', e);
  }
}

document.addEventListener('DOMContentLoaded', init);
