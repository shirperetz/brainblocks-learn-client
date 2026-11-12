import { useState } from "react";
import { praise, say, sfx } from "./audio";
import { shopCheck } from "./levelsClock";
import Money from "./Money";

/**
 * החנות (2026-11-12) - one round: an item (or two) with a price tag. The child taps coins from the
 * wallet onto the counter (tap a coin on the counter to take it back) and presses "לשלם". Exact = the
 * shopkeeper says thank you. Too little / too much = "חסר עוד" / "יותר מדי". Levels 1-3 show the running
 * total; from level 4 the child counts. After two wrong payments the total is shown to help.
 */
export default function ShopRound({ round, onDone }) {
  const [paid, setPaid] = useState([]); // coin values on the counter, in order
  const [wrong, setWrong] = useState(0);
  const [firstPaid, setFirstPaid] = useState(null);
  const [solved, setSolved] = useState(false);
  const [note, setNote] = useState(null);
  const total = paid.reduce((a, b) => a + b, 0);
  const showTotal = round.showTotal || wrong >= 2;

  function add(v) {
    if (solved) return;
    sfx.tap();
    setNote(null);
    setPaid((p) => [...p, v]);
  }
  function remove(i) {
    if (solved) return;
    sfx.tap();
    setNote(null);
    setPaid((p) => p.filter((_, j) => j !== i));
  }
  function pay() {
    if (solved || !paid.length) return;
    const first = firstPaid ?? total;
    if (firstPaid === null) setFirstPaid(total);
    const r = shopCheck(round, total);
    if (r === "ok") {
      setSolved(true);
      sfx.correct();
      say("shop_thanks")
        .then(() => praise())
        .then(() => onDone({ correct: wrong === 0, chosen: String(first), hintUsed: wrong >= 2 }));
      return;
    }
    sfx.wrong();
    setWrong((w) => w + 1);
    setNote(r === "more" ? "חסר עוד כסף" : "יותר מדי כסף - מחזירים מטבע");
    say(r === "more" ? "shop_more" : "shop_less");
  }

  return (
    <div className="shop-game">
      <div className={`shop-shelf ${solved ? "is-sold" : ""}`}>
        {round.items.map((e, i) => (
          <div key={i} className="shop-item">
            <span className="shop-item__emoji" aria-hidden="true">{e}</span>
            <span className="shop-item__tag" dir="ltr">{round.prices[i]} ₪</span>
          </div>
        ))}
        {round.two && <span className="shop-shelf__sum">ביחד?</span>}
      </div>

      <div className={`shop-counter ${note ? "is-wrong" : ""}`} aria-live="polite">
        {paid.length === 0 ? (
          <span className="shop-counter__empty">שמים כאן את הכסף 👇</span>
        ) : (
          paid.map((v, i) => <Money key={i} v={v} small as="button" type="button" onClick={() => remove(i)} />)
        )}
      </div>
      <p className="shop-status">
        {note ?? (showTotal && paid.length ? <>שמתם: <b dir="ltr">{total} ₪</b></> : " ")}
      </p>

      <div className="wallet">
        {[...round.coins].reverse().map((v) => (
          <Money key={v} v={v} as="button" type="button" onClick={() => add(v)} disabled={solved} />
        ))}
      </div>

      <button className="shop-pay" onClick={pay} disabled={solved || !paid.length}>
        💳 לשלם
      </button>
    </div>
  );
}
