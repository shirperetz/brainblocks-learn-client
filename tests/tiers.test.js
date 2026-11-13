// 2026-11-13 (infinite islands): every game at every generated-island tier makes valid rounds,
// and a higher island really asks for bigger numbers than the base island.
import { test } from "node:test";
import assert from "node:assert/strict";
import { balloonRounds, bridgeRounds, dragonRounds, trainRounds, tierCap } from "../src/game/levels.js";
import { clockRounds, coinsRounds, shopRounds } from "../src/game/levelsClock.js";

const GAMES = {
  balloons: { rounds: balloonRounds, big: (r) => Math.max(r.a, r.b, r.answer) },
  bridge: { rounds: bridgeRounds, big: (r) => r.target },
  train: { rounds: trainRounds, big: (r) => Math.max(...r.wagons) },
  coins: { rounds: coinsRounds, big: (r) => r.answer },
  shop: { rounds: shopRounds, big: (r) => r.price },
};

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

test("every round at every tier is valid: the answer is one of 4 different options, no negatives, within the cap", () => {
  for (let tier = 0; tier <= 10; tier++) {
    for (let level = 1; level <= 6; level++) {
      for (const [name, g] of Object.entries(GAMES)) {
        for (const r of g.rounds(level, Math.random, new Set(), tier)) {
          if (r.options) {
            assert.equal(new Set(r.options).size, 4, `${name} t${tier} l${level} options ${r.options}`);
            assert.ok(r.options.includes(r.answer), `${name} t${tier} l${level} answer ${r.answer} not in ${r.options}`);
            assert.ok(r.options.every((v) => v >= 0), `${name} negative ${r.options}`);
          }
          if (name === "train") assert.ok(r.wagons.every((w) => w >= 0 && w <= (tier === 0 ? 100 : tier <= 1 ? 200 : 1000)), `train out of range ${r.wagons}`);
          if (tier > 0 && (name === "balloons" || name === "bridge")) {
            assert.ok(g.big(r) <= tierCap(tier), `${name} t${tier} over the cap: ${g.big(r)}`);
          }
        }
      }
      for (const r of dragonRounds(level, Math.random, new Set(), tier)) {
        assert.ok(r.want >= 1 && r.want <= 20 && r.start >= 0 && r.start < r.want, `dragon t${tier} ${JSON.stringify(r)}`);
      }
      for (const r of clockRounds(level, Math.random, new Set(), tier)) {
        assert.equal(new Set(r.options).size, 4);
        assert.ok(r.options.includes(r.answer));
      }
    }
  }
});

test("a generated island asks for bigger numbers than the base island", () => {
  for (const [name, g] of Object.entries(GAMES)) {
    for (let level = 1; level <= 6; level++) {
      const base = avg(Array.from({ length: 30 }, () => g.rounds(level, Math.random, new Set(), 0)).flat().map(g.big));
      const t3 = avg(Array.from({ length: 30 }, () => g.rounds(level, Math.random, new Set(), 3)).flat().map(g.big));
      assert.ok(t3 > base, `${name} level ${level}: island 3 (${t3.toFixed(1)}) not harder than base (${base.toFixed(1)})`);
    }
  }
  // The clock: island 2+ asks for minutes that are not multiples of 5 from level 4.
  const minutes = clockRounds(5, Math.random, new Set(), 2).map((r) => r.m);
  const odd = Array.from({ length: 20 }, () => clockRounds(5, Math.random, new Set(), 2)).flat().some((r) => r.m % 5 !== 0);
  assert.ok(minutes.length > 0 && odd, "clock tier 2 never asked a single minute");
  // The dragon: no ten-frames from island 2.
  assert.ok(dragonRounds(5, Math.random, new Set(), 2).every((r) => r.frame === false));
});

test("tier 0 is exactly the base island (same rules as before)", () => {
  for (let level = 1; level <= 6; level++) {
    for (const r of balloonRounds(level, Math.random, new Set(), 0)) assert.ok(r.answer <= 20);
    for (const r of bridgeRounds(level, Math.random, new Set(), 0)) assert.ok(r.target <= 20);
  }
});
