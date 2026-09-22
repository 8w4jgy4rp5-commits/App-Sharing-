// Prototype v9: bots are capped at three placements per decision; hand supply is instant.
// ============================================================
// Balance harness — run it with `node sim.js`. Not part of the game and
// never loaded by the page.
//
//   node sim.js                        both bots at the current numbers
//   node sim.js 400                    ...over 400 runs each
//   node sim.js 400 HAND_MAX=1,2,3,4,6    ...sweeping one knob
//
// It plays script.js directly, with stubs where the DOM would be, so a
// full run finishes in well under a millisecond.
//
// THE CLOCK IS SPLIT, AND SO IS THIS. The game no longer has a "turn":
// worldTick() is the meadow's move and placeTile() is the player's, and
// the player may make none, one, or several placements between ticks
// depending on what is in hand. So the loop here is the real loop —
// tick, then let the bot spend what it wants — rather than a single
// takeTurn() call. Real seconds never enter it; TICK_MS is a feel
// setting and has no effect on any number this file reports.
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
// Both bots empty their hand every tick. That is deliberate: it measures
// the game WITHOUT the new banking move, so any credit the split gets is
// credit the separation earned on its own rather than credit for a bot
// playing better than a person would. See `spendAll`.
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
    const re = new RegExp('const ' + name + ' = [0-9]+;');
    if (!re.test(code)) throw new Error('no const ' + name + ' to override');
    code = code.replace(re, 'const ' + name + ' = ' + value + ';');
  }
  const ctx = {
    console, Math, Number, Set, Array, JSON,
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => {},
    document: { addEventListener() {}, querySelectorAll: () => [], getElementById: () => null },
    window: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  // top-level const/let stay in the script's own scope, so hand them out
  vm.runInContext(
    code + '\n;globalThis.__x = { state, el, CELLS, SIZE, MERGE_AT, ANIMALS, PLANTS, GROWS_INTO, HAND_MAX };',
    ctx
  );
  ctx.render = function () {};
  ctx.setTicker = function () {};
  ctx.syncClock = function () {};   // no real timer in here
  const x = ctx.__x;
  x.el.gameover = {};
  x.el.goTitle = {};
  x.el.goScore = {};
  x.el.goLevel = {};
  x.el.goNote = {};
  x.el.goAgain = { focus() {} };
  x.ctx = ctx;
  return x;
}

const VALID = new Set(['sprout', 'grass', 'rabbit', 'fox', 'wolf', 'bear', 'deer', 'zebra', 'buffalo', 'lion', 'tiger', 'elephant', 'bones', 'scrub', 'stone']);

let G, ctx, state, CELLS, SIZE, MERGE_AT, ANIMALS, PLANTS, GROWS_INTO, HAND_MAX;
function use(overrides) {
  G = load(overrides);
  ({ ctx, state, CELLS, SIZE, MERGE_AT, ANIMALS, PLANTS, GROWS_INTO, HAND_MAX } = G);
}

function checkBoard(tag) {
  if (state.cells.length !== CELLS) throw new Error(tag + ': board length ' + state.cells.length);
  if (state.stock.length > HAND_MAX) throw new Error(tag + ': hand overfull (' + state.stock.length + ')');
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (c === null) continue;
    if (!c || !VALID.has(c.kind)) throw new Error(tag + ': bad tile ' + JSON.stringify(c));
    if (ANIMALS[c.kind] && c.clock > ANIMALS[c.kind].starveAt) {
      throw new Error(tag + ': ' + c.kind + ' outlived its hunger (' + c.clock + ')');
    }
    // a plant's life depends on the season, and a season change can shorten
    // it under a plant that was fine a turn ago — so ask for the limit
    // rather than assuming the winter one
    if (PLANTS[c.kind] && c.clock > ctx.plantLimit(c.kind)) {
      throw new Error(tag + ': ' + c.kind + ' outlived its clock (' + c.clock + ' > ' + ctx.plantLimit(c.kind) + ')');
    }
    if (GROWS_INTO[c.kind] && ctx.sameGroup(i, c.kind).length >= MERGE_AT[c.kind]) {
      throw new Error(tag + ': unmerged ' + c.kind + ' group still touching');
    }
  }
}

// How big the group at `i` would be if `kind` landed there.
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
function casualBot(hand) {
  const open = bare();
  if (!open.length) return null;
  const merges = open.filter((i) => groupIfPlaced(i, hand) >= MERGE_AT[hand]);
  if (merges.length) return merges[(Math.random() * merges.length) | 0];
  let best = null, bestScore = -Infinity;
  for (const i of open) {
    const score = groupIfPlaced(i, hand) + Math.random();
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// Understands the food chain: hand-feeds mouths, builds beside dead
// ground to reclaim it, and keeps to the edges where merges are easiest
// to control. Roughly a player who has worked the game out.
function carefulBot(hand) {
  const open = bare();
  if (!open.length) return null;
  let best = null, bestScore = -Infinity;
  for (const i of open) {
    let score = Math.random() * 0.5;
    if (groupIfPlaced(i, hand) >= MERGE_AT[hand]) score += 5;
    for (const n of ctx.neighbours(i)) {
      const c = state.cells[n];
      if (!c) continue;
      if (c.kind === hand) score += 2;
      else if (ANIMALS[c.kind]) {
        // a mouth that is red RIGHT NOW and has nothing beside it is the
        // move the split clock made possible, so the bot has to be able
        // to take it or the harness cannot see the change
        const cfg = ANIMALS[c.kind];
        if (cfg.diet.indexOf(hand) >= 0) {
          score += c.clock >= cfg.eatAt && !ctx.pickMeal(n, cfg) ? 9 : 4;
        } else score -= 1;
      } else if (ctx.isBlocker(c.kind)) score += 1.5;
      else score -= 0.5;
    }
    const x = i % SIZE, y = (i / SIZE) | 0;
    if (x === 0 || x === SIZE - 1) score += 0.3;
    if (y === 0 || y === SIZE - 1) score += 0.3;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// Spend the whole hand, one tile at a time, re-deciding after each
// placement because a merge changes what the next tile should do.
function spendAll(bot, tag) {
  let placed = 0;
  while (state.stock.length && !state.over && placed < HAND_MAX) {
    const i = bot(state.stock[0]);
    if (i == null) break;               // board full
    ctx.placeTile(i);
    placed += 1;
    checkBoard(tag);
  }
  return placed;
}

// THE MOVE THE SPLIT CLOCK EXISTS FOR.
//
// Every other bot here empties its hand the moment it has one, which is
// the old game's only possible behaviour and measures the new one
// without its new option. This one holds tiles back and spends them when
// the board actually needs them — which is only worth anything because
// holding no longer costs the meadow any time.
//
// It plays carefully once it decides to spend, so the difference between
// this row and the careful row is the banking and nothing else.
function bankerBot(tag) {
  let placed = 0;
  for (;;) {
    if (!state.stock.length || state.over || placed >= HAND_MAX) break;
    const hand = state.stock[0];
    const open = bare();
    if (!open.length) break;

    // spend on: a life that can be saved this instant, a merge that
    // completes, or a hand about to overflow and waste the refill
    const rescue = open.some(function (i) {
      return ctx.neighbours(i).some(function (n) {
        const c = state.cells[n];
        if (!c || !ANIMALS[c.kind]) return false;
        const cfg = ANIMALS[c.kind];
        return c.clock >= cfg.eatAt && cfg.diet.indexOf(hand) >= 0 && !ctx.pickMeal(n, cfg);
      });
    });
    const merge = open.some((i) => groupIfPlaced(i, hand) >= MERGE_AT[hand]);
    const full = state.stock.length >= HAND_MAX;
    if (!rescue && !merge && !full) break;   // hold it

    const i = carefulBot(hand);
    if (i == null) break;
    ctx.placeTile(i);
    placed += 1;
    checkBoard(tag);
  }
  return placed;
}

// THE PLAYER WHO ACTUALLY COMPLAINED.
//
// Every bot above empties its hand the instant it has one. No person
// does. A person reads the board, decides, and taps — and while they are
// deciding the hand fills to HAND_MAX and every further refill is thrown
// away (see refillHand: a full hand banks nothing). So the bots measure
// a supply rate the player never receives, and the game they report is
// not the game being played.
//
// This one thinks. It acts on one tick in THINK, casually, which is the
// floor of what a first-timer gets through. Its fox numbers are the ones
// that answer "why can I never build a fox".
let THINK = 3;
function slowBot(tag) {
  if (state.ticks % THINK !== 0) return 0;     // still looking at the board
  return spendAll(casualBot, tag);
}

const GLYPH = { sprout: '.', grass: 'w', rabbit: 'R', fox: 'F', wolf: 'W', bear: 'B', bones: 'x', scrub: '#', stone: 'o' };
function dump(tag) {
  console.log('--- ' + tag + ' | tick ' + state.ticks + ' score ' + state.score);
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

// `bot` is either a placement chooser (spend everything) or, for the
// banker, a whole hand-spending policy. One flag rather than two loops.
function playMany(bot, runs, ownPolicy) {
  const spend = ownPolicy ? bot : function (tag) { return spendAll(bot, tag); };
  const scores = [], ticks = [], firstFox = [], firstRabbit = [], firstWolf = [], firstBear = [], firstElephant = [];
  const endedIn = [0, 0, 0, 0];
  let sawFox = 0, sawRabbit = 0, twoRabbits = 0, sawElephant = 0, sawBear = 0, sawWolf = 0, twoFoxes = 0;
  fromGrowth = 0; fromMeals = 0;
  let starved = 0, tickTotal = 0, idle = 0, aliveSum = 0, aliveN = 0;
  for (let r = 0; r < runs; r++) {
    ctx.newGame();
    let foxAt = 0, rabbitAt = 0, elephantAt = 0, bearAt = 0, wolfAt = 0, peakRabbits = 0, peakFoxes = 0, guard = 0;
    // opening hand, before the world has moved at all
    spend('run ' + r + ' opening');
    while (!state.over) {
      if (++guard > 4000) { dump('run ' + r + ' never ended'); throw new Error('never ended'); }
      const before = state.cells.filter((c) => c && ANIMALS[c.kind]).length;
      ctx.worldTick();
      checkBoard('run ' + r + ' tick ' + state.ticks);
      const after = state.cells.filter((c) => c && ANIMALS[c.kind]).length;
      aliveSum += after; aliveN += 1;
      void before;
      if (state.over) break;
      if (!spend('run ' + r + ' tick ' + state.ticks)) idle += 1;

      const rabbits = count('rabbit');
      if (rabbits > peakRabbits) peakRabbits = rabbits;
      if (!rabbitAt && rabbits) rabbitAt = state.ticks;
      const foxes = count('fox');
      if (foxes > peakFoxes) peakFoxes = foxes;
      if (!foxAt && foxes) foxAt = state.ticks;
      if (!elephantAt && count('elephant')) elephantAt = state.ticks;
      if (!bearAt && count('bear')) bearAt = state.ticks;
      if (!wolfAt && count('wolf')) wolfAt = state.ticks;
    }
    scores.push(ctx.displayScore(state.score));
    ticks.push(state.ticks);
    tickTotal += state.ticks;
    starved += runStarved;
    runStarved = 0;
    endedIn[Math.min(endedIn.length - 1, ctx.season())] += 1;
    if (rabbitAt) { sawRabbit += 1; firstRabbit.push(rabbitAt); }
    if (foxAt) { sawFox += 1; firstFox.push(foxAt); }
    if (peakRabbits >= 2) twoRabbits += 1;
    if (elephantAt) { sawElephant++; firstElephant.push(elephantAt); }
    if (bearAt) { sawBear += 1; firstBear.push(bearAt); }
    if (wolfAt) { sawWolf += 1; firstWolf.push(wolfAt); }
    if (peakFoxes >= 2) twoFoxes += 1;
  }
  const avg = (a) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : 0);
  const sorted = scores.slice().sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return {
    growPct: Math.round((100 * fromGrowth) / Math.max(1, fromGrowth + fromMeals)),
    ticks: avg(ticks),
    p25: pct(0.25), p50: pct(0.5), p75: pct(0.75), max: sorted[sorted.length - 1],
    zero: Math.round((scores.filter((s) => s === 0).length / runs) * 100),
    // The top rung, which is what "a good run" is supposed to mean.
    topPct: Math.round((scores.filter((s) => s >= 5000).length / runs) * 100),
    starved: (100 * starved / tickTotal).toFixed(1),
    alive: (aliveSum / aliveN).toFixed(2),
    idle: Math.round((100 * idle) / tickTotal),
    rabbitPct: Math.round((sawRabbit / runs) * 100), rabbitAt: avg(firstRabbit),
    twoPct: Math.round((twoRabbits / runs) * 100),
    foxPct: Math.round((sawFox / runs) * 100), foxAt: avg(firstFox),
    twoFoxPct: Math.round((twoFoxes / runs) * 100),
    elephantPct: Math.round(100*sawElephant/runs), elephantAt: avg(firstElephant),
    bearPct: Math.round((sawBear / runs) * 100), bearAt: avg(firstBear),
    wolfPct: Math.round((sawWolf / runs) * 100), wolfAt: avg(firstWolf),
    endedIn: endedIn.map((n) => Math.round((n / runs) * 100))
  };
}

// Starvations are the headline number now, so count them at the source
// rather than inferring them from the board afterwards.
let runStarved = 0;
function countDeaths() {
  const orig = ctx.collectDeaths;
  ctx.collectDeaths = function () {
    const dead = orig.apply(this, arguments);
    runStarved += dead.length;
    return dead;
  };
}

// WHERE THE POINTS COME FROM.
//
// Growing pays now as well as eating, and the intent is that eating
// stays the bigger half — "grazing a fox beats farming sprouts" is only
// true if the arithmetic says so. An intent nothing measures is a wish,
// so the split is a column.
let fromGrowth = 0, fromMeals = 0;
function countScore() {
  const g = ctx.scoreGrowth, m = ctx.scoreMeals;
  ctx.scoreGrowth = function () { const n = g.apply(this, arguments); fromGrowth += n; return n; };
  ctx.scoreMeals = function () { const n = m.apply(this, arguments); fromMeals += n; return n; };
}

function row(label, r) {
  console.log(
    label.padEnd(22) +
    String(r.ticks).padStart(6) + '  ' +
    (r.p25 + '/' + r.p50 + '/' + r.p75).padStart(16) + '  ' +
    String(r.max).padStart(6) + '  ' +
    (r.zero + '%').padStart(5) + '  ' +
    (r.topPct + '%').padStart(5) + '  ' +
    r.starved.padStart(8) + '  ' +
    (r.growPct + '%').padStart(6) + '  ' +
    r.alive.padStart(6) + '  ' +
    (r.idle + '%').padStart(5) + '  ' +
    (r.rabbitPct + '% @' + r.rabbitAt).padStart(10) + '  ' +
    (r.foxPct + '% @' + r.foxAt).padStart(10) + '  ' +
    (r.wolfPct + '% @' + r.wolfAt).padStart(10) + '  ' +
    (r.bearPct + '% @' + r.bearAt).padStart(10) + '  ' +
    (r.elephantPct + '% @' + r.elephantAt).padStart(10) + '  ' +
    r.endedIn.join('/').padStart(16)
  );
}

const runs = Number(process.argv[2]) || 300;
// e.g. `HAND_MAX=1,2,3,4,6`, or several knobs at once —
// `MERGE_SPROUT=2 GRASS_IN_HAND=22,35` runs every combination, because
// the knobs are not independent: cheapening a merge changes what the
// right amount of ready-made grass is.
const sweep = process.argv.slice(3);

console.log('configuration          ticks   shown p25/50/75     max   0pt   lv6  starved  grown   alive   idle    rabbit       fox      wolf        bear   elephant     ended sp/su/au/wi');
console.log('-'.repeat(146));

if (sweep.length) {
  const knobs = sweep.map(function (s) {
    const [name, list] = s.split('=');
    return { name: name, values: list.split(',').map(Number) };
  });
  // every combination, in order
  let combos = [{}];
  for (const k of knobs) {
    const next = [];
    for (const c of combos) for (const v of k.values) next.push(Object.assign({}, c, { [k.name]: v }));
    combos = next;
  }
  for (const c of combos) {
    use(c);
    countDeaths();
    countScore();
    const label = Object.keys(c).map(function (n) { return n.replace(/[a-z_]/g, '') + c[n]; }).join(' ');
    row(label + ' casual', playMany(casualBot, runs));
    THINK = 3;
    row(label + ' thinks/3', playMany(slowBot, runs, true));
  }
} else {
  use({});
  countDeaths();
  countScore();
  row('casual bot', playMany(casualBot, runs));
  row('careful bot', playMany(carefulBot, runs));
  row('careful, banking', playMany(bankerBot, runs, true));
  for (const t of [2, 3, 4]) {
    THINK = t;
    row('thinks every ' + t + ' ticks', playMany(slowBot, runs, true));
  }
}
