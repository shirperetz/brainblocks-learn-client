// 2026-11-12: 🕐 אי השעון והכסף - every round solvable, the right answer among 4 distinct options,
// the levels stay in their ranges.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clockRounds, handAngles, timeText, shopRounds, shopCheck, fewestCoins, coinsRounds,
} from "../src/game/levelsClock.js";

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

test("clock: answer among 4 distinct times, minutes as the level says, hands at the right angles", () => {
  const minutes = { 1: [0], 2: [0], 3: [0, 30], 4: [15, 30], 5: [0, 15, 30, 45], 6: [5, 10, 20, 25, 35, 40, 50, 55] };
  for (let level = 1; level <= 6; level++) {
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = clockRounds(level, seeded(seed));
      assert.equal(rounds.length, 8);
      assert.equal(new Set(rounds.map((r) => r.answer)).size, 8, `L${level} repeats`);
      for (const r of rounds) {
        assert.ok(minutes[level].includes(r.m), `L${level} minute ${r.m}`);
        assert.ok(r.h >= 1 && r.h <= 12);
        assert.equal(r.answer, timeText(r.h, r.m));
        assert.equal(r.options.length, 4);
        assert.equal(new Set(r.options).size, 4);
        assert.ok(r.options.includes(r.answer));
        assert.ok(r.options.every((o) => /^(1[0-2]|[1-9]):[0-5][05]$/.test(o)), r.options.join());
      }
    }
  }
  assert.deepEqual(handAngles(3, 0), { hour: 90, minute: 0 });
  assert.deepEqual(handAngles(12, 30), { hour: 15, minute: 180 });
  assert.equal(timeText(9, 5), "9:05");
});

test("shop: price in range, payable with the wallet's coins, check says more / less / ok", () => {
  const range = { 1: [2, 5], 2: [3, 10], 3: [6, 20], 4: [11, 30], 5: [21, 50], 6: [10, 50] };
  for (let level = 1; level <= 6; level++) {
    for (let seed = 1; seed <= 200; seed++) {
      for (const r of shopRounds(level, seeded(seed))) {
        assert.ok(r.price >= range[level][0] && r.price <= range[level][1], `L${level} price ${r.price}`);
        assert.equal(r.prices.reduce((a, b) => a + b, 0), r.price);
        assert.equal(r.items.length, level === 6 ? 2 : 1);
        assert.equal(fewestCoins(r.price, r.coins).reduce((a, b) => a + b, 0), r.price);
        assert.equal(shopCheck(r, r.price), "ok");
        assert.equal(shopCheck(r, r.price - 1), "more");
        assert.equal(shopCheck(r, r.price + 1), "less");
      }
    }
  }
});

test("coins: the answer is the sum (or what's left), among 4 distinct positive options", () => {
  const max = { 1: 5, 2: 10, 3: 15, 4: 30, 5: 50 };
  for (let level = 1; level <= 6; level++) {
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = coinsRounds(level, seeded(seed));
      assert.equal(rounds.length, 8);
      for (const r of rounds) {
        if (level === 6) {
          assert.ok(r.change);
          assert.equal(r.answer, r.had - r.price);
          assert.ok(r.answer >= 1 && r.price >= 1);
        } else {
          assert.equal(r.answer, r.money.reduce((a, b) => a + b, 0));
          assert.ok(r.answer <= max[level], `L${level} sum ${r.answer}`);
          assert.ok(level > 1 || r.money.every((c) => c === 1));
        }
        assert.equal(r.options.length, 4);
        assert.equal(new Set(r.options).size, 4);
        assert.ok(r.options.includes(r.answer));
        assert.ok(r.options.every((o) => o > 0));
      }
    }
  }
});
