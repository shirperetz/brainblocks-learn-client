// 2026-11-11: הגשר + הרכבת - every round solvable, right answer among 4 distinct options, voice clips exist.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bridgeRounds, bridgeSpeech, bridgeText, trainRounds, trainSpeech, trainText, LEVELS_PER_GAME,
} from "../src/game/levels.js";
import clips from "../src/game/clips.json" with { type: "json" };

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

test("bridge: have + answer = target, answer among 4 distinct options, level ranges", () => {
  const targets = { 1: [5], 2: [10], 3: [10], 4: [10], 5: [20], 6: [10, 20] };
  for (let level = 1; level <= LEVELS_PER_GAME; level++) {
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = bridgeRounds(level, seeded(seed));
      assert.equal(rounds.length, 8);
      rounds.forEach((r, i) => {
        assert.ok(targets[level].includes(r.target), `L${level} target ${r.target}`);
        assert.equal(r.have + r.answer, r.target);
        assert.ok(r.answer >= 1 && r.have >= 1, `L${level} ${r.have}/${r.target}`);
        assert.equal(r.options.length, 4);
        assert.equal(new Set(r.options).size, 4);
        assert.ok(r.options.includes(r.answer));
        assert.ok(r.options.every((o) => o >= 0));
        if (i) assert.notEqual(bridgeText(r), bridgeText(rounds[i - 1]));
        bridgeSpeech(r).forEach((k) => assert.ok(clips[k], `clip ${k}`));
      });
    }
  }
});

test("train: wagons are a real sequence, the gap is the answer, clips exist", () => {
  for (let level = 1; level <= LEVELS_PER_GAME; level++) {
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = trainRounds(level, seeded(seed));
      assert.equal(rounds.length, 8);
      rounds.forEach((r) => {
        for (let i = 1; i < r.wagons.length; i++) assert.equal(r.wagons[i] - r.wagons[i - 1], r.step);
        assert.ok(r.wagons.every((n) => n >= 0 && n <= 100), r.wagons.join());
        assert.equal(r.wagons[r.gap], r.answer);
        assert.equal(new Set(r.options).size, 4, `L${level} ${r.options}`);
        assert.ok(r.options.includes(r.answer));
        if (level === 1) assert.equal(r.gap, r.wagons.length - 1);
        if (level === 2) assert.ok(r.gap > 0 && r.gap < r.wagons.length - 1);
        if (level === 4) assert.ok(r.step < 0);
        if (level <= 2) assert.ok(r.wagons.every((n) => n <= 10));
        assert.ok(trainText(r).includes("?"));
        trainSpeech(r).forEach((k) => assert.ok(clips[k], `clip ${k}`));
      });
    }
  }
});
