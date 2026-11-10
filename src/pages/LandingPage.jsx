import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import { useProfile } from "../context/profileStore";
import { startsOnIsland } from "../game/games";
import "../styles/pages/landing.css";

// Screen 1 — the warm welcome. One clear action: start playing.
export default function LandingPage() {
  const navigate = useNavigate();
  const { hasProfile, profile, loading } = useProfile();

  function handleStart() {
    // Returning child jumps straight in; a new child starts with the grade (then the character).
    navigate(hasProfile ? (startsOnIsland(profile?.grade) ? "/island" : "/topics") : "/grade");
  }

  return (
    <div className="landing">
      <div className="landing__sky" aria-hidden="true">
        <span className="landing__floaty landing__floaty--1">7</span>
        <span className="landing__floaty landing__floaty--2">⭐</span>
        <span className="landing__floaty landing__floaty--3">5</span>
        <span className="landing__floaty landing__floaty--4">➕</span>
        <span className="landing__floaty landing__floaty--5">🌟</span>
        <span className="landing__floaty landing__floaty--6">3</span>
      </div>

      <div className="landing__content">
        <Mascot avatarKey={profile?.avatar ?? "ROBOT"} size="lg" float message="שלום! בואו נלמד יחד" />

        <h1 className="screen-title landing__title">ברוכים הבאים לעולם החשבון</h1>
        <p className="screen-subtitle">לומדים חשבון בכיף, במשחקים ובשלבים</p>

        <div className="landing__actions">
          <BigButton variant="green" onClick={handleStart} disabled={loading}>
            בואו נתחיל לשחק
          </BigButton>
          {hasProfile && (
            <BigButton variant="ghost" onClick={() => navigate(startsOnIsland(profile?.grade) ? "/island" : "/topics")}>
              להמשיך מאיפה שהפסקתי
            </BigButton>
          )}
        </div>

        <button className="text-link landing__parents" onClick={() => navigate("/parent")}>
          להורים ולמורים
        </button>
      </div>
    </div>
  );
}
