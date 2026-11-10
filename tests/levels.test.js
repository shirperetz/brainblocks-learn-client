// node --test tests/   (built-in runner, no packages)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dragonRounds, dragonCheck, balloonRounds, options, balloonSpeech, balloonText, LEVELS_PER_GAME,
} from "../src/game/levels.js";
import clips from "../src/game/clips.json" with { type: "json" };

// deterministic random for repeatable tests
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

test("dragon: wants stay in each level's range, start < want, no repeat in a row", () => {
  const ranges = { 1: [1, 5], 2: [3, 10], 3: [5, 10], 4: [4, 10], 5: [11, 20], 6: [8, 20] };
  for (let level = 1; level <= LEVELS_PER_GAME; level++) {
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = dragonRounds(level, seeded(seed));
      assert.equal(rounds.length, 6);
      rounds.forEach((r, i) => {
        assert.ok(r.want >= ranges[level][0] && r.want <= ranges[level][1], `L${level} want ${r.want}`);
        assert.ok(r.start >= 0 && r.start < r.want, `start ${r.start} want ${r.want}`);
        if (level === 4 || level === 6) assert.ok(r.start >= 1 && r.want - r.start >= 2);
        else assert.equal(r.start, 0);
        if (i) assert.notEqual(r.want, rounds[i - 1].want);
        assert.ok(clips[`want${r.want}`], `clip want${r.want}`);
      });
    }
  }
});

test("dragon check", () => {
  assert.equal(dragonCheck({ want: 5 }, 3), "more");
  assert.equal(dragonCheck({ want: 5 }, 6), "less");
  assert.equal(dragonCheck({ want: 5 }, 5), "ok");
});

test("balloons: correct math, ranges, no negatives, 4 distinct options with the answer", () => {
  for (let level = 1; level <= LEVELS_PER_GAME; level++) {
    for (let seed = 1; seed <= 300; seed++) {
      for (const r of balloonRounds(level, seeded(seed))) {
        assert.equal(r.answer, r.op === "+" ? r.a + r.b : r.a - r.b);
        assert.ok(r.answer >= 0 && r.answer <= 20 && r.a >= 1 && r.b >= 1);
        if (level === 1) assert.ok(r.op === "+" && r.answer <= 5);
        if (level === 2) assert.ok(r.op === "+" && r.answer <= 10);
        if (level === 3) assert.ok(r.op === "-" && r.a <= 5 && r.answer >= 1);
        if (level === 4) assert.ok(r.op === "-" && r.a <= 10 && r.answer >= 1);
        if (level === 5) assert.ok(r.answer <= 10);
        if (level === 6) assert.ok(r.op === "+" && r.answer >= 11 && r.answer <= 20 && r.a <= 10 && r.b <= 10);
        assert.equal(r.options.length, 4);
        assert.equal(new Set(r.options).size, 4);
        assert.ok(r.options.includes(r.answer));
        r.options.forEach((o) => assert.ok(o >= 0 && o <= 20));
        balloonSpeech(r).forEach((k) => assert.ok(clips[k], `clip ${k}`));
      }
    }
  }
});

test("options near 0 and 20 still give 4", () => {
  for (const ans of [0, 1, 19, 20]) for (let s = 1; s < 50; s++) assert.equal(new Set(options(ans, seeded(s))).size, 4);
});

test("text form is left-to-right math", () => {
  assert.equal(balloonText({ a: 7, op: "+", b: 9 }), "7 + 9 = ?");
});

test("every clip key has a wav file", async () => {
  const { existsSync } = await import("node:fs");
  for (const k of Object.keys(clips)) assert.ok(existsSync(new URL(`../public/audio/${k}.wav`, import.meta.url)), k);
});

test("balloons level 1: no sum pair twice, answers spread (not mostly 5)", () => {
  let fives = 0, total = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const rounds = balloonRounds(1, seeded(seed));
    const keys = rounds.map((r) => `${r.a}+${r.b}`);
    assert.equal(new Set(keys).size, keys.length, keys.join(","));
    rounds.forEach((r) => { total++; if (r.answer === 5) fives++; });
  }
  assert.ok(fives / total < 0.4, `answer 5 in ${Math.round((100 * fives) / total)}%`);
});
