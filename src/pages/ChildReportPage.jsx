import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import MathText from "../components/MathText";
import { useProfile } from "../context/profileStore";
import { getCharacter } from "../data/characters";
import { GRADES, getGrade } from "../data/grades";
import { LEVELS, LEVEL_ORDER, TREND, levelOf, timeAgo, topicInfo } from "../data/progress";
import { staffMe, staffMoveChild, staffReport, staffSetGrade, staffSetPassword } from "../services/learnApi";
import "../styles/pages/staff.css";

// 2026-11-11 (Shir: "the children's results - what she finds hard and what she doesn't - really
// organised, designed properly"): one child, for the teacher / the admin. Everything is computed on
// the server from the saved answers (no AI); this page only lays it out.
export default function ChildReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [openTopic, setOpenTopic] = useState(null);

  useEffect(() => {
    if (!profile || !(profile.admin || profile.teacher)) return undefined;
    let alive = true;
    staffReport(id)
      .then((r) => alive && setReport(r))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id, profile]);

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace state={{ next: `/staff/child/${id}` }} />;
  if (!(profile.admin || profile.teacher)) return <Navigate to="/" replace />;

  return (
    <div className="app-shell staff">
      <button className="back-button" onClick={() => navigate("/staff")}>
        ← לכל הילדים
      </button>
      {error && <p className="form-error">{error}</p>}
      {!report && !error && <p className="staff__loading">טוען...</p>}
      {report && <Report report={report} openTopic={openTopic} setOpenTopic={setOpenTopic} />}
      {report && <NewPassword key={`p${report.child.id}`} child={report.child} />}
      {report && (
        <MoveClass
          key={`c${report.child.id}`}
          child={report.child}
          onSaved={(changes) => setReport({ ...report, child: { ...report.child, ...changes } })}
        />
      )}
      {report && (
        <GradeLock
          key={`${report.child.id}-${report.child.grade}-${report.child.gradeLocked}-${report.child.gradeChangeAllowed}`}
          child={report.child}
          admin={Boolean(profile.admin)}
          onSaved={(changes) => setReport({ ...report, child: { ...report.child, ...changes } })}
        />
      )}
    </div>
  );
}

/**
 * 2026-11-12 (Shir: "the option to switch classes - for me as admin and for the teachers"): which class
 * the child is in. A teacher sees only her own classes; the admin all of them + "בלי כיתה". A class
 * that practices one grade gives it to the child, locked (the server does it).
 */
/**
 * 2026-11-12 (Shir: a teacher gets "a new password for a child" - only for her own children; the server
 * checks it's hers): a child who forgot the password gets a new one from its teacher.
 */
function NewPassword({ child }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    try {
      await staffSetPassword(child.id, { password });
      setMsg(`הסיסמה של ${child.name} הוחלפה. תמסרי לו/ה: ${password}`);
      setErr("");
      setPassword("");
    } catch (e) {
      setErr(e.message);
      setMsg("");
    }
  }

  return (
    <section className="staff-card">
      <h2>🔑 סיסמה חדשה ל{child.name}</h2>
      <p className="staff-card__hint">כשילד/ה שוכח/ת סיסמה. שם המשתמש: <b dir="ltr">{child.username ?? "—"}</b></p>
      <div className="admin__row">
        <input className="admin__input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמה חדשה (לפחות 6)" aria-label="סיסמה חדשה" autoComplete="off" />
        <button className="admin__btn" disabled={password.length < 6} onClick={save}>שמירה</button>
      </div>
      {msg && <p className="admin__message" role="status">{msg}</p>}
      {err && <p className="form-error">{err}</p>}
    </section>
  );
}

function MoveClass({ child, admin, onSaved }) {
  const [classes, setClasses] = useState(null);
  const [target, setTarget] = useState(child.classId ?? 0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    staffMe()
      .then((m) => alive && setClasses(m.classes ?? []))
      .catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (!classes) return null;
  const current = classes.find((c) => c.id === child.classId);
  const options = [...(admin ? [{ id: 0, name: "בלי כיתה (שלי)" }] : []), ...classes];
  const changed = Number(target) !== (child.classId ?? 0);

  async function save() {
    const to = options.find((c) => c.id === Number(target));
    if (!window.confirm(`להעביר את ${child.name} ל${to?.name ?? "כיתה"}?`)) return;
    try {
      const p = await staffMoveChild(child.id, Number(target));
      onSaved({ classId: p.classId ?? null, grade: p.grade, gradeLocked: p.gradeLocked });
      setMsg(`${child.name} עבר/ה ל${to?.name ?? ""}`);
      setErr("");
    } catch (e) {
      setErr(e.message);
      setMsg("");
    }
  }

  return (
    <section className="staff-card">
      <h2>🏫 הכיתה של {child.name}</h2>
      <p className="staff-card__hint">
        עכשיו: <b>{current?.name ?? (child.classId ? "כיתה של מורה אחרת" : "בלי כיתה")}</b>.
        {" "}אם לכיתה החדשה יש כיתת תרגול קבועה, הילד/ה מקבל/ת אותה נעולה.
      </p>
      <div className="admin__row">
        <select className="class-row__grade" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="להעביר לכיתה">
          {!options.some((o) => o.id === (child.classId ?? 0)) && <option value={child.classId ?? 0}>{current?.name ?? "הכיתה הנוכחית"}</option>}
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.teacherName && admin ? ` · ${c.teacherName}` : ""}</option>
          ))}
        </select>
        <button className="admin__btn" onClick={save} disabled={!changed}>העברה</button>
      </div>
      {msg && <p className="admin__message" role="status">{msg}</p>}
      {err && <p className="form-error">{err}</p>}
    </section>
  );
}

/**
 * 2026-11-12 (Shir: "limit the child - tell him which grade to practice, not all grades"): the grade
 * this child practices, locked or open. The server enforces it (topics + questions + saved rounds).
 */
function GradeLock({ child, onSaved }) {
  const [grade, setGrade] = useState(child.grade ?? "");
  const [locked, setLocked] = useState(Boolean(child.gradeLocked));
  // 2026-11-12 (Shir): may the child change its own grade - the admin or the teacher decides (default yes).
  const [mayChange, setMayChange] = useState(Boolean(child.gradeChangeAllowed));
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const changed = grade !== (child.grade ?? "") || locked !== Boolean(child.gradeLocked)
    || mayChange !== Boolean(child.gradeChangeAllowed);

  async function save() {
    try {
      const p = await staffSetGrade(child.id, { grade: grade || undefined, locked, changeAllowed: mayChange });
      onSaved({ grade: p.grade, gradeLocked: p.gradeLocked, gradeChangeAllowed: p.gradeChangeAllowed });
      setMsg(locked ? `נשמר: ${child.name} מתרגל/ת רק ${getGrade(grade)?.label ?? ""}` : "נשמר: הכיתה פתוחה לבחירה");
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <section className="staff-card grade-lock">
      <h2>🎓 הכיתה שהילד/ה מתרגל/ת</h2>
      <p className="staff-card__hint">בנעילה הילד/ה לא יכול/ה להחליף כיתה, ומקבל/ת רק את הנושאים של הכיתה הזאת.</p>
      <div className="grade-lock__grades" role="radiogroup" aria-label="כיתה">
        {GRADES.map((g) => (
          <button
            key={g.key}
            type="button"
            role="radio"
            aria-checked={grade === g.key}
            className={`grade-lock__grade ${grade === g.key ? "is-on" : ""}`}
            onClick={() => setGrade(g.key)}
          >
            {g.letter}
          </button>
        ))}
      </div>
      <label className="grade-lock__lock">
        <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} disabled={!grade} />
        🔒 לנעול על הכיתה הזאת
      </label>
      <label className="grade-lock__lock">
        <input type="checkbox" checked={mayChange} onChange={(e) => setMayChange(e.target.checked)} disabled={locked} />
        🔄 מותר לילד/ה להחליף כיתה בעצמו/ה
      </label>
      {msg && <p className="admin__message" role="status">{msg}</p>}
      {err && <p className="form-error">{err}</p>}
      <button className="admin__btn" onClick={save} disabled={!changed}>
        שמירה
      </button>
    </section>
  );
}

function Report({ report, openTopic, setOpenTopic }) {
  const c = report.child;
  const me = getCharacter(c.avatar);
  const trend = TREND[report.trendDirection] ?? TREND.UNKNOWN;
  const rec = report.recommendation;
  const skillsByTopic = (topic) => report.skills.filter((s) => s.topic === topic);

  return (
    <>
      {/* ---- who ---- */}
      <section className="report-hero">
        <span className="report-hero__avatar" style={{ background: me.color }} aria-hidden="true">
          {me.emoji}
        </span>
        <div className="report-hero__who">
          <h1>{c.name}</h1>
          <p>
            {getGrade(c.grade)?.label ?? "בלי כיתה"}
            {c.gradeLocked ? " 🔒" : ""} · @{c.username ?? "—"} · שיחק/ה {timeAgo(c.lastActiveAt)}
          </p>
        </div>
        <Link className="report-hero__island" to={`/staff/child/${c.id}/island`} title="האי שבנה/תה">
          🏝️ <small>האי</small>
        </Link>
        <div className="report-hero__streak" title="ימים ברצף באתגר היומי">
          🔥 {c.dailyStreak}
        </div>
      </section>

      {report.attention.length > 0 && (
        <section className="attention" aria-label="צריך תשומת לב">
          {report.attention.map((a) => (
            <span key={a} className="attention__chip">⚠️ {a}</span>
          ))}
        </section>
      )}

      {/* ---- this week ---- */}
      <section className="tiles" aria-label="השבוע">
        <Tile value={report.week.minutes} unit="דק׳" label="תרגול השבוע" />
        <Tile value={report.week.rounds} label="סבבים השבוע" />
        <Tile value={report.week.answers ? `${report.week.pct}%` : "—"} label="הצלחה השבוע" />
        <Tile value={`⭐ ${report.stars}`} label={`${report.stagesCompleted} שלבים הושלמו`} />
      </section>

      {/* ---- what to do next ---- */}
      {rec && (
        <section className={`recommend recommend--${(rec.kind ?? "START").toLowerCase()}`}>
          <span className="recommend__icon" aria-hidden="true">
            {rec.kind === "PRACTICE" ? "🎯" : rec.kind === "CONTINUE" ? "🚀" : "👋"}
          </span>
          <div>
            <strong>{rec.kind === "PRACTICE" ? "ההמלצה שלי" : rec.kind === "CONTINUE" ? "הכל טוב!" : "עוד לא התחלנו"}</strong>
            <p>
              {rec.text}
              {rec.topic && ` · ${topicInfo(rec.topic).emoji} ${topicInfo(rec.topic).name}`}
            </p>
          </div>
        </section>
      )}

      {/* ---- hard / strong ---- */}
      <div className="two-col">
        <section className="staff-card">
          <h2>🆘 מתקשה ב...</h2>
          {report.hard.length === 0 ? (
            <p className="staff-card__empty">אין משהו שהוא/היא מתקשה בו כרגע 🎉</p>
          ) : (
            <ul className="skill-list">
              {report.hard.map((s) => (
                <SkillRow key={s.skill} s={s} withExample />
              ))}
            </ul>
          )}
        </section>
        <section className="staff-card">
          <h2>💪 חזק ב...</h2>
          {report.strong.length === 0 ? (
            <p className="staff-card__empty">עוד מעט נדע - צריך עוד כמה תשובות</p>
          ) : (
            <ul className="skill-list">
              {report.strong.map((s) => (
                <SkillRow key={s.skill} s={s} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ---- trend ---- */}
      <section className="staff-card">
        <div className="staff-card__head">
          <h2>📊 4 שבועות אחרונים</h2>
          <span className={`trend-badge ${trend.className}`}>
            {trend.emoji} {trend.label}
          </span>
        </div>
        <TrendBars weeks={report.trend} />
      </section>

      {/* ---- by topic ---- */}
      <section className="staff-card">
        <h2>🗺️ לפי נושא</h2>
        <Legend />
        {report.topics.length === 0 ? (
          <p className="staff-card__empty">עוד לא שיחק/ה באף נושא</p>
        ) : (
          <ul className="topic-grid">
            {report.topics.map((t) => {
              const info = topicInfo(t.topic);
              const lvl = levelOf(t.level);
              const open = openTopic === t.topic;
              const skills = skillsByTopic(t.topic);
              return (
                <li key={t.topic} className={`topic-tile ${lvl.className}${open ? " is-open" : ""}`}>
                  <button
                    className="topic-tile__btn"
                    onClick={() => setOpenTopic(open ? null : t.topic)}
                    aria-expanded={open}
                    disabled={skills.length === 0}
                  >
                    <span className="topic-tile__emoji" aria-hidden="true">{info.emoji}</span>
                    <span className="topic-tile__name">{info.name}</span>
                    <span className="topic-tile__level">
                      {lvl.label}
                      {t.answered >= 4 && ` · ${t.pct}%`}
                    </span>
                    <span className="topic-tile__meta">
                      שלב {t.highestStage || 1}/6 · ⭐ {t.stars}
                    </span>
                  </button>
                  {open && (
                    <ul className="skill-list skill-list--inner">
                      {skills.map((s) => (
                        <SkillRow key={s.skill} s={s} withExample={s.level === "HARD"} />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="staff__foot">
        {report.openMistakes} טעויות עוד מחכות לחזרה במסך &quot;חזרה על טעויות&quot; של הילד/ה. המדידה לפי 20 התשובות
        האחרונות בכל מיומנות, כך שמי שהשתפר/ה לא נשאר/ת &quot;מתקשה&quot;.
      </p>
    </>
  );
}

function Tile({ value, unit, label }) {
  return (
    <div className="tile">
      <span className="tile__value">
        {value}
        {unit && <small> {unit}</small>}
      </span>
      <span className="tile__label">{label}</span>
    </div>
  );
}

function SkillRow({ s, withExample }) {
  const lvl = levelOf(s.level);
  return (
    <li className={`skill-row ${lvl.className}`}>
      <div className="skill-row__top">
        <span className="skill-row__name">{s.name}</span>
        <span className="skill-row__score">
          {s.correct}/{s.answered}
        </span>
      </div>
      <div className="meter" role="img" aria-label={`${s.pct}% נכון`}>
        <span style={{ width: `${Math.max(4, s.pct)}%` }} />
      </div>
      <div className="skill-row__meta">
        {topicInfo(s.topic).emoji} {topicInfo(s.topic).name} · שלב {s.stage}
        {s.hints > 0 && ` · ${s.hints} פעמים "לא הבנתי"`}
      </div>
      {withExample && s.example && (
        <div className="mistake">
          <MathText text={s.example.question} />
          <span className="mistake__label">
            ענה/תה: <span className="mistake__given">{s.example.given}</span>
          </span>
          <span className="mistake__label">
            נכון: <span className="mistake__right">{s.example.correct}</span>
          </span>
        </div>
      )}
    </li>
  );
}

function TrendBars({ weeks }) {
  return (
    <div className="trend">
      {weeks.map((w, i) => {
        const pct = w.pct;
        const label = i === weeks.length - 1 ? "השבוע" : i === weeks.length - 2 ? "שבוע שעבר" : `לפני ${weeks.length - 1 - i} שב׳`;
        const lvl = pct == null ? "lvl-none" : pct >= 85 ? "lvl-strong" : pct >= 60 ? "lvl-ok" : "lvl-hard";
        return (
          <div key={w.weekStart} className="trend__col">
            <span className="trend__pct">{pct == null ? "—" : `${pct}%`}</span>
            <div className="trend__track">
              <span className={`trend__bar ${lvl}`} style={{ height: `${pct == null ? 0 : Math.max(6, pct)}%` }} />
            </div>
            <span className="trend__label">{label}</span>
            <span className="trend__n">{w.answered} תשובות</span>
          </div>
        );
      })}
    </div>
  );
}

export function Legend() {
  return (
    <ul className="legend" aria-label="מקרא">
      {LEVEL_ORDER.filter((k) => k !== "NONE").map((k) => (
        <li key={k} className={LEVELS[k].className}>
          <span className="legend__dot" /> {LEVELS[k].label}
          <small> - {LEVELS[k].long}</small>
        </li>
      ))}
    </ul>
  );
}
