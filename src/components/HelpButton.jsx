import { useRef, useState } from "react";
import { getHelp, speakUrl } from "../services/learnApi";
import { sayUrl, stopVoice } from "../game/audio";
import "../styles/components/help.css";

/**
 * "🤔 לא הבנתי" (2026-11-10, Shir: "ai שיצטרכו ילדים אם הם לא מבינים משהו").
 * Asks the server for a short explanation of THIS question. First and "explain differently": step-by-step
 * ways made by code (always correct, never the answer). From the third press: the local AI rewords one,
 * filtered on the server (short, Hebrew, only the right numbers, never the answer). The child never
 * types anything. `speak` (grades א-ב): the explanation is also read aloud.
 *
 * question: { text, correct, chosen?, hint }   onUsed(): called once, the first time it is opened.
 * Give it key={the question} so a new question starts closed.
 */
export default function HelpButton({ question, grade, speak = false, onUsed, compact = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [help, setHelp] = useState(null); // { text, source }
  const [audio, setAudio] = useState(null); // object URL of the spoken text
  const used = useRef(false);
  const asked = useRef(0);
  const [presses, setPresses] = useState(0); // explanations shown so far (0, 1, 2...)

  async function ask() {
    setOpen(true);
    setLoading(true);
    if (!used.current) {
      used.current = true;
      onUsed?.();
    }
    const n = ++asked.current;
    const attempt = presses;
    setPresses(attempt + 1);
    try {
      const h = await getHelp({
        questionText: question.text,
        correctAnswer: question.correct,
        chosenAnswer: question.chosen,
        grade,
        attempt,
        fallbackHint: question.hint,
      });
      if (n !== asked.current) return;
      setHelp(h);
      const url = speak ? await speakUrl(h.text) : null;
      if (n !== asked.current) return;
      setAudio(url);
      if (url) sayUrl(url);
    } catch {
      setHelp({ text: question.hint || "בואו נקרא את השאלה שוב לאט.", source: "hint" });
    } finally {
      if (n === asked.current) setLoading(false);
    }
  }

  function close() {
    stopVoice();
    asked.current++;
    setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <button type="button" className={`help-btn ${compact ? "help-btn--compact" : ""}`} onClick={ask} aria-label="לא הבנתי">
        🤔{compact ? "" : " לא הבנתי"}
      </button>
    );
  }

  return (
    <div className="help-bubble" role="dialog" aria-label="הסבר">
      <div className="help-bubble__owl" aria-hidden="true">🦉</div>
      <div className="help-bubble__body">
        {loading ? (
          <p className="help-bubble__text help-bubble__text--loading">חושבים על הסבר...</p>
        ) : (
          <p className="help-bubble__text">{help?.text}</p>
        )}
        <div className="help-bubble__actions">
          {audio && !loading && (
            <button type="button" className="help-chip" onClick={() => sayUrl(audio)} aria-label="להקשיב">
              🔊
            </button>
          )}
          {!loading && (
            <button type="button" className="help-chip" onClick={ask}>
              {presses >= 2 ? "🦉 עוד דרך" : "🔁 תסבירו אחרת"}
            </button>
          )}
          <button type="button" className="help-chip" onClick={close}>
            ✔ הבנתי
          </button>
        </div>
      </div>
    </div>
  );
}
