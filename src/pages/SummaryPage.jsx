import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { cheer } from "../game/companion";
import BigButton from "../components/BigButton";
import StarRating from "../components/StarRating";
import Mascot from "../components/Mascot";
import "../styles/pages/summary.css";

// Screen 9 — celebrate the result and route onward.
export default function SummaryPage() {
  const { topic, stage } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const summary = location.state?.summary;
  // 2026-11-13: a round on a generated island goes back to that island
  const back = location.state?.back ?? null;
  // 2026-11-11: the companion celebrates (or encourages) once, when the summary appears.
  useEffect(() => {
    if (summary) cheer(summary.passed ? "levelPassed" : "levelFailed");
  }, [summary]);

  // Reached directly (e.g. refresh) without a result — send back to the map.
  if (!summary) return <Navigate to={`/map/${topic}`} replace />;

  const hasMistakes = summary.mistakes && summary.mistakes.length > 0;

  return (
    <div className="app-shell">
      <div className="summary">
        <Mascot dolphin size="md" play={summary.passed ? "success" : "sad"} />

        <h1 className="screen-title">{summary.encouragement}</h1>

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

        <div className="summary__actions">
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
      </div>
    </div>
  );
}
