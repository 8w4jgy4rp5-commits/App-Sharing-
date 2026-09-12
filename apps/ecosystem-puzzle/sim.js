// ============================================================
// Balance harness — open index.html?sim=1 (add &runs=500 for more samples)
//
// Not part of the game, and not loaded unless the URL asks for it.
//
// A stage's goal and the rules that make the goal possible live in two
// different files' worth of numbers, so every new stage raises the same two
// questions: can it be cleared at all, and how often. Guessing at those cost
// stage 3 a fox that never came. This answers them with numbers: it plays
// every stage many times over with a plain bot and prints a table.
//
// It calls step(dt) directly — no clock, no drawing, no saving — so a
// 110-second stage plays out in roughly ten milliseconds, and a few hundred
// playthroughs are done before you have finished reading this.
// ============================================================

'use strict';

(function () {
  const params = new URLSearchParams(location.search);
  const RUNS = Math.max(1, Math.min(2000, Number(params.get('runs')) || 200));
  const G = CONFIG.gridSize;

  // ---------- the bot ----------
  // Deliberately plain: plant whatever is in hand, on open ground, as far from
  // any fox as it can manage. It is roughly a player who understands the game
  // and is paying attention — not a perfect one. If this bot cannot clear a
  // stage, a person is not going to either.
  function botPlant() {
    while (state.seeds > 0) {
      let best = null;
      let bestScore = -Infinity;
      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
          if (state.cells[y * G + x].kind !== 'EMPTY') continue;
          let foxDist = 99;
          for (const a of state.animals) {
            if (a.type !== 'fox') continue;
            foxDist = Math.min(foxDist, Math.abs(a.x - x) + Math.abs(a.y - y));
          }
          // cap the reward for distance, then jitter, so the bot spreads its
          // planting around instead of stacking every seedling in one corner
          const score = Math.min(foxDist, 10) + Math.random() * 3;
          if (score > bestScore) { bestScore = score; best = { x: x, y: y }; }
        }
      }
      if (!best) return;
      const before = state.seeds;
      plantAt(best.x, best.y);
      if (state.seeds === before) return;   // refused, so stop asking
    }
  }

  // ---------- one playthrough ----------
  function runTrial(stage) {
    resetStage(stage);
    // the harness stands in for the player closing the mission card
    state.started = true;
    state.briefing = false;
    state.paused = false;
    state.tutorialShowing = false;

    const dt = CONFIG.tickMs;
    const limitMs = (stage.timeLimitSec != null ? stage.timeLimitSec : 240) * 1000;
    const firstSeen = {};
    const everSeen = { rabbit: 0, fox: 0 };
    let guard = 0;

    while (!state.cleared && !state.failed && state.gameNow <= limitMs && guard++ < 40000) {
      botPlant();
      step(dt);
      for (const type of ['rabbit', 'fox']) {
        const n = countAnimals(type);
        if (n > everSeen[type]) everSeen[type] = n;
        if (n > 0 && firstSeen[type] == null) firstSeen[type] = state.gameNow;
      }
    }

    const short = stage.conditions
      .filter(function (c) { return !conditionMet(c); })
      .map(function (c) { return c.entity; });

    return {
      cleared: state.cleared,
      atMs: state.gameNow,
      firstSeen: firstSeen,
      everSeen: everSeen,
      short: short
    };
  }

  // ---------- one stage, many playthroughs ----------
  function median(nums) {
    if (!nums.length) return null;
    const sorted = nums.slice().sort(function (a, b) { return a - b; });
    return sorted[Math.floor(sorted.length / 2)];
  }

  function runStage(stage) {
    const clearTimes = [];
    const foxTimes = [];
    const reasons = {};
    for (let i = 0; i < RUNS; i++) {
      const t = runTrial(stage);
      if (t.firstSeen.fox != null) foxTimes.push(t.firstSeen.fox);
      if (t.cleared) {
        clearTimes.push(t.atMs);
        continue;
      }
      // name the failure after the thing that was missing, and say plainly
      // when the thing never turned up at all — that is the broken case
      let why;
      const neverCame = t.short.filter(function (e) {
        return (e === 'rabbit' || e === 'fox') && !t.everSeen[e];
      });
      if (neverCame.length) {
        why = neverCame.map(function (e) { return EMOJI[e]; }).join('') + ' never appeared';
      } else if (t.short.length) {
        why = 'short of ' + t.short.map(function (e) { return EMOJI[e]; }).join('');
      } else {
        why = 'ran out of time';
      }
      reasons[why] = (reasons[why] || 0) + 1;
    }
    return {
      stage: stage,
      clearPct: Math.round((clearTimes.length / RUNS) * 100),
      medianClearMs: median(clearTimes),
      medianFoxMs: median(foxTimes),
      reasons: Object.keys(reasons)
        .map(function (k) { return { why: k, n: reasons[k] }; })
        .sort(function (a, b) { return b.n - a.n; })
    };
  }

  // ---------- the report ----------
  function secs(ms) { return ms == null ? '—' : (ms / 1000).toFixed(0) + 's'; }

  function verdict(r) {
    if (r.clearPct === 0) return { word: 'BROKEN', cls: 'bad' };
    if (r.clearPct < 25) return { word: 'brutal', cls: 'bad' };
    if (r.clearPct < 55) return { word: 'hard', cls: 'warn' };
    if (r.clearPct > 97) return { word: 'a gimme', cls: 'warn' };
    return { word: 'fair', cls: 'good' };
  }

  function render(results, problems, ms) {
    document.body.innerHTML = '';
    document.body.className = 'sim-body';

    const style = document.createElement('style');
    style.textContent = [
      '.sim-body{font:14px/1.6 system-ui,sans-serif;background:#fbfdf6;color:#2f3d22;padding:24px 18px 60px;max-width:820px;margin:0 auto}',
      '.sim-body h1{font-size:20px;margin:0 0 2px}',
      '.sim-body p.sub{color:#6b7a5a;margin:0 0 20px}',
      '.sim-body h2{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7a5a;margin:26px 0 8px}',
      '.sim-body table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}',
      '.sim-body th{text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b7a5a;border-bottom:1px solid #dfe8d2;padding:6px 8px}',
      '.sim-body td{border-bottom:1px solid #eef3e6;padding:8px}',
      '.sim-body td.num{text-align:right;white-space:nowrap}',
      '.sim-body .bar{display:inline-block;height:8px;border-radius:999px;background:#8cc63f;vertical-align:middle;min-width:2px}',
      '.sim-body .good{color:#3f7d20;font-weight:bold}',
      '.sim-body .warn{color:#9a6b00;font-weight:bold}',
      '.sim-body .bad{color:#b3261e;font-weight:bold}',
      '.sim-body ul{margin:0;padding-left:18px}',
      '.sim-body li.err{color:#b3261e}.sim-body li.wrn{color:#9a6b00}',
      '.sim-body .ok{color:#3f7d20}',
      '.sim-body code{background:#eef3e6;border-radius:4px;padding:1px 5px}',
      '.sim-body .why{color:#6b7a5a;font-size:13px}'
    ].join('');
    document.body.appendChild(style);

    const h = document.createElement('h1');
    h.textContent = '🌿 Ecosystem Puzzle — balance harness';
    document.body.appendChild(h);

    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = RUNS + ' bot playthroughs per stage · ' + ms + 'ms total · '
      + 'reload with ' + '?sim=1&runs=500' + ' for a tighter number';
    document.body.appendChild(sub);

    // --- the static checks
    const h2a = document.createElement('h2');
    h2a.textContent = 'Stage self-check';
    document.body.appendChild(h2a);
    if (!problems.length) {
      const ok = document.createElement('p');
      ok.className = 'ok';
      ok.textContent = '✓ every stage goal is reachable under the current spawn rules';
      document.body.appendChild(ok);
    } else {
      const ul = document.createElement('ul');
      for (const pr of problems) {
        const li = document.createElement('li');
        li.className = pr.level === 'error' ? 'err' : 'wrn';
        li.textContent = (pr.level === 'error' ? '✗ ' : '⚠ ') + pr.text;
        ul.appendChild(li);
      }
      document.body.appendChild(ul);
    }

    // --- the playthroughs
    const h2b = document.createElement('h2');
    h2b.textContent = 'Bot playthroughs';
    document.body.appendChild(h2b);

    const table = document.createElement('table');
    const head = document.createElement('tr');
    for (const label of ['Stage', 'Clear rate', '', 'Median clear', 'First 🦊', 'Reads as', 'Why it failed']) {
      const th = document.createElement('th');
      th.textContent = label;
      head.appendChild(th);
    }
    table.appendChild(head);

    for (const r of results) {
      const tr = document.createElement('tr');
      const v = verdict(r);

      const name = document.createElement('td');
      name.textContent = r.stage.id + '. ' + r.stage.name;
      tr.appendChild(name);

      const pct = document.createElement('td');
      pct.className = 'num ' + v.cls;
      pct.textContent = r.clearPct + '%';
      tr.appendChild(pct);

      const bar = document.createElement('td');
      const fill = document.createElement('span');
      fill.className = 'bar';
      fill.style.width = Math.max(2, r.clearPct) + 'px';
      bar.appendChild(fill);
      tr.appendChild(bar);

      const at = document.createElement('td');
      at.className = 'num';
      at.textContent = secs(r.medianClearMs) + ' / ' + (r.stage.timeLimitSec || '∞') + 's';
      tr.appendChild(at);

      const fox = document.createElement('td');
      fox.className = 'num';
      fox.textContent = secs(r.medianFoxMs);
      tr.appendChild(fox);

      const word = document.createElement('td');
      word.className = v.cls;
      word.textContent = v.word;
      tr.appendChild(word);

      const why = document.createElement('td');
      why.className = 'why';
      why.textContent = r.reasons.length
        ? r.reasons.slice(0, 2).map(function (x) {
            return x.why + ' (' + Math.round((x.n / RUNS) * 100) + '%)';
          }).join(', ')
        : '—';
      tr.appendChild(why);

      table.appendChild(tr);
    }
    document.body.appendChild(table);

    const note = document.createElement('p');
    note.className = 'sub';
    note.style.marginTop = '20px';
    note.innerHTML = 'Add a stage to <code>STAGES</code>, reload this page, and read the row. '
      + 'A <b>0%</b> clear rate with &ldquo;never appeared&rdquo; is the bug this harness exists to catch.';
    document.body.appendChild(note);
  }

  // ---------- go ----------
  SIM.on = true;             // no drawing, no logging, no touching the save
  state.paused = true;       // ...and the live tick loop stands down
  const problems = validateStages();
  const t0 = performance.now();
  const results = STAGES.map(runStage);
  const ms = Math.round(performance.now() - t0);
  render(results, problems, ms);
  console.table(results.map(function (r) {
    return {
      stage: r.stage.id + '. ' + r.stage.name,
      clear: r.clearPct + '%',
      median: secs(r.medianClearMs),
      firstFox: secs(r.medianFoxMs),
      top_failure: r.reasons.length ? r.reasons[0].why : '—'
    };
  }));
})();
