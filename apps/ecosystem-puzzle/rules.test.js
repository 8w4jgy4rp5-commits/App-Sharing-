// ============================================================
// Rule tests for the food web — run them with `node rules.test.js`.
//
// sim.js answers "is the game fair?" over thousands of random runs.
// This file answers "does the rule do what it says?" on boards built by
// hand, one rule per board, because an average cannot tell you whether a
// wolf beside a rabbit and a fox reached for the right one.
//
// It loads the real script.js in a sandbox the same way sim.js does, so
// there is no second copy of the rules to drift out of step.
// ============================================================

const fs = require('fs');
const vm = require('vm');
const path = require('path');

function load() {
  const code = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
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
  vm.runInContext(
    code + '\n;globalThis.__x = { state, CELLS, SIZE, MERGE_AT, ANIMALS, MEAL_VALUE, GROWS_INTO };',
    ctx
  );
  ctx.render = function () {};
  ctx.setTicker = function () {};
  const x = ctx.__x;
  x.ctx = ctx;
  return x;
}

const X = load();
const S = X.state;
const at = (x, y) => y * X.SIZE + x;
const cell = (x, y) => S.cells[at(x, y)];

function board(spec) {
  for (let i = 0; i < X.CELLS; i++) S.cells[i] = null;
  for (const [x, y, kind, clock] of spec) S.cells[at(x, y)] = { kind, clock: clock || 0 };
}
const starving = (kind) => X.ANIMALS[kind].eatAt;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass += 1; console.log('  ok   ' + name); }
  else { fail += 1; console.log('  FAIL ' + name + (extra ? '   -> ' + extra : '')); }
}
function show(m) { return JSON.stringify(m.map((x) => x.kind + '<-' + x.ateKind)); }

// ---------- who eats what ----------
console.log('\nwho eats what');

board([[1, 1, 'wolf', starving('wolf')], [0, 1, 'rabbit'], [2, 1, 'fox']]);
let m = X.ctx.feedEveryone();
ok('a wolf beside a rabbit and a fox takes the rabbit — cheapest first',
   m.length === 1 && m[0].ateKind === 'rabbit', show(m));

board([[1, 1, 'wolf', starving('wolf')], [2, 1, 'fox']]);
m = X.ctx.feedEveryone();
ok('a wolf with only a fox beside it takes the fox', m.length === 1 && m[0].ateKind === 'fox', show(m));
ok('and that meal is worth a fox', m.length === 1 && m[0].points === X.MEAL_VALUE.fox,
   m.length ? String(m[0].points) : 'no meal');

board([[1, 1, 'fox', starving('fox')], [0, 1, 'grass'], [2, 1, 'rabbit']]);
m = X.ctx.feedEveryone();
ok('a fox beside grass and a rabbit takes the rabbit', m.length === 1 && m[0].ateKind === 'rabbit', show(m));

board([[1, 1, 'fox', starving('fox')], [2, 1, 'grass']]);
m = X.ctx.feedEveryone();
ok('a fox with no rabbit falls back to grass', m.length === 1 && m[0].ateKind === 'grass', show(m));
ok('and a mouthful of grass is worth grass, not a fox',
   m.length === 1 && m[0].points === X.MEAL_VALUE.grass, m.length ? String(m[0].points) : 'no meal');

board([[1, 1, 'fox', starving('fox')], [2, 1, 'fox', starving('fox')]]);
m = X.ctx.feedEveryone();
ok('a hungry fox does not eat another fox — a rung never eats its own', m.length === 0, show(m));

// ---------- grass is safe ground ----------
console.log('\ngrass is safe ground');

board([[1, 1, 'wolf', starving('wolf')], [0, 1, 'grass'], [2, 1, 'grass'], [1, 0, 'grass'], [1, 2, 'grass']]);
m = X.ctx.feedEveryone();
ok('a starving wolf ringed by grass eats nothing', m.length === 0, show(m));
ok('and the grass is all still standing',
   [[0, 1], [2, 1], [1, 0], [1, 2]].every(([x, y]) => cell(x, y) && cell(x, y).kind === 'grass'));

// ---------- hunger is the trigger, not adjacency ----------
console.log('\nhunger is the trigger, not adjacency');

board([[1, 1, 'wolf', starving('wolf') - 1], [2, 1, 'fox']]);
m = X.ctx.feedEveryone();
ok('a wolf one turn short of hungry leaves the fox alone', m.length === 0, show(m));
ok('so a fox may be built beside a fed wolf in safety', cell(2, 1) && cell(2, 1).kind === 'fox');

// ---------- order of settling ----------
console.log('\norder of settling');

board([[1, 1, 'wolf', starving('wolf')], [2, 1, 'rabbit', starving('rabbit')], [3, 1, 'grass']]);
m = X.ctx.feedEveryone();
ok('the wolf takes the rabbit before that rabbit can strip the grass',
   m.length === 1 && m[0].kind === 'wolf' && cell(3, 1) && cell(3, 1).kind === 'grass', show(m));

// ---------- the ladder ----------
console.log('\nthe ladder');
ok('a fox grows into a wolf', X.GROWS_INTO.fox === 'wolf');
ok('two foxes make a wolf', X.MERGE_AT.fox === 2);
ok('the wolf is the top — nothing to grow into', !X.GROWS_INTO.wolf);

const rank = (k) => { let n = 0, c = 'sprout'; while (c && c !== k) { c = X.GROWS_INTO[c]; n += 1; } return c === k ? n : -1; };
let bad = '';
for (const k in X.ANIMALS) {
  for (const d of X.ANIMALS[k].diet) {
    if (rank(d) < 0) bad = k + ' eats "' + d + '", which is not on the ladder';
    else if (rank(d) >= rank(k)) bad = k + ' eats ' + d + ', which is not below it';
  }
}
ok('every diet entry is a real rung below its eater', !bad, bad);

const climb = Object.keys(X.ANIMALS).sort((a, b) => rank(a) - rank(b));
let widen = true;
for (let i = 1; i < climb.length; i++) {
  if (X.ANIMALS[climb[i]].diet.length < X.ANIMALS[climb[i - 1]].diet.length) widen = false;
}
ok('diets widen as the ladder climbs, never narrow', widen,
   climb.map((a) => a + ':' + X.ANIMALS[a].diet.length).join(' '));

const priced = Object.keys(X.ANIMALS).every((k) => X.ANIMALS[k].diet.every((d) => X.MEAL_VALUE[d] > 0));
ok('every meal on every diet has a price', priced);

// ---------- the red bar means what it says ----------
//
// The one rule the player reads off the board is "an animal reaches out
// when its bar is red". That is not written down anywhere in the code —
// it falls out of EAT_AT, STARVE_AT and the 34% the meter paints red
// agreeing with each other. Nudge any of the three and the promise
// quietly breaks, so check the arithmetic rather than trusting it.
console.log('\nthe red bar means what it says');

const RED_AT = 0.34;                       // matches the meter's is-low cut
const red = (kind, clock) => X.ctx.vitality({ kind, clock }) <= RED_AT;

for (const kind in X.ANIMALS) {
  const cfg = X.ANIMALS[kind];
  ok('a ' + kind + ' is already red the turn it reaches out', red(kind, cfg.eatAt),
     'eatAt ' + cfg.eatAt + ' of ' + cfg.starveAt);
  ok('a ' + kind + ' one turn short of hungry is not red yet', !red(kind, cfg.eatAt - 1),
     'eatAt ' + cfg.eatAt + ' of ' + cfg.starveAt);
  ok('a ' + kind + ' gets turns to be answered in, not one', cfg.starveAt - cfg.eatAt >= 3,
     'window ' + (cfg.starveAt - cfg.eatAt));
}

// ---------- the ground keeps clear of animals ----------
//
// A stone taking the last bare square beside a hungry animal is a death
// the player had no move against, which is the one thing the ground is
// not allowed to do.
console.log('\nthe ground keeps clear of animals');

// rabbit at the middle, so 4 of the 25 squares touch it
function stoneLands() {
  S.turn = 0;                              // turn % stoneEvery() === 0
  const put = X.ctx.surfaceStone();
  return put ? put.at : -1;
}

let touched = 0;
for (let n = 0; n < 200; n++) {
  board([[2, 2, 'rabbit', starving('rabbit')]]);
  const put = stoneLands();
  if (put >= 0 && X.ctx.neighbours(put).indexOf(at(2, 2)) >= 0) touched += 1;
}
ok('200 stones, none of them beside the rabbit', touched === 0, touched + ' landed beside it');

// the fallback: box the rabbit's whole row in so the only bare squares
// left are ones that touch it. The ground still has to take its turn.
board([
  [2, 2, 'rabbit', starving('rabbit')],
  [1, 2, 'scrub'], [3, 2, 'scrub'], [2, 1, 'scrub'],
]);
for (let i = 0; i < X.CELLS; i++) if (!S.cells[i] && i !== at(2, 2) && i !== at(2, 3)) S.cells[i] = { kind: 'stone', clock: 0 };
ok('with nowhere else left, the stone still lands', stoneLands() === at(2, 3));

console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
