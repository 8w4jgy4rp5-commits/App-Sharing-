// ============================================================
// Balance harness — run it with `node sim.js`. Not part of the game and
// never loaded by the page.
//
//   node sim.js          one table row per STONE_EVERY value
//   node sim.js 400 5    400 runs at STONE_EVERY = 5
//
// It plays script.js directly, with stubs where the DOM would be, so a
// full run finishes in well under a millisecond and a thousand of them
// are done before you have finished reading this.
//
// Two questions get asked of every change to the numbers, and guessing
// at either one has already been wrong once: does a run end at all, and
// does anyone ever reach the fox. The first version of these rules never
// terminated — merging is a tile sink, so the board emptied instead of
// filling — and the version after that put the fox out of reach in 98%%
// of runs. Both showed up here, in seconds, rather than in play.
// ============================================================
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.join(__dirname, 'script.js');

// The tuning numbers are top-level consts, so a sweep rewrites them in
// the source text and reloads rather than trying to poke at them.
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
  return { ctx, ...x };
}

const VALID = new Set(['sprout', 'grass', 'rabbit', 'fox', 'bones', 'scrub', 'stone']);

// rebound by playMany for each configuration under test
let G, ctx, state, CELLS, SIZE, ANIMALS, PLANTS, GROWS_INTO;

function use(overrides) {
  G = load(overrides);
  ({ ctx, state, CELLS, SIZE, ANIMALS, PLANTS, GROWS_INTO } = G);
}

function checkBoard(tag) {
  if (state.cells.length !== CELLS) throw new Error(tag + ': board length ' + state.cells.length);
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (c === null) continue;
    if (!c || !VALID.has(c.kind)) throw new Error(tag + ': bad tile at ' + i + ' ' + JSON.stringify(c));
    if (ANIMALS[c.kind] && c.clock > ANIMALS[c.kind].starveAt) {
      throw new Error(tag + ': ' + c.kind + ' outlived its hunger (' + c.clock + ')');
    }
    if (PLANTS[c.kind] && c.clock > PLANTS[c.kind].witherAt) {
      throw new Error(tag + ': ' + c.kind + ' outlived its clock (' + c.clock + ')');
    }
    if (GROWS_INTO[c.kind] && ctx.sameGroup(i, c.kind).length >= G.MERGE_AT[c.kind]) {
      throw new Error(tag + ': unmerged ' + c.kind + ' group still touching at ' + i);
    }
  }
}

// A plain bot: keeps like next to like so merges happen, feeds a mouth
// when it can, and builds beside dead ground to reclaim it. Roughly a
// person who understands the game and is paying attention. If this bot
// cannot make a run last, a player will not either.
function botPick() {
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < CELLS; i++) {
    if (state.cells[i]) continue;
    let score = Math.random() * 0.5;
    for (const n of ctx.neighbours(i)) {
      const c = state.cells[n];
      if (!c) continue;
      if (c.kind === state.hand) score += 3;                 // build toward a merge
      else if (ANIMALS[c.kind]) {
        score += ANIMALS[c.kind].prey === state.hand ? 4 : -1; // hand-feed a mouth
      } else if (ctx.isBlocker(c.kind)) score += 1.5;         // build beside dead ground
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

function playMany(runs) {
  const scores = [], turns = [], tops = { sprout: 0, grass: 0, rabbit: 0, fox: 0 };
  for (let r = 0; r < runs; r++) {
    ctx.newGame();
    let guard = 0;
    while (!state.over) {
      if (++guard > 4000) { dump('run ' + r + ' never ended'); throw new Error('never ended'); }
      const i = botPick();
      if (i == null) throw new Error('run ' + r + ': no bare square but the run is not over');
      ctx.takeTurn(i);
      checkBoard('run ' + r + ' turn ' + state.turn);
    }
    scores.push(state.score);
    turns.push(state.turn);
    tops[state.topKind] += 1;
  }
  const sorted = scores.slice().sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  const avg = (a) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
  return {
    turns: avg(turns),
    maxTurns: Math.max(...turns),
    p25: pct(0.25), p50: pct(0.5), p75: pct(0.75), max: sorted[sorted.length - 1],
    zero: scores.filter((s) => s === 0).length,
    tops
  };
}

const runs = Number(process.argv[2]) || 300;
const only = process.argv[3] ? Number(process.argv[3]) : null;
const values = only ? [only] : [2, 3, 4, 5, 6, 8];

console.log('stone  turns(avg/max)   score p25/p50/p75/max      0pt   reached fox / rabbit');
for (const every of values) {
  use({ STONE_EVERY: every });
  const r = playMany(runs);
  console.log(
    String(every).padStart(4) + '   ' +
    (r.turns + '/' + r.maxTurns).padEnd(15) + '  ' +
    (r.p25 + '/' + r.p50 + '/' + r.p75 + '/' + r.max).padEnd(24) + '  ' +
    String(r.zero).padStart(3) + '   ' +
    String(r.tops.fox).padStart(5) + ' / ' + String(r.tops.rabbit).padStart(5)
  );
}
