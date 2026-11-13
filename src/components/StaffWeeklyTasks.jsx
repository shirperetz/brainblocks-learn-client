import { useCallback, useEffect, useState } from "react";
import { getCharacter } from "../data/characters";
import { topicInfo } from "../data/progress";
import { TOPICS, isTopicAllowedForGrade } from "../data/topics";
import { GAMES } from "../game/games";
import * as api from "../services/learnApi";
import { ask } from "./dialog";

/**
 * 2026-11-12 (idea #5): the teacher's "📅 משימה שבועית" for one class - set "3 rounds of fractions
 * for 7 days", see who finished, cancel. The server checks it's her class and the class's grade.
 */
export default function StaffWeeklyTasks({ cls }) {
  const [tasks, setTasks] = useState(null);
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(3);
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(null); // task id whose children list is shown
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    api.staffAssignments(cls.id)
      .then((list) => alive && setTasks(list))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [cls.id, reload]);

  // The island games are for א׳-ב׳ (or a class without a grade); the topics by the class's grade.
  const gamesOk = !cls.grade || cls.grade === "G1" || cls.grade === "G2";
  const options = [
    ...(gamesOk ? GAMES.filter((g) => g.ready).map((g) => ({ key: g.topic, emoji: g.emoji, name: g.name })) : []),
    ...TOPICS.filter((t) => isTopicAllowedForGrade(t.key, cls.grade)),
  ];

  async function act(fn, text) {
    try {
      await fn();
      setMessage(text);
      setError("");
      refresh();
    } catch (e) {
      setError(e.message);
      setMessage("");
    }
  }

  const running = (tasks ?? []).filter((t) => t.active);
  const ended = (tasks ?? []).filter((t) => !t.active);

  return (
    <section className="staff-card">
      <h2>📅 משימה שבועית · {cls.name}</h2>
      <p className="staff-card__hint">
        הילדים בכיתה רואים את המשימה במסך הנושאים עם פס התקדמות. נחשב רק סבב רגיל של הנושא שבו ענו נכון על חצי
        לפחות. עד 3 משימות בבת אחת.
      </p>
      {message && <p className="admin__message" role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {tasks === null ? (
        <p className="staff__loading">טוען...</p>
      ) : (
        <>
          {running.length === 0 && <p className="staff-card__empty">אין משימה פעילה.</p>}
          <ul className="tasks">
            {[...running, ...ended].map((t) => {
              const info = topicInfo(t.topic);
              return (
                <li key={t.id} className={`task${t.active ? "" : " is-ended"}`}>
                  <button className="task__head" onClick={() => setOpen(open === t.id ? null : t.id)}
                    aria-expanded={open === t.id}>
                    <span aria-hidden="true">{info.emoji}</span>
                    <strong>{t.rounds} סבבים · {info.name}</strong>
                    <small>
                      {t.finished}/{t.total} סיימו · {t.active ? `עד ${shortDate(t.endDate)}` : `הסתיימה ${shortDate(t.endDate)}`}
                    </small>
                  </button>
                  {open === t.id && (
                    <ul className="task__kids">
                      {t.children.length === 0 && <li>אין עדיין ילדים מאושרים בכיתה.</li>}
                      {t.children.map((c) => (
                        <li key={c.childId} className={c.done >= t.rounds ? "is-done" : c.done === 0 ? "is-none" : ""}>
                          <span aria-hidden="true">{getCharacter(c.avatar).emoji}</span> {c.name}
                          <b>{c.done >= t.rounds ? "✔" : `${c.done}/${t.rounds}`}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                  {t.active && (
                    <button className="admin__btn admin__btn--ghost task__cancel"
                      onClick={async () => await ask(`לבטל את המשימה "${info.name}"? הילדים לא יראו אותה יותר.`) &&
                        act(() => api.staffCancelAssignment(t.id), "המשימה בוטלה")}>
                      ביטול
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {running.length < 3 && (
            <div className="admin__row">
              <select className="class-row__grade" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="נושא המשימה">
                <option value="">בחרי נושא</option>
                {options.map((o) => (
                  <option key={o.key} value={o.key}>{o.emoji} {o.name}</option>
                ))}
              </select>
              <select className="class-row__grade" value={rounds} onChange={(e) => setRounds(Number(e.target.value))} aria-label="כמה סבבים">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "סבב" : "סבבים"}</option>
                ))}
              </select>
              <select className="class-row__grade" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="לכמה ימים">
                {[3, 5, 7, 10, 14].map((n) => (
                  <option key={n} value={n}>ל-{n} ימים</option>
                ))}
              </select>
              <button className="admin__btn" disabled={!topic}
                onClick={() => act(async () => {
                  await api.staffCreateAssignment(cls.id, { topic, rounds, days });
                  setTopic("");
                }, "המשימה נשלחה לכיתה")}>
                + משימה
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function shortDate(iso) {
  const [, m, d] = String(iso).split("-");
  return `${Number(d)}.${Number(m)}`;
}
