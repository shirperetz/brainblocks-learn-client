import { useEffect, useState } from "react";
import { staffGivePractice, staffMeitzav, staffTomorrow, staffWeekly } from "../services/learnApi";
import { getTopic } from "../data/topics";
import MathText from "./MathText";
import Worksheet from "./Worksheet";
import "../styles/components/teacher-insights.css";

/**
 * 2026-11-21 (Shir chose): two cards on the teacher's class tab, built only from the class's real answers.
 * "מה ללמד מחר" - up to 3 skills the class finds hard, real exercises they got wrong (the lesson's
 * material) and 3 groups. "מוכנות למיצ״ב" - the 4 areas by the test's weights, every child, a 2-week plan.
 */
const topicName = (k) => getTopic(k)?.name ?? k;

/**
 * 2026-11-22 (Shir: "a weekly report for the teacher"): the last 7 days against the 7 before - who
 * practised and how much, who didn't, who improved or dropped (10+ answers each week), what is still hard.
 */
export function WeeklyCard({ classId }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    let alive = true;
    staffWeekly(classId).then((x) => alive && setD(x)).catch(() => alive && setD({ error: true }));
    return () => {
      alive = false;
    };
  }, [classId]);
  if (!d) return null;
  if (d.error) return <section className="staff-card ti"><h2>📅 השבוע בכיתה</h2><p className="ti__empty">לא הצלחנו לטעון כרגע.</p></section>;
  return (
    <section className="staff-card ti" aria-label="השבוע בכיתה">
      <h2>📅 השבוע בכיתה</h2>
      <p className="staff-card__hint">7 הימים האחרונים · {d.answers} תשובות · {d.pct}% נכון</p>
      <div className="ti__week">
        <div>
          <b>התאמנו ({d.practiced.length} מתוך {d.children})</b>
          <ul className="ti__list">
            {d.practiced.map((k) => (
              <li key={k.id}><span>{k.name}</span><span className="ti__muted">{k.answers} תרגילים{k.pct != null ? ` · ${k.pct}%` : ""}</span></li>
            ))}
          </ul>
          {d.practiced.length === 0 && <p className="ti__empty">אף אחד עוד לא התאמן השבוע.</p>}
        </div>
        <div>
          {d.notPracticed.length > 0 && <p><b>לא התאמנו:</b> {d.notPracticed.map((k) => k.name).join(", ")}</p>}
          {d.improved.length > 0 && <p><b>⭐ השתפרו:</b> {d.improved.map((k) => `${k.name} (${k.from}%→${k.to}%)`).join(", ")}</p>}
          {d.dropped.length > 0 && <p><b>⬇️ ירדו:</b> {d.dropped.map((k) => `${k.name} (${k.from}%→${k.to}%)`).join(", ")}</p>}
          {d.hard.length > 0 && <p><b>עדיין קשה:</b> {d.hard.map((h) => `${h.name} (${h.pct}%)`).join(" · ")}</p>}
          {d.improved.length === 0 && d.dropped.length === 0 && <p className="ti__muted">השוואה לשבוע שעבר מופיעה לילדים עם 10+ תשובות בכל שבוע.</p>}
        </div>
      </div>
    </section>
  );
}

export function TomorrowCard({ classId, className }) {
  const [d, setD] = useState(null);
  const [note, setNote] = useState("");
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    let alive = true;
    staffTomorrow(classId).then((x) => alive && setD(x)).catch(() => alive && setD({ focus: [], quiet: [], error: true }));
    return () => {
      alive = false;
    };
  }, [classId]);
  if (!d) return null;

  async function practiceFor(kids, topic) {
    let ok = 0;
    for (const k of kids) {
      try {
        await staffGivePractice(k.id, topic);
        ok++;
      } catch {
        /* one child failing doesn't stop the rest */
      }
    }
    setNote(`🎯 נשלח תרגול אישי ב${topicName(topic)} ל-${ok} ילדים`);
  }

  return (
    <section className="staff-card ti" aria-label="מה ללמד מחר">
      <h2>📋 מה ללמד מחר</h2>
      <p className="staff-card__hint">לפי התשובות של הכיתה ב-{d.days ?? 14} הימים האחרונים</p>
      {d.focus.some((f) => f.examples?.length) && (
        <button className="admin__btn ti__print" onClick={() => setPrinting(true)}>🖨️ דף עבודה להדפסה</button>
      )}
      {printing && <Worksheet focus={d.focus} className={className} onDone={() => setPrinting(false)} />}
      {d.focus.length === 0 && (
        <p className="ti__empty">{d.error ? "לא הצלחנו לטעון כרגע." : "אין כרגע משהו שרוב הכיתה מתקשה בו 🎉 (או שעוד אין מספיק תשובות)."}</p>
      )}
      {d.focus.map((f, i) => (
        <article key={f.skill} className="ti__focus">
          <header className="ti__head">
            <span className="ti__num" aria-hidden="true">{i + 1}</span>
            <div className="ti__title">
              <b>{f.name}</b>
              <span>{topicName(f.topic)} · {f.pct}% נכון בכיתה ({f.answers} תשובות)</span>
            </div>
            <span className={`ti__pct ${f.pct < 60 ? "is-low" : "is-mid"}`}>{f.pct}%</span>
          </header>
          {f.mistake?.name && f.mistake.name !== "-" && (
            <p className="ti__mistake">🔍 הטעות שחוזרת: <b>{f.mistake.name}</b> - {f.mistake.tip}</p>
          )}
          {f.examples?.length > 0 && (
            <div className="ti__examples">
              <span className="ti__label">תרגילים לשיעור (טעו בהם השבוע):</span>
              <ul>
                {f.examples.map((e) => (
                  <li key={e.text}>
                    <span className="ti__q"><MathText text={e.text} /></span>
                    <span className="ti__a">תשובה: <b>{e.right}</b>{e.given ? ` · ענו ${e.given}` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="ti__groups">
            <Group title="צריכים עזרה" tone="help" kids={f.groups.help} />
            <Group title="בדרך" tone="way" kids={f.groups.way} />
            <Group title="מוכנים להמשיך" tone="ready" kids={f.groups.ready} />
          </div>
          {f.groups.help.length > 0 && f.topic && (
            <button className="admin__btn ti__give" onClick={() => practiceFor(f.groups.help, f.topic)}>
              🎯 תרגול אישי ל"צריכים עזרה" ({f.groups.help.length})
            </button>
          )}
        </article>
      ))}
      {d.quiet?.length > 0 && (
        <p className="ti__quiet">💤 לא תרגלו ב-{d.days ?? 14} ימים: {d.quiet.map((k) => k.name).join(", ")}</p>
      )}
      {note && <p className="ti__note" role="status">{note}</p>}
    </section>
  );
}

function Group({ title, tone, kids }) {
  return (
    <div className={`ti__group ti__group--${tone}`}>
      <span className="ti__group-title">{title} <small>{kids.length}</small></span>
      {kids.length === 0 ? (
        <span className="ti__none">-</span>
      ) : (
        <span className="ti__kids">{kids.map((k) => `${k.name} ${k.pct}%`).join(" · ")}</span>
      )}
    </div>
  );
}

const LEVEL = {
  READY: { text: "מוכנים", cls: "ready" },
  ALMOST: { text: "כמעט", cls: "way" },
  REVIEW: { text: "צריך חזרה", cls: "help" },
  NODATA: { text: "עוד אין מספיק תרגול", cls: "none" },
};
const AREA_SHORT = { FRACTIONS: "שברים", WHOLE: "טבעיים", GEOMETRY: "גיאומטריה", DATA: "נתונים" };

export function MeitzavCard({ classId }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    let alive = true;
    staffMeitzav(classId).then((x) => alive && setD(x)).catch(() => alive && setD(null));
    return () => {
      alive = false;
    };
  }, [classId]);
  if (!d) return null;
  const lv = LEVEL[d.level] ?? LEVEL.NODATA;
  return (
    <section className="staff-card ti" aria-label="מוכנות למיצ״ב">
      <div className="ti__mz-top">
        <div>
          <h2>📝 מוכנות למיצ״ב</h2>
          <p className="staff-card__hint">לפי משקלי המבחן, מהתשובות של {d.days} הימים האחרונים</p>
        </div>
        <div className={`ti__score ti__score--${lv.cls}`}>
          <b>{d.score == null ? "-" : `${d.score}%`}</b>
          <span>{lv.text}</span>
          {d.score != null && d.areas.some((a) => a.pct == null) && (
            <small className="ti__missing">בלי: {d.areas.filter((a) => a.pct == null).map((a) => a.name).join(", ")}</small>
          )}
        </div>
      </div>
      <ul className="ti__areas">
        {d.areas.map((a) => (
          <li key={a.key}>
            <span className="ti__area-name">{a.name} <small>{a.weight}% מהמבחן</small></span>
            <span className="ti__bar" aria-hidden="true">
              <i style={{ width: `${a.pct ?? 0}%` }} className={a.pct == null ? "" : a.pct >= 80 ? "is-ready" : a.pct >= 60 ? "is-way" : "is-help"} />
            </span>
            <span className="ti__area-pct">{a.pct == null ? "לא תורגל" : `${a.pct}%`}</span>
          </li>
        ))}
      </ul>
      {d.plan?.length > 0 && (
        <div className="ti__plan">
          <span className="ti__label">תוכנית חזרה לשבועיים:</span>
          <ol>
            {d.plan.map((w) => (
              <li key={w.week}>
                <b>שבוע {w.week}: {w.area}</b>
                {w.pct == null ? " (עוד לא תורגל)" : ` (${w.pct}%)`}
                <span className="ti__topics">{w.topics.map(topicName).join(" · ")} + {w.meitzavRounds} סבבי "תרגול מיצ״ב"</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {d.children?.length > 0 && (
        <div className="ti__table-wrap">
          <table className="ti__table">
            <thead>
              <tr>
                <th>ילד/ה</th>
                <th>מוכנות</th>
                {Object.values(AREA_SHORT).map((n) => <th key={n}>{n}</th>)}
              </tr>
            </thead>
            <tbody>
              {d.children.map((c) => {
                const l = LEVEL[c.level] ?? LEVEL.NODATA;
                return (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td><span className={`ti__chip ti__chip--${l.cls}`}>{c.score == null ? l.text : `${c.score}% ${l.text}`}</span></td>
                    {Object.keys(AREA_SHORT).map((k) => <td key={k}>{c.areas[k] == null ? "·" : `${c.areas[k]}%`}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
