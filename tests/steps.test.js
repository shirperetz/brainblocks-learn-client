// 2026-11-21: "step by step" - every split exercise must add up: each small exercise's answer is
// right, the answer is among the choices, and the last step lands on the real answer.
import test from "node:test";
import assert from "node:assert/strict";
import { stepsFor } from "../src/game/steps.js";

let seed = 7;
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rand = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

/** Evaluates "8 + 5 = ?", "7 + 4 + 1 = ?", "12 ÷ 4 = ?" - null for asks in words. */
function evalAsk(ask) {
  const m = /^([\d +\-×÷]+) = \?$/.exec(ask);
  if (!m) return null;
  const parts = m[1].trim().split(" ");
  let v = Number(parts[0]);
  for (let i = 1; i < parts.length; i += 2) {
    const op = parts[i], n = Number(parts[i + 1]);
    v = op === "+" ? v + n : op === "-" ? v - n : op === "×" ? v * n : v / n;
  }
  return v;
}

function check(text, right) {
  const s = stepsFor(text, right, rng);
  assert.ok(s, `no steps for ${text}`);
  for (const st of s.steps) {
    assert.ok(st.options.length >= 2 && st.options.length <= 3, `${text}: options ${st.options}`);
    assert.equal(new Set(st.options.map(String)).size, st.options.length, `${text}: duplicate options`);
    assert.ok(st.options.map(String).includes(String(st.answer)), `${text}: answer not offered`);
    const v = evalAsk(st.ask);
    if (v !== null) assert.equal(v, st.answer, `${text}: "${st.ask}" is not ${st.answer}`);
    if (typeof st.answer === "number") assert.ok(st.answer >= 0 && Number.isInteger(st.answer), `${text}: ${st.answer}`);
  }
  return s;
}

test("addition, subtraction, multiplication, division - every step adds up", () => {
  for (let i = 0; i < 400; i++) {
    const a = rand(1, i < 100 ? 9 : 99999), b = rand(1, i < 100 ? 9 : 99999);
    const s1 = check(`כמה זה ${a} + ${b}?`, a + b);
    assert.equal(s1.steps.at(-1).answer, a + b);
    const [x, y] = a >= b ? [a, b] : [b, a];
    const s2 = check(`כמה זה ${x} - ${y}?`, x - y);
    assert.equal(s2.steps.at(-1).answer, x - y);
    const m = rand(2, i < 200 ? 10 : 30), n = rand(2, i < 200 ? 10 : 99);
    const s3 = check(`כמה זה ${m} × ${n}?`, m * n);
    assert.equal(s3.steps.at(-1).answer, m * n);
    const s4 = check(`כמה זה ${m * n} ÷ ${m}?`, n);
    assert.equal(s4.steps.at(-1).answer, n);
  }
});

test("through ten for small numbers: 8 + 5 and 13 - 5", () => {
  const add = check("כמה זה 8 + 5?", 13);
  assert.deepEqual(add.steps.map((s) => s.answer), [2, 3, 13]);
  const sub = check("כמה זה 13 - 5?", 8);
  assert.deepEqual(sub.steps.map((s) => s.answer), [10, 2, 8]);
});

test("column addition carries, column subtraction borrows (also through a 0)", () => {
  const add = check("כמה זה 47 + 38?", 85);
  assert.deepEqual(add.steps.map((s) => s.answer), [15, 5, 8, 85]);
  const sub = check("כמה זה 402 - 157?", 245);
  assert.deepEqual(sub.steps.map((s) => s.answer), [5, 4, 2, 245]);
});

test("the missing number: the inverse exercise first, then its steps", () => {
  const s = check("מה המספר החסר? 7 + ? = 12", 5);
  assert.equal(s.steps[0].answer, "12 - 7");
  assert.ok(s.steps[0].options.includes("12 + 7"));
  assert.equal(s.steps.at(-1).answer, 5);
  const d = check("מה המספר החסר? ? ÷ 4 = 6", 24);
  assert.equal(d.steps[0].answer, "6 × 4");
  assert.equal(d.steps.at(-1).answer, 24);
  const m = check("מה המספר החסר? 9 - ? = 4", 5);
  assert.equal(m.steps[0].answer, "9 - 4");
});

test("what can't be split gets no steps (no button)", () => {
  assert.equal(stepsFor("איזה המספר הגדול ביותר?", "40"), null);
  assert.equal(stepsFor("כמה זה 3 + 4?", "8"), null); // a wrong "right answer" - never teach it
  assert.equal(stepsFor("כמה זה 3/4 + 1/4?", "1"), null);
});
