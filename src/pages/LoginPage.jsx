import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import { useProfile } from "../context/profileStore";
import { startsOnIsland } from "../game/games";
import "../styles/pages/onboarding.css";
import "../styles/pages/admin.css";

// 2026-11-11 children's accounts: a child who already has a username logs in - on any device -
// and continues exactly where they stopped (the progress is on the server).
export default function LoginPage() {
  const navigate = useNavigate();
  const { loginProfile } = useProfile();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  // e.g. "/admin" from the admin link; after an automatic log-out, the staff page she was on
  const next = location.state?.next ?? query.get("next") ?? undefined;
  const expired = query.get("expired") === "1";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canLogin = username.trim().length >= 3 && password.length > 0 && !submitting;

  async function handleLogin() {
    if (!canLogin) return;
    setSubmitting(true);
    setError("");
    try {
      const p = await loginProfile({ username: username.trim(), password });
      const staff = p.admin || p.teacher;
      navigate(
        next && staff && (next === "/admin" ? p.admin : next.startsWith("/staff"))
          ? next
          : p.teacher
            ? "/staff"
            : startsOnIsland(p.grade)
              ? "/island"
              : "/topics",
      );
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate("/")}>
        ← חזרה
      </button>
      <div className="onboarding">
        <div className="onboarding__header">
          <Mascot avatarKey="ROBOT" size="md" message="שמחים שחזרת!" />
          <h1 className="screen-title">כניסה</h1>
          <p className="screen-subtitle">כתבו את שם המשתמש והסיסמה שלכם</p>
        </div>

        <div className="account-box">
          <div className="name-field">
            <label htmlFor="login-username">שם משתמש</label>
            <input
              id="login-username"
              type="text"
              value={username}
              maxLength={20}
              autoCapitalize="none"
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            />
          </div>
          <div className="name-field">
            <label htmlFor="login-password">סיסמה</label>
            <div className="password-row">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                maxLength={40}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button type="button" className="password-row__eye" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "להסתיר סיסמה" : "להראות סיסמה"}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        {expired && !error && (
          <p className="admin__message" role="status">
            🔒 לא היה שימוש חצי שעה, אז יצאנו בשביל השמירה עליך. צריך להיכנס שוב.
          </p>
        )}
        {error && <p className="form-error">{error}</p>}

        <div className="onboarding__actions">
          <BigButton variant="green" onClick={handleLogin} disabled={!canLogin}>
            {submitting ? "רגע..." : "כניסה"}
          </BigButton>
        </div>
        <button className="text-link login-switch" onClick={() => navigate("/grade")}>
          אין לי עדיין משתמש - להירשם
        </button>
      </div>
    </div>
  );
}
