import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import { registerTeacher } from "../services/learnApi";
import "../styles/pages/room.css";
import BotTrap from "../components/BotTrap";
import ConsentBox from "../components/ConsentBox";

// 2026-11-12 (Shir chose: no teachers' code - her approval is enough): a teacher signs up and waits.
export default function TeacherSignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);

  const ok = name.trim().length > 0 && username.trim().length >= 3 && password.length >= 6 && password === again && consent;

  async function send() {
    setBusy(true);
    setError("");
    try {
      await registerTeacher({ name: name.trim(), username: username.trim(), password, privacyAccepted: consent });
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell room-child who">
      <BotTrap />
      <button className="back-button" onClick={() => navigate("/who")}>← חזרה</button>
      <div className="who__body">
      {sent ? (
        <section className="room-card">
          <h1>✓ נרשמת!</h1>
          <p className="room-note">מנהלת האתר תאשר אותך בקרוב. אחרי האישור נכנסים עם שם המשתמש והסיסמה.</p>
          <BigButton variant="green" onClick={() => navigate("/login")}>למסך הכניסה</BigButton>
        </section>
      ) : (
        <section className="room-card">
          <h1>👩‍🏫 הרשמה למורים</h1>
          <label htmlFor="t-name">השם שיופיע לילדים</label>
          <input id="t-name" className="admin__input" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} placeholder="המורה דנה" />
          <label htmlFor="t-user">שם משתמש (אותיות באנגלית או ספרות)</label>
          <input id="t-user" className="admin__input" dir="ltr" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <label htmlFor="t-pass">סיסמה (לפחות 6)</label>
          <input id="t-pass" className="admin__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <label htmlFor="t-pass2">שוב את הסיסמה</label>
          <input id="t-pass2" className="admin__input" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          {again && password !== again && <p className="form-error">הסיסמאות לא זהות</p>}
          <ConsentBox kind="teacher" checked={consent} onChange={setConsent} />
          {error && <p className="form-error">{error}</p>}
          <BigButton variant="green" onClick={send} disabled={!ok || busy}>הרשמה</BigButton>
        </section>
      )}
      </div>
    </div>
  );
}
