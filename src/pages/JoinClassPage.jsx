import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import { useRequireProfile } from "../hooks/useRequireProfile";
import { askJoinClass, cancelJoinClass, getJoinClass } from "../services/learnApi";
import "../styles/pages/room.css";

// 2026-11-13 (Shir chose: "a child who already has an account types the teacher's code and waits for
// her approval, without signing up again"). Everything else keeps working while she waits.
export default function JoinClassPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [st, setSt] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getJoinClass(profile.id).then(setSt).catch((e) => setError(e.message));
  }, [ready, profile]);

  if (!ready) return null;
  const clean = code.replace(/\s/g, "");

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      setSt(await fn());
    } catch (e) {
      setError(e.status === 404 ? "אין כיתה עם הקוד הזה. בדקו אותו עם המורה." : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell room-child">
      <button className="back-button" onClick={() => navigate("/")}>← בית</button>
      <section className="room-card">
        <h1>🏫 הצטרפות לכיתה</h1>
        {st?.className && <p className="room-note">את/ה עכשיו בכיתה: <b>{st.className}</b></p>}
        {st?.pendingClassName ? (
          <>
            <p className="room-note" role="status">
              ⏳ ביקשת להצטרף ל<b>{st.pendingClassName}</b>
              {st.pendingTeacher ? ` של ${st.pendingTeacher}` : ""}. מחכים שהמורה תאשר. בינתיים אפשר להמשיך לשחק!
            </p>
            <BigButton variant="ghost" disabled={busy} onClick={() => run(() => cancelJoinClass(profile.id))}>
              ביטול הבקשה
            </BigButton>
          </>
        ) : (
          <>
            <label htmlFor="class-code">הקוד של הכיתה מהמורה</label>
            <input id="class-code" className="room-code-input" maxLength={10} value={code} autoComplete="off"
              onChange={(e) => setCode(e.target.value)} placeholder="ABC123" dir="ltr" />
            <BigButton variant="green" disabled={busy || clean.length < 4} onClick={() => run(() => askJoinClass(profile.id, clean))}>
              שליחה למורה
            </BigButton>
          </>
        )}
        {error && <p className="form-error">{error}</p>}
      </section>
    </div>
  );
}
