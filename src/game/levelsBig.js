// 🏰 אי המספרים הגדולים (2026-11-13, ג׳: up to 1,000; generated islands up to 10,000 and more).
// Pure round generators, tested with `node --test tests/`.
//   מאות, עשרות, אחדות - base-ten blocks: which number? which picture? what is the digit worth?
//   ישר המספרים         - which number does the arrow show? (level 6: about which)
//   מי גדול יותר?       - the biggest / smallest, < > =, rounding to tens and hundreds

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

function fill4(answer, mistakes, rand, ok = (v) => v >= 0) {
  const set = new Set([answer]);
  for (const m of mistakes) {
    if (set.size === 4) break;
    if (Number.isInteger(m) && ok(m)) set.add(m);
  }
  for (const d of [10, -10, 1, -1, 100, -100, 2, 20]) {
    if (set.size === 4) break;
    if (ok(answer + d)) set.add(answer + d);
  }
  return shuffle([...set], rand);
}

/** 1234 -> "1,234" (how the screen writes big numbers). */
export const fmt = (n) => n.toLocaleString("en-US");

// ---- מאות, עשרות, אחדות ------------------------------------------------------------------------
export const PV_ROUNDS = 8;
export const blocksValue = (b) => (b.th ?? 0) * 1000 + b.h * 100 + b.t * 10 + b.o;
export const blocksId = (b) => `${b.th ?? 0}-${b.h}-${b.t}-${b.o}`;

export function placeValueRound(level, rand = Math.random, tier = 0) {
  const thousands = tier > 0;
  const lv = tier > 0 ? pick(rand, [2, 3, 4, 5, 6].filter((l) => l >= Math.min(level, 5))) : level;
  const th = thousands ? between(rand, 1, Math.min(9, 2 + tier)) : 0;
  if (lv === 5) {
    // "what is the coloured digit worth?" - every digit different, none zero
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand).slice(0, thousands ? 4 : 3);
    const value = Number(digits.join(""));
    const pos = between(rand, 0, digits.length - 1); // from the left
    const power = digits.length - 1 - pos;
    const d = digits[pos];
    const answer = d * 10 ** power;
    const options = fill4(answer, [d, d * 10, d * 100, d * 1000, digits[(pos + 1) % digits.length] * 10 ** power].filter((x) => x !== answer), rand, (v) => v > 0);
    return { mode: "digit", value, pos, digit: d, answer, options };
  }
  let b;
  if (lv === 1) b = { th: 0, h: 0, t: between(rand, 1, 9), o: between(rand, 0, 9) };
  else if (lv === 6) b = { th, h: between(rand, 0, 3), t: between(rand, 10, 19), o: between(rand, 0, 9) }; // more than 9 tens
  else {
    b = { th, h: between(rand, 1, 9), t: between(rand, 1, 9), o: between(rand, 1, 9) };
    if (lv === 3) b[rand() < 0.5 ? "t" : "o"] = 0;
  }
  const value = blocksValue(b);
  if (lv === 4) {
    // the number is written, the child picks the picture
    const wrong = [
      { ...b, t: b.o, o: b.t },
      { ...b, h: b.t, t: b.h },
      { ...b, t: (b.t + 1) % 10 },
      { ...b, o: (b.o + 1) % 10 },
      { ...b, h: (b.h % 9) + 1 },
    ];
    const pool = new Map([[blocksId(b), b]]);
    for (const w of shuffle(wrong, rand)) if (pool.size < 4 && blocksValue(w) !== value) pool.set(blocksId(w), w);
    const list = shuffle([...pool.values()], rand);
    return { mode: "build", blocks: b, value, answer: blocksId(b), options: list.map(blocksId), look: Object.fromEntries(list.map((x) => [blocksId(x), x])) };
  }
  // read: which number is this?
  const base = (b.th ?? 0) * 1000;
  const mistakes = [
    base + b.h * 100 + b.o * 10 + b.t, // tens and ones swapped
    (b.th ?? 0) + b.h + b.t + b.o, // added the blocks
    lv === 3 ? Number(`${b.th || ""}${b.h}${b.t || ""}${b.o || ""}`) : null, // the zero dropped (305 -> 35)
    lv === 6 ? base + b.h * 100 + (b.t % 10) * 10 + b.o : null, // the extra hundred lost (14 tens -> 4 tens)
    lv === 6 ? Number(`${b.h || ""}${b.t}${b.o}`) : null, // written side by side (1 hundred 14 tens 3 -> 1143)
    value + 100,
  ].filter((x) => x !== null && x !== value);
  return { mode: "read", blocks: b, value, answer: value, options: fill4(value, mistakes, rand) };
}

export function placeValueRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(PV_ROUNDS, (r) => placeValueRound(level, r, tier), (x) => `${x.mode}:${x.value}:${x.pos ?? ""}`, rand, avoid);
}

export function placeValueText(r) {
  if (r.mode === "digit") return `כמה שווה הספרה ${r.digit} במספר ${r.value}?`;
  const b = r.blocks;
  const parts = `${b.th ? `${b.th} אלפים, ` : ""}${b.h} מאות, ${b.t} עשרות, ${b.o} אחדות`;
  return r.mode === "build" ? `איזה ציור מראה את המספר ${r.value}?` : `איזה מספר זה? ${parts}`;
}

// ---- ישר המספרים -------------------------------------------------------------------------------
export const LINE_ROUNDS = 8;
const LINE = {
  1: { span: 100, tick: 10, labels: "ends-mid" },
  2: { span: 100, tick: 5, labels: "ends-mid" },
  3: { span: 1000, tick: 100, labels: "ends-mid" },
  4: { span: 100, tick: 10, labels: "ends", offset: true }, // 300-400
  5: { span: 1000, tick: 50, labels: "ends" },
  6: { span: 1000, tick: 100, labels: "ends", estimate: true },
};

export function lineRound(level, rand = Math.random, tier = 0) {
  let cfg = LINE[level] ?? LINE[1];
  if (tier > 0) {
    const big = pick(rand, [
      { span: 10000, tick: 1000, labels: "ends-mid" },
      { span: 10000, tick: 500, labels: "ends" },
      { span: 1000, tick: 100, labels: "ends", offset: true, scale: 10 },
      { span: 10000, tick: 1000, labels: "ends", estimate: true },
    ]);
    cfg = level >= 6 ? { ...big, estimate: true, tick: 1000 } : big;
  }
  const from = cfg.offset ? between(rand, 1, 8) * cfg.span * (cfg.scale ?? 1) : 0;
  const span = cfg.span;
  const to = from + span;
  const steps = span / cfg.tick;
  let at;
  let answer;
  let options;
  if (cfg.estimate) {
    // about: the arrow is between ticks; the options are far apart
    const unit = span / 100;
    at = from + between(rand, 5, 95) * unit;
    answer = at;
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < 4 && guard++ < 200) {
      const v = from + between(rand, 3, 97) * unit;
      if ([...set].every((x) => Math.abs(x - v) >= span * 0.15)) set.add(v);
    }
    options = shuffle([...set], rand);
  } else {
    const i = between(rand, 1, steps - 1);
    at = from + i * cfg.tick;
    answer = at;
    // mistakes: one tick off, ticks counted as 1 (or as 10), counted from the other end
    const wrongTick = cfg.tick === 1 ? 10 : cfg.tick >= 100 ? cfg.tick / 10 : 1;
    options = fill4(answer, [at + cfg.tick, at - cfg.tick, from + i * wrongTick, to - i * cfg.tick, from + i * cfg.tick * 2, at + 2 * cfg.tick, at - 2 * cfg.tick, at + 3 * cfg.tick, at - 3 * cfg.tick], rand, (v) => v >= from && v <= to && v !== from && v !== to);
  }
  const labels = cfg.labels === "ends-mid" ? [from, from + span / 2, to] : [from, to];
  return { from, to, tick: cfg.tick, marks: labels.filter((v) => v !== at), at, answer, options, estimate: Boolean(cfg.estimate) };
}

export function lineRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(LINE_ROUNDS, (r) => lineRound(level, r, tier), (x) => `${x.from}-${x.to}/${x.tick}@${x.at}`, rand, avoid);
}

export const lineText = (r) => `${r.estimate ? "בערך " : ""}איזה מספר מסמן החץ? (ישר מ-${r.from} עד ${r.to}, קפיצות של ${r.tick})`;

// ---- מי גדול יותר? -----------------------------------------------------------------------------
export const BIGGER_ROUNDS = 8;

function sameDigits(rand, count) {
  // numbers made of the same digits - the trap is reading only the first one
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand).slice(0, count);
  const perms = new Set();
  let guard = 0;
  while (perms.size < 4 && guard++ < 100) perms.add(Number(shuffle(digits, rand).join("")));
  while (perms.size < 4) perms.add(Number(digits.join("")) + perms.size);
  return [...perms];
}

export const roundTo = (n, to) => Math.round(n / to) * to;

export function biggerRound(level, rand = Math.random, tier = 0) {
  const digits = tier > 0 ? Math.min(6, 4 + Math.floor(tier / 2)) : level === 1 ? 2 : 3;
  const lv = tier > 0 ? between(rand, Math.max(2, Math.min(level, 5)), 6) : level;
  if (lv <= 3) {
    let nums;
    if (lv === 1) {
      const a = between(rand, 1, 9);
      const b = between(rand, 1, 9);
      nums = [...new Set([a * 10 + b, b * 10 + a, a * 11, a * 10 + ((b + 1) % 10), between(rand, 10, 99)])].slice(0, 3);
      while (nums.length < 3) nums.push(between(rand, 10, 99));
      nums = [...new Set(nums)];
    } else {
      nums = sameDigits(rand, digits);
    }
    const min = lv === 3;
    const answer = min ? Math.min(...nums) : Math.max(...nums);
    return { mode: min ? "min" : "max", nums, answer, options: shuffle(nums, rand) };
  }
  if (lv === 4) {
    const a = between(rand, 10 ** (digits - 1), 10 ** digits - 1);
    const r = rand();
    // equal sometimes; else a near one with the same first digit (the real test)
    const b = r < 0.17 ? a : Math.min(10 ** digits - 1, Math.max(10 ** (digits - 1), a + pick(rand, [-1, 1]) * between(rand, 1, 10 ** (digits - 2) * 9)));
    const answer = a > b ? ">" : a < b ? "<" : "=";
    return { mode: "sign", a, b, answer, options: ["<", "=", ">"] };
  }
  const to = lv === 5 ? 10 : 100;
  let n;
  do n = between(rand, 10 ** (digits - 1) + 1, 10 ** digits - 1);
  while (n % to === 0);
  const answer = roundTo(n, to);
  const down = Math.floor(n / to) * to;
  const up = down + to;
  const options = fill4(answer, [answer === up ? down : up, roundTo(n, to * 10), n - (n % to) + to * 2, down - to], rand, (v) => v > 0 && v !== n);
  return { mode: lv === 5 ? "round10" : "round100", n, to, answer, options };
}

export function biggerRounds(level, rand = Math.random, avoid = new Set(), tier = 0) {
  return series(BIGGER_ROUNDS, (r) => biggerRound(level, r, tier), (x) => `${x.mode}:${x.nums?.join(",") ?? `${x.a ?? x.n}${x.b ?? ""}`}`, rand, avoid);
}

export function biggerText(r) {
  if (r.mode === "max") return `איזה מספר הכי גדול? ${r.nums.join(", ")}`;
  if (r.mode === "min") return `איזה מספר הכי קטן? ${r.nums.join(", ")}`;
  if (r.mode === "sign") return `איזה סימן מתאים? ${r.a} ? ${r.b}`;
  return `עגלו את ${r.n} ל${r.to === 10 ? "עשרת" : "מאה"} הקרובה`;
}
