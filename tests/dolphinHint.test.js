import { test } from "node:test";
import assert from "node:assert/strict";
import { hintsFor, marksUnits, strategyLine } from "../src/game/dolphinHint.js";

test("two hints, never the answer", () => {
  const q = { text: "כמה זה 38 + 47?", hint: "חברו קודם את האחדות", options: ["85", "75", "95", "84"] };
  const h = hintsFor(q);
  assert.equal(h.length, 2);
  assert.equal(h[0], "חברו קודם את האחדות");
  for (const line of h) assert.ok(!line.includes("85"), line);
  assert.match(strategyLine("כמה זה 52 - 17?"), /פורטים/);
  assert.match(strategyLine("כמה זה 6 × 7?"), /חיבור/);
});

test("the units are marked only in + / − with a 2-digit number", () => {
  assert.equal(marksUnits("כמה זה 38 + 47?"), true);
  assert.equal(marksUnits("כמה זה 3 + 4?"), false);
  assert.equal(marksUnits("כמה זה 6 × 17?"), false);
});
