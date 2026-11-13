import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DolphinPerch from "../components/DolphinPerch";
import WeeklyTasks from "../components/WeeklyTasks";
import ClassBuilding from "../components/ClassBuilding";
import { ISLES } from "../game/games";
import { preload, say, sfx } from "../game/audio";
import { getGrade } from "../data/grades";
import { getIsles } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/room.css";
import "../styles/pages/island.css";
import "../styles/pages/sea.css";

/**
 * 2026-11-13 (Shir: "an island for everything, endless"; design A - a path on the sea - with C's big
 * card for the island being played). The islands come from the server in order: the base islands,
 * then generated ones forever; the next one opens at 2/3 of the one before, and there is always one
 * more, locked, waiting at the end of the path. docs/plan-infinite-islands.md.
 */
export default function SeaPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [isles, setIsles] = useState(null);
  const [error, setError] = useState("");
  const [nudge, setNudge] = useState(null);

  useEffect(() => {
    if (!ready) return;
    preload(["sea_intro", "isle_locked"]);
    say("sea_intro");
    getIsles(profile.id)
      .then((sea) => setIsles(sea.isles))
      .catch((e) => setError(e.message));
  }, [ready, profile]);

  if (!ready) return null;

  /** A base island of another grade, when the teacher locked the child's grade. */
  function gradeLock(isle) {
    const base = ISLES.find((b) => b.key === isle.key);
    if (!base || !profile.gradeLocked || !profile.grade || base.grades.includes(profile.grade)) return null;
    return `לכיתה ${base.grades.map((g) => getGrade(g)?.letter ?? "").join("-")}`;
  }

  function open(isle) {
    if (!isle.open || gradeLock(isle)) {
      sfx.wrong();
      say("isle_locked");
      setNudge(isle.key);
      setTimeout(() => setNudge(null), 1600);
      return;
    }
    sfx.tap();
    navigate(isle.generated ? `/sea/${isle.key}` : `/isle/${isle.key}`);
  }

  const list = isles ?? [];
  const openIsles = list.filter((i) => i.open);
  const current = openIsles[openIsles.length - 1];

  return (
    <div className="app-shell island-shell sea-shell">
      <button className="back-button" onClick={() => navigate("/")}>← בית</button>
      <h1 className="island__title">🌊 ים האיים</h1>
      <DolphinPerch message="לאן מפליגים היום?" />
      {error && <p className="form-error">{error}</p>}

      {current && (
        <section className="isle-card" style={{ "--isle": current.color }} aria-label="האי שלך עכשיו">
          <div className="isle-card__art" aria-hidden="true">
            <span className="isle-card__land">{current.mark}</span>
          </div>
          <div className="isle-card__body">
            <h2 className="isle-card__name">{current.name}</h2>
            <div className="isle-card__bar" role="img" aria-label={`${current.passed} מתוך ${current.total} שלבים`}>
              <span style={{ width: `${Math.round((current.passed / current.total) * 100)}%` }} />
            </div>
            <p className="isle-card__info">
              {current.passed} מתוך {current.total} שלבים
              {current.passed < current.needed ? ` · עוד ${current.needed - current.passed} והאי הבא נפתח` : " · האי הבא פתוח!"}
            </p>
            <button className="isle-card__play" onClick={() => open(current)}>
              שחקו!
            </button>
          </div>
        </section>
      )}

      <ol className="sea-path" aria-label="כל האיים">
        {list.map((isle, i) => {
          const lock = gradeLock(isle);
          const prev = i > 0 ? list[i - 1] : null;
          const closed = !isle.open || lock;
          return (
            <li key={isle.key} className={`sea-path__stop ${i % 2 ? "is-left" : "is-right"}`}>
              <button
                className={`path-isle${closed ? " is-closed" : ""}${nudge === isle.key ? " is-nudging" : ""}${isle === current ? " is-current" : ""}`}
                style={{ "--isle": isle.color, "--d": `${(i % 6) * 0.4}s` }}
                onClick={() => open(isle)}
                aria-label={`${isle.name}${closed ? " - נעול" : ""}`}
              >
                <span className="path-isle__land" aria-hidden="true">{closed ? "🔒" : isle.mark}</span>
                <span className="path-isle__name">{isle.name}</span>
                <span className="path-isle__sub">
                  {lock
                    ? `🔒 ${lock}`
                    : !isle.open
                      ? prev
                        ? `עוד ${Math.max(0, prev.needed - prev.passed)} שלבים ב${prev.name}`
                        : "נעול"
                      : isle.passed >= isle.total
                        ? `⭐ ${isle.stars} · הושלם`
                        : `⭐ ${isle.stars} · ${isle.passed}/${isle.total}`}
                </span>
              </button>
            </li>
          );
        })}
        {isles && <li className="sea-path__more" aria-hidden="true">🌊 ועוד איים מחכים...</li>}
      </ol>

      <button className="room-entry" onClick={() => navigate("/room")}>🎮 יש לי קוד חדר מהמורה</button>
      <WeeklyTasks profileId={profile.id} />
      <ClassBuilding profileId={profile.id} />
      <button className="text-link island__grown" onClick={() => navigate("/topics")}>
        לכל נושאי החשבון
      </button>
    </div>
  );
}
