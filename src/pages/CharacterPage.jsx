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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canConfirm = selected && name.trim().length > 0 && !submitting;

  useEffect(() => {
    if (!young) return;
    preload(["pick_friend"]);
    say("pick_friend");
  }, [young]);

  if (!chosen?.grade) return <Navigate to="/grade" replace />;

  async function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    setError("");
    try {
      await createProfile({ name: name.trim(), avatar: selected, grade: chosen.grade, difficulty: chosen.difficulty });
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
