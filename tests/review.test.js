import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewOptions } from "../src/game/review.js";

test("review options: the answer + 3 different non-negative numbers", () => {
  for (const ans of ["0", "1", "7", "19", "56", "120", "9999"]) {
    for (let i = 0; i < 200; i++) {
      const o = reviewOptions(ans);
      assert.equal(o.length, 4);
      assert.equal(new Set(o).size, 4);
      assert.ok(o.includes(ans));
      o.forEach((v) => assert.ok(Number(v) >= 0 && Number.isInteger(Number(v))));
    }
  }
});

test("review options: non-numeric answers are skipped", () => {
  for (const ans of ["", null, undefined, "3/4", "abc", "-2", "2.5"]) assert.equal(reviewOptions(ans), null);
});
