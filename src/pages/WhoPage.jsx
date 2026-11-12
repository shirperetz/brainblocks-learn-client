import { useNavigate } from "react-router-dom";
import Mascot from "../components/Mascot";
import "../styles/pages/onboarding.css";
import "../styles/pages/room.css";

// 2026-11-12 (Shir: "when someone new comes in, it asks: a child or a teacher"): the first step of
// signing up. A child goes on as before (grade -> character -> username); a teacher signs up with a name,
// username and password and waits for Shir's approval. Laid out like the grade screen (Shir: "make it
// nice - stuck at the top it doesn't look good").
export default function WhoPage() {
  const navigate = useNavigate();
  return (
    <div className="app-shell who">
      <button className="back-button" onClick={() => navigate("/")}>← חזרה</button>
      <div className="onboarding who__body">
        <div className="onboarding__header">
          <Mascot dolphin size="md" message="שלום! מי מגיע/ה היום?" />
          <h1 className="screen-title">ברוכים הבאים!</h1>
          <p className="screen-subtitle">בוחרים מי נרשם/ת, ומתחילים</p>
        </div>
        <div className="who__choices" role="group" aria-label="מי נרשם/ת">
          <button className="who__card who__card--child" onClick={() => navigate("/grade")}>
            <span className="who__icon" aria-hidden="true">🧒</span>
            <span className="who__title">אני ילד/ה</span>
            <span className="who__sub">לשחק, לתרגל ולצבור כוכבים</span>
          </button>
          <button className="who__card who__card--teacher" onClick={() => navigate("/teacher-signup")}>
            <span className="who__icon" aria-hidden="true">👩‍🏫</span>
            <span className="who__title">אני מורה</span>
            <span className="who__sub">כיתות, דוחות וחדרי משחק</span>
          </button>
        </div>
        <p className="who__note">מורה נרשמת עם שם משתמש וסיסמה, ונכנסת אחרי שמנהלת האתר מאשרת.</p>
      </div>
    </div>
  );
}
