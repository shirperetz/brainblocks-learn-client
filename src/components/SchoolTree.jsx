import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGrade } from "../data/grades";
import { getCharacter } from "../data/characters";
import { adminMoveClass, adminSetTeacher, adminTree, staffCreateClass, staffDeleteClass, staffMoveChild } from "../services/learnApi";
import { GRADES } from "../data/grades";
import { ask } from "./dialog";

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
function ChildRow({ c, onOpen, onPromote, classOptions, onMove }) {
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
      {classOptions && (
        <select
          className="tree-child__move"
          value={c.classId ?? ""}
          onChange={(e) => onMove(c, e.target.value)}
          aria-label={`להעביר את ${c.name} לכיתה`}
        >
          <option value="">{c.classId ? "בלי כיתה" : "להעביר לכיתה…"}</option>
          {classOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      )}
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
  const [newClass, setNewClass] = useState(null); // { teacherId, name, grade }
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

  // 2026-11-12 (Shir: "I want to move Romi to Eti's class"): every child can be moved to any class here,
  // and a class can be opened for a teacher right under her card.
  async function moveChild(c, classId) {
    try {
      await staffMoveChild(c.id, classId ? Number(classId) : null);
      setMessage(classId ? `${c.name} הועבר/ה לכיתה` : `${c.name} יצא/ה מהכיתה`);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  // 2026-11-13 (Shir: "as the admin I add and delete classes for the teachers"): the children stay
  // (they move to "no class"); the class's code stops working.
  async function deleteClass(cls) {
    const lines = [`למחוק את הכיתה "${cls.name}"?`, ""];
    if (cls.children.length > 0) lines.push(`${cls.children.length} הילדים שבה לא יימחקו - הם יעברו ל"בלי כיתה".`);
    lines.push("הקוד של הכיתה יפסיק לעבוד. אי אפשר לבטל.");
    if (!await ask(lines.join("\n"))) return;
    try {
      await staffDeleteClass(cls.id);
      setMessage(`הכיתה ${cls.name} נמחקה`);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function createClass() {
    if (!newClass?.name?.trim()) return;
    try {
      await staffCreateClass(newClass.name.trim(), newClass.teacherId, newClass.grade || undefined);
      setMessage(`נפתחה כיתה ${newClass.name.trim()}`);
      setError("");
      setNewClass(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!tree) return error ? <p className="form-error">{error}</p> : <p className="play__loading">טוען...</p>;
  const openChild = (c) => navigate(`/staff/child/${c.id}`);
  const teachers = tree.teachers;
  const classOptions = teachers.flatMap((t) =>
    t.classes.map((cls) => ({ id: cls.id, label: `${cls.name} - ${t.name}` })));

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
                      <button type="button" className="admin__btn admin__btn--ghost admin__btn--danger" onClick={() => deleteClass(cls)}>
                        🗑️ מחיקת הכיתה
                      </button>
                    </div>
                    {cls.children.length === 0 ? (
                      <p className="staff-card__hint">עוד אין ילדים בכיתה.</p>
                    ) : (
                      <ul className="tree-children">
                        {cls.children.map((c) => (
                          <ChildRow key={c.id} c={c} onOpen={openChild} classOptions={classOptions} onMove={moveChild} />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {newClass?.teacherId === t.id ? (
                  <div className="tree-newclass">
                    <input
                      type="text"
                      placeholder="שם הכיתה, למשל ג׳2"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      aria-label="שם הכיתה"
                    />
                    <select value={newClass.grade} onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })} aria-label="כיתה">
                      <option value="">כל הכיתות</option>
                      {GRADES.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                    </select>
                    <button type="button" className="admin__btn" onClick={createClass} disabled={!newClass.name.trim()}>פתיחה</button>
                    <button type="button" className="admin__btn admin__btn--ghost" onClick={() => setNewClass(null)}>ביטול</button>
                  </div>
                ) : (
                  <button type="button" className="admin__btn" onClick={() => setNewClass({ teacherId: t.id, name: "", grade: "" })}>
                    ➕ כיתה חדשה ל{t.name}
                  </button>
                )}
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
                <ChildRow
                  key={c.id}
                  c={c}
                  onOpen={openChild}
                  classOptions={classOptions}
                  onMove={moveChild}
                  onPromote={(p) => setConfirm({ kind: "promote", person: p })}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
