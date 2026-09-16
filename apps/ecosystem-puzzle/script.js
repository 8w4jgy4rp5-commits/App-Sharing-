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
// Two, not three. With the fox as the top rung three was right; with the
// wolf above it, three grass per rabbit priced the wolf out of the game
// — the harness found it at 5% of runs, which is not a top rung, it is a
// rumour. Two brings the first fox in around turn 30 instead of 44, and
// that gap is the whole budget for building the second one.
const MERGE_GRASS = 2;
const MERGE_RABBIT = 2;
// Two, for the same reason rabbits take two: a fox is expensive to keep
// and three alive at once is a wall, not a difficulty setting.
const MERGE_FOX = 2;

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
// So both animals now eat only once they are nearly dead, which makes one
// visible rule cover everything: an animal takes what is beside it only
// when its bar is red, and at that point you wanted it fed anyway. Grass
// sitting next to a rabbit is otherwise safe, and can be built into the
// next rabbit in peace.
//
// It costs score — the casual bot's median fell from 900 to 700, since
// meals are the only points — and buys back a game whose best strategy is
// not a trick. The fox turns up slightly more often, too.
//
// THESE NUMBERS ARE NOT THE DIFFICULTY KNOB, and widening them was tried
// and reverted.
//
// The clock is counted in turns and a turn is one tap, so every move the
// player makes to save an animal also ages it. Stretching STARVE_AT
// therefore buys nothing: five turns of grace cost five turns of hunger
// on everything else on the board. It was measured — rabbit 11 -> 13,
// fox 16 -> 19, wolf 21 -> 25 — and a bot that plays to keep the chain
// alive starved at 3.7 per hundred turns before and 3.4 after. The
// treadmill does not care how long the track is.
//
// What actually decides whether the game is playable is the price of a
// meal in taps, and that is fixed in the diets below, not here.
const RABBIT_EAT_AT = 9;
const RABBIT_STARVE_AT = 11;

const FOX_EAT_AT = 13;
const FOX_STARVE_AT = 16;

// The wolf is the first rung that eats more than one thing, so its own
// numbers matter less than that rule does: a wide diet already keeps it
// alive on scraps. The long clock is there so a wolf is not a crisis the
// turn it lands, and the points are what make the fox worth spending.
const WOLF_EAT_AT = 17;
const WOLF_STARVE_AT = 21;

// A meal is worth WHAT WAS EATEN, not who ate it.
//
// While every animal had exactly one prey the two were the same number,
// so the score lived on the predator: a fox ate rabbits, therefore a
// fox's meal was worth a rabbit. Diets broke that. Paying a fox its own
// rate for a mouthful of grass made grazing foxes the highest-scoring
// thing in the game — the harness caught it instantly, medians jumped
// from 2000 to 6700 — and it deserved to be caught, because it is
// nonsense: a fox that finds berries has not achieved anything a rabbit
// has not.
//
// Scoring the prey instead keeps every old number exactly where it was
// (grass to a rabbit is still 100, a rabbit to a fox is still 500) and
// prices the new meals honestly. Eating well means eating something big.
//
// A sprout is priced so that panicking is never the efficient play. A
// grass costs three taps and pays 100, which is 33 a tap; a sprout costs
// one tap and pays 25. Feeding properly is always worth more per turn —
// the sprout is there to save a life, not to farm one.
const MEAL_VALUE = { sprout: 25, grass: 100, rabbit: 500, fox: 2000 };

// What to call each meal in the turn line, keyed eater<eaten.
const MEAL_LINE = {
  'rabbit<grass': 'A rabbit grazed',
  'rabbit<sprout': 'A rabbit stripped a sprout',
  'fox<rabbit': 'A fox took a rabbit',
  'fox<grass': 'A fox made do with grass',
  'fox<sprout': 'A fox scraped by on a sprout',
  'wolf<rabbit': 'The wolf took a rabbit',
  'wolf<fox': 'The wolf took your fox'
};

// Plants run down on the same clock. Long enough to be built with, short
// enough that hoarding is not a strategy.
const SPROUT_WITHER_AT = 14;
const GRASS_WITHER_AT = 18;

// Percent of the hand dealt as grass rather than sprouts. Grass shows up
// often enough that a run can get off the ground; any more and sprouts
// stop mattering.
const GRASS_IN_HAND = 22;

const MERGE_AT = { sprout: MERGE_SPROUT, grass: MERGE_GRASS, rabbit: MERGE_RABBIT, fox: MERGE_FOX };

// The ladder. Order matters: each kind grows into the next one.
const GROWS_INTO = {
  sprout: 'grass',
  grass: 'rabbit',
  rabbit: 'fox',
  fox: 'wolf'
  // wolf is the top — it has nothing to grow into, only mouths to feed
};

// WHAT EATS WHAT, and why it is a list.
//
// A real food chain does not get narrower as it climbs, it gets wider: a
// wolf takes hares and foxes and whatever else is slow that day. The
// first version of this game had one `prey` string per animal, which
// made a tidy ladder and a dishonest ecosystem — every rung ate exactly
// the rung below and nothing else.
//
// Widening it changes the puzzle more than it changes the fiction. With
// one prey each, the board only ever asks you to put two things
// together. With a diet, the apex also eats the things you are building
// the next apex out of, so the same board now asks you to keep two
// things APART — and a merge game with a repulsion in it is a different
// game. Grass is the one thing no carnivore wants, which is what makes
// it safe packing material to park beside a hungry wolf.
//
// `diet` is listed cheapest first and read in that order: a wolf beside
// both a rabbit and a fox takes the rabbit. That is how predators
// actually choose — easiest meal wins — and it hands the player a move,
// which is to keep a cheap rabbit in reach as a decoy so the fox
// survives the wolf's next red bar.
// A SPROUT IS ALSO FOOD, and that one entry is what makes this a game
// rather than a treadmill.
//
// The clock is counted in taps, and the player only ever gets one tap.
// So the real question the board asks is: what fraction of your taps
// does one animal cost you? A rabbit wants feeding every 9 turns, and
// while grass was its only food a meal cost three taps to build — a
// third of your entire budget, per rabbit. Three animals was therefore
// 100% of every tap you had, with nothing left to build with, and a
// fourth was arithmetically impossible. Nothing about tapping faster
// helps, because tapping faster is what advances the clock.
//
// Letting the bottom rung of the plant ladder count as a meal drops the
// price of a rescue from three taps to one, and the same board that
// could hold three animals holds five. Measured over 400 runs with a bot
// that plays to keep the chain alive: starvations fell from 3.7 per
// hundred turns to 0.4, animals alive went 2.8 -> 3.4, and the wolf —
// the top rung, previously a rumour — turned up in half of all runs
// instead of a fifth.
//
// It is deliberately the WORST meal on the board (see MEAL_VALUE). The
// point is not that feeding is cheap, it is that a life is always
// saveable in one move if you have a bare square beside it. Doing it
// properly still scores better; the sprout is the fire escape.
//
// It costs nothing in safety, either, because the red-bar rule already
// covers it: nothing is eaten until the eater's bar is red, so sprouts
// parked beside a fed rabbit are as safe as they ever were — and a
// half-built patch of grass beside a hungry one is now its own emergency
// ration rather than a race you lose.
//
// `diet` is preference order, so grass stays first and a rabbit standing
// between both still takes the grass and leaves your sprouts alone.
const ANIMALS = {
  rabbit: { diet: ['grass', 'sprout'], eatAt: RABBIT_EAT_AT, starveAt: RABBIT_STARVE_AT },
  fox: { diet: ['rabbit', 'grass', 'sprout'], eatAt: FOX_EAT_AT, starveAt: FOX_STARVE_AT },
  // The wolf keeps its short menu. It is the standing bill the game is
  // about, and an apex you can save with a sprout is not one.
  wolf: { diet: ['rabbit', 'fox'], eatAt: WOLF_EAT_AT, starveAt: WOLF_STARVE_AT }
};

// Predators settle in ladder order, top down, so a wolf takes its rabbit
// before that rabbit strips a patch of grass on the same turn. Derived
// rather than written out, so the next rung joins by being added above.
const PREDATOR_ORDER = Object.keys(ANIMALS).sort(function (a, b) {
  return rank(b) - rank(a);
});

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
// How fast the ground pushes back is the year's business — see the
// season block below.
const CLEAR_PER_MERGE = 1;  // one growth buys back one dead square

// ---------- The year ----------
//
// A run is one year, and the meadow hardens as it goes. Spring gives the
// stones a long gap and the plants a long life, which is the room a new
// player needs to find the ladder at all; by winter the ground is pushing
// back twice as fast and nothing keeps. Meals are worth more each season,
// so surviving into the hard part is where a score is actually made
// rather than merely accumulated.
//
// The animals' own clocks deliberately do NOT ramp. "An animal eats only
// when its bar is red" is the one rule the player has to be able to trust
// at a glance, and a rule that quietly changes underneath them is worse
// than a hard one.
const SEASON_LENGTH = 25;       // turns per season
const SEASONS = 4;              // spring, summer, autumn, winter — winter then stays

const STONE_EVERY_FIRST = 6;    // spring: a stone every this many turns
const STONE_EVERY_LAST = 2;     // ...winter
const WITHER_BONUS_FIRST = 8;   // spring: plants live this many turns longer
const WITHER_BONUS_LAST = 0;    // ...winter
const SCORE_PER_SEASON = 1;     // meals multiply by 1, 2, 3, 4 across the year

const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'];
// One line each — the strip is one line tall, and the multiplier is
// already on it, so none of these need to restate it.
const SEASON_NOTES = [
  'Stones are rare and growth keeps.',
  'The ground starts to push back.',
  'Stones come faster, growth fades.',
  'Hard ground. Nothing keeps for long.'
];

// 0 in spring, SEASONS-1 from winter on.
function season() {
  return Math.min(SEASONS - 1, Math.floor(state.turn / SEASON_LENGTH));
}

// Walks `from` to `to` across the year, rounded to whole turns.
function seasonal(from, to) {
  if (SEASONS < 2) return to;
  return Math.round(from + (to - from) * (season() / (SEASONS - 1)));
}

function stoneEvery() { return Math.max(1, seasonal(STONE_EVERY_FIRST, STONE_EVERY_LAST)); }
function witherBonus() { return seasonal(WITHER_BONUS_FIRST, WITHER_BONUS_LAST); }
function scoreMultiplier() { return 1 + season() * SCORE_PER_SEASON; }

// A plant's whole life this season. Used by the wither check and by the
// meter, so the bar always means what it looks like it means.
function plantLimit(kind) { return PLANTS[kind].witherAt + witherBonus(); }

const HAND_ODDS = [
  { kind: 'sprout', weight: 100 - GRASS_IN_HAND },
  { kind: 'grass', weight: GRASS_IN_HAND }
];

const SLUG = 'ecosystem-puzzle';

// Bumped whenever the rules or the point values change. A best score set
// under different arithmetic is not a record, it is a leftover, so one
// from an older ruleset is ignored rather than left standing as a target
// that cannot be compared to anything the player can score now.
const RULES_VERSION = 6;

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
    : isPlant(cell.kind) ? plantLimit(cell.kind)
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

// Predators eat top down. A rabbit the wolf takes is a rabbit that does
// not get to strip a patch of grass on the same turn, which is the whole
// reason an apex is worth keeping around at all.
function feedEveryone() {
  const meals = [];
  for (const kind of PREDATOR_ORDER) {
    const cfg = ANIMALS[kind];
    for (let i = 0; i < CELLS; i++) {
      const me = state.cells[i];
      if (!me || me.kind !== kind || me.clock < cfg.eatAt) continue;

      const meal = pickMeal(i, cfg);
      if (!meal) continue;

      state.cells[meal.at] = null;
      me.clock = 0;
      meals.push({ at: i, ate: meal.at, kind: kind, points: MEAL_VALUE[meal.kind], ateKind: meal.kind });
    }
  }
  return meals;
}

// What a hungry animal at `i` reaches for. `diet` is in preference
// order — cheapest first — so the whole rule is: walk the diet, stop at
// the first kind that is actually beside you. Within one kind, take
// whichever is closest to running out, since grass about to wither or a
// rabbit about to starve was lost either way.
// Returns { at, kind } for the square it takes, or null if nothing it
// eats is beside it.
function pickMeal(i, cfg) {
  for (const want of cfg.diet) {
    let target = -1, worst = -1;
    for (const n of neighbours(i)) {
      const p = state.cells[n];
      if (!p || p.kind !== want) continue;
      if (p.clock > worst) { worst = p.clock; target = n; }
    }
    if (target >= 0) return { at: target, kind: want };
  }
  return null;
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
//
// It keeps clear of animals, and that is a fairness rule rather than a
// difficulty one. Taking room is a cost the player can play around;
// taking the last bare square beside a hungry rabbit is an execution
// they cannot, because the only way to feed that rabbit was to build on
// the square the ground just took. Boards where an animal starved with
// nothing but dead ground around it were a third of all starvations, and
// none of them were a move the player got wrong.
//
// Staying away costs the ground almost nothing: it still lands, still
// every stoneEvery turns, just further out. Runs came back the same
// length and the same score — only the unanswerable deaths went.
function surfaceStone() {
  if (state.turn % stoneEvery() !== 0) return null;
  const open = [];
  for (let i = 0; i < CELLS; i++) if (!state.cells[i]) open.push(i);
  if (!open.length) return null;
  // Late on, every bare square may be beside something alive; then the
  // stone lands anyway rather than the ground skipping a turn.
  const away = open.filter(function (i) {
    for (const n of neighbours(i)) {
      const c = state.cells[n];
      if (c && isAnimal(c.kind)) return false;
    }
    return true;
  });
  const from = away.length ? away : open;
  const at = from[(Math.random() * from.length) | 0];
  state.cells[at] = makeTile('stone');
  return { at: at, kind: 'stone' };
}

// Runs last, so anything grazed this turn is already gone and only
// growth nobody came for goes to scrub.
function witherPlants() {
  const gone = [];
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (!c || !isPlant(c.kind) || c.clock < plantLimit(c.kind)) continue;
    gone.push({ at: i, kind: c.kind });
    state.cells[i] = makeTile('scrub');
  }
  return gone;
}

// Several mouths fed on one turn multiply each other: the point of the
// game is a chain that runs, not a single animal kept alive in a corner.
// The season multiplies it again, so a chain still running in winter is
// worth several times the same chain in spring.
function scoreMeals(meals) {
  if (!meals.length) return 0;
  let base = 0;
  for (const m of meals) base += m.points;
  const gained = base * meals.length * scoreMultiplier();
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
  el.goTitle.textContent = 'The meadow filled in ' + SEASON_NAMES[season()];
  el.goScore.textContent = state.score.toLocaleString();
  el.goNote.textContent = endNote();
  el.gameover.hidden = false;
  el.goAgain.focus();
}

function endNote() {
  if (state.score === 0) return 'Nothing ever ate. Grow grass into a rabbit first — animals are the only way to score.';
  if (state.topKind === 'wolf') return 'A wolf. It ate whatever was nearest, and the meadow could not refill behind it.';
  if (state.topKind === 'fox') return 'You raised a fox. Two of them, side by side, bring a wolf.';
  if (state.topKind === 'rabbit') return 'Rabbits came. A fox needs two of them alive and touching.';
  return 'Three touching sprouts make grass, and two patches of grass bring a rabbit.';
}

function turnMessage(grew, meals, deaths, withered, stone, gained) {
  const bits = [];

  if (meals.length) {
    // Name the biggest thing that happened. With diets, WHAT was eaten is
    // the news — a wolf taking a fox is a very different turn from a wolf
    // taking the rabbit you left out for it.
    const who = [];
    const top = meals.slice().sort(function (a, b) { return rank(b.kind) - rank(a.kind); })[0];
    const rest = meals.length - 1;
    who.push(MEAL_LINE[top.kind + '<' + top.ateKind] || 'An animal ate');
    if (rest) who.push(rest === 1 ? 'one more fed' : rest + ' more fed');
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
const spritesFor = {};   // kind -> is every part of its rig loaded?
let spritesReady = false;

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

// Which parts each animal needs. A kind is painted only once every part
// it names has loaded; a kind whose art is missing falls back to its
// inline SVG silhouette on its own, leaving the other kinds painted.
// That is what lets a new rung arrive on the ladder before its art does.
function partsOf(kind) {
  const rig = RIG[kind];
  const keys = [];
  for (const part of rig.parts) {
    if (part[0] !== '@head') keys.push(part[0]);
  }
  for (const face in rig.head) keys.push(rig.head[face]);
  return keys;
}

function loadSprites() {
  const keys = Object.keys(SPRITE_FILES);
  let left = keys.length;
  const settle = function () {
    left -= 1;
    if (left > 0) return;
    // a kind is ready when every part it asks for is in hand
    for (const kind in RIG) {
      spritesFor[kind] = partsOf(kind).every(function (k) { return sprites[k]; });
    }
    spritesReady = true;
    render();
  };
  for (const key of keys) {
    const img = new Image();
    img.onload = function () {
      sprites[key] = { img: shrinkSprite(img, 72), w: img.width, h: img.height };
      settle();
    };
    // a missing file only costs the kinds that wanted it
    img.onerror = settle;
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
  const useSvg = !isAnimal(kind) || !spritesReady || !spritesFor[kind];
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
  sprout: 'sprout', grass: 'grass', rabbit: 'rabbit', fox: 'fox', wolf: 'wolf',
  bones: 'bones, blocked', scrub: 'scrub, blocked', stone: 'stone, blocked'
};

const VITAL_WORD = {
  rabbit: ['starving', 'hungry', 'fed'],
  fox: ['starving', 'hungry', 'fed'],
  wolf: ['starving', 'hungry', 'fed']
};
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
      if (p && ANIMALS[c.kind].diet.indexOf(p.kind) >= 0) risk.add(n);
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
  renderSeason();
  el.goal.textContent = nextGoal();
  el.scoreValue.textContent = state.score.toLocaleString();
  el.bestValue.textContent = state.best.toLocaleString();
}

function setTicker(text) { el.ticker.textContent = text; }

function renderSeason() {
  const s = season();
  el.seasonBar.dataset.season = String(s);
  el.seasonName.textContent = SEASON_NAMES[s] || SEASON_NAMES[SEASON_NAMES.length - 1];
  el.seasonNote.textContent = SEASON_NOTES[s] || '';
  el.seasonMult.textContent = '×' + scoreMultiplier();
  // winter is the last one, so the track sits full rather than restarting
  const within = s >= SEASONS - 1 ? 1 : (state.turn % SEASON_LENGTH) / SEASON_LENGTH;
  el.seasonFill.style.width = Math.round(within * 100) + '%';
}

function countKind(kind) {
  let n = 0;
  for (const c of state.cells) if (c && c.kind === kind) n += 1;
  return n;
}

// One line saying what the board is one step away from. The rules are all
// in the guide, but nobody reads a guide while playing, and a player who
// cannot see the next rung does not know the ladder is there at all.
// Is an animal of this kind within two turns of its red bar with nothing
// it eats beside it? Returns its square, or -1.
function goingHungry(kind) {
  const cfg = ANIMALS[kind];
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (!c || c.kind !== kind || c.clock < cfg.eatAt - 2) continue;
    if (!pickMeal(i, cfg)) return i;
  }
  return -1;
}

// Is a fox sitting beside a wolf that is about to want feeding?
function foxUnderThreat() {
  for (let i = 0; i < CELLS; i++) {
    const c = state.cells[i];
    if (!c || c.kind !== 'wolf' || c.clock < ANIMALS.wolf.eatAt - 2) continue;
    const meal = pickMeal(i, ANIMALS.wolf);
    if (meal && meal.kind === 'fox') return true;
  }
  return false;
}

function nextGoal() {
  const wolf = countKind('wolf'), fox = countKind('fox');
  const rabbit = countKind('rabbit'), grass = countKind('grass');

  if (wolf) {
    if (foxUnderThreat()) return 'Your wolf is about to take your fox. Put a rabbit beside it instead.';
    if (goingHungry('wolf') >= 0) return 'Your wolf needs a rabbit or a fox beside it, or it starves.';
    return 'A fed wolf is most of your score. Keep it in rabbits so it leaves your foxes alone.';
  }

  if (fox) {
    if (fox >= MERGE_FOX) return 'Two foxes side by side bring a wolf.';
    if (goingHungry('fox') >= 0) return 'Your fox needs a rabbit beside it — or grass, or even a sprout.';
    return 'Another fox brings a wolf. Two more rabbits make one.';
  }

  // Hunger outranks the ladder. A player who is one tap from losing a
  // rabbit does not need to be told what two rabbits would make, and the
  // one-tap answer is the thing worth saying out loud, because nothing
  // else on the board teaches it.
  if (rabbit && goingHungry('rabbit') >= 0) {
    return 'A rabbit is starving. A sprout beside it saves it now — grass is worth more if you have it.';
  }

  if (rabbit >= MERGE_RABBIT) return 'Two rabbits side by side draw a fox.';

  // The one rung people get stuck on: a second rabbit. Say how close it is.
  if (rabbit) {
    if (grass >= MERGE_GRASS) return 'Bring your grass together for a second rabbit — then put the two rabbits side by side.';
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
    'goal', 'seasonBar', 'seasonName', 'seasonNote', 'seasonMult', 'seasonFill',
    'gameover', 'goTitle', 'goScore', 'goNote', 'goAgain', 'howBtn', 'newBtn',
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
