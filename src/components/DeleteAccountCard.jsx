import { useEffect, useState } from "react";
import { cancelDeletion, getDeletionState, requestDeletion } from "../services/learnApi";
import { ask } from "./dialog";

/**
 * 2026-11-14 (privacy): "delete my account" in settings. Needs the account's password (a friend with
 * the tablet can't), then waits for the admin; until then it can be cancelled.
 */
export default function DeleteAccountCard({ profile }) {
  const [requestedAt, setRequestedAt] = useState(undefined);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDeletionState(profile.id).then((r) => setRequestedAt(r.requestedAt ?? null)).catch(() => setRequestedAt(null));
  }, [profile.id]);

  if (profile.admin || requestedAt === undefined) return null;

  async function send() {
    const sure = await ask("למחוק את החשבון וכל מה שנשמר בו - הכוכבים, המטבעות, האי וההתקדמות? אי אפשר לשחזר אחר כך.", { okText: "כן, לבקש מחיקה", danger: true });
    if (!sure) return;
    setBusy(true);
    setError("");
    try {
      const r = await requestDeletion(profile.id, password);
      setRequestedAt(r.requestedAt);
      setPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    setBusy(true);
    try {
      await cancelDeletion(profile.id);
      setRequestedAt(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-card">
      <h2>🗑️ מחיקת החשבון שלי</h2>
      {requestedAt ? (
        <>
          <p className="admin__hint" role="status">
            ✓ ביקשת למחוק את החשבון. מנהלת האתר תאשר את המחיקה בקרוב, ואז כל המידע יימחק. עד אז אפשר להתחרט.
          </p>
          <button className="admin__btn" disabled={busy} onClick={undo}>התחרטתי - לא למחוק</button>
        </>
      ) : (
        <>
          <p className="admin__hint">
            החשבון וכל מה שנשמר בו יימחקו (אחרי אישור של מנהלת האתר). כדאי לעשות את זה יחד עם הורה.{" "}
            <a href="/privacy">מה נשמר?</a>
          </p>
          <div className="name-field">
            <label htmlFor="del-pw">הסיסמה שלי (לאישור)</label>
            <input id="del-pw" type="password" maxLength={40} autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="admin__btn admin__btn--danger" disabled={busy || !password} onClick={send}>
            {busy ? "רגע..." : "בקשה למחוק את החשבון"}
          </button>
        </>
      )}
    </section>
  );
}
