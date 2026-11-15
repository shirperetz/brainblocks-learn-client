import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BigButton from "../components/BigButton";
import { useProfile } from "../context/profileStore";
import { roomJoin, roomJoinGuest } from "../services/learnApi";
import "../styles/pages/room.css";

// 2026-11-12: "🎮 יש לי קוד חדר" - a logged-in child joins with the code; a child without an account
// types a name too and waits for the teacher (Shir chose: guests allowed, the teacher approves).
export default function RoomJoinPage() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  // 2026-11-15: "/room?code=123456" (the hint on the log-in screen, a link from the teacher) fills it in.
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => (params.get("code") || "").replace(/\D/g, "").slice(0, 6));
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const stop = useRef(false);
  useEffect(() => () => {
    stop.current = true; // leaving the page stops the waiting
  }, []);
  if (loading) return null;
  const child = profile && !profile.admin && !profile.teacher;
  const clean = code.replace(/\D/g, "");

  // 2026-11-13 (Shir: "a child can't get into the room I opened"): the child typed the code 23 seconds
  // before the room existed, saw "not found" and gave up. A code with no room yet now keeps trying
  // every 3 seconds for 2 minutes, with a clear message, until the teacher opens it.
  async function join() {
    setBusy(true);
    setError("");
    setWaiting(false);
    const until = Date.now() + 120_000;
    for (;;) {
      try {
        const r = child ? await roomJoin(clean) : await roomJoinGuest(clean, name.trim());
        navigate(`/room/${r.code}`);
        return;
      } catch (e) {
        if (e.status === 404 && Date.now() < until && !stop.current) {
          setWaiting(true);
          await new Promise((ok) => setTimeout(ok, 3000));
          continue;
        }
        setWaiting(false);
        setError(e.status === 404 ? "אין חדר עם הקוד הזה. בדקו את הקוד על הלוח ונסו שוב." : e.message);
        setBusy(false);
        return;
      }
    }
  }

  return (
    <div className="app-shell room-child">
      <button className="back-button" onClick={() => navigate("/")}>← בית</button>
      <section className="room-card">
        <h1>🎮 נכנסים לחדר</h1>
        <label htmlFor="room-code">קוד החדר מהמורה</label>
        <input id="room-code" className="room-code-input" inputMode="numeric" maxLength={7} value={code}
          onChange={(e) => setCode(e.target.value)} placeholder="000000" autoComplete="off" />
        {!child && (
          <>
            <label htmlFor="room-name">{profile ? "מורים פותחים חדר במסך הכיתות. לשחק כאורח/ת - השם:" : "השם שלך"}</label>
            <input id="room-name" className="admin__input" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="השם שלך" />
            <p className="room-note">בלי משתמש: המורה צריכה לאשר אותך, והתוצאות לא נשמרות.</p>
          </>
        )}
        {waiting && <p className="room-note" role="status">⏳ עוד אין חדר עם הקוד הזה. מחכים שהמורה תפתח אותו...</p>}
        {error && <p className="form-error">{error}</p>}
        <BigButton variant="green" onClick={join} disabled={busy || clean.length !== 6 || (!child && name.trim().length === 0)}>
          כניסה
        </BigButton>
      </section>
    </div>
  );
}
