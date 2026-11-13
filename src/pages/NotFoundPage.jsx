import { useLocation, useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import "../styles/pages/legal.css";

/** 2026-11-14 (Shir): a friendly "not found" (was a silent jump to the home page). */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="app-shell not-found">
      <Mascot dolphin size="lg" play="sad" message="אופס! הדף הזה לא נמצא" />
      <h1 className="screen-title">הדף לא נמצא</h1>
      <p className="screen-subtitle">אולי הקישור ישן, או שהייתה טעות בהקלדה.</p>
      <div className="not-found__actions">
        <BigButton variant="green" onClick={() => navigate("/")}>🏠 לדף הבית</BigButton>
        <BigButton variant="ghost" onClick={() => navigate(`/contact?kind=problem&from=${encodeURIComponent(pathname)}`)}>
          🐞 לדווח על בעיה
        </BigButton>
      </div>
    </div>
  );
}
