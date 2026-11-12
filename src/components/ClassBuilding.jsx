import { useEffect, useState } from "react";
import { getClassBuilding, staffClassBuilding } from "../services/learnApi";
import "../styles/components/class-building.css";

/**
 * 2026-11-12 (idea #6): "🏗️ הבניין של הכיתה" - the class builds one building a week from everyone's
 * right answers. `profileId` - the child's own class; `classId` - a class (teacher / admin).
 * Nothing is shown for a child without a class.
 */
export default function ClassBuilding({ profileId, classId }) {
  const staff = classId != null;
  const [b, setB] = useState(null);

  useEffect(() => {
    let alive = true;
    (staff ? staffClassBuilding(classId) : getClassBuilding(profileId))
      .then((x) => alive && setB(x && x.target ? x : null))
      .catch(() => alive && setB(null));
    return () => {
      alive = false;
    };
  }, [staff, classId, profileId]);

  if (!b) return null;
  const stage = Math.max(0, Math.min(5, b.stage));
  const perStage = b.target / 5;
  const toNext = b.done ? 0 : Math.max(1, Math.ceil(perStage * (stage + 1) - b.built));

  return (
    <section className={`building${b.done ? " is-done" : ""}`} aria-label="הבניין של הכיתה">
      <BuildingPicture stage={stage} />
      <div className="building__text">
        <h2 className="building__title">🏗️ הבניין של {b.className}</h2>
        <p className="building__line">
          {b.done ? "🎉 הבניין מוכן! כל הכבוד לכל הכיתה" : `הכיתה ענתה נכון ${b.built} מתוך ${b.target} השבוע`}
        </p>
        {!b.done && <p className="building__sub">עוד {toNext} תשובות נכונות ל{STAGE_NEXT[stage]}</p>}
        <p className="building__sub">
          {b.helped === 0 ? "עוד אף אחד לא התחיל השבוע" : `${b.helped} מתוך ${b.children} ילדים כבר עזרו`}
          {!staff && b.mine > 0 && ` · את/ה עזרת ב-${b.mine} תשובות`}
        </p>
      </div>
    </section>
  );
}

const STAGE_NEXT = ["יסודות", "קומה ראשונה", "קומה שנייה", "גג", "דגל"];

/** 0 empty lot · 1 foundations · 2-3 floors · 4 roof · 5 flag. */
function BuildingPicture({ stage }) {
  const floor = (y, key) => (
    <g key={key}>
      <rect x="30" y={y} width="100" height="30" rx="3" className="building__wall" />
      {[44, 72, 100].map((x) => (
        <rect key={x} x={x} y={y + 8} width="14" height="14" rx="2" className="building__window" />
      ))}
    </g>
  );
  return (
    <svg className="building__pic" viewBox="0 0 160 150" role="img" aria-label={`שלב ${stage} מתוך 5`}>
      <rect x="0" y="132" width="160" height="18" className="building__ground" />
      {stage === 0 && <text x="80" y="120" textAnchor="middle" fontSize="30">🏗️</text>}
      {stage >= 1 && <rect x="24" y="120" width="112" height="12" rx="2" className="building__base" />}
      {stage >= 2 && floor(90, "f1")}
      {stage >= 3 && floor(60, "f2")}
      {stage >= 4 && <polygon points="22,62 80,24 138,62" className="building__roof" />}
      {stage >= 5 && (
        <g>
          <line x1="80" y1="24" x2="80" y2="4" className="building__pole" />
          <polygon points="80,4 100,9 80,14" className="building__flag" />
        </g>
      )}
    </svg>
  );
}
