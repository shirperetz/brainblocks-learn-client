import { useEffect, useState } from "react";
import "../styles/components/open-answer.css";

/**
 * 2026-11-21 (Shir chose "open answers"): the child types the number instead of picking one of four -
 * no guessing, like most Meitzav questions. A big display + keypad (and the keyboard on a computer).
 */
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export default function OpenAnswer({ done, checking, typed, right, onSubmit }) {
  const [value, setValue] = useState("");

  function press(k) {
    if (done || checking) return;
    if (k === "⌫") return setValue((v) => v.slice(0, -1));
    setValue((v) => {
      if (v.length >= 9) return v;
      if (k === "." && (v.includes(".") || v === "")) return v;
      return v + k;
    });
  }
  function submit() {
    if (!done && !checking && value && value !== ".") onSubmit(value.replace(/\.$/, ""));
  }

  // a computer: digits, point, Backspace and Enter work too
  useEffect(() => {
    function onKey(e) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^[0-9]$/.test(e.key) || e.key === ".") press(e.key);
      else if (e.key === "Backspace") press("⌫");
      else if (e.key === "Enter") submit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const state = !done ? "" : right ? " is-right" : " is-wrong";
  return (
    <div className="open-answer">
      <p className="open-answer__hint">✍️ הקלידו את התשובה</p>
      <div className={`open-answer__display${state}`} role="status" aria-live="polite" aria-label="התשובה שלי">
        <span dir="ltr">{done ? typed : value || " "}</span>
        {done && <span className="open-answer__mark" aria-hidden="true">{right ? "✓" : "✗"}</span>}
      </div>
      {!done && (
        <>
          <div className="open-answer__keys" dir="ltr">
            {KEYS.map((k) => (
              <button key={k} type="button" className={`open-answer__key${k === "⌫" ? " is-back" : ""}`} onClick={() => press(k)}
                aria-label={k === "⌫" ? "למחוק" : k === "." ? "נקודה" : k} disabled={checking}>
                {k}
              </button>
            ))}
          </div>
          <button type="button" className="open-answer__go" onClick={submit} disabled={!value || checking}>
            {checking ? "בודקים..." : "בדיקה ✓"}
          </button>
        </>
      )}
    </div>
  );
}
