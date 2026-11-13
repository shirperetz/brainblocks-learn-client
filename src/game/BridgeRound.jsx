import { useState } from "react";
import { praise, say, sfx } from "./audio";

const STONE_COLORS = ["#8d6e63", "#a1887f", "#795548", "#6d4c41"];

/**
 * הגשר (2026-11-11) - one round: a bridge of `target` planks over a river, `have` in place, the rest
 * missing. "על הגשר יש שבעה קרשים, כמה קרשים חסרים עד עשר?" - tap the stone with the answer. Right:
 * the missing planks fall into place and a little friend walks across. Two wrong tries: the empty
 * places get numbers ("בואו נספור ביחד"). Planks come in rows of 5 (and 10 per row for 20) to help
 * seeing "how many to ten".
 */
export default function BridgeRound({ round, onDone }) {
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
        .then(() => say("bridge_done"))
        .then(() => onDone({ correct: wrong.length === 0, chosen: String(first), hintUsed: hint }));
      return;
    }
    sfx.wrong();
    const next = [...wrong, v];
    setWrong(next);
    say(next.length >= 2 ? ["try", "hint"] : ["try"]);
  }

  // 2026-11-13: generated islands go to 50 / 100 / 1,000 - too many planks to draw; the numbers stay.
  const drawn = round.target <= 20;
  const perRow = round.target === 20 ? 10 : round.target;
  const rows = [];
  for (let start = 0; drawn && start < round.target; start += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, round.target - start) }, (_, i) => start + i));
  }
  let missingNo = 0;

  return (
    <div className="bridge-game">
      <div className="bridge-q" aria-live="polite">
        {round.eq ? (
          <span className="equation equation--small" dir="ltr">
            <span>{round.have}</span>
            <span className="equation__op">+</span>
            <span className={`equation__answer ${solved ? "is-shown" : ""}`}>{solved ? round.answer : "?"}</span>
            <span className="equation__op">=</span>
            <span>{round.target}</span>
          </span>
        ) : (
          <span className="bridge-q__goal">
            צריך <b>{round.target}</b> קרשים
          </span>
        )}
      </div>

      <div className={`river ${solved ? "is-solved" : ""} ${drawn ? "" : "river--numbers"}`} aria-hidden="true">
        <span className="river__bank river__bank--start">🌳</span>
        <div className="bridge">
          {rows.map((row, r) => (
            <div key={r} className="bridge__row" dir="ltr">
              {row.map((i) => {
                const missing = i >= round.have;
                const n = missing ? ++missingNo : 0;
                return (
                  <span
                    key={i}
                    className={`plank ${missing ? "plank--missing" : ""} ${(i % 5) === 4 ? "plank--fifth" : ""}`}
                    style={{ "--i": n }}
                  >
                    {missing && hint && !solved && <small>{n}</small>}
                  </span>
                );
              })}
            </div>
          ))}
          <span className="bridge__walker">🐰</span>
        </div>
        <span className="river__bank river__bank--end">🏡</span>
      </div>

      <div className="stones">
        {round.options.map((v, i) => (
          <button
            key={v}
            className={`stone-pick ${wrong.includes(v) ? "is-gone" : ""} ${solved && v === round.answer ? "is-right" : ""}`}
            style={{ "--c": STONE_COLORS[i % STONE_COLORS.length] }}
            onClick={() => pick(v)}
            disabled={wrong.includes(v) || solved}
            aria-label={`${v} קרשים`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
