import { test } from "node:test";
import assert from "node:assert/strict";
import { mathParts } from "../src/game/mathText.js";

const math = (t) => mathParts(t).filter((p) => p.math).map((p) => p.text);

test("formulas and series are found; the Hebrew around them is kept", () => {
  assert.deepEqual(math("כמה זה 363 + 852?"), ["363 + 852"]);
  assert.deepEqual(math("כמה זה 72 ÷ 9?"), ["72 ÷ 9"]);
  assert.deepEqual(math("מה המספר הבא? 3, 7, 11, 15, ?"), ["3, 7, 11, 15, ?"]);
  assert.deepEqual(math("3 + 2 = ?"), ["3 + 2 = ?"]);
  assert.deepEqual(math("איזה המספר הגדול ביותר?"), []);
  // a word problem: lone numbers stay in the sentence
  assert.deepEqual(math("לנועה יש 6 שקיות, ובכל שקית 4 מדבקות."), []);
  const t = "כמה זה 363 + 852?";
  assert.equal(mathParts(t).map((p) => p.text).join(""), t);
});

test("fractions are math too (2026-11-11)", () => {
  assert.deepEqual(math("2/7 + 3/7 = ?"), ["2/7 + 3/7 = ?"]);
  assert.deepEqual(math("איזה שבר שווה ל-1/2?"), ["1/2"]);
  assert.deepEqual(math("כמה זה 3/4 מ-20?"), ["3/4"]);
});

test("division with ':' and degrees stay left-to-right (2026-11-11)", () => {
  assert.deepEqual(math("כתבו את התרגיל 7 : 8 כשבר"), ["7 : 8"]);
  assert.deepEqual(math("התוצאה של 20 : 4 היא..."), ["20 : 4"]);
  assert.deepEqual(math("5 : 7"), ["5 : 7"]);
  assert.deepEqual(math("זווית של 140° היא זווית..."), ["140°"]);
  assert.deepEqual(math("סביב נקודה יש שלוש זוויות. שתיים מהן 120° ו-90°."), ["120°", "90°"]);
});

// 2026-11-12 (Shir's screenshots: "8 = 40 × ?" and "+ ? ... 617 = 1032" came out mirrored).
test("an equation that starts with ? is one math part", () => {
  assert.deepEqual(math("מה המספר החסר? ? × 8 = 40"), ["? × 8 = 40"]);
  assert.deepEqual(math("מה המספר החסר? ? + 617 = 1032"), ["? + 617 = 1032"]);
  assert.deepEqual(math("מה המספר החסר? 12 - ? = 5"), ["12 - ? = 5"]);
  // the sentence's own question mark is not math
  assert.deepEqual(math("איזה המספר הקטן ביותר?"), []);
  const t = "מה המספר החסר? ? × 8 = 40";
  assert.equal(mathParts(t).map((p) => p.text).join(""), t);
});

test("x, brackets, decimals and percents stay left-to-right (2026-11-21, the new topics)", () => {
  assert.deepEqual(math("מה x? x + 10 = 13"), ["x + 10 = 13"]);
  assert.deepEqual(math("מה x? 4 × x + 3 = 47"), ["4 × x + 3 = 47"]);
  assert.deepEqual(math("כמה זה (4 + 7) × 2?"), ["(4 + 7) × 2"]);
  assert.deepEqual(math("כמה זה 2 × (9 - 3) + 4?"), ["2 × (9 - 3) + 4"]);
  assert.deepEqual(math("0.3 + 0.4 = ?"), ["0.3 + 0.4 = ?"]);
  assert.deepEqual(math("כמה זה 20% מ-150?"), ["20%"]);
  assert.deepEqual(math("צמצמו את היחס 6 : 9"), ["6 : 9"]);
});
