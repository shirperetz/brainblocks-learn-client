// 🔷 אי הצורות (2026-11-13, Shir: "the 3 missing islands"). Pure round generators - no React, no DOM,
// tested with `node --test tests/`. Every polygon is made HERE as points in a 100x100 box, so the
// drawing is dumb and a test can count its sides (sides = pts.length).
//   איזו צורה?            - find the shape that is said (then rotated, irregular, solids)
//   כמה צלעות, כמה פינות? - count sides / corners; find the shape with N sides
//   מה בא אחר כך?          - continue a pattern of shapes and colours

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

/** Same as the other islands: no repeat in a row / in the level / of what was played lately. */
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

export const COLORS = ["#ff5f6d", "#4aa8ff", "#ffce3a", "#25c685", "#a77bff"];
export const COLOR_NAMES = { "#ff5f6d": "אדום", "#4aa8ff": "כחול", "#ffce3a": "צהוב", "#25c685": "ירוק", "#a77bff": "סגול" };

export const SHAPE_NAMES = {
  circle: "עיגול",
  square: "ריבוע",
  triangle: "משולש",
  rectangle: "מלבן",
  pentagon: "מחומש",
  hexagon: "משושה",
  parallelogram: "מקבילית",
  star: "כוכב",
  cube: "קובייה",
  sphere: "כדור",
  cylinder: "גליל",
  cone: "חרוט",
};

export const SOLIDS = ["cube", "sphere", "cylinder", "cone"];
/** Things that look like each solid ("לאיזה גוף זה דומה?"). */
export const LOOKS_LIKE = {
  cube: [["🎲", "קובייה של משחק"], ["📦", "קופסה"], ["🧊", "קוביית קרח"]],
  sphere: [["⚽", "כדורגל"], ["🏀", "כדורסל"], ["🌍", "כדור הארץ"]],
  cylinder: [["🥫", "קופסת שימורים"], ["🔋", "סוללה"]],
  cone: [["🍦", "גביע גלידה"], ["🚧", "קונוס"]],
};

const r1 = (v) => Math.round(v * 10) / 10;

function rotate(pts, deg, cx = 50, cy = 50) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [r1(cx + (x - cx) * c - (y - cy) * s), r1(cy + (x - cx) * s + (y - cy) * c)]);
}

/** A regular polygon, first corner on top (a triangle points up). */
export function regular(n, radius = 40, rot = 0) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [r1(50 + radius * Math.cos(a)), r1(50 + radius * Math.sin(a))];
  });
  return rotate(pts, rot);
}

function rect(w, h, rot = 0) {
  const x = 50 - w / 2;
  const y = 50 - h / 2;
  return rotate([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], rot);
}

/** A convex polygon with n corners that does not look regular (corners far enough apart to see). */
export function irregular(n, rand) {
  const minGap = (2 * Math.PI) / n / 2.2;
  let angles;
  let guard = 0;
  do {
    angles = Array.from({ length: n }, () => rand() * 2 * Math.PI).sort((a, b) => a - b);
    const gaps = angles.map((a, i) => (i ? a - angles[i - 1] : a + 2 * Math.PI - angles[n - 1]));
    if (gaps.every((g) => g >= minGap && g < Math.PI * 0.95)) break;
  } while (guard++ < 200);
  if (guard >= 200) return regular(n, 40, between(rand, 0, 359));
  return angles.map((a) => {
    const radius = 30 + rand() * 13;
    return [r1(50 + radius * Math.cos(a)), r1(50 + radius * Math.sin(a))];
  });
}

/** Concave shapes children meet: an L (6 sides), an arrow (7), a T (8), a plus (12), a star (10). */
export const CONCAVE = {
  L: [[22, 12], [46, 12], [46, 64], [80, 64], [80, 88], [22, 88]],
  arrow: [[12, 38], [56, 38], [56, 16], [90, 50], [56, 84], [56, 62], [12, 62]],
  T: [[12, 14], [88, 14], [88, 38], [62, 38], [62, 88], [38, 88], [38, 38], [12, 38]],
  plus: [[38, 10], [62, 10], [62, 38], [90, 38], [90, 62], [62, 62], [62, 90], [38, 90], [38, 62], [10, 62], [10, 38], [38, 38]],
  star: (() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const radius = i % 2 ? 18 : 42;
      pts.push([r1(50 + radius * Math.cos(a)), r1(52 + radius * Math.sin(a))]);
    }
    return pts;
  })(),
};

/** Points of a named flat shape (circle: none). size 0.6-1, rot in degrees. */
export function shapePts(kind, rot = 0, size = 1) {
  const s = (pts) => pts.map(([x, y]) => [r1(50 + (x - 50) * size), r1(50 + (y - 50) * size)]);
  switch (kind) {
    case "square":
      return s(rect(66, 66, rot));
    case "rectangle":
      return s(rect(84, 46, rot));
    case "triangle":
      return s(regular(3, 44, rot));
    case "pentagon":
      return s(regular(5, 42, rot));
    case "hexagon":
      return s(regular(6, 42, rot));
    case "star":
      return s(rotate(CONCAVE.star, rot));
    case "parallelogram":
      return s(rotate([[26, 28], [92, 28], [74, 72], [8, 72]], rot));
    default:
      return null;
  }
}

function look(kind, rand, { rotate: rot = false, colors = true } = {}) {
  const size = 0.65 + rand() * 0.35;
  const deg = rot ? pick(rand, kind === "triangle" ? [180, 90, 30, 200] : kind === "rectangle" ? [90, 20, 160] : [20, 35, 15, 30]) : 0;
  return { kind, pts: shapePts(kind, deg, size), r: kind === "circle" ? r1(40 * size) : undefined, fill: colors ? pick(rand, COLORS) : "#4aa8ff" };
}

// ---- איזו צורה? ---------------------------------------------------------------------------
export const SHAPE_NAME_ROUNDS = 8;
const FLAT1 = ["circle", "square", "triangle"];
const FLAT2 = ["circle", "square", "triangle", "rectangle"];
const FLAT4 = ["circle", "square", "triangle", "rectangle", "pentagon", "hexagon"];

/** Options for "find the X": X + 3 other kinds; asked for a rectangle, no square (a square IS one). */
function kindOptions(target, pool, rand) {
  // asked for a rectangle: no square (it IS one), but a slanted parallelogram - close, and not one
  const others = shuffle(pool.filter((k) => k !== target && !(target === "rectangle" && k === "square")), rand);
  if (target === "rectangle" && !others.includes("parallelogram")) others.unshift("parallelogram");
  return shuffle([target, ...others.slice(0, 3)], rand);
}

export function shapeNameRound(level, rand = Math.random, tier = 0) {
  const lv = tier > 0 ? between(rand, Math.max(3, Math.min(level, 6)), 6) : level;
  if (lv === 6) {
    // solids: "where is the cone?" or "what does 🍦 look like?"
    const target = pick(rand, SOLIDS);
    const like = rand() < 0.5;
    const [emoji, thing] = pick(rand, LOOKS_LIKE[target]);
    const kinds = shuffle(SOLIDS, rand);
    const options = kinds.map((_, i) => `o${i}`);
    const lookMap = {};
    const labels = {};
    kinds.forEach((k, i) => {
      lookMap[`o${i}`] = { kind: k, fill: pick(rand, COLORS) };
      labels[`o${i}`] = SHAPE_NAMES[k];
    });
    return { mode: like ? "like" : "find", target, emoji, thing, options, look: lookMap, labels, answer: options[kinds.indexOf(target)] };
  }
  if (lv === 5) {
    // irregular: a triangle is any 3 sides; asked among other irregular polygons
    const target = pick(rand, ["triangle", "triangle", "pentagon", "hexagon", "square"]);
    const n = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 }[target];
    const sides = shuffle([3, 4, 5, 6, 7].filter((x) => x !== n), rand).slice(0, 3);
    const all = shuffle([n, ...sides], rand);
    const options = all.map((_, i) => `o${i}`);
    const lookMap = {};
    const labels = {};
    all.forEach((m, i) => {
      // "square" on this level stays a real (rotated) square - the others are any 4-gon
      const pts = m === 4 && target === "square" ? shapePts("square", between(rand, 10, 40), 0.85) : irregular(m, rand);
      lookMap[`o${i}`] = { kind: "poly", pts, fill: pick(rand, COLORS) };
      labels[`o${i}`] = `${m} צלעות`;
    });
    return { mode: "find", target, options, look: lookMap, labels, answer: options[all.indexOf(n)] };
  }
  const pool = lv >= 4 ? FLAT4 : lv >= 2 ? FLAT2 : FLAT1;
  const target = pick(rand, pool);
  const kinds = kindOptions(target, lv === 1 ? FLAT2 : pool, rand);
  const options = kinds.map((_, i) => `o${i}`);
  const lookMap = {};
  const labels = {};
  kinds.forEach((k, i) => {
    lookMap[`o${i}`] = look(k, rand, { rotate: lv >= 3, colors: lv >= 2 });
    labels[`o${i}`] = SHAPE_NAMES[k];
  });
  return { mode: "find", target, options, look: lookMap, labels, answer: options[kinds.indexOf(target)] };
}

export function shapeNameRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(
    SHAPE_NAME_ROUNDS,
    (r) => shapeNameRound(level, r, tier),
    (x) => `${x.mode}:${x.target}:${x.emoji ?? ""}:${x.options.map((o) => x.labels[o]).join(",")}`,
    rand,
    avoid,
  );
}

export function shapeNameSpeech(r) {
  return [r.mode === "like" ? "solid_like" : `shape_find_${r.target}`];
}

export function shapeNameText(r) {
  return r.mode === "like" ? `לאיזה גוף דומה ${r.thing}?` : `איפה ה${SHAPE_NAMES[r.target]}?`;
}

// ---- כמה צלעות, כמה פינות? ------------------------------------------------------------------
export const SIDES_ROUNDS = 8;

/** Wrong counts children give: one more / one less (counted a side twice / missed one). */
export function countOptions(answer, rand) {
  const set = new Set([answer]);
  for (const d of shuffle([-1, 1, 2, -2, 3], rand)) {
    if (answer + d >= 0) set.add(answer + d);
    if (set.size === 4) break;
  }
  let extra = answer + 4;
  while (set.size < 4) set.add(extra++);
  return shuffle([...set], rand);
}

export function sidesRound(level, rand = Math.random, tier = 0) {
  const lv = tier > 0 ? between(rand, Math.max(4, Math.min(level, 6)), 6) : level;
  if (lv === 5) {
    const top = tier > 0 ? Math.min(10, 6 + tier) : 6;
    const n = between(rand, 3, top);
    const others = shuffle(Array.from({ length: top + 1 - 3 }, (_, i) => i + 3).filter((m) => m !== n), rand).slice(0, 3);
    const all = shuffle([n, ...others], rand);
    const options = all.map((_, i) => `o${i}`);
    const lookMap = {};
    const labels = {};
    all.forEach((m, i) => {
      lookMap[`o${i}`] = { kind: "poly", pts: irregular(m, rand), fill: pick(rand, COLORS) };
      labels[`o${i}`] = `${m} צלעות`;
    });
    return { mode: "find", n, options, look: lookMap, labels, answer: options[all.indexOf(n)] };
  }
  const ask = lv === 2 ? "corners" : lv === 1 ? "sides" : pick(rand, ["sides", "corners"]);
  let shape;
  if (lv <= 2) shape = look(pick(rand, ["triangle", "square", "rectangle"]), rand, { rotate: false });
  else if (lv === 3) shape = look(pick(rand, ["triangle", "square", "pentagon", "hexagon", "rectangle"]), rand, { rotate: true });
  else if (lv === 4) {
    const top = tier > 0 ? Math.min(12, 8 + tier) : 8;
    shape = { kind: "poly", pts: irregular(between(rand, 3, top), rand), fill: pick(rand, COLORS) };
  } else {
    // level 6: concave shapes, and the circle (no corners, no straight sides)
    const which = pick(rand, tier > 0 ? ["L", "arrow", "T", "plus", "star"] : ["L", "arrow", "T", "star", "circle"]);
    shape = which === "circle" ? { kind: "circle", r: 40, fill: pick(rand, COLORS) } : { kind: "poly", pts: CONCAVE[which], fill: pick(rand, COLORS), name: which };
  }
  const circle = shape.kind === "circle";
  const answer = circle ? 0 : shape.pts.length;
  return { mode: "count", ask: circle ? "corners" : ask, shape, answer, options: countOptions(answer, rand) };
}

export function sidesRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(
    SIDES_ROUNDS,
    (r) => sidesRound(level, r, tier),
    (x) => (x.mode === "find" ? `find:${x.n}:${x.options.map((o) => x.labels[o]).join(",")}` : `${x.ask}:${x.shape.kind}:${x.shape.name ?? ""}:${x.answer}:${x.shape.fill}`),
    rand,
    avoid,
  );
}

export function sidesSpeech(r) {
  if (r.mode === "find") return [`sides_find_${r.n}`];
  return [r.ask === "corners" ? "corners_q" : "sides_q"];
}

export function sidesText(r) {
  if (r.mode === "find") return `איפה הצורה עם ${r.n} צלעות?`;
  return r.ask === "corners" ? "כמה פינות (קודקודים) יש לצורה?" : "כמה צלעות יש לצורה?";
}

// ---- מה בא אחר כך? --------------------------------------------------------------------------
export const PATTERN_ROUNDS = 8;
const P_KINDS = ["circle", "square", "triangle", "star", "hexagon"];

/** One item of a pattern, with its points ready to draw. */
export function token(kind, fill, rot = 0, size = 1) {
  return { kind, fill, rot, size, pts: shapePts(kind, rot, size * 0.9), r: kind === "circle" ? r1(36 * size) : undefined };
}
export const tokenId = (t) => `${t.kind}.${t.fill}.${t.rot}.${t.size}`;

export function tokenText(t) {
  const size = t.size < 0.7 ? " קטן" : t.size > 0.9 ? " גדול" : "";
  return `${SHAPE_NAMES[t.kind]} ${COLOR_NAMES[t.fill] ?? ""}${size}${t.rot ? " מסובב" : ""}`.trim();
}

export function patternRound(level, rand = Math.random, tier = 0) {
  const lv = tier > 0 ? between(rand, Math.max(4, Math.min(level, 6)), 6) : level;
  const len = tier > 1 ? 8 : 7;
  let seq;
  if (lv <= 4) {
    const coreLen = lv === 1 ? 2 : lv === 2 ? 3 : lv === 3 ? 3 : 4;
    const kinds = shuffle(P_KINDS, rand);
    const colors = shuffle(COLORS, rand);
    const distinct = lv === 1 ? [0, 1] : lv === 2 ? pick(rand, [[0, 0, 1], [0, 1, 1]]) : lv === 3 ? [0, 1, 2] : pick(rand, [[0, 0, 1, 1], [0, 1, 0, 2], [0, 1, 2, 2]]);
    const core = distinct.slice(0, coreLen).map((d) => token(kinds[d], colors[d]));
    seq = Array.from({ length: len }, (_, i) => core[i % core.length]);
  } else if (lv === 5) {
    // shape and colour repeat on their own: shapes every 2, colours every 3 (or the other way)
    const [pk, pc] = pick(rand, [[2, 3], [3, 2]]);
    const kinds = shuffle(P_KINDS, rand).slice(0, pk);
    const colors = shuffle(COLORS, rand).slice(0, pc);
    seq = Array.from({ length: len }, (_, i) => token(kinds[i % pk], colors[i % pc]));
  } else {
    // turning or growing
    const fill = pick(rand, COLORS);
    if (rand() < 0.5) {
      // only a triangle: a turned square/star/hexagon can look exactly like the one before
      seq = Array.from({ length: len }, (_, i) => token("triangle", fill, (i % 4) * 90));
    } else {
      const kind = pick(rand, ["circle", "square", "triangle", "hexagon"]);
      const sizes = [0.55, 0.8, 1];
      seq = Array.from({ length: len }, (_, i) => token(kind, fill, 0, sizes[i % 3]));
    }
  }
  const gap = lv <= 3 ? len - 1 : between(rand, 2, len - 1);
  const right = seq[gap];
  // Wrong items: the ones next to it in the pattern, and the right shape in the wrong colour / turn / size.
  const cands = [...new Map(seq.map((t) => [tokenId(t), t])).values()];
  const mutate = [
    token(right.kind, pick(rand, COLORS.filter((c) => c !== right.fill)), right.rot, right.size),
    token(pick(rand, P_KINDS.filter((k) => k !== right.kind)), right.fill, 0, right.size),
    right.kind === "triangle" ? token(right.kind, right.fill, (right.rot + 90) % 360, right.size) : null,
    // another size only when the pattern itself is about size (in a row every item looks small)
    new Set(seq.map((t) => t.size)).size > 1 ? token(right.kind, right.fill, right.rot, right.size === 1 ? 0.55 : 1) : null,
  ];
  const pool = new Map([[tokenId(right), right]]);
  for (const t of shuffle([...cands, ...mutate], rand)) {
    if (pool.size === 4) break;
    if (!t) continue;
    // a turned circle looks the same - never an option that can't be told apart
    if (t.kind === "circle" && t.rot) continue;
    pool.set(tokenId(t), t);
  }
  let guard = 0;
  while (pool.size < 4 && guard++ < 50) {
    const t = token(pick(rand, P_KINDS), pick(rand, COLORS), 0, right.size);
    if (t.kind === right.kind && t.fill === right.fill) continue;
    pool.set(tokenId(t), t);
  }
  const list = shuffle([...pool.values()], rand);
  const options = list.map(tokenId);
  const lookMap = Object.fromEntries(list.map((t) => [tokenId(t), t]));
  const labels = Object.fromEntries(list.map((t) => [tokenId(t), tokenText(t)]));
  return { seq, gap, options, look: lookMap, labels, answer: tokenId(right) };
}

export function patternRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(PATTERN_ROUNDS, (r) => patternRound(level, r, tier), (x) => `${x.seq.map(tokenId).join("|")}@${x.gap}`, rand, avoid);
}

export function patternText(r) {
  return `מה בא במקום סימן השאלה? ${r.seq.map((t, i) => (i === r.gap ? "?" : tokenText(t))).join(", ")}`;
}
