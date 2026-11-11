import { mathParts } from "../game/mathText";
import "../styles/components/question-picture.css";

/**
 * A Hebrew sentence with math inside it ("כמה זה 363 + 852?"). In right-to-left text the browser
 * flips the formula ("?852 + 363 כמה זה"); each formula is isolated left-to-right instead, the way
 * math is written, while the sentence around it stays Hebrew.
 */
/** "363 + 852" never breaks around the operator; a sequence still wraps after its commas. */
function keepFormulaTogether(text) {
  return text.replace(/ ([+\-−×÷:=<>]) /g, " $1 ");
}

/** "3/4" -> 3 above 4 with a line between, the way children learn to write a fraction. */
function withFractions(text) {
  const parts = text.split(/(\d+\/\d+)/);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    const m = /^(\d+)\/(\d+)$/.exec(p);
    return m ? (
      <span key={i} className="frac" aria-label={`${m[1]} חלקי ${m[2]}`}>
        <span className="frac__top">{m[1]}</span>
        <span className="frac__bottom">{m[2]}</span>
      </span>
    ) : (
      p
    );
  });
}

export default function MathText({ text }) {
  return mathParts(text).map((p, i) =>
    p.math ? (
      <bdi key={i} dir="ltr" className="math-inline">
        {withFractions(keepFormulaTogether(p.text))}
      </bdi>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}
