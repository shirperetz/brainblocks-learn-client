import { useEffect, useState } from "react";
import { ask, askText } from "./dialog";
import { addPasskey, newBackupCodes, passkeysSupported, removePasskey, securityState } from "../services/passkey";

/**
 * 2026-11-14 (Shir: "fingerprint", "the code in case I change phones"): the admin's own log-in safety on
 * the public site - the devices whose fingerprint / face / PIN opens the admin account, and new one-time
 * backup codes (shown once; the old ones stop working).
 */
const when = (t) => (t ? new Date(t).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }) : "עוד לא");

export default function AdminSecurity() {
  const [st, setSt] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [codes, setCodes] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    securityState().then(setSt).catch((e) => setError(e.message));
  }, []);

  async function add() {
    const name = await askText("איך לקרוא למכשיר הזה? (למשל: הטלפון שלי)", "הטלפון שלי");
    if (name == null) return;
    setBusy(true);
    setError("");
    try {
      setSt(await addPasskey(name));
      setNote("✓ נשמר. מעכשיו נכנסים לניהול עם הסיסמה וטביעת האצבע של המכשיר הזה.");
    } catch (e) {
      setError(e?.name === "NotAllowedError" ? "בוטל. אפשר לנסות שוב." : e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(k) {
    if (!(await ask(`להסיר את "${k.name}"? אחרי זה טביעת האצבע שלו לא תפתח את הניהול.`, { okText: "להסיר", danger: true }))) return;
    setSt(await removePasskey(k.id));
  }

  async function fresh() {
    const pw = await askText("לקודים חדשים צריך שוב את הסיסמה שלך. הקודים הישנים יפסיקו לעבוד.", "", { okText: "קודים חדשים", secret: true });
    if (!pw) return;
    try {
      setCodes((await newBackupCodes(pw)).codes);
      setSt(await securityState());
    } catch (e) {
      setError(e.message);
    }
  }

  if (error && !st) return <p className="form-error" role="alert">{error}</p>;
  if (!st) return <p className="play__loading">טוען...</p>;
  return (
    <>
      {note && <p className="admin__message" role="status">{note}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="admin__card">
        <h2>🔐 כניסה מאובטחת לניהול</h2>
        {!st.on ? (
          <p className="admin__hint">באתר שבמחשב הניהול נפתח רק מהמכשירים שלך (Tailscale). טביעת אצבע פועלת באתר הציבורי.</p>
        ) : (
          <p className="admin__hint">באתר הזה, אחרי הסיסמה צריך גם טביעת אצבע / פנים של מכשיר רשום, או קוד גיבוי.</p>
        )}
        <h3>👆 מכשירים עם טביעת אצבע ({st.passkeys.length})</h3>
        {st.passkeys.length === 0 ? <p className="admin__hint">עוד אין.</p> : (
          <ul className="audit-list">
            {st.passkeys.map((k) => (
              <li key={k.id} className="audit-row">
                <span className="audit-row__who">{k.name}</span>
                <span className="audit-row__when">נוסף {when(k.createdAt)} · שימוש אחרון {when(k.lastUsedAt)}</span>
                <button className="admin__btn admin__btn--danger" onClick={() => remove(k)}>להסיר</button>
              </li>
            ))}
          </ul>
        )}
        {st.on && st.rpId && passkeysSupported() && (
          <button className="admin__btn" onClick={add} disabled={busy}>{busy ? "רגע..." : "➕ להוסיף את טביעת האצבע של המכשיר הזה"}</button>
        )}

        <h3>🗝️ קודי גיבוי (נשארו {st.codesLeft})</h3>
        <p className="admin__hint">לטלפון חדש או כשאין טביעת אצבע: כל קוד נכנס פעם אחת. לשמור אותם במקום בטוח (לא בטלפון עצמו).</p>
        {codes && (
          <div className="admin__message" role="status">
            <b>הקודים החדשים - מופיעים רק עכשיו:</b>
            <ol dir="ltr" style={{ fontFamily: "monospace", fontSize: "1.1rem" }}>
              {codes.map((c) => <li key={c}>{c}</li>)}
            </ol>
          </div>
        )}
        <button className="admin__btn" onClick={fresh}>קודי גיבוי חדשים</button>
      </section>
    </>
  );
}
