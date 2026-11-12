import { useState } from "react";
import { praise, say, sfx } from "./audio";
import Money from "./Money";

/**
 * כמה כסף? (2026-11-12) - one round: a pile of coins and bills (big ones first, the way we count
 * money), four amounts to choose from. Level 6: "you had X, bought something for Y - how much is left?".
 * Two wrong tries: a running total appears under each coin (10, 15, 17...) / the subtraction is shown.
 */
export default function CoinsRound({ round, onDone }) {
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
      praise().then(() => onDone({ correct: wrong.length === 0, chosen: String(first), hintUsed: hint }));
      return;
    }
    sfx.wrong();
    setWrong([...wrong, v]);
    say(["try"]);
  }

  // The running total under each coin (the hint): 10, 15, 17...
  const runs = round.change ? [] : round.money.map((_, i) => round.money.slice(0, i + 1).reduce((a, b) => a + b, 0));
  return (
    <div className="coins-game">
      {round.change ? (
        <div className="change-story">
          <div className="change-story__part">
            <span className="change-story__label">היה לי</span>
            <Money v={round.had} />
          </div>
          <span className="change-story__arrow" aria-hidden="true">←</span>
          <div className="change-story__part">
            <span className="change-story__label">קניתי</span>
            <span className="shop-item">
              <span className="shop-item__emoji" aria-hidden="true">{round.item}</span>
              <span className="shop-item__tag" dir="ltr">{round.price} ₪</span>
            </span>
          </div>
          <span className="change-story__arrow" aria-hidden="true">←</span>
          <div className="change-story__part">
            <span className="change-story__label">נשאר לי</span>
            <span className="change-story__q">{solved ? `${round.answer} ₪` : "?"}</span>
          </div>
          {hint && !solved && (
            <p className="change-story__hint" dir="ltr">
              {round.had} - {round.price} = ?
            </p>
          )}
        </div>
      ) : (
        <div className="money-pile" dir="ltr">
          {round.money.map((v, i) => (
            <span key={i} className="money-pile__one">
              <Money v={v} />
              {hint && <small className="money-pile__run">{runs[i]}</small>}
            </span>
          ))}
        </div>
      )}

      <div className="time-picks">
        {round.options.map((v) => (
          <button
            key={v}
            className={`time-pick ${wrong.includes(v) ? "is-gone" : ""} ${solved && v === round.answer ? "is-right" : ""}`}
            onClick={() => pick(v)}
            disabled={wrong.includes(v) || solved}
            dir="ltr"
          >
            {v} ₪
          </button>
        ))}
      </div>
    </div>
  );
}
