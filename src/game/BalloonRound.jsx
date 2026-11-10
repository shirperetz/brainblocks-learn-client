import { useState } from "react";
import { praise, say, sfx } from "./audio";

const COLORS = ["#ff6fb5", "#4aa8ff", "#ffce3a", "#25c685"];
const A = "🍎";
const B = "🍏";

/**
 * בלונים - one round: "כמה זה 3 ועוד 2?" is heard, shown as an equation (left-to-right, the way
 * math is written) and as pictures. Pop the balloon with the answer. A wrong balloon deflates;
 * after two wrong tries the pictures get numbers ("בואו נספור ביחד").
 */
export default function BalloonRound({ round, onDone }) {
  const [gone, setGone] = useState([]); // wrong balloons (deflated)
  const [popped, setPopped] = useState(null);
  const [firstPick, setFirstPick] = useState(null);
  const hint = gone.length >= 2;

  function pick(value) {
    if (popped !== null || gone.includes(value)) return;
    const first = firstPick ?? value;
    if (firstPick === null) setFirstPick(value);
    if (value === round.answer) {
      setPopped(value);
      sfx.pop();
      sfx.correct();
      praise().then(() =>
        onDone({ correct: gone.length === 0, chosen: String(first), hintUsed: hint }),
      );
      return;
    }
    sfx.wrong();
    const next = [...gone, value];
    setGone(next);
    say(next.length >= 2 ? ["try", "hint"] : ["try"]);
  }

  // Pictures: a red apples, then (+) b green apples, or (-) the last b crossed out.
  const pics = [];
  if (round.op === "+") {
    for (let i = 0; i < round.a; i++) pics.push({ e: A, k: `a${i}` });
    pics.push({ sep: true, k: "sep" });
    for (let i = 0; i < round.b; i++) pics.push({ e: B, k: `b${i}` });
  } else {
    for (let i = 0; i < round.a; i++) pics.push({ e: A, k: `a${i}`, out: i >= round.a - round.b });
  }
  let counter = 0;

  return (
    <div className="balloons">
      <div className="equation" dir="ltr" aria-label={`${round.a} ${round.op === "+" ? "ועוד" : "פחות"} ${round.b}`}>
        <span>{round.a}</span>
        <span className="equation__op">{round.op}</span>
        <span>{round.b}</span>
        <span className="equation__op">=</span>
        <span className={`equation__answer ${popped !== null ? "is-shown" : ""}`}>
          {popped !== null ? round.answer : "?"}
        </span>
      </div>

      <div className={`pictures ${round.a + round.b > 10 ? "pictures--small" : ""}`} dir="ltr" aria-hidden="true">
        {pics.map((p) =>
          p.sep ? (
            <span key={p.k} className="pictures__plus">+</span>
          ) : (
            <span key={p.k} className={`pictures__item ${p.out ? "is-out" : ""}`}>
              <span className="pictures__emoji">{p.e}</span>
              {hint && !p.out && <small className="pictures__num">{++counter}</small>}
            </span>
          ),
        )}
      </div>

      <div className="sky">
        {round.options.map((v, i) => (
          <button
            key={v}
            className={`balloon ${gone.includes(v) ? "is-gone" : ""} ${popped === v ? "is-popped" : ""}`}
            style={{ "--c": COLORS[i % COLORS.length], "--delay": `${i * 0.35}s` }}
            onClick={() => pick(v)}
            disabled={gone.includes(v) || popped !== null}
            aria-label={`בלון ${v}`}
          >
            <span className="balloon__body" dir="ltr">
              {v}
            </span>
            <span className="balloon__string" />
          </button>
        ))}
      </div>
    </div>
  );
}
