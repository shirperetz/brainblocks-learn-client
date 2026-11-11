import { mathParts } from "../game/mathText";

/**
 * A Hebrew sentence with math inside it ("כמה זה 363 + 852?"). In right-to-left text the browser
 * flips the formula ("?852 + 363 כמה זה"); each formula is isolated left-to-right instead, the way
 * math is written, while the sentence around it stays Hebrew.
 */
/** "363 + 852" never breaks around the operator; a sequence still wraps after its commas. */
function keepFormulaTogether(text) {
  return text.replace(/ ([+\-−×÷:=<>]) /g, " $1 ");
}

export default function MathText({ text }) {
  return mathParts(text).map((p, i) =>
    p.math ? (
      <bdi key={i} dir="ltr" className="math-inline">
        {keepFormulaTogether(p.text)}
      </bdi>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}
