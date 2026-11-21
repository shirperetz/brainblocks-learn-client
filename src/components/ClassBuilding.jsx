import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { donateToBuilding, getClassBuilding, staffClassBuilding } from "../services/learnApi";
import "../styles/components/class-building.css";

/**
 * 2026-11-12 (idea #6): "🏗️ הבניין של הכיתה" - the class builds one building a week from everyone's
 * right answers. `profileId` - the child's own class; `classId` - a class (teacher / admin).
 * Nothing is shown for a child without a class.
 */
export default function ClassBuilding({ profileId, classId, compact = false }) {
  const staff = classId != null;
  const navigate = useNavigate();
  const onIsland = typeof window !== "undefined" && /island/.test(window.location.pathname);
  const [b, setB] = useState(null);
  const [giving, setGiving] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

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

  // 2026-11-14 (A5, Shir: "donate coins to the class building"): 2 coins = 1 brick, up to 20 a week.
  async function give(coins) {
    setBusy(true);
    setNote("");
    try {
      const next = await donateToBuilding(profileId, coins);
      setB(next);
      setGiving(false);
      window.dispatchEvent(new CustomEvent("coins-changed", { detail: next.coins }));
      setNote(`תודה! הוספת ${coins / (next.coinsPerBrick || 2)} לבנים לבניין 🧱 (נשארו לך ${next.coins} מטבעות)`);
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  }
  const canGive = !staff && !b.done && (b.canDonate ?? 0) > 0;
  const stage = Math.max(0, Math.min(5, b.stage));
  const perStage = b.target / 5;
  const toNext = b.done ? 0 : Math.max(1, Math.ceil(perStage * (stage + 1) - b.built));

  // 2026-11-21 (Shir: the big card sat in the middle of the play page and hid what's below it):
  // on the play pages it's one slim row; the full card (picture, donating) lives on the class island.
  if (compact) {
    const pct = Math.round((100 * Math.min(b.built, b.target)) / Math.max(1, b.target));
    return (
      <button className={`building-row${b.done ? " is-done" : ""}`} onClick={() => navigate("/class-island")}>
        <span className="building-row__icon" aria-hidden="true">{b.done ? "🎉" : "🏗️"}</span>
        <span className="building-row__text">
          <b>הבניין של {b.className}</b>
          <span>{b.done ? "הבניין מוכן! כל הכבוד" : `${b.built} מתוך ${b.target} לבנים השבוע`}</span>
          <span className="building-row__bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        </span>
        <span className="building-row__go" aria-hidden="true">‹</span>
      </button>
    );
  }

  return (
    <section className={`building${b.done ? " is-done" : ""}`} aria-label="הבניין של הכיתה">
      <BuildingPicture stage={stage} />
      <div className="building__text">
        <h2 className="building__title">🏗️ הבניין של {b.className}</h2>
        <p className="building__line">
          {b.done ? "🎉 הבניין מוכן! כל הכבוד לכל הכיתה" : `הכיתה בנתה ${b.built} מתוך ${b.target} לבנים השבוע`}
        </p>
        {!b.done && <p className="building__sub">עוד {toNext} לבנים ל{STAGE_NEXT[stage]} · כל תשובה נכונה = לבנה</p>}
        <p className="building__sub">
          {b.helped === 0 ? "עוד אף אחד לא התחיל השבוע" : `${b.helped} מתוך ${b.children} ילדים כבר עזרו`}
          {!staff && b.mine > 0 && ` · את/ה עזרת ב-${b.mine} לבנים`}
          {staff && b.donatedCoins > 0 && ` · נתרמו ${b.donatedCoins} מטבעות`}
        </p>
        {canGive && !giving && (
          <button className="building__give" onClick={() => setGiving(true)}>🪙 לתרום מטבעות לבניין</button>
        )}
        {canGive && giving && (
          <div className="building__chips" role="group" aria-label="כמה מטבעות לתרום">
            {[2, 6, 10, 20].filter((n) => n <= b.canDonate).map((n) => (
              <button key={n} className="building__chip" disabled={busy} onClick={() => give(n)}>
                {n} 🪙 = {n / (b.coinsPerBrick || 2)} 🧱
              </button>
            ))}
            <button className="building__chip building__chip--ghost" onClick={() => setGiving(false)}>ביטול</button>
          </div>
        )}
        {!staff && !b.done && b.canDonate === 0 && b.myDonated > 0 && (
          <p className="building__sub">תרמת השבוע {b.myDonated} מטבעות - תודה! 💛</p>
        )}
        {note && <p className="building__note" role="status">{note}</p>}
        {/* 2026-11-14: the class's 3D island (every finished week stays there) */}
        {!onIsland && (
          <button className="building__isle" onClick={() => navigate(staff ? `/staff/class/${classId}/island` : "/class-island")}>
            🏝️ לאי של הכיתה + ליגת הכיתות
          </button>
        )}
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
