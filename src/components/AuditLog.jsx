import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient";

/**
 * 2026-11-13 (Shir: security - "a log of who did what"): the staff's changes, newest first, in plain
 * Hebrew. The server records method + path of every successful change; this page names them.
 */
const RULES = [
  [/children\/\d+\/approve$/, "אישרה ילד/ה"],
  [/children\/\d+\/disabled$/, "חסמה / ביטלה חסימה"],
  [/children\/\d+\/password$/, "שינתה סיסמה"],
  [/children\/\d+\/grade$/, "שינתה כיתה (שכבה)"],
  [/children\/\d+\/class$/, "העבירה ילד/ה לכיתה"],
  [/children\/\d+\/practice$/, "נתנה תרגול אישי"],
  [/teachers\/\d+\/approve$/, "אישרה מורה"],
  [/teachers\/\d+\/disabled$/, "חסמה / ביטלה חסימה של מורה"],
  [/teachers\/\d+\/max-students$/, "קבעה מקסימום תלמידים למורה"],
  [/class-requests\/\d+\/accept$/, "אישרה בקשת הצטרפות לכיתה"],
  [/class-requests\/\d+\/decline$/, "דחתה בקשת הצטרפות לכיתה"],
  [/classes\/\d+\/assignments$/, "נתנה משימה שבועית"],
  [/assignments\/\d+\/cancel$/, "ביטלה משימה"],
  [/^.*\/classes\/\d+$/, null], // PATCH / DELETE - by method below
  [/classes$/, "פתחה כיתה חדשה"],
  [/teacher-code$/, "שינתה את קוד המורים"],
  [/join-code$/, "שינתה את קוד ההצטרפות"],
  [/admin\/tree\/.*teacher/, "שינתה מורה/תלמיד"],
  [/admin\/tree\/classes\/\d+/, "העבירה כיתה למורה אחרת"],
];

function describe(e) {
  if (/\/classes\/\d+$/.test(e.path)) return e.method === "DELETE" ? "מחקה כיתה" : "שינתה הגדרות כיתה";
  for (const [re, text] of RULES) if (text && re.test(e.path)) return text;
  return `${e.method} ${e.path.replace("/api/learn/", "")}`;
}

export default function AuditLog() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest("/api/learn/admin/audit").then(setRows).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="form-error">{error}</p>;
  if (!rows) return <p className="play__loading">טוען...</p>;
  return (
    <section className="admin__card">
      <h2>📜 יומן פעולות</h2>
      <p className="admin__hint">כל שינוי שעשו המנהלת והמורים - מי, מה ומתי (300 האחרונים).</p>
      {rows.length === 0 ? (
        <p className="admin__hint">עוד אין פעולות ביומן.</p>
      ) : (
        <ul className="audit-list">
          {rows.map((e, i) => (
            <li key={i} className="audit-row">
              <span className="audit-row__when">{new Date(e.at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}</span>
              <span className="audit-row__who">{e.actorRole === "מורה" ? "👩‍🏫" : "👑"} {e.actor}</span>
              <span className="audit-row__what">{describe(e)}{e.target ? ` · ${e.target}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
