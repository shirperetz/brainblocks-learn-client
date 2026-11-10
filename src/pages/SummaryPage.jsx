import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import BigButton from "../components/BigButton";
import StarRating from "../components/StarRating";
import Mascot from "../components/Mascot";
import { useProfile } from "../context/profileStore";
import "../styles/pages/summary.css";

// Screen 9 — celebrate the result and route onward.
export default function SummaryPage() {
  const { topic, stage } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const summary = location.state?.summary;

  // Reached directly (e.g. refresh) without a result — send back to the map.
  if (!summary) return <Navigate to={`/map/${topic}`} replace />;

  const hasMistakes = summary.mistakes && summary.mistakes.length > 0;

  return (
    <div className="app-shell">
      <div className="summary">
        <Mascot avatarKey={profile?.avatar ?? "ROBOT"} size="md" float />

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
          {summary.nextStageUnlocked && (
            <BigButton variant="green" onClick={() => navigate(`/play/${topic}/${summary.nextStage}`)}>
              עבור לשלב הבא ←
            </BigButton>
          )}
          <BigButton variant="blue" onClick={() => navigate(`/play/${topic}/${stage}`)}>
            נסה שוב
          </BigButton>
          {hasMistakes && (
            <BigButton variant="ghost" onClick={() => navigate("/review")}>
              בוא נחזור על מה שהיה קשה
            </BigButton>
          )}
          <BigButton variant="ghost" onClick={() => navigate(`/map/${topic}`)}>
            חזרה למפה
          </BigButton>
        </div>
      </div>
    </div>
  );
}
