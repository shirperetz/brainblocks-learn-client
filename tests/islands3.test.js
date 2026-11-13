// 2026-11-13: the shapes, times and big-numbers islands - every game, level and island tier makes
// valid rounds whose answer is really right.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONCAVE, patternRounds, shapeNameRounds, sidesRounds, tokenId } from "../src/game/levelsShapes.js";
import { arraysRounds, groupsRounds, shareRounds } from "../src/game/levelsTimes.js";
import { biggerRounds, blocksValue, lineRounds, placeValueRounds } from "../src/game/levelsBig.js";

const GAMES = { shapeName: shapeNameRounds, sides: sidesRounds, pattern: patternRounds, groups: groupsRounds, share: shareRounds, arrays: arraysRounds, pv: placeValueRounds, line: lineRounds, bigger: biggerRounds };

function each(fn) {
  for (let tier = 0; tier <= 8; tier++)
    for (let level = 1; level <= 6; level++)
      for (let rep = 0; rep < 4; rep++)
        for (const [name, rounds] of Object.entries(GAMES)) for (const r of rounds(level, Math.random, new Set(), tier)) fn(name, r, level, tier);
}

test("every round: enough different options, the answer is one of them, rounds are made", () => {
  for (const [name, rounds] of Object.entries(GAMES)) for (let l = 1; l <= 6; l++) assert.ok(rounds(l).length >= 6, `${name} l${l}`);
  each((name, r, level, tier) => {
    const want = r.mode === "sign" ? 3 : name === "bigger" && r.mode !== "sign" && r.nums ? r.nums.length : 4;
    assert.equal(new Set(r.options).size, r.options.length, `${name} dup ${r.options}`);
    assert.ok(r.options.length >= Math.min(want, 3), `${name} t${tier} l${level} only ${r.options}`);
    if (!(name === "bigger" && (r.mode === "max" || r.mode === "min"))) assert.equal(r.options.length, want, `${name} t${tier} l${level} ${r.options}`);
    assert.ok(r.options.includes(r.answer), `${name} t${tier} l${level} ${r.answer} not in ${r.options}`);
  });
});

test("the answers are right", () => {
  each((name, r) => {
    if (name === "sides") {
      if (r.mode === "count") assert.equal(r.answer, r.shape.kind === "circle" ? 0 : r.shape.pts.length);
      else assert.equal(r.look[r.answer].pts.length, r.n);
    }
    if (name === "shapeName" && r.mode === "find" && r.look[r.answer].kind !== "poly") assert.equal(r.look[r.answer].kind, r.target);
    if (name === "shapeName" && r.target === "rectangle") assert.ok(!Object.values(r.look).some((l) => l.kind === "square"), "a square is a rectangle too");
    if (name === "pattern") assert.equal(tokenId(r.seq[r.gap]), r.answer);
    if (name === "groups") assert.equal(r.answer, r.n * r.k);
    if (name === "share") {
      if (r.mode === "rem") {
        assert.equal(r.total, r.kids * r.each + r.rem);
        assert.ok(r.rem > 0 && r.rem < r.kids);
      } else assert.equal(r.total, r.kids * r.each);
      if (r.mode === "kids") assert.equal(r.answer, r.kids);
    }
    if (name === "arrays") {
      if (r.mode === "count") assert.equal(r.answer, r.rows * r.cols);
      if (r.mode === "floors") assert.equal(r.answer, r.rows);
      if (r.mode === "which") assert.ok(!r.options.includes(`${r.cols} × ${r.rows}`) || r.rows === r.cols);
    }
    if (name === "pv") {
      if (r.mode === "read") assert.equal(r.answer, blocksValue(r.blocks));
      if (r.mode === "build") assert.ok(Object.values(r.look).filter((b) => blocksValue(b) === r.value).length === 1);
      if (r.mode === "digit") assert.ok(String(r.value).includes(String(r.digit)));
    }
    if (name === "line") assert.ok(r.answer > r.from && r.answer < r.to && r.options.every((v) => v > r.from && v < r.to), `line ${JSON.stringify(r)}`);
    if (name === "bigger") {
      if (r.mode === "max") assert.equal(r.answer, Math.max(...r.nums));
      if (r.mode === "min") assert.equal(r.answer, Math.min(...r.nums));
      if (r.mode === "sign") assert.equal(r.answer, r.a > r.b ? ">" : r.a < r.b ? "<" : "=");
      if (r.mode === "round10" || r.mode === "round100") assert.equal(r.answer, Math.round(r.n / r.to) * r.to);
    }
  });
});

test("shapes are drawable: points inside the box, concave shapes count right", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(CONCAVE).map(([k, v]) => [k, v.length])), { L: 6, arrow: 7, T: 8, plus: 12, star: 10 });
  each((name, r) => {
    const all = [r.shape, ...Object.values(r.look ?? {}), ...(r.seq ?? [])].filter((x) => x?.pts);
    for (const s of all) assert.ok(s.pts.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100), `${name} out of box`);
  });
});

test("a generated island asks for bigger numbers", () => {
  const big = (rounds, f, tier) => Array.from({ length: 20 }, () => rounds(3, Math.random, new Set(), tier)).flat().map(f);
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.ok(avg(big(groupsRounds, (r) => r.answer, 3)) > avg(big(groupsRounds, (r) => r.answer, 0)));
  assert.ok(avg(big(placeValueRounds, (r) => r.value, 3)) > avg(big(placeValueRounds, (r) => r.value, 0)));
  assert.ok(avg(big(lineRounds, (r) => r.to, 3)) > avg(big(lineRounds, (r) => r.to, 0)));
});
