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
