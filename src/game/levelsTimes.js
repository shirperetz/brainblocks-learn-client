// ✖️ אי הכפל והחילוק (2026-11-13, ב׳-ג׳). Pure round generators, tested with `node --test tests/`.
//   סלים שווים     - n baskets with k in each: how many in all? (multiplication as equal groups)
//   מחלקים עוגיות  - share fairly: how many each? how many children? (level 6: with a remainder)
//   חלונות בבניין  - an array of windows: count, pick the exercise, find the missing factor

const between = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

/** The answer + 3 wrong ones, the mistakes first (in order), then near numbers. All > 0, all different. */
export function pickOptions(answer, mistakes, rand) {
  const set = new Set([answer]);
  for (const m of mistakes) {
    if (set.size === 4) break;
    if (Number.isInteger(m) && m > 0) set.add(m);
  }
  for (const d of [1, -1, 2, -2, 3, 4, 5]) {
    if (set.size === 4) break;
    if (answer + d > 0) set.add(answer + d);
  }
  return shuffle([...set], rand);
}

export const PICTURE_MAX = 40; // more than this many things on the screen: numbers instead
export const ITEMS = ["🍎", "🍓", "🥚", "⚽", "🌸", "🍪", "⭐", "🐟"];

// ---- סלים שווים ----------------------------------------------------------------------------
export const GROUPS_ROUNDS = 8;
const GROUPS = {
  1: { k: [2], n: [2, 5] },
  2: { k: [5, 10], n: [2, 5] },
  3: { k: [2, 5, 10], n: [2, 10], ex: true },
  4: { k: [3, 4], n: [2, 6], ex: true },
  5: { k: [2, 3, 4, 5, 6, 7, 8, 9, 10], n: [2, 10], ex: true },
  6: { k: [6, 7, 8, 9], n: [6, 9], ex: true },
};

export function groupsRound(level, rand = Math.random, tier = 0) {
  const cfg = GROUPS[level] ?? GROUPS[1];
  let n;
  let k;
  if (tier > 0) {
    // generated islands: all the tables, then two-digit groups (12 × 4)
    n = between(rand, 2, 9);
    k = tier === 1 ? between(rand, Math.max(2, level), 10) : between(rand, 6, Math.min(25, 10 + tier * 2));
  } else {
    n = between(rand, cfg.n[0], cfg.n[1]);
    k = pick(rand, cfg.k);
  }
  const answer = n * k;
  const options = pickOptions(answer, [n + k, answer + k, answer - k, (n + 1) * k, (n - 1) * k], rand);
  return { n, k, item: pick(rand, ITEMS), answer, options, ex: Boolean(cfg.ex || tier > 0), pictures: answer <= PICTURE_MAX };
}

export function groupsRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(GROUPS_ROUNDS, (r) => groupsRound(level, r, tier), (x) => `${x.n}x${x.k}`, rand, avoid);
}

export const groupsText = (r) => `${r.n} סלים, ובכל סל ${r.k}. כמה יש בסך הכל?`;

// ---- מחלקים עוגיות -------------------------------------------------------------------------
export const SHARE_ROUNDS = 8;
const SHARE = {
  1: { kids: [2], each: [1, 5] },
  2: { kids: [2, 5, 10], each: [1, 5] },
  3: { kids: [3, 4], each: [2, 6] },
  4: { kids: [2, 3, 4, 5, 6], each: [2, 6], ex: true },
  5: { kids: [2, 3, 4, 5, 6, 7, 8, 9, 10], each: [2, 10], ex: true, howMany: true },
  6: { kids: [2, 3, 4, 5, 6], each: [2, 8], ex: true, rem: true },
};

/** "4|2" = 4 each, 2 left. */
export const remId = (q, r) => `${q}|${r}`;
export const remLabel = (v) => {
  const [q, r] = String(v).split("|");
  return r === "0" ? `${q}, לא נשאר` : `${q}, נשארו ${r}`;
};

export function shareRound(level, rand = Math.random, tier = 0) {
  const cfg = SHARE[level] ?? SHARE[1];
  const kids = tier > 0 ? between(rand, 2, 10) : pick(rand, cfg.kids);
  const each = tier > 0 ? between(rand, 2, Math.min(30, 8 + tier * 2)) : between(rand, cfg.each[0], cfg.each[1]);
  const withRem = cfg.rem || (tier > 0 && level >= 5 && rand() < 0.5);
  if (withRem) {
    const rem = between(rand, 1, kids - 1);
    const total = kids * each + rem;
    // mistakes: the remainder forgotten (one more each), each and remainder swapped, one less each
    const wrong = [remId(each + 1, 0), remId(rem, each), remId(each - 1, rem + kids), remId(each, rem + 1), remId(each, 0)];
    const set = new Set([remId(each, rem)]);
    for (const w of wrong) {
      const [q, r] = w.split("|").map(Number);
      if (set.size < 4 && q > 0 && r >= 0 && w !== remId(each, rem)) set.add(w);
    }
    return { mode: "rem", kids, each, rem, total, answer: remId(each, rem), options: shuffle([...set], rand), ex: true, pictures: total <= PICTURE_MAX };
  }
  const total = kids * each;
  const howMany = cfg.howMany ? rand() < 0.5 : tier > 0 && rand() < 0.4;
  if (howMany) {
    // "every child gets 4 - how many children?"
    return { mode: "kids", kids, each, rem: 0, total, answer: kids, options: pickOptions(kids, [each, total - each, kids + 1, kids - 1], rand), ex: true, pictures: total <= PICTURE_MAX };
  }
  return { mode: "each", kids, each, rem: 0, total, answer: each, options: pickOptions(each, [total - kids, kids, each + 1, each - 1], rand), ex: Boolean(cfg.ex || tier > 0), pictures: total <= PICTURE_MAX };
}

export function shareRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(SHARE_ROUNDS, (r) => shareRound(level, r, tier), (x) => `${x.mode}:${x.total}:${x.kids}`, rand, avoid);
}

export function shareText(r) {
  if (r.mode === "kids") return `יש ${r.total} עוגיות, וכל ילד מקבל ${r.each}. לכמה ילדים יספיקו?`;
  if (r.mode === "rem") return `${r.total} עוגיות ל-${r.kids} ילדים. כמה יקבל כל ילד, וכמה יישארו?`;
  return `${r.total} עוגיות ל-${r.kids} ילדים. כמה יקבל כל ילד?`;
}

// ---- חלונות בבניין ------------------------------------------------------------------------
export const ARRAYS_ROUNDS = 8;
const ARRAYS = {
  1: { rows: [2, 3], cols: [2, 3, 4, 5], mode: ["count"] },
  2: { rows: [2, 3, 4, 5], cols: [2, 5, 10], mode: ["count"] },
  3: { rows: [2, 3, 4, 5], cols: [2, 3, 4, 5, 6], mode: ["which"] },
  4: { rows: [2, 3, 4, 5, 6], cols: [2, 3, 4, 5, 6], mode: ["count", "which"] },
  5: { rows: [2, 3, 4, 5, 6, 7], cols: [2, 3, 4, 5, 6, 7, 8], mode: ["floors"] },
  6: { rows: [6, 7, 8, 9], cols: [6, 7, 8, 9], mode: ["count", "floors"] },
};

export const ex = (a, b) => `${a} × ${b}`;

export function arraysRound(level, rand = Math.random, tier = 0) {
  const cfg = ARRAYS[level] ?? ARRAYS[1];
  const rows = tier > 0 ? between(rand, 3, Math.min(12, 6 + tier)) : pick(rand, cfg.rows);
  const cols = tier > 0 ? between(rand, 3, Math.min(12, 6 + tier)) : pick(rand, cfg.cols);
  const mode = tier > 0 ? pick(rand, ["count", "which", "floors"]) : pick(rand, cfg.mode);
  const total = rows * cols;
  if (mode === "which") {
    // never the turned-around exercise as a wrong one (cols × rows is right too)
    const wrongs = [`${rows} + ${cols}`, ex(rows, cols + 1), ex(rows + 1, cols), ex(rows, rows === cols ? cols + 2 : rows), `${rows} + ${cols} + ${rows}`];
    const set = new Set([ex(rows, cols)]);
    for (const w of wrongs) if (set.size < 4 && w !== ex(cols, rows)) set.add(w);
    return { mode, rows, cols, total, answer: ex(rows, cols), options: shuffle([...set], rand) };
  }
  if (mode === "floors") {
    return { mode, rows, cols, total, answer: rows, options: pickOptions(rows, [cols, total - cols, rows + 1, rows - 1], rand) };
  }
  return { mode: "count", rows, cols, total, answer: total, options: pickOptions(total, [rows + cols, total + cols, total - cols, total + rows], rand) };
}

export function arraysRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(ARRAYS_ROUNDS, (r) => arraysRound(level, r, tier), (x) => `${x.mode}:${x.rows}x${x.cols}`, rand, avoid);
}

export function arraysText(r) {
  if (r.mode === "which") return `בבניין ${r.rows} קומות ובכל קומה ${r.cols} חלונות. איזה תרגיל מתאים?`;
  if (r.mode === "floors") return `? × ${r.cols} = ${r.total} - בכל קומה ${r.cols} חלונות, ויש ${r.total} חלונות. כמה קומות?`;
  return `בבניין ${r.rows} קומות ובכל קומה ${r.cols} חלונות. כמה חלונות יש?`;
}
