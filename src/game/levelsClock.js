// 🕐 אי השעון והכסף (2026-11-12, Shir: "more islands for grades 1-3"). Pure round generators for the
// three games - no React, no DOM, tested with `node --test tests/`. `rand` is injectable for tests.
//   מה השעה?  - an analog clock, pick the time (whole hours -> half -> quarters -> 5 minutes)
//   החנות     - pay EXACTLY the price with coins (and bills from level 5)
//   כמה כסף?  - count a pile of money; level 6: what's left after buying (change)

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

/** `count` rounds, never the same key twice (while the level still has fresh ones). */
function series(count, make, keyOf, rand) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < 2000) {
    const r = make(rand);
    const k = keyOf(r);
    if (seen.has(k) && guard < 1500) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

// ---- מה השעה? ---------------------------------------------------------------------------
// minutes = which minute values the level uses. Wrong options are the mistakes children make:
// the hour next to it (reading the short hand late/early), the hands swapped, another minute value.
const CLOCK = {
  1: { minutes: [0], hours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  2: { minutes: [0], hours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], close: true },
  3: { minutes: [0, 30] },
  4: { minutes: [15, 30] },
  5: { minutes: [0, 15, 30, 45] },
  6: { minutes: [5, 10, 20, 25, 35, 40, 50, 55] },
};

export const CLOCK_ROUNDS = 8;

/** "3:05" - always two-digit minutes, read left to right. */
export function timeText(h, m) {
  return `${h}:${String(m).padStart(2, "0")}`;
}

const wrapHour = (h) => ((h - 1 + 12) % 12) + 1;

export function clockRound(level, rand = Math.random) {
  const cfg = CLOCK[level] ?? CLOCK[1];
  const h = between(rand, 1, 12);
  const m = pick(rand, cfg.minutes);
  const answer = timeText(h, m);
  const wrong = [
    timeText(wrapHour(h + 1), m),
    timeText(wrapHour(h - 1), m),
    // hands swapped: the long hand read as the hour (12 -> 12:00 stays out)
    m % 5 === 0 && m !== 0 ? timeText(wrapHour(m / 5), (h % 12) * 5) : null,
    timeText(h, m === 30 ? 0 : 30),
    timeText(h, m === 15 ? 45 : 15),
    timeText(wrapHour(h + 2), m),
    cfg.close ? null : timeText(h, (m + 30) % 60),
  ].filter((t) => t && t !== answer);
  const set = new Set([answer]);
  for (const t of shuffle(wrong, rand)) {
    set.add(t);
    if (set.size === 4) break;
  }
  let extra = 3;
  while (set.size < 4) set.add(timeText(wrapHour(h + extra++), m));
  return { h, m, answer, options: shuffle([...set], rand) };
}

export function clockRounds(level, rand = Math.random) {
  return series(CLOCK_ROUNDS, (r) => clockRound(level, r), (x) => x.answer, rand);
}

/** The angles of the hands, in degrees from 12 o'clock clockwise. */
export function handAngles(h, m) {
  return { hour: ((h % 12) + m / 60) * 30, minute: m * 6 };
}

// ---- money --------------------------------------------------------------------------------
// Israeli coins and the smallest bills. `bill` = drawn as a note, not a coin.
export const MONEY = [
  { v: 1, bill: false },
  { v: 2, bill: false },
  { v: 5, bill: false },
  { v: 10, bill: false },
  { v: 20, bill: true },
  { v: 50, bill: true },
];

const ITEMS = ["🍎", "🍌", "🥛", "🍞", "🧃", "🍦", "🍪", "🧸", "⚽", "📒", "✏️", "🎈", "🧁", "🍫", "🪀", "🖍️"];

// ---- החנות: pay exactly --------------------------------------------------------------------
// coins = what is in the wallet to tap; showTotal = the counter shows the running sum (levels 1-3).
const SHOP = {
  1: { price: [2, 5], coins: [1, 2], showTotal: true },
  2: { price: [3, 10], coins: [1, 2, 5], showTotal: true },
  3: { price: [6, 20], coins: [1, 2, 5, 10], showTotal: true },
  4: { price: [11, 30], coins: [1, 2, 5, 10], showTotal: false },
  5: { price: [21, 50], coins: [1, 2, 5, 10, 20], showTotal: false },
  6: { price: [5, 25], coins: [1, 2, 5, 10, 20], showTotal: false, two: true },
};

export const SHOP_ROUNDS = 6;

export function shopRound(level, rand = Math.random) {
  const cfg = SHOP[level] ?? SHOP[1];
  const items = shuffle(ITEMS, rand).slice(0, cfg.two ? 2 : 1);
  const prices = items.map(() => between(rand, cfg.price[0], cfg.price[1]));
  const price = prices.reduce((a, b) => a + b, 0);
  return { items, prices, price, coins: cfg.coins, showTotal: cfg.showTotal, two: Boolean(cfg.two) };
}

export function shopRounds(level, rand = Math.random) {
  return series(SHOP_ROUNDS, (r) => shopRound(level, r), (x) => `${x.items.join("")}${x.price}`, rand);
}

/** "more" (not enough yet) | "less" (too much) | "ok". */
export function shopCheck(round, paid) {
  if (paid < round.price) return "more";
  if (paid > round.price) return "less";
  return "ok";
}

/** The fewest coins that make `amount` from `coins` (greedy works for 1/2/5/10/20/50). */
export function fewestCoins(amount, coins) {
  const out = [];
  let left = amount;
  for (const v of [...coins].sort((a, b) => b - a)) {
    while (left >= v) {
      out.push(v);
      left -= v;
    }
  }
  return out;
}

// ---- כמה כסף?: count the money; level 6 = change --------------------------------------------
const COINS = {
  1: { coins: [1], count: [2, 5] },
  2: { coins: [1, 2], count: [2, 5], max: 10 },
  3: { coins: [1, 2, 5], count: [2, 5], max: 15 },
  4: { coins: [1, 2, 5, 10], count: [3, 5], max: 30 },
  5: { coins: [1, 2, 5, 10, 20], count: [3, 5], max: 50 },
  6: { change: true },
};

export const COINS_ROUNDS = 8;

/** The answer + 3 different nearby amounts (the mistakes: one coin miscounted, a 2 read as 1...). */
export function moneyOptions(answer, rand = Math.random, max = 100) {
  const set = new Set([answer]);
  for (const d of shuffle([1, -1, 2, -2, 5, -5, 10, -10, 3, -3], rand)) {
    const v = answer + d;
    if (v > 0 && v <= max) set.add(v);
    if (set.size === 4) break;
  }
  return shuffle([...set], rand);
}

export function coinsRound(level, rand = Math.random) {
  const cfg = COINS[level] ?? COINS[1];
  if (cfg.change) {
    // "You had 10 / 20 shekels and bought something for X - how much is left?"
    const had = pick(rand, [10, 10, 20, 20, 50]);
    const price = between(rand, Math.ceil(had * 0.3), had - 1);
    const answer = had - price;
    return { change: true, had, price, item: pick(rand, ITEMS), money: [had], answer, options: moneyOptions(answer, rand, had) };
  }
  let money;
  let guard = 0;
  do {
    money = Array.from({ length: between(rand, cfg.count[0], cfg.count[1]) }, () => pick(rand, cfg.coins));
  } while (cfg.max && money.reduce((a, b) => a + b, 0) > cfg.max && guard++ < 50);
  money.sort((a, b) => b - a); // big first: that's how we count money
  const answer = money.reduce((a, b) => a + b, 0);
  return { change: false, money, answer, options: moneyOptions(answer, rand) };
}

export function coinsRounds(level, rand = Math.random) {
  return series(COINS_ROUNDS, (r) => coinsRound(level, r), (x) => `${x.change ? x.had + "-" + x.price : x.money.join("+")}`, rand);
}
