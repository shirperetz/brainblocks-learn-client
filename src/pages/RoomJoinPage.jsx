import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import { useProfile } from "../context/profileStore";
import { roomJoin, roomJoinGuest } from "../services/learnApi";
import "../styles/pages/room.css";

// 2026-11-12: "🎮 יש לי קוד חדר" - a logged-in child joins with the code; a child without an account
// types a name too and waits for the teacher (Shir chose: guests allowed, the teacher approves).
export default function RoomJoinPage() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return null;
  const child = profile && !profile.admin && !profile.teacher;
  const clean = code.replace(/\D/g, "");

  async function join() {
    setBusy(true);
    setError("");
    try {
      const r = child ? await roomJoin(clean) : await roomJoinGuest(clean, name.trim());
      navigate(`/room/${r.code}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
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
        {error && <p className="form-error">{error}</p>}
        <BigButton variant="green" onClick={join} disabled={busy || clean.length !== 6 || (!child && name.trim().length === 0)}>
          כניסה
        </BigButton>
      </section>
    </div>
  );
}
