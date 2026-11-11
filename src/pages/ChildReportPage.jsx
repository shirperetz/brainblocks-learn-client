import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import MathText from "../components/MathText";
import { useProfile } from "../context/profileStore";
import { getCharacter } from "../data/characters";
import { getGrade } from "../data/grades";
import { LEVELS, LEVEL_ORDER, TREND, levelOf, timeAgo, topicInfo } from "../data/progress";
import { staffReport } from "../services/learnApi";
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
    </div>
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
            {getGrade(c.grade)?.label ?? "בלי כיתה"} · @{c.username ?? "—"} · שיחק/ה {timeAgo(c.lastActiveAt)}
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
