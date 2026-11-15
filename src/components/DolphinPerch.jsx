import { useEffect, useRef } from "react";
import { getPerch, setPerch } from "../game/companion";

/**
 * Where the dolphin sits on this page (Shir 12.11, option C): just above the page's main card, its tail
 * resting on the card's edge, a speech bubble beside it. `message` = what it says when nothing else is
 * happening (an answer / stage event briefly replaces it). The dolphin itself is drawn by Companion.
 */
// `side` (the game screens): on a wide screen (computer / big tablet) the dolphin stands big on the
// left of the game instead of on the card (Shir 12.11: "on the computer - on the left, bigger, once
// they start playing"). On a phone it still sits on the card.
// `hint` (2026-11-15): { lines: [..], key } - the dolphin gives these when touched (see Companion).
export default function DolphinPerch({ message = null, side = false, hint = null }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    setPerch({ el, message, hint });
    return () => {
      if (getPerch()?.el === el) setPerch(null);
    };
  }, [message, hint]);
  return <div ref={ref} className={`dolphin-perch${side ? " dolphin-perch--side" : ""}`} />;
}
