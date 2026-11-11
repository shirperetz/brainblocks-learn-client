import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { CHARACTERS } from "../data/characters";
import { getGrade } from "../data/grades";
import { isMuted, setMuted, sfx } from "../game/audio";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/staff.css";
import "../styles/pages/settings.css";

// 2026-11-11 (was an empty placeholder): the child's own settings - sound, character, grade,
// password, log out. Big buttons, few words; nothing here deletes anything.
export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { patchProfile, changePassword, resetProfile } = useProfile();
  const [muted, setMutedState] = useState(isMuted());
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return null;

  function toggleSound() {
    setMuted(!muted);
    setMutedState(!muted);
    if (muted) sfx.tap();
  }

  async function pickCharacter(key) {
    if (key === profile.avatar) return;
    sfx.tap();
    try {
      await patchProfile({ avatar: key });
      setMessage("הדמות הוחלפה!");
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function savePassword() {
    if (pw.next !== pw.again) {
      setError("הסיסמאות החדשות לא זהות");
      return;
    }
    setBusy(true);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", again: "" });
      setMessage("הסיסמה הוחלפה. במכשירים אחרים צריך להיכנס מחדש.");
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const canSave = pw.current && pw.next.length >= 4 && pw.again && !busy;

  return (
    <div className="app-shell staff settings">
      <button className="back-button" onClick={() => navigate("/")}>← בית</button>
      <h1 className="screen-title">⚙️ הגדרות</h1>
      <p className="screen-subtitle">
        {profile.name} · @{profile.username}
      </p>

      {message && <p className="admin__message" role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <section className="staff-card">
        <h2>🔊 קול</h2>
        <button className={`switch ${muted ? "" : "is-on"}`} onClick={toggleSound} aria-pressed={!muted}>
          <span className="switch__knob" aria-hidden="true" />
          <span>{muted ? "הקול כבוי" : "הקול פועל - הדמות מדברת"}</span>
        </button>
      </section>

      <section className="staff-card">
        <h2>🙂 הדמות שלי</h2>
        <div className="char-grid">
          {CHARACTERS.map((c) => (
            <button
              key={c.key}
              className={`char-pick ${c.key === profile.avatar ? "is-on" : ""}`}
              style={{ "--c": c.color }}
              onClick={() => pickCharacter(c.key)}
              aria-pressed={c.key === profile.avatar}
            >
              <span className="char-pick__emoji" aria-hidden="true">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="staff-card">
        <h2>🎓 הכיתה שלי</h2>
        <div className="admin__row">
          <strong className="settings__grade">{getGrade(profile.grade)?.label ?? "עוד לא נבחרה"}</strong>
          <button className="admin__btn admin__btn--ghost" onClick={() => navigate("/grade")}>החלפת כיתה</button>
        </div>
      </section>

      <section className="staff-card">
        <h2>🔑 החלפת סיסמה</h2>
        <div className="account-box">
          {[
            ["current", "הסיסמה של היום", "current-password"],
            ["next", "סיסמה חדשה (לפחות 4)", "new-password"],
            ["again", "שוב את הסיסמה החדשה", "new-password"],
          ].map(([k, label, ac]) => (
            <div className="name-field" key={k}>
              <label htmlFor={`pw-${k}`}>{label}</label>
              <input id={`pw-${k}`} type="password" maxLength={40} autoComplete={ac} value={pw[k]}
                onChange={(e) => setPw({ ...pw, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <button className="admin__btn" disabled={!canSave} onClick={savePassword}>
          {busy ? "רגע..." : "שמירת סיסמה"}
        </button>
      </section>

      <button className="text-link staff__logout" onClick={() => { resetProfile(); navigate("/login"); }}>
        יציאה מהמשתמש
      </button>
    </div>
  );
}
