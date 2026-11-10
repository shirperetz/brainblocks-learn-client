import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";

// Temporary screen for routes that are wired up but not built yet.
// Each milestone replaces these with the real page.
export default function Placeholder({ title }) {
  const navigate = useNavigate();
  return (
    <div className="app-shell" style={{ alignItems: "center", justifyContent: "center", gap: 22 }}>
      <h1 className="screen-title">{title}</h1>
      <p className="screen-subtitle">המסך הזה בבנייה — בקרוב נשחק כאן! 🛠️</p>
      <BigButton variant="ghost" onClick={() => navigate("/")}>
        חזרה לעמוד הראשי
      </BigButton>
    </div>
  );
}
