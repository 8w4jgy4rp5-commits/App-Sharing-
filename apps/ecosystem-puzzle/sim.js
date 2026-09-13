// ============================================================
// Balance harness — run it with `node sim.js`. Not part of the game and
// never loaded by the page.
//
//   node sim.js                        both bots at the current numbers
//   node sim.js 400                    ...over 400 runs each
//   node sim.js 400 RABBIT_EAT_AT=2,4,6   ...sweeping one knob
//
// It plays script.js directly, with stubs where the DOM would be, so a
// full run finishes in well under a millisecond.
//
// TWO BOTS, and the second one is the point. The first version of this
// file had only the careful bot, which hand-feeds animals to keep them
// alive — an expert move a first-time player cannot see. It reported the
// fox as reachable 55% of the time while the game as actually played was
// unwinnable: a rabbit ate grass faster than grass could be grown, so a
// second rabbit never happened and the fox never arrived. A bot that is
// cleverer than a beginner will hide exactly the problems a beginner hits,
// so the casual bot below only ever completes a merge, and its numbers are
// the ones that decide whether the game is fair.
//
// Every tuning number in script.js is a plain `const NAME = <number>;` so
// this file can rewrite it. Keep it that way.
// ============================================================

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.join(__dirname, 'script.js');

function load(overrides) {
  let code = fs.readFileSync(SRC, 'utf8');
  for (const [name, value] of Object.entries(overrides || {})) {
    const re = new RegExp('const ' + name + ' = \\d+;');
    if (!re.test(code)) throw new Error('no const ' + name + ' to override');
    code = code.replace(re, 'const ' + name + ' = ' + value + ';');
  }
  const ctx = {
    console, Math, Number, Set, Array, JSON,
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: () => {},
    document: { addEventListener() {}, querySelectorAll: () => [], getElementById: () => null },
    window: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  // top-level const/let stay in the script's own scope, so hand them out
  vm.runInContext(
    code + '\n;globalThis.__x = { state, el, CELLS, SIZE, MERGE_AT, ANIMALS, PLANTS, GROWS_INTO };',
    ctx
  );
  ctx.render = function () {};
  ctx.setTicker = function () {};
  const x = ctx.__x;
  x.el.gameover = {};
  x.el.goScore = {};
  x.el.goNote = {};
  x.el.goAgain = { focus() {} };
  x.ctx = ctx;
  return x;
}

const VALID = new Set(['sprout', 'grass', 'rabbit', 'fox', 'bones', 'scrub', 'stone']);

let G, ctx, state, CELLS, SIZE, MERGE_AT, ANIMALS, PLANTS, GROWS_INTO;
function use(overrides) {
  G = load(overrides);
  ({ ctx, state, CELLS, SIZE, MERGE_AT, ANIMALS, PLANTS, GROWS_INTO } = G);
}

function checkBoard(tag) {
  if (state.cells.length !== CELLS) throw new Error(tag + ': board length ' + state.cells.length);
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (c === null) continue;
    if (!c || !VALID.has(c.kind)) throw new Error(tag + ': bad tile ' + JSON.stringify(c));
    if (ANIMALS[c.kind] && c.clock > ANIMALS[c.kind].starveAt) {
      throw new Error(tag + ': ' + c.kind + ' outlived its hunger (' + c.clock + ')');
    }
    if (PLANTS[c.kind] && c.clock > PLANTS[c.kind].witherAt) {
      throw new Error(tag + ': ' + c.kind + ' outlived its clock (' + c.clock + ')');
    }
    if (GROWS_INTO[c.kind] && ctx.sameGroup(i, c.kind).length >= MERGE_AT[c.kind]) {
      throw new Error(tag + ': unmerged ' + c.kind + ' group still touching');
    }
  }
}

// How big the group at `i` would be if the hand tile landed there.
function groupIfPlaced(i, kind) {
  const seen = new Set();
  let n = 1;
  for (const a of ctx.neighbours(i)) {
    const c = state.cells[a];
    if (!c || c.kind !== kind || seen.has(a)) continue;
    for (const g of ctx.sameGroup(a, kind)) {
      if (!seen.has(g)) { seen.add(g); n += 1; }
    }
  }
  return n;
}

function bare() {
  const out = [];
  for (let i = 0; i < CELLS; i++) if (!state.cells[i]) out.push(i);
  return out;
}

// Only ever does the one thing the rules tell you to do: put like beside
// like. It does not feed animals on purpose and does not plan around
// anything. This is the floor of competence the game has to clear.
function casualBot() {
  const open = bare();
  if (!open.length) return null;
  const merges = open.filter((i) => groupIfPlaced(i, state.hand) >= MERGE_AT[state.hand]);
  if (merges.length) return merges[(Math.random() * merges.length) | 0];
  let best = null, bestScore = -Infinity;
  for (const i of open) {
    const score = groupIfPlaced(i, state.hand) + Math.random();
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// Understands the food chain: hand-feeds mouths, builds beside dead
// ground to reclaim it, and keeps to the edges where merges are easiest
// to control. Roughly a player who has worked the game out.
function carefulBot() {
  const open = bare();
  if (!open.length) return null;
  let best = null, bestScore = -Infinity;
  for (const i of open) {
    let score = Math.random() * 0.5;
    if (groupIfPlaced(i, state.hand) >= MERGE_AT[state.hand]) score += 5;
    for (const n of ctx.neighbours(i)) {
      const c = state.cells[n];
      if (!c) continue;
      if (c.kind === state.hand) score += 2;
      else if (ANIMALS[c.kind]) score += ANIMALS[c.kind].prey === state.hand ? 4 : -1;
      else if (ctx.isBlocker(c.kind)) score += 1.5;
      else score -= 0.5;
    }
    const x = i % SIZE, y = (i / SIZE) | 0;
    if (x === 0 || x === SIZE - 1) score += 0.3;
    if (y === 0 || y === SIZE - 1) score += 0.3;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

const GLYPH = { sprout: '.', grass: 'w', rabbit: 'R', fox: 'F', bones: 'x', scrub: '#', stone: 'o' };
function dump(tag) {
  console.log('--- ' + tag + ' | turn ' + state.turn + ' score ' + state.score);
  for (let y = 0; y < SIZE; y++) {
    let row = '';
    for (let x = 0; x < SIZE; x++) {
      const c = state.cells[y * SIZE + x];
      row += (c ? GLYPH[c.kind] : '_') + ' ';
    }
    console.log('  ' + row);
  }
}

function count(kind) {
  let n = 0;
  for (const c of state.cells) if (c && c.kind === kind) n += 1;
  return n;
}

function playMany(bot, runs) {
  const scores = [], turns = [], firstFox = [], firstRabbit = [];
  let sawFox = 0, sawRabbit = 0, twoRabbits = 0;
  for (let r = 0; r < runs; r++) {
    ctx.newGame();
    let foxAt = 0, rabbitAt = 0, peakRabbits = 0, guard = 0;
    while (!state.over) {
      if (++guard > 4000) { dump('run ' + r + ' never ended'); throw new Error('never ended'); }
      const i = bot();
      if (i == null) throw new Error('run ' + r + ': no bare square but the run is not over');
      ctx.takeTurn(i);
      checkBoard('run ' + r + ' turn ' + state.turn);
      const rabbits = count('rabbit');
      if (rabbits > peakRabbits) peakRabbits = rabbits;
      if (!rabbitAt && rabbits) rabbitAt = state.turn;
      if (!foxAt && count('fox')) foxAt = state.turn;
    }
    scores.push(state.score);
    turns.push(state.turn);
    if (rabbitAt) { sawRabbit += 1; firstRabbit.push(rabbitAt); }
    if (foxAt) { sawFox += 1; firstFox.push(foxAt); }
    if (peakRabbits >= 2) twoRabbits += 1;
  }
  const avg = (a) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : 0);
  const sorted = scores.slice().sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return {
    turns: avg(turns),
    p25: pct(0.25), p50: pct(0.5), p75: pct(0.75), max: sorted[sorted.length - 1],
    zero: Math.round((scores.filter((s) => s === 0).length / runs) * 100),
    rabbitPct: Math.round((sawRabbit / runs) * 100), rabbitAt: avg(firstRabbit),
    twoPct: Math.round((twoRabbits / runs) * 100),
    foxPct: Math.round((sawFox / runs) * 100), foxAt: avg(firstFox)
  };
}

function row(label, r) {
  console.log(
    label.padEnd(22) +
    String(r.turns).padStart(5) + '  ' +
    (r.p25 + '/' + r.p50 + '/' + r.p75).padStart(16) + '  ' +
    String(r.max).padStart(6) + '  ' +
    (r.zero + '%').padStart(5) + '  ' +
    (r.rabbitPct + '% @' + r.rabbitAt).padStart(10) + '  ' +
    (r.twoPct + '%').padStart(6) + '  ' +
    (r.foxPct + '% @' + r.foxAt).padStart(10)
  );
}

const runs = Number(process.argv[2]) || 300;
const sweep = process.argv[3];   // e.g. RABBIT_EAT_AT=2,4,6

console.log('configuration           turns   score p25/50/75     max   0pt    rabbit     2 rab      fox');
console.log('-'.repeat(96));

if (sweep) {
  const [name, list] = sweep.split('=');
  for (const v of list.split(',')) {
    use({ [name]: Number(v) });
    row(name + '=' + v + ' casual', playMany(casualBot, runs));
    row(name + '=' + v + ' careful', playMany(carefulBot, runs));
  }
} else {
  use({});
  row('casual bot', playMany(casualBot, runs));
  row('careful bot', playMany(carefulBot, runs));
}
