import { useState } from "react";
import { praise, say, sfx } from "./audio";

const WAGON_COLORS = ["#ff6fb5", "#4aa8ff", "#ffce3a", "#25c685", "#ff9f43"];

/**
 * הרכבת (2026-11-11) - one round: a train of numbered wagons in order (up, down, by 2s, by 10s),
 * one wagon shows "?". Tap the right number among four; the wagon gets its number and the train
 * leaves. Wrong numbers fall away; after two, the step between wagons is shown above them.
 * Wagons are laid out left-to-right, the way numbers are written.
 */
export default function TrainRound({ round, onDone }) {
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);
  const [firstPick, setFirstPick] = useState(null);
  const hint = wrong.length >= 2;

  function pick(v) {
    if (solved || wrong.includes(v)) return;
    const first = firstPick ?? v;
    if (firstPick === null) setFirstPick(v);
    if (v === round.answer) {
      setSolved(true);
      sfx.correct();
      praise()
        .then(() => say("train_go"))
        .then(() => onDone({ correct: wrong.length === 0, chosen: String(first), hintUsed: hint }));
      return;
    }
    sfx.wrong();
    const next = [...wrong, v];
    setWrong(next);
    say(next.length >= 2 ? ["try", "hint"] : ["try"]);
  }

  const step = round.step;
  return (
    <div className="train-game">
      <div className={`track ${solved ? "is-leaving" : ""}`} dir="ltr">
        <div className="train">
          <span className="train__engine" aria-hidden="true">🚂</span>
          {round.wagons.map((n, i) => {
            const isGap = i === round.gap;
            return (
              <span
                key={i}
                className={`wagon ${isGap ? "wagon--gap" : ""} ${isGap && solved ? "is-filled" : ""}`}
                style={{ "--c": WAGON_COLORS[i % WAGON_COLORS.length] }}
              >
                {hint && i > 0 && !solved && (
                  <small className="wagon__step">{step > 0 ? `+${step}` : step}</small>
                )}
                <span className="wagon__num">{isGap ? (solved ? n : "?") : n}</span>
                <span className="wagon__wheels" aria-hidden="true" />
              </span>
            );
          })}
        </div>
        <div className="rails" aria-hidden="true" />
      </div>

      <div className="tickets">
        {round.options.map((v) => (
          <button
            key={v}
            className={`ticket ${wrong.includes(v) ? "is-gone" : ""} ${solved && v === round.answer ? "is-right" : ""}`}
            onClick={() => pick(v)}
            disabled={wrong.includes(v) || solved}
            aria-label={`המספר ${v}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
