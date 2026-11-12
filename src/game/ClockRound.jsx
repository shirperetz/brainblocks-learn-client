import { useState } from "react";
import { praise, say, sfx } from "./audio";
import { handAngles } from "./levelsClock";

/**
 * מה השעה? (2026-11-12) - one round: a big analog clock, four times to choose from. Two wrong tries:
 * the minutes appear around the clock (5, 10, 15...) and the short hand is highlighted ("look at the
 * short hand first").
 */
export default function ClockRound({ round, onDone }) {
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);
  const [firstPick, setFirstPick] = useState(null);
  const hint = wrong.length >= 2;
  const { hour, minute } = handAngles(round.h, round.m);

  function pick(t) {
    if (solved || wrong.includes(t)) return;
    const first = firstPick ?? t;
    if (firstPick === null) setFirstPick(t);
    if (t === round.answer) {
      setSolved(true);
      sfx.correct();
      praise().then(() => onDone({ correct: wrong.length === 0, chosen: first, hintUsed: hint }));
      return;
    }
    sfx.wrong();
    const next = [...wrong, t];
    setWrong(next);
    say(["try"]);
  }

  return (
    <div className="clock-game">
      <svg className={`clock-face ${hint ? "is-hint" : ""} ${solved ? "is-solved" : ""}`} viewBox="-110 -110 220 220" role="img" aria-label="שעון">
        <circle r="104" className="clock-face__rim" />
        <circle r="96" className="clock-face__dial" />
        {Array.from({ length: 60 }, (_, i) => (
          <line
            key={i}
            x1="0"
            y1={i % 5 === 0 ? -88 : -91}
            x2="0"
            y2="-95"
            className={i % 5 === 0 ? "clock-face__tick is-big" : "clock-face__tick"}
            transform={`rotate(${i * 6})`}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const a = (n * 30 * Math.PI) / 180;
          return (
            <text key={n} x={Math.sin(a) * 72} y={-Math.cos(a) * 72} className="clock-face__num">
              {n}
            </text>
          );
        })}
        {hint &&
          Array.from({ length: 12 }, (_, i) => {
            const mins = ((i + 1) * 5) % 60;
            const a = ((i + 1) * 30 * Math.PI) / 180;
            return (
              <text key={i} x={Math.sin(a) * 50} y={-Math.cos(a) * 50} className="clock-face__min">
                {String(mins).padStart(2, "0")}
              </text>
            );
          })}
        <line x1="0" y1="10" x2="0" y2="-48" className="clock-face__hour" transform={`rotate(${hour})`} />
        <line x1="0" y1="14" x2="0" y2="-80" className="clock-face__minute" transform={`rotate(${minute})`} />
        <circle r="6" className="clock-face__pin" />
      </svg>
      {hint && <p className="clock-game__tip">המחוג הקצר (הכתום) מראה את השעה. הארוך מראה את הדקות.</p>}

      <div className="time-picks">
        {round.options.map((t) => (
          <button
            key={t}
            className={`time-pick ${wrong.includes(t) ? "is-gone" : ""} ${solved && t === round.answer ? "is-right" : ""}`}
            onClick={() => pick(t)}
            disabled={wrong.includes(t) || solved}
            dir="ltr"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
