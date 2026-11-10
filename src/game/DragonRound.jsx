import { useState } from "react";
import Dots from "./Dots";
import { dragonCheck } from "./levels";
import { say, sfx } from "./audio";

const FRUIT = "🍓";

/**
 * הדרקון הרעב - one round. The dragon asks for `want` berries (voice + number + dots).
 * The child taps berries on the tree to move them to the plate (tap a plate berry to give it
 * back), then taps the plate to feed. `start` berries may already be on the plate ("count on").
 * No number on the plate until the hint: the point is to count.
 */
export default function DragonRound({ round, onDone }) {
  const treeSize = Math.min(20, round.want - round.start + 4);
  const [onTree, setOnTree] = useState(treeSize);
  const [added, setAdded] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [mood, setMood] = useState("ask"); // ask | more | less | yum
  const [firstTry, setFirstTry] = useState(null); // what was on the plate at the first feed

  const onPlate = round.start + added;
  const done = mood === "yum";
  const hint = wrongs >= 2;

  function take() {
    if (done || onTree === 0) return;
    sfx.tap();
    setOnTree((t) => t - 1);
    setAdded((a) => a + 1);
    if (mood !== "ask") setMood("ask");
  }

  function giveBack() {
    if (done || added === 0) return;
    sfx.tap();
    setOnTree((t) => t + 1);
    setAdded((a) => a - 1);
    if (mood !== "ask") setMood("ask");
  }

  function feed() {
    if (done) return;
    const verdict = dragonCheck(round, onPlate);
    const first = firstTry ?? onPlate;
    if (firstTry === null) setFirstTry(onPlate);
    if (verdict === "ok") {
      setMood("yum");
      sfx.correct();
      say("dragon_yum").then(() =>
        onDone({ correct: wrongs === 0, chosen: String(first), hintUsed: hint }),
      );
      return;
    }
    sfx.wrong();
    setWrongs((w) => w + 1);
    setMood(verdict);
    say(wrongs + 1 >= 2 ? ["hint"] : [], verdict === "more" ? "dragon_more" : "dragon_less");
  }

  const plateItems = Array.from({ length: onPlate }, (_, i) => i);

  return (
    <div className="dragon">
      <div className={`dragon__creature dragon__creature--${mood}`}>
        <span className="dragon__face" aria-hidden="true">
          {mood === "yum" ? "😋" : "🐲"}
        </span>
        <div className="dragon__bubble">
          <span className="dragon__want" dir="ltr">
            {round.want}
          </span>
          <Dots n={round.want} />
          <span className="dragon__fruit">{FRUIT}</span>
        </div>
      </div>

      <div className="dragon__tree" aria-label="עץ התותים">
        {Array.from({ length: onTree }, (_, i) => (
          <button key={i} className="berry" onClick={take} aria-label="תות">
            {FRUIT}
          </button>
        ))}
        {onTree === 0 && <span className="dragon__empty">🌳</span>}
      </div>

      <button
        className={`plate ${round.frame ? "plate--frame" : ""} ${mood === "more" || mood === "less" ? "is-wrong" : ""} ${done ? "is-done" : ""}`}
        onClick={feed}
        aria-label="להאכיל את הדרקון"
      >
        {round.start > 0 && (
          <span className="plate__start" dir="ltr" aria-label={`כבר יש ${round.start}`}>
            ✔ {round.start} {FRUIT}
          </span>
        )}
        <span className="plate__items" dir="ltr">
          {plateItems.map((i) => {
            const fixed = i < round.start;
            return (
              <span
                key={i}
                className={`plate__berry ${fixed ? "is-fixed" : ""}`}
                onClick={(e) => {
                  if (fixed) return;
                  e.stopPropagation();
                  giveBack();
                }}
              >
                {FRUIT}
                {(hint || done) && <small className="plate__num">{i + 1}</small>}
              </span>
            );
          })}
          {round.frame &&
            Array.from({ length: (10 - (onPlate % 10)) % 10 }, (_, i) => (
              <span key={`e${i}`} className="plate__slot" />
            ))}
        </span>
        <span className="plate__label">🍽️ להאכיל</span>
      </button>
    </div>
  );
}
