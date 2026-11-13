import { useNavigate } from "react-router-dom";

/**
 * 2026-11-14 (Shir: "a short page for someone who arrives without an account"): under the welcome, only
 * for visitors who aren't logged in - what this is, for whom, and how to join. Also what Google reads.
 */
const FOR_KIDS = [
  ["🏝️", "איים ומשחקים", "עוברים מאי לאי, משחקים, אוספים כוכבים ובונים אי משלכם."],
  ["📚", "לפי תוכנית הלימודים", "מכיתה א׳ ועד ו׳: חיבור וחיסור, כפל, שברים, גאומטריה ועוד."],
  ["🤔", "עזרה כשלא מבינים", "אחרי טעות מופיע הסבר עם ציור, והתרגיל חוזר כדי להצליח."],
];
const FOR_ADULTS = [
  ["👩‍🏫", "למורים", "כיתה עם קוד, משימה שבועית, דוח לכל ילד ומה קשה לכל הכיתה, וחדר משחק חי בכיתה."],
  ["👨‍👩‍👧", "להורים", "חינם, בלי פרסומות ובלי מעקב. כל ילד רואה רק את שלו, והרשמה רק באישור הורה."],
];

export default function GuestIntro() {
  const navigate = useNavigate();
  return (
    <section className="guest-intro" aria-labelledby="guest-intro-title">
      <h2 id="guest-intro-title" className="guest-intro__title">מה יש בעולם החשבון?</h2>
      <div className="guest-intro__grid">
        {FOR_KIDS.map(([icon, title, text]) => (
          <div className="guest-intro__card" key={title}>
            <span className="guest-intro__icon" aria-hidden="true">{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="guest-intro__grid guest-intro__grid--two">
        {FOR_ADULTS.map(([icon, title, text]) => (
          <div className="guest-intro__card guest-intro__card--adult" key={title}>
            <span className="guest-intro__icon" aria-hidden="true">{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <h2 className="guest-intro__title">איך מצטרפים?</h2>
      <ol className="guest-intro__steps">
        <li><strong>מקבלים קוד</strong> מהמורה, או מבקשים ממנהלת האתר.</li>
        <li><strong>נרשמים</strong> עם הקוד - הורה מאשר/ת בתיבה בטופס.</li>
        <li><strong>מחכים לאישור</strong> של המורה או של מנהלת האתר, ומתחילים לשחק.</li>
      </ol>
      <div className="guest-intro__actions">
        <button className="guest-intro__btn" onClick={() => navigate("/who")}>להרשמה</button>
        <button className="guest-intro__btn guest-intro__btn--ghost" onClick={() => navigate("/parent")}>מורים: איך פותחים כיתה</button>
      </div>
    </section>
  );
}
