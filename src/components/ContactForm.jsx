import { useEffect, useState } from "react";
import BotTrap from "./BotTrap";
import { markFormOpened, sendContact } from "../services/learnApi";

/**
 * 2026-11-14 (privacy / accessibility): a message to the site's operator - no account needed (a parent
 * writes too). It reaches the admin's screen and her phone. Name and a way to answer are optional.
 */
export default function ContactForm({ kind: initialKind = "privacy" }) {
  const [kind, setKind] = useState(initialKind);
  const [name, setName] = useState("");
  const [reply, setReply] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => markFormOpened(), []);

  async function send(e) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      await sendContact({ kind, name, reply, text });
      setState("sent");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  if (state === "sent") {
    return <p className="legal-sent" role="status">✓ ההודעה נשלחה. תודה! נחזור אליך בהקדם, אם השארת דרך ליצור קשר.</p>;
  }
  return (
    <form className="legal-form" onSubmit={send}>
      <BotTrap />
      <label htmlFor="c-kind">נושא הפנייה</label>
      <select id="c-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="privacy">פרטיות</option>
        <option value="deletion">מחיקת מידע</option>
        <option value="accessibility">נגישות</option>
        <option value="problem">תקלה באתר</option>
        <option value="other">אחר</option>
      </select>
      <label htmlFor="c-name">שם (לא חובה)</label>
      <input id="c-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      <label htmlFor="c-reply">מייל או טלפון לתשובה (לא חובה)</label>
      <input id="c-reply" maxLength={120} dir="ltr" value={reply} onChange={(e) => setReply(e.target.value)} autoComplete="email" />
      <label htmlFor="c-text">ההודעה</label>
      <textarea id="c-text" rows={5} maxLength={2000} required value={text} onChange={(e) => setText(e.target.value)} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="legal-form__send" disabled={state === "busy" || text.trim().length < 3}>
        {state === "busy" ? "שולח..." : "שליחה"}
      </button>
    </form>
  );
}
