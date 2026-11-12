import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import DolphinPerch from "../components/DolphinPerch";
import WeeklyTasks from "../components/WeeklyTasks";
import ClassBuilding from "../components/ClassBuilding";
import { GAMES, ISLES } from "../game/games";
import { LEVELS_PER_GAME } from "../game/levels";
import { preload, say, sfx } from "../game/audio";
import { getGrade } from "../data/grades";
import { getStageMap } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/room.css";
import "../styles/pages/island.css";
import "../styles/pages/sea.css";

const WIDE_QUERY = "(min-width: 760px)";
function subscribeWide(cb) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const isWide = () => window.matchMedia(WIDE_QUERY).matches;

/**
 * 2026-11-12 (Shir: "more islands for grades 1-3", "a sea map with all the islands"): the islands
 * float on one sea; tap an island -> its games. An island not built yet says "בקרוב"; a child whose
 * grade is locked by the teacher sees another grade's island closed.
 */
export default function SeaPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [stars, setStars] = useState({}); // isle key -> stars
  const [nudge, setNudge] = useState(null);
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);

  useEffect(() => {
    if (!ready) return;
    preload(["sea_intro", "isle_locked"]);
    say("sea_intro");
    let active = true;
    GAMES.filter((g) => g.ready).forEach((g) =>
      getStageMap(profile.id, g.topic)
        .then((m) => active && setStars((s) => ({ ...s, [g.isle]: (s[g.isle] ?? 0) + m.totalStars })))
        .catch(() => {}),
    );
    return () => {
      active = false;
    };
  }, [ready, profile]);

  if (!ready) return null;

  function closedFor(isle) {
    if (!isle.ready) return "בקרוב";
    if (profile.gradeLocked && profile.grade && !isle.grades.includes(profile.grade)) {
      return `לכיתה ${isle.grades.map((g) => getGrade(g)?.letter ?? "").join("-")}`;
    }
    return null;
  }

  function open(isle) {
    const closed = closedFor(isle);
    if (closed) {
      sfx.wrong();
      say("isle_locked");
      setNudge(isle.key);
      setTimeout(() => setNudge(null), 1600);
      return;
    }
    sfx.tap();
    navigate(`/isle/${isle.key}`);
  }

  return (
    <div className="app-shell island-shell sea-shell">
      <button className="back-button" onClick={() => navigate("/")}>← בית</button>
      <h1 className="island__title">🌊 ים האיים</h1>
      <DolphinPerch message="לאן מפליגים היום?" />

      <div className={`sea ${wide ? "sea--wide" : ""}`}>
        <span className="sea__deco sea__deco--boat" aria-hidden="true">⛵</span>
        <span className="sea__deco sea__deco--whale" aria-hidden="true">🐳</span>
        <span className="sea__deco sea__deco--fish" aria-hidden="true">🐠</span>
        {ISLES.map((isle, i) => {
          const [x, y] = wide ? isle.wide : isle.tall;
          const closed = closedFor(isle);
          const games = GAMES.filter((g) => g.isle === isle.key && g.ready).length;
          return (
            <button
              key={isle.key}
              className={`isle${closed ? " is-closed" : ""}${nudge === isle.key ? " is-nudging" : ""}`}
              style={{ left: `${x}%`, top: `${y}%`, "--isle": isle.color, "--d": `${i * 0.5}s` }}
              onClick={() => open(isle)}
              aria-label={`${isle.name}${closed ? ` - ${closed}` : ""}`}
            >
              <span className="isle__land" aria-hidden="true">
                <span className="isle__emoji">{isle.emoji}</span>
              </span>
              <span className="isle__name">{isle.name}</span>
              {closed ? (
                <span className="isle__lock">🔒 {closed}</span>
              ) : (
                <span className="isle__stars">⭐ {stars[isle.key] ?? 0}/{games * LEVELS_PER_GAME * 3}</span>
              )}
            </button>
          );
        })}
      </div>

      <button className="room-entry" onClick={() => navigate("/room")}>🎮 יש לי קוד חדר מהמורה</button>
      <WeeklyTasks profileId={profile.id} />
      <ClassBuilding profileId={profile.id} />
      <button className="text-link island__grown" onClick={() => navigate("/topics")}>
        לכל נושאי החשבון
      </button>
    </div>
  );
}
