// Round generators for the island games (2026-11-10). Pure functions: no React, no DOM,
// tested with `node --test tests/` (no extra packages). `rand` is injectable for tests.

export const LEVELS_PER_GAME = 6; // must match ProgressService.STAGES_PER_TOPIC on the server

const between = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Makes `count` rounds with `make`: never the same `keyOf` twice in a row, no repeat at all while the
 * level still has fresh ones, and (2026-11-12, Shir: "no repeating the same questions - an endless
 * pool") nothing this child got recently on this device (`avoid`) while fresh ones exist.
 * Each round gets its key as `_key`, so the game can remember it.
 */
function series(count, make, keyOf, rand, avoid = new Set()) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < 3000) {
    const r = make(rand);
    const k = keyOf(r);
    if (out.length && keyOf(out[out.length - 1]) === k) continue;
    if (seen.has(k) && guard < 2500) continue;
    if (avoid.has(k) && guard < 1500) continue;
    seen.add(k);
    r._key = k;
    out.push(r);
  }
  return out;
}

// ---- הדרקון הרעב: counting, then counting on ----------------------------------------
// want  = how many the dragon asks for (spoken + shown as a number and dots)
// start = berries already on the plate (levels 4 and 6: "count on" from there)
// frame = show the plate as ten-frames (groups of 5/10 help counting)
const DRAGON = {
  1: { want: [1, 5], start: null, frame: false },
  2: { want: [3, 10], start: null, frame: false },
  3: { want: [5, 10], start: null, frame: true },
  4: { want: [4, 10], start: "on", frame: true },
  5: { want: [11, 20], start: null, frame: true },
  6: { want: [8, 20], start: "on", frame: true },
};

export const DRAGON_ROUNDS = 6;

/**
 * 2026-11-13 (infinite islands): `tier` = which generated island (0 = the base island). The dragon
 * stays within 20 (the berries must fit on the screen) but gets harder: the level above, no
 * ten-frames from tier 2, and "count on" from a plate that already has berries.
 */
function dragonCfg(level, tier) {
  const base = DRAGON[level] ?? DRAGON[1];
  if (!tier) return base;
  const up = DRAGON[Math.min(6, level + 1 + Math.floor(tier / 2))];
  return { want: up.want, start: level % 2 === 0 || tier >= 3 ? "on" : up.start, frame: tier < 2 ? up.frame : false };
}

export function dragonRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  const cfg = dragonCfg(level, tier);
  return series(
    DRAGON_ROUNDS,
    (r) => {
      const want = between(r, cfg.want[0], cfg.want[1]);
      const start = cfg.start === "on" ? between(r, Math.max(1, Math.floor(want / 3)), want - 2) : 0;
      return { want, start, frame: cfg.frame };
    },
    (x) => x.want,
    rand,
    avoid,
  );
}

/** "more" | "less" | "ok" for what is on the plate now. */
export function dragonCheck(round, onPlate) {
  if (onPlate < round.want) return "more";
  if (onPlate > round.want) return "less";
  return "ok";
}

// ---- בלונים: + and - with pictures ----------------------------------------------------
const BALLOONS = {
  1: { ops: ["+"], max: 5 },
  2: { ops: ["+"], max: 10 },
  3: { ops: ["-"], max: 5 },
  4: { ops: ["-"], max: 10 },
  5: { ops: ["+", "-"], max: 10 },
  6: { ops: ["+"], max: 20, bridge: true }, // 8+5: crossing ten
};

export const BALLOON_ROUNDS = 8;

/** The biggest number on generated island `tier`: 100 for the first four, then 1,000. */
export function tierCap(tier) {
  return tier <= 4 ? 100 : 1000;
}

export function balloonRound(level, rand = Math.random, tier = 0) {
  const cfg = BALLOONS[level] ?? BALLOONS[1];
  const op = cfg.ops[Math.floor(rand() * cfg.ops.length)];
  let a, b;
  if (tier > 0) {
    // 2026-11-13 (infinite islands): the same kinds, bigger numbers - growing with every island
    // up to 100 (then 1,000).
    const max = Math.min(tierCap(tier), Math.round(Math.max(cfg.max, 10) * (1 + tier)));
    if (op === "+") {
      const sum = between(rand, Math.max(3, Math.floor(max / 3)), max);
      a = between(rand, 1, sum - 1);
      b = sum - a;
    } else {
      a = between(rand, Math.max(3, Math.floor(max / 3)), max);
      b = between(rand, 1, a - 1);
    }
    const answer = op === "+" ? a + b : a - b;
    return { a, op, b, answer, options: options(answer, rand, tierCap(tier)) };
  }
  if (op === "+") {
    if (cfg.bridge) {
      a = between(rand, 5, 10);
      b = between(rand, 11 - a, Math.min(10, 20 - a)); // sum 11..20
    } else {
      const sum = between(rand, 2, cfg.max); // the answer first, so small and big answers are equally likely
      a = between(rand, 1, sum - 1);
      b = sum - a;
    }
  } else {
    a = between(rand, 2, cfg.max);
    b = between(rand, 1, a - 1); // answer is 1..a-1: never negative, never zero
  }
  const answer = op === "+" ? a + b : a - b;
  return { a, op, b, answer, options: options(answer, rand) };
}

/**
 * The answer + 3 different nearby numbers in 0..max, shuffled. Above 20 the mistakes are the real
 * ones of bigger numbers too: a forgotten carry (±10), one off (±1).
 */
export function options(answer, rand = Math.random, max = 20) {
  const set = new Set([answer]);
  const near = shuffle(answer > 20 ? [-1, 1, -10, 10, 2, -2, 11, -9, 100, -100] : [-1, 1, -2, 2, 3, -3, 4, -4], rand);
  for (const d of near) {
    const v = answer + d;
    if (v >= 0 && v <= max) set.add(v);
    if (set.size === 4) break;
  }
  for (let d = 5; set.size < 4; d++) set.add(answer + d <= max ? answer + d : Math.max(0, answer - d));
  return shuffle([...set], rand);
}

export function balloonRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(BALLOON_ROUNDS, (r) => balloonRound(level, r, tier), (x) => `${x.a}${x.op}${x.b}`, rand, avoid);
}

/** Clip keys for "כמה זה 3 ועוד 2". */
export function balloonSpeech(round) {
  return ["howmuch", `n${round.a}`, round.op === "+" ? "plus" : "minus", `n${round.b}`];
}

/** Text form for the server's mistake log: "3 + 2 = ?" (math is written left-to-right). */
export function balloonText(round) {
  return `${round.a} ${round.op} ${round.b} = ?`;
}

// ---- הגשר: completing to 10 (2026-11-11) -------------------------------------------------
// A bridge of `target` planks with `have` already in place; the child picks how many are missing.
// eq = also show it as "7 + ? = 10" (level 6). Level 1 builds to 5, 2-4 to 10, 5 to 20.
const BRIDGE = {
  1: { target: [5], have: [1, 4] },
  2: { target: [10], have: [5, 9] },
  3: { target: [10], have: [1, 9] },
  4: { target: [10], have: [1, 9], eq: true },
  5: { target: [20], have: [10, 19] },
  6: { target: [10, 20], have: null, eq: true },
};

export const BRIDGE_ROUNDS = 8;

/** 2026-11-13: generated islands complete to round tens, then 100, then hundreds up to 1,000. */
function bridgeTargets(level, tier) {
  if (tier <= 1) return [20, 30, 40, 50];
  if (tier <= 3) return level <= 3 ? [50, 60, 70, 80, 90] : [100];
  if (tier <= 5) return [100];
  return level <= 3 ? [100, 200, 500] : [1000];
}

export function bridgeRound(level, rand = Math.random, tier = 0) {
  if (tier > 0) {
    const targets = bridgeTargets(level, tier);
    const target = targets[Math.floor(rand() * targets.length)];
    // A higher level = less already on the bridge = a bigger missing part.
    const lo = Math.max(1, Math.round(target * (0.75 - level * 0.1)));
    const have = between(rand, lo, target - 1);
    const answer = target - have;
    return { target, have, answer, eq: true, options: options(answer, rand, target) };
  }
  const cfg = BRIDGE[level] ?? BRIDGE[1];
  const target = cfg.target[Math.floor(rand() * cfg.target.length)];
  const [lo, hi] = cfg.have ?? (target === 20 ? [10, 19] : [1, 9]);
  const have = between(rand, lo, hi);
  const answer = target - have;
  return { target, have, answer, eq: Boolean(cfg.eq), options: options(answer, rand) };
}

export function bridgeRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(BRIDGE_ROUNDS, (r) => bridgeRound(level, r, tier), (x) => `${x.have}/${x.target}`, rand, avoid);
}

/** "על הגשר יש שבעה קרשים. כמה חסרים עד עשר?" */
export function bridgeSpeech(round) {
  return ["bridge_has", `n${round.have}`, "bridge_missing_to", `n${round.target}`];
}

export function bridgeText(round) {
  return `${round.have} + ? = ${round.target}`;
}

// ---- הרכבת: the order of numbers (2026-11-11) ---------------------------------------------
// Wagons with a sequence, one wagon is "?". step<0 = counting down.
const TRAIN = {
  1: { from: [1, 5], step: 1, len: 5, gap: "end", max: 10 },
  2: { from: [1, 6], step: 1, len: 5, gap: "middle", max: 10 },
  3: { from: [5, 15], step: 1, len: 5, gap: "any", max: 20 },
  4: { from: [6, 20], step: -1, len: 5, gap: "any", max: 20 },
  5: { from: [0, 6], step: 2, len: 5, gap: "any", max: 20, even: true },
  6: { from: [1, 5], step: 10, len: 5, gap: "any", max: 100, tens: true },
};

export const TRAIN_ROUNDS = 8;

/** 2026-11-13: generated islands - bigger steps, counting down, bigger numbers. */
function trainTierCfg(level, tier) {
  // Only numbers on the wagons (no pictures), so the train goes higher than the others: 200, then 1,000.
  const steps = tier <= 1 ? [2, 5, 10, -2, -5, 10] : tier <= 4 ? [3, 4, 5, 10, -5, 20] : [25, 50, 100, -10, -25, 11];
  const step = steps[(level - 1) % steps.length];
  const max = tier <= 1 ? 200 : 1000;
  const top = Math.max(1, max - Math.abs(step) * 4); // the whole train stays within max
  return { step, len: 5, gap: level <= 2 ? "middle" : "any", max, from: [Math.min(top, Math.floor(max / 5)), top] };
}

export function trainRound(level, rand = Math.random, tier = 0) {
  if (tier > 0) {
    const cfg = trainTierCfg(level, tier);
    let start = between(rand, cfg.from[0], cfg.from[1]);
    if (cfg.step < 0) start += Math.abs(cfg.step) * (cfg.len - 1); // counting down stays at 0 or above
    const wagons = Array.from({ length: cfg.len }, (_, i) => start + i * cfg.step);
    const gap = cfg.gap === "middle" ? between(rand, 1, cfg.len - 2) : between(rand, 0, cfg.len - 1);
    const answer = wagons[gap];
    return { wagons, gap, answer, step: cfg.step, options: trainOptions(answer, cfg, rand) };
  }
  const cfg = TRAIN[level] ?? TRAIN[1];
  let start = between(rand, cfg.from[0], cfg.from[1]);
  if (cfg.even) start -= start % 2;
  if (cfg.tens) start *= 10;
  const wagons = Array.from({ length: cfg.len }, (_, i) => start + i * cfg.step);
  const gap =
    cfg.gap === "end" ? cfg.len - 1 : cfg.gap === "middle" ? between(rand, 1, cfg.len - 2) : between(rand, 0, cfg.len - 1);
  const answer = wagons[gap];
  return { wagons, gap, answer, step: cfg.step, options: cfg.tens ? tensOptions(answer, rand) : trainOptions(answer, cfg, rand) };
}

/** Wrong answers children really pick: one off (forgot the order), a step off (skipped a wagon). */
function trainOptions(answer, cfg, rand) {
  const s = Math.abs(cfg.step);
  const set = new Set([answer]);
  for (const d of shuffle([s, -s, 1, -1, 2 * s, -2 * s, 2, -2, 3, -3], rand)) {
    const v = answer + d;
    if (v >= 0 && v <= cfg.max) set.add(v);
    if (set.size === 4) break;
  }
  for (let d = 4; set.size < 4; d++) set.add(answer + d <= cfg.max ? answer + d : Math.max(0, answer - d));
  return shuffle([...set], rand);
}

function tensOptions(answer, rand) {
  const set = new Set([answer]);
  for (const d of shuffle([10, -10, 1, -1, 20, -20, 5], rand)) {
    const v = answer + d;
    if (v > 0 && v <= 100) set.add(v);
    if (set.size === 4) break;
  }
  return shuffle([...set], rand);
}

export function trainRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(TRAIN_ROUNDS, (r) => trainRound(level, r, tier), (x) => x.wagons.join(","), rand, avoid);
}

/** "איזה מספר חסר ברכבת?" - then the wagons are read, the missing one as "מה?". */
export function trainSpeech(round) {
  return ["train_q", ...round.wagons.map((n, i) => (i === round.gap ? "train_blank" : `n${n}`))];
}

export function trainText(round) {
  return round.wagons.map((n, i) => (i === round.gap ? "?" : n)).join(", ");
}
