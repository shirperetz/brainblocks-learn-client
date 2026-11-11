import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import { useProfile } from "../context/profileStore";
import "../styles/pages/onboarding.css";
import "../styles/pages/staff.css";

// 2026-11-11: "להורים ולמורים" (was an empty placeholder). Parents: how it works. Teachers: sign up
// with the teachers' code Shir gives out (then wait for her OK), or log in to the classes screen.
export default function ParentsPage() {
  const navigate = useNavigate();
  const { createProfile, profile } = useProfile();
  const [form, setForm] = useState({ joinCode: "", name: "", username: "", password: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ok = form.joinCode.trim() && form.name.trim() && form.username.length >= 3 && form.password.length >= 4 && !busy;

  async function signUp() {
    setBusy(true);
    setError("");
    try {
      const r = await createProfile({ ...form, name: form.name.trim(), avatar: "ROBOT" });
      if (r?.pending) setSent(true);
      else navigate("/staff");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (key, label, props = {}) => (
    <div className="name-field">
      <label htmlFor={`t-${key}`}>{label}</label>
      <input id={`t-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <div className="app-shell staff">
      <button className="back-button" onClick={() => navigate("/")}>← בית</button>
      <h1 className="screen-title">להורים ולמורים</h1>

      <section className="staff-card">
        <h2>👨‍👩‍👧 להורים</h2>
        <ul className="parents-list">
          <li>הילד/ה נרשם/ת עם <b>קוד ההצטרפות</b> שקיבלתם מהמורה, ונכנס/ת אחרי שהמורה מאשרת.</li>
          <li>כל ההתקדמות נשמרת לפי שם המשתמש, אז אפשר להמשיך מכל מכשיר.</li>
          <li>המשחק שואל קודם שאלות עם מספרים קטנים, ומחזיר אחר כך על טעויות.</li>
          <li>אין צ׳אט, אין תמונות ואין פרסומות. שומרים רק שם פרטי, כיתה ותשובות.</li>
        </ul>
      </section>

      {profile && (profile.teacher || profile.admin) ? (
        <BigButton variant="green" onClick={() => navigate("/staff")}>📊 לכיתות שלי</BigButton>
      ) : (
        <section className="staff-card">
          <h2>👩‍🏫 למורים</h2>
          {sent ? (
            <p className="admin__message" role="status">
              ההרשמה התקבלה! אחרי שתאושר אפשר להיכנס עם שם המשתמש והסיסמה, ולפתוח כיתות.
            </p>
          ) : (
            <>
              <p className="staff-card__hint">
                מורה רואה רק את התלמידים בכיתות שלה: מה קל להם, במה הם מתקשים, ומה כדאי לתרגל. צריך <b>קוד מורים</b>.
              </p>
              <div className="account-box">
                {field("joinCode", "קוד מורים", { maxLength: 20, autoCapitalize: "none" })}
                {field("name", "השם שלך (כפי שהילדים מכירים)", { maxLength: 24 })}
                {field("username", "שם משתמש", { maxLength: 20, autoCapitalize: "none", autoComplete: "username" })}
                {field("password", "סיסמה (לפחות 4)", { type: "password", maxLength: 40, autoComplete: "new-password" })}
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="onboarding__actions">
                <BigButton variant="blue" onClick={signUp} disabled={!ok}>{busy ? "רגע..." : "הרשמה כמורה"}</BigButton>
              </div>
            </>
          )}
          <button className="text-link" onClick={() => navigate("/login", { state: { next: "/staff" } })}>
            כבר יש לי משתמש מורה - כניסה
          </button>
        </section>
      )}
    </div>
  );
}
