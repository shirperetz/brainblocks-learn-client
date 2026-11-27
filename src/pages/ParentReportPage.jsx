import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCharacter } from "../data/characters";
import { getGrade } from "../data/grades";
import { TREND, topicInfo } from "../data/progress";
import { parentView } from "../services/learnApi";
import "../styles/pages/staff.css";

/**
 * 2026-11-26 (Shir: idea #9): what a parent sees from the teacher's link - read-only, no log-in.
 * Short and warm: this week, what goes well, where to help at home (with the tip), no other children.
 */
export default function ParentReportPage() {
  const { code } = useParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    parentView(code).then((x) => alive && setR(x)).catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [code]);

  if (err) {
    return (
      <div className="app-shell staff parent-report">
        <section className="staff-card">
          <h1>👪 דוח להורים</h1>
          <p>{err}</p>
        </section>
      </div>
    );
  }
  if (!r) return <div className="app-shell staff parent-report"><p className="play__loading">טוען את הדוח...</p></div>;

  const trend = TREND[r.trendDirection] ?? TREND.UNKNOWN;
  const w = r.week ?? {};
  return (
    <div className="app-shell staff parent-report">
      <header className="staff-card parent-report__head">
        <span className="parent-report__avatar" aria-hidden="true">{getCharacter(r.avatar)?.emoji ?? "🙂"}</span>
        <div>
          <h1>הדוח של {r.name}</h1>
          <p className="staff-card__hint">{getGrade(r.grade)?.label ?? ""} · עולם החשבון · השבוע האחרון</p>
        </div>
      </header>

      <section className="staff-card">
        <h2>📅 השבוע</h2>
        {w.rounds ? (
          <ul className="parent-report__stats">
            <li><b>{w.rounds}</b> סבבים</li>
            <li><b>{w.minutes}</b> דקות</li>
            <li><b>{w.answers}</b> תרגילים</li>
            <li><b>{w.pct}%</b> נכון</li>
          </ul>
        ) : (
          <p>השבוע {r.name} עוד לא תרגל/ה. עשר דקות ביום עושות הבדל גדול 🙂</p>
        )}
        <p>{trend.emoji} {trend.label}{r.dailyStreak > 1 ? ` · 🔥 ${r.dailyStreak} ימים ברצף` : ""} · ⭐ {r.stars ?? 0} כוכבים</p>
      </section>

      {r.strong?.length > 0 && (
        <section className="staff-card">
          <h2>💪 הולך טוב</h2>
          <ul className="parent-report__list">
            {r.strong.slice(0, 5).map((s) => <li key={s.skill}>{topicInfo(s.topic).emoji} {s.name}</li>)}
          </ul>
        </section>
      )}

      {(r.hard?.length > 0 || r.patterns?.length > 0) && (
        <section className="staff-card">
          <h2>🤝 איפה אפשר לעזור בבית</h2>
          <ul className="parent-report__list">
            {(r.hard ?? []).slice(0, 3).map((s) => <li key={s.skill}>{topicInfo(s.topic).emoji} {s.name}</li>)}
          </ul>
          {(r.patterns ?? []).map((p) => (
            <p key={`${p.skill}-${p.type}`} className="pattern__tip">💡 {p.label}: {p.tip}</p>
          ))}
        </section>
      )}

      {r.recommendation && (
        <section className="staff-card">
          <h2>✨ ההמלצה שלנו</h2>
          <p>{r.recommendation}</p>
        </section>
      )}

      <p className="staff-card__hint parent-report__foot">
        הדוח לקריאה בלבד ונשלח מהמורה. הקישור פעיל עד {new Date(r.expiresAt).toLocaleDateString("he-IL")}. ·{" "}
        <a href="/privacy">פרטיות</a>
      </p>
    </div>
  );
}
