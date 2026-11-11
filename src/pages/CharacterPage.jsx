import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import OptionCard from "../components/OptionCard";
import BigButton from "../components/BigButton";
import { CHARACTERS } from "../data/characters";
import { useProfile } from "../context/profileStore";
import { startsOnIsland } from "../game/games";
import { preload, say } from "../game/audio";
import "../styles/pages/onboarding.css";

// Screen 3 — pick the companion character and type a name. Creates the profile with the grade
// chosen on the screen before (passed in navigation state); without one, back to the grade.
export default function CharacterPage() {
  const navigate = useNavigate();
  const { createProfile } = useProfile();
  const chosen = useLocation().state;
  const young = chosen?.grade === "G1" || chosen?.grade === "G2" || chosen?.grade === "G3";
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  // 2026-11-11: children's accounts - the username + password this child will log in with.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // 2026-11-11: the join code from the parents / teacher (filled in when the link carried it).
  const [joinCode, setJoinCode] = useState(() => {
    try {
      return sessionStorage.getItem("lc_join_code") ?? "";
    } catch {
      return "";
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false); // signed up, waiting for the admin's approval

  const canConfirm = selected && name.trim().length > 0 && username.trim().length >= 3 && password.length >= 4 && joinCode.trim().length > 0 && !submitting;

  useEffect(() => {
    if (!young) return;
    preload(["pick_friend"]);
    say("pick_friend");
  }, [young]);

  if (pending) {
    return (
      <div className="app-shell">
        <div className="onboarding">
          <div className="onboarding__header">
            <div className="pending-badge" aria-hidden="true">⏳</div>
            <h1 className="screen-title">ההרשמה התקבלה!</h1>
            <p className="screen-subtitle">
              עכשיו מחכים שההורים או המורה יאשרו. אחרי האישור נכנסים עם שם המשתמש <strong>{username.trim().toLowerCase()}</strong> והסיסמה שבחרתם.
            </p>
          </div>
          <div className="onboarding__actions">
            <BigButton variant="green" onClick={() => navigate("/login")}>
              למסך הכניסה
            </BigButton>
          </div>
        </div>
      </div>
    );
  }

  if (!chosen?.grade) return <Navigate to="/grade" replace />;

  async function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    setError("");
    try {
      const made = await createProfile({ name: name.trim(), avatar: selected, grade: chosen.grade, difficulty: chosen.difficulty,
        username: username.trim(), password, joinCode: joinCode.trim() });
      if (made?.pending) {
        setPending(true);
        setSubmitting(false);
        return;
      }
      navigate(startsOnIsland(chosen.grade) ? "/island" : "/topics");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate("/grade")}>
        ← חזרה
      </button>
      <div className="onboarding">
        <div className="onboarding__header">
          <div className="steps" aria-hidden="true">
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
          </div>
          <h1 className="screen-title">בחר דמות</h1>
          <p className="screen-subtitle">הדמות תלווה אותך לאורך כל המשחק</p>
        </div>

        <div className="option-grid" role="group" aria-label="דמויות">
          {CHARACTERS.map((c) => (
            <OptionCard
              key={c.key}
              icon={c.emoji}
              title={c.name}
              color={c.color}
              selected={selected === c.key}
              onClick={() => setSelected(c.key)}
            />
          ))}
        </div>

        <div className="name-field">
          <label htmlFor="child-name">איך קוראים לך?</label>
          <input
            id="child-name"
            type="text"
            value={name}
            maxLength={24}
            placeholder="הקלד את שמך כאן"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <div className="account-box">
          <p className="account-box__title">שם משתמש וסיסמה - כדי להיכנס שוב מכל מכשיר</p>
          <div className="name-field">
            <label htmlFor="child-username">שם משתמש</label>
            <input
              id="child-username"
              type="text"
              value={username}
              maxLength={20}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="לפחות 3 אותיות או ספרות, בלי רווח"
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            />
          </div>
          <div className="name-field">
            <label htmlFor="child-password">סיסמה</label>
            <div className="password-row">
              <input
                id="child-password"
                type={showPassword ? "text" : "password"}
                value={password}
                maxLength={40}
                autoComplete="new-password"
                placeholder="לפחות 4 תווים"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
              <button type="button" className="password-row__eye" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "להסתיר סיסמה" : "להראות סיסמה"}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <div className="name-field">
            <label htmlFor="join-code">קוד הצטרפות (מההורים או מהמורה)</label>
            <input
              id="join-code"
              type="text"
              inputMode="numeric"
              value={joinCode}
              maxLength={20}
              autoComplete="off"
              onChange={(e) => setJoinCode(e.target.value)}
            />
          </div>
          <p className="account-box__hint">כדאי שמבוגר ירשום את הסיסמה במקום בטוח</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="onboarding__actions">
          <BigButton variant="green" onClick={handleConfirm} disabled={!canConfirm}>
            {submitting ? "רגע..." : "אישור"}
          </BigButton>
        </div>
      </div>
    </div>
  );
}
