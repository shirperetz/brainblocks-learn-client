import { useNavigate } from "react-router-dom";
import ContactForm from "../components/ContactForm";
import "../styles/pages/legal.css";

export const ACCESSIBILITY_UPDATED = "14.11.2026";

/** 2026-11-14 (Shir: an accessibility statement before going public). Keep it true to the site. */
export default function AccessibilityPage() {
  const navigate = useNavigate();
  return (
    <div className="app-shell legal">
      <button className="back-button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>← חזרה</button>
      <article className="legal__body">
        <h1>הצהרת נגישות</h1>
        <p className="legal__updated">עודכן לאחרונה: {ACCESSIBILITY_UPDATED}</p>

        <p>
          חשוב לנו שכל ילד וילדה יוכלו לתרגל ב"עולם החשבון", וגם הורים ומורים. אנחנו פועלים כדי שהאתר יעמוד ברמה AA של
          הנחיות הנגישות לתכני אינטרנט (WCAG 2.1), שעליהן מבוסס התקן הישראלי 5568.
        </p>

        <h2>מה כבר נעשה</h2>
        <ul>
          <li>האתר כולו בעברית, מימין לשמאל, ומוגדר כך גם עבור קוראי מסך.</li>
          <li>אפשר להקריא כל שאלה בקול (כפתור 🔊 ליד השאלה), ובכיתות א׳–ב׳ ההקראה פועלת אוטומטית. אפשר לכבות ולהדליק בהגדרות.</li>
          <li>כפתורים גדולים ונוחים ללחיצה, והתאמה לטלפון, לטאבלט ולמחשב.</li>
          <li>אפשר להגדיל את התצוגה בעזרת הגדלה רגילה של הדפדפן או של הטלפון.</li>
          <li>אפשר לנווט במקלדת (Tab ו-Enter), והכפתור שנבחר מסומן במסגרת בולטת.</li>
          <li>לכפתורים שיש בהם רק סמל יש תיאור מילולי עבור קוראי מסך.</li>
          <li>אין הגבלת זמן בשלבים הרגילים. רק באתגר "60 שניות" יש שעון, והוא אתגר רשות.</li>
          <li>אחרי טעות מופיע הסבר במילים ובציור, ואפשר לבקש עזרה בכפתור "לא הבנתי".</li>
        </ul>

        <h2>מה עוד לא נגיש במלואו</h2>
        <ul>
          <li>"האי שלי" בתלת-ממד ומשחקי הציור באיים (למשל ספירת עצמים בתמונה) מבוססים על ציור, ולכן נוחים פחות לקורא מסך.</li>
          <li>לחלק מהציורים בשאלות יש תיאור קצר בלבד.</li>
        </ul>
        <p>אנחנו ממשיכים לשפר. אם משהו לא עובד בשבילכם - נשמח מאוד לדעת.</p>

        <h2 id="contact">פנייה בנושא נגישות</h2>
        <p>נתקלתם בבעיה, או שאתם צריכים עזרה כדי להשתמש באתר? כתבו לנו כאן, ונחזור אליכם בהקדם.</p>
        <ContactForm kind="accessibility" />

        <p className="legal__links">
          <a href="/privacy">מדיניות פרטיות</a>
        </p>
      </article>
    </div>
  );
}
