import { useCallback, useEffect, useState } from "react";
import { adminErase, adminKeep, adminMessageDone, adminPrivacy } from "../services/learnApi";
import { ask } from "./dialog";

const when = (at) => new Date(at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

/** 2026-11-14 (privacy): the admin's tab - accounts that asked to be deleted, and messages from the site. */
export default function PrivacyAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    adminPrivacy().then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function erase(r) {
    const sure = await ask(`למחוק לצמיתות את ${r.name} (@${r.username}) ואת כל המידע שלו/ה? אי אפשר לשחזר (חוץ מהגיבוי הלילי, 14 יום).`, { okText: "מחיקה לצמיתות", danger: true });
    if (!sure) return;
    try {
      await adminErase(r.id);
      setNote(`✓ ${r.name} נמחק/ה עם כל המידע.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function keep(r) {
    await adminKeep(r.id).catch((e) => setError(e.message));
    setNote(`הבקשה של ${r.name} בוטלה - החשבון נשאר.`);
    load();
  }

  async function toggle(m) {
    await adminMessageDone(m.id, !m.done).catch((e) => setError(e.message));
    load();
  }

  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!data) return <p className="play__loading">טוען...</p>;
  const open = data.messages.filter((m) => !m.done);
  const closed = data.messages.filter((m) => m.done);
  return (
    <>
      {note && <p className="admin__message" role="status">{note}</p>}
      <section className="admin__card">
        <h2>🗑️ בקשות למחיקת חשבון ({data.deletionRequests.length})</h2>
        {data.deletionRequests.length === 0 ? (
          <p className="admin__hint">אין בקשות.</p>
        ) : (
          <ul className="audit-list">
            {data.deletionRequests.map((r) => (
              <li key={r.id} className="audit-row">
                <span className="audit-row__when">{when(r.requestedAt)}</span>
                <span className="audit-row__who">{r.teacher ? "👩‍🏫" : "🧒"} {r.name} · @{r.username}</span>
                <span className="audit-row__what">
                  <button className="admin__btn admin__btn--danger" onClick={() => erase(r)}>מחיקה לצמיתות</button>{" "}
                  <button className="admin__btn" onClick={() => keep(r)}>להשאיר</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="admin__card">
        <h2>✉️ פניות מהאתר ({open.length} פתוחות)</h2>
        <p className="admin__hint">מהטופס בדפי הפרטיות והנגישות. גם מי שלא רשום יכול לכתוב.</p>
        {data.messages.length === 0 && <p className="admin__hint">עוד אין פניות.</p>}
        <ul className="audit-list">
          {[...open, ...closed].map((m) => (
            <li key={m.id} className={`audit-row ${m.done ? "is-done" : ""}`} style={m.done ? { opacity: 0.55 } : undefined}>
              <span className="audit-row__when">{when(m.at)} · {m.kindLabel}</span>
              <span className="audit-row__who">
                {m.name || "בלי שם"}{m.reply ? ` · ${m.reply}` : ""}{m.account ? ` · @${m.account}` : ""}
              </span>
              <span className="audit-row__what" style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
              <button className="admin__btn" onClick={() => toggle(m)}>{m.done ? "להחזיר לפתוחות" : "✓ טופל"}</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
