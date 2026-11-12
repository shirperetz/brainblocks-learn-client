import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGrade } from "../data/grades";
import { getCharacter } from "../data/characters";
import { adminMoveClass, adminSetTeacher, adminTree } from "../services/learnApi";

function ago(iso) {
  if (!iso) return "עוד לא שיחק/ה";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min <= 1 ? "עכשיו" : `לפני ${min} דק׳`;
  const h = Math.round(min / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.round(h / 24);
  return d === 1 ? "אתמול" : `לפני ${d} ימים`;
}

/** One child row: avatar, name, grade, stars, last played - tap opens the child's report. */
function ChildRow({ c, onOpen, onPromote }) {
  const ch = getCharacter(c.avatar);
  return (
    <li className="tree-child">
      <button type="button" className="tree-child__main" onClick={() => onOpen(c)}>
        <span className="tree-child__avatar" style={{ background: ch.color }} aria-hidden="true">{ch.emoji}</span>
        <span className="tree-child__name">
          {c.name}
          {!c.approved && !c.disabled && <small className="tree-tag tree-tag--wait">ממתין/ה לאישור</small>}
          {c.disabled && <small className="tree-tag">חסום/ה</small>}
        </span>
        <span className="tree-child__meta">
          {getGrade(c.grade)?.label ?? "בלי כיתה"} · ⭐ {c.stars} · {ago(c.lastActiveAt)}
        </span>
      </button>
      {onPromote && (
        <button type="button" className="admin__btn admin__btn--ghost tree-child__promote" onClick={() => onPromote(c)}>
          👩‍🏫 להפוך למורה
        </button>
      )}
    </li>
  );
}

/**
 * 2026-11-12 (Shir: "in the admin screen I make my users teachers, and under the teachers the children
 * of their class - I click the teacher and the students appear - do what you think is really good"):
 * teacher cards -> tap -> her classes -> the children; "children without a teacher"; make a user a
 * teacher (with a confirm), back to student, give a class to another teacher.
 */
export default function SchoolTree() {
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [open, setOpen] = useState({}); // teacher id -> true
  const [confirm, setConfirm] = useState(null); // { kind: "promote"|"demote", person }
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminTree().then(setTree).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function doConfirm() {
    const { kind, person } = confirm;
    setConfirm(null);
    try {
      await adminSetTeacher(person.id, kind === "promote");
      setMessage(kind === "promote" ? `${person.name} עכשיו מורה 👩‍🏫` : `${person.name} חזר/ה להיות תלמיד/ה`);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function moveClass(cls, teacherId) {
    try {
      await adminMoveClass(cls.id, Number(teacherId));
      setMessage(`הכיתה ${cls.name} הועברה`);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!tree) return error ? <p className="form-error">{error}</p> : <p className="play__loading">טוען...</p>;
  const openChild = (c) => navigate(`/staff/child/${c.id}`);
  const teachers = tree.teachers;

  return (
    <div className="tree">
      {message && <p className="admin__message" role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {confirm && (
        <div className="tree-confirm" role="alertdialog" aria-label="אישור">
          <p>
            {confirm.kind === "promote"
              ? `להפוך את ${confirm.person.name} למורה? היא/הוא יוכל/תוכל לפתוח כיתות ולראות את התלמידים שלה/ו.`
              : `להחזיר את ${confirm.person.name} להיות תלמיד/ה?`}
          </p>
          <div className="admin__row">
            <button type="button" className="admin__btn" onClick={doConfirm}>כן</button>
            <button type="button" className="admin__btn admin__btn--ghost" onClick={() => setConfirm(null)}>ביטול</button>
          </div>
        </div>
      )}

      {teachers.map((t) => {
        const isOpen = Boolean(open[t.id]);
        return (
          <section key={t.id} className={`tree-teacher ${isOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="tree-teacher__head"
              onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))}
              aria-expanded={isOpen}
            >
              <span className="tree-teacher__icon" aria-hidden="true">{t.admin ? "👑" : "👩‍🏫"}</span>
              <span className="tree-teacher__name">
                {t.name} {t.admin && <small className="tree-tag">מנהלת</small>}
                {!t.admin && !t.approved && <small className="tree-tag tree-tag--wait">ממתינה לאישור</small>}
              </span>
              <span className="tree-teacher__count">
                {t.classes.length} כיתות · {t.childCount} תלמידים
              </span>
              <span className="tree-teacher__chev" aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="tree-teacher__body">
                {t.classes.length === 0 && <p className="staff-card__hint">עוד אין לה כיתות.</p>}
                {t.classes.map((cls) => (
                  <div key={cls.id} className="tree-class">
                    <div className="tree-class__head">
                      <strong>🏫 {cls.name}</strong>
                      {cls.grade && <span className="tree-tag">{getGrade(cls.grade)?.label}</span>}
                      <span className="tree-class__count">{cls.children.length} תלמידים</span>
                      <label className="tree-class__move">
                        <span>להעביר ל:</span>
                        <select value={t.id} onChange={(e) => moveClass(cls, e.target.value)}>
                          {teachers.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {cls.children.length === 0 ? (
                      <p className="staff-card__hint">עוד אין ילדים בכיתה.</p>
                    ) : (
                      <ul className="tree-children">
                        {cls.children.map((c) => <ChildRow key={c.id} c={c} onOpen={openChild} />)}
                      </ul>
                    )}
                  </div>
                ))}
                {!t.admin && (
                  <button type="button" className="admin__btn admin__btn--ghost" onClick={() => setConfirm({ kind: "demote", person: t })}>
                    ↩️ להחזיר לתלמיד/ה
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}

      <section className="tree-teacher is-open tree-teacher--none">
        <div className="tree-teacher__head tree-teacher__head--static">
          <span className="tree-teacher__icon" aria-hidden="true">🧒</span>
          <span className="tree-teacher__name">ילדים בלי מורה</span>
          <span className="tree-teacher__count">{tree.noTeacher.length} תלמידים</span>
        </div>
        <div className="tree-teacher__body">
          {tree.noTeacher.length === 0 ? (
            <p className="staff-card__hint">כל הילדים שייכים לכיתה של מורה 🎉</p>
          ) : (
            <ul className="tree-children">
              {tree.noTeacher.map((c) => (
                <ChildRow key={c.id} c={c} onOpen={openChild} onPromote={(p) => setConfirm({ kind: "promote", person: p })} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
