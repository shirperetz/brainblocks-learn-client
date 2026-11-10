import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OptionCard from "../components/OptionCard";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import { GRADES, DIFFICULTIES } from "../data/grades";
import { startsOnIsland } from "../game/games";
import { useProfile } from "../context/profileStore";
import { preload, say } from "../game/audio";
import "../styles/pages/onboarding.css";

// Screen 2 — the very first question: which grade (2026-11-10, Shir: "ממש בהתחלה איזה כיתה אתה").
// It decides everything after it: grades א-ב go to אי המספרים (spoken), older grades to the topics.
// A new child continues to the character; a returning child (changing grade) is saved right away.
export default function GradePage() {
  const { loading } = useProfile();
  if (loading) return null;
  return <GradeForm />;
}

function GradeForm() {
  const navigate = useNavigate();
  const { profile, hasProfile, patchProfile } = useProfile();
  const [grade, setGrade] = useState(profile?.grade ?? null);
  const [difficulty, setDifficulty] = useState(profile?.difficulty ?? "MEDIUM");

  useEffect(() => {
    if (hasProfile) return; // a returning child already knows this screen
    preload(["pick_grade"]);
    say("pick_grade");
  }, [hasProfile]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");


  async function handleContinue() {
    if (!grade || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      if (!hasProfile) {
        navigate("/character", { state: { grade, difficulty } });
        return;
      }
      await patchProfile({ grade, difficulty });
      navigate(startsOnIsland(grade) ? "/island" : "/topics");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate(hasProfile ? (startsOnIsland(profile?.grade) ? "/island" : "/topics") : "/")}>
        ← חזרה
      </button>
      <div className="onboarding">
        <div className="onboarding__header">
          <div className="steps" aria-hidden="true">
            <span className="steps__dot is-active" />
            <span className="steps__dot" />
          </div>
          <Mascot avatarKey={profile?.avatar ?? "ROBOT"} size="sm" message="באיזו כיתה אתם?" />
          <h1 className="screen-title">בחר כיתה</h1>
        </div>

        <div className="option-grid" role="group" aria-label="כיתות">
          {GRADES.map((g) => (
            <OptionCard
              key={g.key}
              icon={g.letter}
              title={g.label}
              subtitle={g.blurb}
              color={g.color}
              selected={grade === g.key}
              onClick={() => setGrade(g.key)}
            />
          ))}
        </div>

        <p className="screen-subtitle">רמת קושי</p>
        <div className="pills" role="group" aria-label="רמת קושי">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              className={`pill ${difficulty === d.key ? "is-active" : ""}`}
              onClick={() => setDifficulty(d.key)}
              aria-pressed={difficulty === d.key}
            >
              {d.label}
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="onboarding__actions">
          <BigButton variant="green" onClick={handleContinue} disabled={!grade || submitting}>
            {submitting ? "רגע..." : "המשך"}
          </BigButton>
        </div>
      </div>
    </div>
  );
}
