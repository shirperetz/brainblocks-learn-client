import { useNavigate, useSearchParams } from "react-router-dom";
import ContactForm from "../components/ContactForm";
import "../styles/pages/legal.css";

/**
 * 2026-11-14 (Shir: "a 'report a problem' button"): /contact?kind=problem&from=/play/ADDITION/2 - the
 * page the person came from is added to the message, so a problem can be found.
 */
export default function ContactPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kind = params.get("kind") || "problem";
  const from = params.get("from") || "";
  return (
    <div className="app-shell legal">
      <button className="back-button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>← חזרה</button>
      <article className="legal__body">
        <h1>{kind === "problem" ? "🐞 דיווח על בעיה" : "✉️ צור קשר"}</h1>
        <p>
          {kind === "problem"
            ? "משהו לא עבד? ספרו מה קרה ומה ניסיתם לעשות - ונבדוק. אפשר לכתוב גם בלי להיות רשומים."
            : "שאלה, רעיון או בקשה? כתבו לנו כאן. אפשר לכתוב גם בלי להיות רשומים."}
        </p>
        <ContactForm kind={kind} from={from} />
        <p className="legal__links">
          <a href="/privacy">מדיניות פרטיות</a> · <a href="/accessibility">הצהרת נגישות</a>
        </p>
      </article>
    </div>
  );
}
