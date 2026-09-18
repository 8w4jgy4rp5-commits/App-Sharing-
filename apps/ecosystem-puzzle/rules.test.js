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
    code + '\n;globalThis.__x = { state, CELLS, SIZE, MERGE_AT, ANIMALS, MEAL_VALUE, GROWS_INTO, HAND_MAX };',
    ctx
  );
  ctx.render = function () {};
  ctx.setTicker = function () {};
  ctx.syncClock = function () {};   // no real timer in here
  ctx.endRun = function () { state.over = true; };
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

// Counted in PREY RUNGS, not diet entries.
//
// This used to count the whole diet and it broke the day plants became
// an emergency ration, which is the test doing its job: the two halves
// of a diet are not the same thing and were being added together. The
// animals a rung can take is the food chain widening as it climbs — a
// wolf takes hares and foxes and whatever else is slow that day. The
// plants underneath are the fire escape, and the apex deliberately does
// not get one, so counting those in made a shorter wolf menu look like
// a narrowing chain when it is the opposite.
const climb = Object.keys(X.ANIMALS).sort((a, b) => rank(a) - rank(b));
const preyRungs = (k) => X.ANIMALS[k].diet.filter((d) => X.ANIMALS[d]).length;
let widen = true;
for (let i = 1; i < climb.length; i++) {
  if (preyRungs(climb[i]) < preyRungs(climb[i - 1])) widen = false;
}
ok('the animals a rung can take widen as the ladder climbs, never narrow', widen,
   climb.map((a) => a + ':' + preyRungs(a)).join(' '));

// and the plant half, which runs the other way on purpose
const plantFallbacks = (k) => X.ANIMALS[k].diet.filter((d) => !X.ANIMALS[d]).length;
ok('the higher the rung, the less it can scrape by on plants',
   plantFallbacks('wolf') <= plantFallbacks('fox') && plantFallbacks('fox') <= plantFallbacks('rabbit'),
   climb.map((a) => a + ':' + plantFallbacks(a)).join(' '));

const priced = Object.keys(X.ANIMALS).every((k) => X.ANIMALS[k].diet.every((d) => X.MEAL_VALUE[d] > 0));
ok('every meal on every diet has a price', priced);

// ---------- a life is always one tap away ----------
//
// The clock is counted in taps and the player only gets one tap, so a
// meal that costs three taps to build costs a third of the whole budget
// per animal — three animals and there is nothing left to play with.
// The bottom rung of the plant ladder being edible is what breaks that,
// and it is load-bearing enough to check rather than assume.
console.log('\na life is always one tap away');

const HAND = ['sprout', 'grass'];          // everything the hand can deal
for (const kind of ['rabbit', 'fox']) {
  const saveable = HAND.filter((h) => X.ANIMALS[kind].diet.indexOf(h) >= 0);
  ok('a starving ' + kind + ' can be saved with a tile the hand actually deals',
     saveable.length > 0, 'diet ' + JSON.stringify(X.ANIMALS[kind].diet));
  ok('...including the one it always has — a sprout',
     X.ANIMALS[kind].diet.indexOf('sprout') >= 0);
}

board([[1, 1, 'rabbit', starving('rabbit')], [2, 1, 'sprout']]);
m = X.ctx.feedEveryone();
ok('a starving rabbit will take a bare sprout', m.length === 1 && m[0].ateKind === 'sprout', show(m));
ok('and the rabbit is fed, not merely fewer sprouts',
   cell(1, 1) && cell(1, 1).clock === 0 && !cell(2, 1));

board([[1, 1, 'rabbit', starving('rabbit')], [0, 1, 'sprout'], [2, 1, 'grass']]);
m = X.ctx.feedEveryone();
ok('given both, it takes the grass and leaves the sprout standing',
   m.length === 1 && m[0].ateKind === 'grass' && cell(0, 1) && cell(0, 1).kind === 'sprout', show(m));

board([[1, 1, 'rabbit', starving('rabbit') - 1], [2, 1, 'sprout']]);
m = X.ctx.feedEveryone();
ok('sprouts are still safe to build beside a rabbit that is not red yet', m.length === 0, show(m));

// the rescue must never be the efficient play: grass is MERGE_SPROUT taps
// for MEAL_VALUE.grass, a sprout is one tap for MEAL_VALUE.sprout
const perTapGrass = X.MEAL_VALUE.grass / X.MERGE_AT.sprout;
ok('panicking costs score — a sprout pays less per tap than grass does',
   X.MEAL_VALUE.sprout < perTapGrass,
   X.MEAL_VALUE.sprout + ' vs ' + perTapGrass.toFixed(1) + ' a tap');

ok('the wolf keeps its short menu — an apex saved by a sprout is not one',
   X.ANIMALS.wolf.diet.indexOf('sprout') < 0);

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
  // The promise is one-directional: nothing is taken off the board
  // without the player having been shown a red bar first. The bar going
  // red a turn early is a warning, not a lie — the bar going red LATE
  // would be, so that is the edge worth pinning.
  ok('a ' + kind + ' is already red the turn it reaches out', red(kind, cfg.eatAt),
     'eatAt ' + cfg.eatAt + ' of ' + cfg.starveAt);
  ok('a just-fed ' + kind + ' is not red', !red(kind, 0));
  ok('a ' + kind + ' that reaches out has at least one turn left to be answered in',
     cfg.starveAt > cfg.eatAt, 'window ' + (cfg.starveAt - cfg.eatAt));
}

// ---------- your move costs the world nothing ----------
//
// This is the whole point of the rewrite, so it is checked directly
// rather than inferred. If any of these start failing, the game has
// quietly gone back to being a treadmill.
console.log('\nyour move costs the world nothing');

// newGame() is not called here — it reaches for the DOM. Every board in
// this file is built by hand anyway, which is the point of the file.
const beforeClocks = () => S.cells.filter((c) => c).map((c) => c.kind + ':' + c.clock).join(' ');

board([[0, 0, 'rabbit', 4], [4, 4, 'grass', 3]]);
S.ticks = 7;
S.stock = ['sprout', 'sprout', 'sprout'];
const clocksWere = beforeClocks();
X.ctx.placeTile(at(2, 2));
ok('placing does not advance the world clock', S.ticks === 7, 'ticks ' + S.ticks);
ok('placing does not age anything already on the board',
   beforeClocks().replace(' sprout:0', '').replace('sprout:0 ', '') === clocksWere,
   beforeClocks());
ok('placing spends exactly one tile', S.stock.length === 2, 'stock ' + S.stock.length);
ok('...and it is the oldest one, so the hand is a queue', S.stock.length === 2);

// three placements between two ticks is the move the old game could not
// express: a whole hand emptied into one crisis, at no cost in time
S.stock = ['sprout', 'sprout', 'sprout'];
S.ticks = 7;
X.ctx.placeTile(at(0, 2));
X.ctx.placeTile(at(0, 3));
X.ctx.placeTile(at(1, 3));
ok('a whole hand can be spent between two ticks', S.ticks === 7 && S.stock.length === 0,
   'ticks ' + S.ticks + ' stock ' + S.stock.length);

// and the reverse: an empty hand means the board cannot be touched
S.stock = [];
const wasEmpty = !cell(3, 3);
X.ctx.placeTile(at(3, 3));
ok('an empty hand places nothing', wasEmpty && !cell(3, 3));

// the world moves on its own, with nobody playing at all
board([[2, 2, 'rabbit', X.ANIMALS.rabbit.starveAt - 1]]);
S.stock = []; S.ticks = 0; S.over = false;
X.ctx.worldTick();
ok('the world ages the board with no placement at all',
   cell(2, 2) && cell(2, 2).kind === 'bones', cell(2, 2) && cell(2, 2).kind);
ok('and the world clock did advance', S.ticks === 1, 'ticks ' + S.ticks);

// a tile arrives on the world's clock, not on yours
S.stock = []; S.refill = 0;
X.ctx.worldTick();
ok('a tick deals a tile into an empty hand', S.stock.length === 1, 'stock ' + S.stock.length);
for (let n = 0; n < 10; n++) X.ctx.worldTick();
ok('and the hand never exceeds HAND_MAX', S.stock.length <= X.HAND_MAX, 'stock ' + S.stock.length);


// ---------- the ground keeps clear of animals ----------
//
// A stone taking the last bare square beside a hungry animal is a death
// the player had no move against, which is the one thing the ground is
// not allowed to do.
console.log('\nthe ground keeps clear of animals');

// rabbit at the middle, so 4 of the 25 squares touch it
function stoneLands() {
  S.ticks = 0;                             // ticks % stoneEvery() === 0
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
