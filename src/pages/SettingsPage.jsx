import { useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import DeleteAccountCard from "../components/DeleteAccountCard";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { CHARACTERS } from "../data/characters";
import { DOLPHIN_NAME, DOLPHIN_STILL } from "../data/dolphin";
import { readAloudDefault, setReadAloud } from "../game/readAloud";
import { getGrade } from "../data/grades";
import { isMuted, setMuted, sfx } from "../game/audio";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/staff.css";
import "../styles/pages/settings.css";
import "../styles/pages/legal.css";

// 2026-11-11 (was an empty placeholder): the child's own settings - sound, character, grade,
// password, log out. Big buttons, few words; nothing here deletes anything.
export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { patchProfile, changePassword, resetProfile } = useProfile();
  const [muted, setMutedState] = useState(isMuted());
  const [readAloud, setReadAloudState] = useState(() => readAloudDefault(profile?.grade));
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

  function toggleReadAloud() {
    setReadAloud(!readAloud);
    setReadAloudState(!readAloud);
    sfx.tap();
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

  async function pickCompanion(key) {
    if (key === (profile.companion ?? "FOX")) return;
    sfx.tap();
    try {
      await patchProfile({ companion: key });
      setMessage(key === "NONE" ? "הדולפין הלך לשחות. אפשר להחזיר אותו בכל רגע." : "הדולפין חזר לפינה! 👋");
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
      <DolphinPerch />
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
        <h2>📖 הקראת שאלות</h2>
        <p className="staff-card__hint">ליד כל שאלה יש 🔊. אפשר שהשאלה תוקרא לבד בכל פעם.</p>
        <button className={`switch ${readAloud ? "is-on" : ""}`} onClick={toggleReadAloud} aria-pressed={readAloud}>
          <span className="switch__knob" aria-hidden="true" />
          <span>{readAloud ? "כל שאלה מוקראת לבד" : "מקריאים רק כשלוחצים על 🔊"}</span>
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
        <h2>🐬 {DOLPHIN_NAME} שעוזר לי</h2>
        <p className="staff-card__hint">יושב בפינה, מעודד ועוזר. לוחצים עליו - והוא אומר משהו.</p>
        <div className="char-grid">
          {[
            { key: "FOX", img: DOLPHIN_STILL, name: "להראות", color: "#bfe6ff" },
            { key: "NONE", emoji: "🙈", name: "להסתיר", color: "var(--line)" },
          ].map((c) => {
            // Any saved animal from before = shown; only "NONE" hides it.
            const on = c.key === "NONE" ? profile.companion === "NONE" : profile.companion !== "NONE";
            return (
              <button
                key={c.key}
                className={`char-pick ${on ? "is-on" : ""}`}
                style={{ "--c": c.color }}
                onClick={() => !on && pickCompanion(c.key)}
                aria-pressed={on}
              >
                {c.img ? (
                  <img className="char-pick__img" src={c.img} alt="" />
                ) : (
                  <span className="char-pick__emoji" aria-hidden="true">{c.emoji}</span>
                )}
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="staff-card">
        <h2>🎓 הכיתה שלי</h2>
        <div className="admin__row">
          <strong className="settings__grade">{getGrade(profile.grade)?.label ?? "עוד לא נבחרה"}</strong>
          {profile.gradeLocked ? (
            <span className="staff-card__hint">🔒 המורה קבעה את הכיתה</span>
          ) : !profile.gradeChangeAllowed && !profile.admin && !profile.teacher ? (
            <span className="staff-card__hint">🔒 להחלפת כיתה מבקשים מהמורה</span>
          ) : (
            <button className="admin__btn admin__btn--ghost" onClick={() => navigate("/grade")}>החלפת כיתה</button>
          )}
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

      <DeleteAccountCard profile={profile} />

      <button className="text-link staff__logout" onClick={() => { resetProfile(); navigate("/login"); }}>
        יציאה מהמשתמש
      </button>
      <nav className="site-footer" aria-label="מידע על האתר">
        <a href="/privacy">מדיניות פרטיות</a>
        <a href="/accessibility">הצהרת נגישות</a>
        <a href="/contact?kind=problem&from=/settings">🐞 דיווח על בעיה</a>
      </nav>
    </div>
  );
}
