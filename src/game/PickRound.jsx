import { useState } from "react";
import { praise, say, sfx } from "./audio";

/**
 * 2026-11-13: one round of the shapes / times / big-numbers games - a picture (Art) and the options
 * to tap (drawn by Opt, or plain text). Same rules as the other island games: a wrong option fades
 * away, after two wrong ones the picture shows its hint, and only a first-try answer counts as right.
 * `round.labels` (optional) turns an option into words for the report ("משולש", "4, נשארו 2").
 */
export default function PickRound({ round, onDone, Art, Opt, wide = false }) {
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);
  const [firstPick, setFirstPick] = useState(null);
  const hint = wrong.length >= 2;
  const label = (v) => round.labels?.[v] ?? String(v);

  function pick(v) {
    if (solved || wrong.includes(v)) return;
    const first = firstPick ?? v;
    if (firstPick === null) setFirstPick(v);
    if (v === round.answer) {
      setSolved(true);
      sfx.correct();
      praise().then(() => onDone({ correct: wrong.length === 0, chosen: label(first), hintUsed: hint }));
      return;
    }
    sfx.wrong();
    const next = [...wrong, v];
    setWrong(next);
    say(next.length >= 2 ? ["try", "hint"] : ["try"]);
  }

  return (
    <div className="pick-game">
      <Art round={round} hint={hint && !solved} solved={solved} />
      <div className={`pick-opts${Opt ? " pick-opts--art" : ""}${wide ? " pick-opts--wide" : ""} pick-opts--n${round.options.length}`}>
        {round.options.map((v) => (
          <button
            key={v}
            className={`pick-opt ${wrong.includes(v) ? "is-gone" : ""} ${solved && v === round.answer ? "is-right" : ""}`}
            onClick={() => pick(v)}
            disabled={wrong.includes(v) || solved}
            aria-label={label(v)}
          >
            {Opt ? <Opt v={v} round={round} /> : <span dir={/[֐-׿]/.test(label(v)) ? "rtl" : "ltr"}>{label(v)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
