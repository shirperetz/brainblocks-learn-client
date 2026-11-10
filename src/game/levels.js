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
 * Makes `count` rounds with `make`: never the same `keyOf` twice in a row, and no repeat at all
 * while the level still has fresh ones (level 1 of the balloons has only 10 different sums).
 */
function series(count, make, keyOf, rand) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < 2000) {
    const r = make(rand);
    const k = keyOf(r);
    if (out.length && keyOf(out[out.length - 1]) === k) continue;
    if (seen.has(k) && guard < 1500) continue;
    seen.add(k);
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

export function dragonRounds(level, rand = Math.random) {
  const cfg = DRAGON[level] ?? DRAGON[1];
  return series(
    DRAGON_ROUNDS,
    (r) => {
      const want = between(r, cfg.want[0], cfg.want[1]);
      const start = cfg.start === "on" ? between(r, Math.max(1, Math.floor(want / 3)), want - 2) : 0;
      return { want, start, frame: cfg.frame };
    },
    (x) => x.want,
    rand,
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

export function balloonRound(level, rand = Math.random) {
  const cfg = BALLOONS[level] ?? BALLOONS[1];
  const op = cfg.ops[Math.floor(rand() * cfg.ops.length)];
  let a, b;
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

/** The answer + 3 different nearby numbers in 0..20, shuffled. */
export function options(answer, rand = Math.random) {
  const set = new Set([answer]);
  const near = shuffle([-1, 1, -2, 2, 3, -3, 4, -4], rand);
  for (const d of near) {
    const v = answer + d;
    if (v >= 0 && v <= 20) set.add(v);
    if (set.size === 4) break;
  }
  return shuffle([...set], rand);
}

export function balloonRounds(level, rand = Math.random) {
  return series(BALLOON_ROUNDS, (r) => balloonRound(level, r), (x) => `${x.a}${x.op}${x.b}`, rand);
}

/** Clip keys for "כמה זה 3 ועוד 2". */
export function balloonSpeech(round) {
  return ["howmuch", `n${round.a}`, round.op === "+" ? "plus" : "minus", `n${round.b}`];
}

/** Text form for the server's mistake log: "3 + 2 = ?" (math is written left-to-right). */
export function balloonText(round) {
  return `${round.a} ${round.op} ${round.b} = ?`;
}
