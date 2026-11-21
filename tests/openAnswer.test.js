import { test } from "node:test";
import assert from "node:assert/strict";
import { isOpenQuestion } from "../src/game/openAnswer.js";

const q = (options, extra = {}) => ({ bankId: 1, options, ...extra });

test("every third numeric question from stage 2 is open", () => {
  assert.equal(isOpenQuestion(q(["12", "14", "1,250", "3.5"]), 2, 2), true);
  assert.equal(isOpenQuestion(q(["12", "14"]), 1, 2), false); // not the third
  assert.equal(isOpenQuestion(q(["12", "14"]), 2, 1), false); // stage 1 stays multiple choice
});

test("never for words, fractions, retries or without a bank question", () => {
  assert.equal(isOpenQuestion(q(["1/2", "1/3"]), 2, 3), false);
  assert.equal(isOpenQuestion(q(["זוגי", "אי-זוגי"]), 2, 3), false);
  assert.equal(isOpenQuestion(q(["12", "14"], { retry: true }), 2, 3), false);
  assert.equal(isOpenQuestion({ options: ["12", "14"] }, 2, 3), false);
});
