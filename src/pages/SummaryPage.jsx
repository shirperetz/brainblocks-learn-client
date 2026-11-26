import { sfx } from "../game/audio";
import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { cheer } from "../game/companion";
import BigButton from "../components/BigButton";
import StarRating from "../components/StarRating";
import Mascot from "../components/Mascot";
import { updateProfile } from "../services/learnApi";
import { useProfile } from "../context/profileStore";
import "../styles/pages/summary.css";

// Screen 9 — celebrate the result and route onward.
export default function SummaryPage() {
  const { topic, stage } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const summary = location.state?.summary;
  // 2026-11-13: a round on a generated island goes back to that island
  const back = location.state?.back ?? null;
  // 2026-11-21: a foundations round goes back to the topics; a hard round offers calm mode once
  const foundation = location.state?.foundation ?? null;
  const calm = Boolean(location.state?.calm);
  const { profile, refreshProfile } = useProfile();
  async function goCalm() {
    try {
      await updateProfile(profile.id, { calm: true });
      await refreshProfile();
    } catch {
      /* stays as it was */
    }
    navigate(`/play/${topic}/${stage}`);
  }
  // 2026-11-11: the companion celebrates (or encourages) once, when the summary appears.
  useEffect(() => {
    if (summary) cheer(summary.stars >= 3 ? "levelStars3" : summary.passed ? "levelPassed" : "levelFailed");
    if (summary?.stars >= 3) sfx.star();
    else if (summary?.passed) sfx.stage();
  }, [summary]);

  // Reached directly (e.g. refresh) without a result — send back to the map.
  if (!summary) return <Navigate to={`/map/${topic}`} replace />;

  const hasMistakes = summary.mistakes && summary.mistakes.length > 0;

  return (
    <div className="app-shell">
      <div className="summary">
        <Mascot dolphin size="md" play={summary.stars >= 3 ? "success" : summary.passed ? "smile" : "sad"} />

        <h1 className="screen-title">
          {foundation
            ? summary.scorePct >= 80 ? "🧱 היסוד חזק! כל הכבוד" : "🧱 כל סבב בונה עוד לבנה"
            : calm && !summary.passed ? "כל ניסיון מקרב אותך 💙" : summary.encouragement}
        </h1>

        <StarRating value={summary.stars} size="lg" animate />

        <div className="summary__stats card">
          <p>
            ענית נכון על <strong>{summary.correct}</strong> מתוך <strong>{summary.total}</strong> שאלות
          </p>
          <p>
            צברת <strong>{summary.points}</strong> נקודות
          </p>
          <p>
            קיבלת <strong>{summary.stars}</strong> כוכבים
          </p>
        </div>

        {foundation ? (
          <div className="summary__actions">
            <BigButton variant="green" onClick={() => navigate("/topics")}>חזרה לנושאים ←</BigButton>
            {summary.scorePct < 80 && (
              <BigButton variant="blue" onClick={() => navigate(`/play/${topic}/${stage}?foundation=${foundation}`)}>עוד סבב קצר</BigButton>
            )}
          </div>
        ) : (
        <div className="summary__actions">
          {!calm && !summary.passed && summary.scorePct < 50 && profile && !profile.calm && (
            <BigButton variant="green" onClick={goCalm}>
              🌿 לנסות במצב רגוע? (2 תשובות לבחירה, 5 שאלות)
            </BigButton>
          )}
          {summary.passed && (
            <BigButton variant="ghost" onClick={() => navigate("/my-island")}>
              🎁 קיבלת חלק חדש לאי שלך!
            </BigButton>
          )}
          {back && summary.passed && Number(stage) < 6 && (
            <BigButton variant="green" onClick={() => navigate(`${back}/q/${topic}/${Number(stage) + 1}`)}>
              לשלב הבא ←
            </BigButton>
          )}
          {summary.nextStageUnlocked && (
            <BigButton variant="green" onClick={() => navigate(`/play/${topic}/${summary.nextStage}`)}>
              עבור לשלב הבא ←
            </BigButton>
          )}
          <BigButton variant="blue" onClick={() => navigate(back ? `${back}/q/${topic}/${stage}` : `/play/${topic}/${stage}`)}>
            נסה שוב
          </BigButton>
          {hasMistakes && (
            <BigButton variant="ghost" onClick={() => navigate("/review")}>
              בוא נחזור על מה שהיה קשה
            </BigButton>
          )}
          <BigButton variant="ghost" onClick={() => navigate(back ?? `/map/${topic}`)}>
            {back ? "חזרה לאי" : "חזרה למפה"}
          </BigButton>
        </div>
        )}
      </div>
    </div>
  );
}
