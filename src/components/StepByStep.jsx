import { useEffect, useRef, useState } from "react";
import MathText from "./MathText";
import { stepsFor } from "../game/steps";
import { cheer } from "../game/companion";
import "../styles/components/step-by-step.css";

/**
 * 2026-11-21 (Shir chose "step by step"): after a mistake the exercise is solved together - one small
 * step at a time, each a tiny question with 3 choices. A wrong choice just shakes and waits (no
 * score, no penalty); a right one turns green and the next step comes. At the end: the whole exercise.
 * apple-design: feedback on press, one thing on screen at a time, done steps stay as a calm list.
 */
export default function StepByStep({ text, right }) {
  const [plan] = useState(() => stepsFor(text, right));
  const [at, setAt] = useState(0);
  const [wrong, setWrong] = useState(null); // the choice that shook
  const [good, setGood] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!plan) return null;

  const done = at >= plan.steps.length;
  const step = plan.steps[at];

  function pick(o) {
    if (good !== null) return;
    if (String(o) === String(step.answer)) {
      setGood(o);
      setWrong(null);
      cheer("correct");
      timer.current = setTimeout(() => {
        setGood(null);
        setAt((i) => i + 1);
      }, 650);
    } else {
      setWrong(o);
    }
  }

  return (
    <div className="sbs" aria-label="פותרים יחד צעד אחרי צעד">
      {at > 0 && (
        <ol className="sbs__done">
          {plan.steps.slice(0, at).map((s, i) => (
            <li key={i}>
              <span className="sbs__check" aria-hidden="true">✓</span>
              <MathText text={doneLine(s)} />
            </li>
          ))}
        </ol>
      )}
      {!done ? (
        <div className="sbs__now" key={at} role="group" aria-label={`צעד ${at + 1} מתוך ${plan.steps.length}`}>
          <p className="sbs__count">👣 צעד {at + 1} מתוך {plan.steps.length}</p>
          <p className="sbs__say">{step.say}</p>
          <p className="sbs__ask"><MathText text={step.ask} /></p>
          <div className="sbs__choices">
            {step.options.map((o) => (
              <button
                key={String(o)}
                type="button"
                className={`sbs__choice${good === o ? " is-right" : ""}${wrong === o ? " is-wrong" : ""}`}
                onClick={() => pick(o)}
              >
                <MathText text={String(o)} />
              </button>
            ))}
          </div>
          {wrong !== null && <p className="sbs__try" role="status">כמעט! נסו עוד אחת 🙂</p>}
        </div>
      ) : (
        <p className="sbs__end" role="status">🎉 פתרנו יחד! <b><MathText text={plan.done} /></b></p>
      )}
    </div>
  );
}

/** A finished step as one line: "8 + 5 = 13", or "כמה חסר ל-8 כדי להגיע ל-10: 2". */
function doneLine(s) {
  return /= \?$/.test(s.ask) ? s.ask.replace(/\?$/, String(s.answer)) : `${s.ask.replace(/\?$/, "")}: ${s.answer}`;
}
