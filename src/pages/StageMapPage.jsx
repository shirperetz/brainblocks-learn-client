import { useEffect, useState, useSyncExternalStore } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import { getTopic } from "../data/topics";
import { getStageMap } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/stage-map.css";

// Where each stage stands on the island (percent of the map: x from the left, y from the top) and the
// trail through them (viewBox 100 x 100, stretched to the map). TALL = phone: from the beach at the
// bottom up to the treasure at the top. WIDE = computer / tablet (Shir 12.11: "on the computer the map
// looks like on the phone - not so nice"): a wide island, the trail winds from the beach on the right
// (where Hebrew starts) to the treasure on the left.
const LAYOUTS = {
  tall: {
    spots: [[72, 86], [30, 75], [64, 61], [30, 47], [66, 33], [44, 15]],
    trail: "M72 86 C 56 84, 40 82, 30 75 S 52 64, 64 61 S 36 52, 30 47 S 56 37, 66 33 S 50 20, 44 15",
    halo: "M14 30 C 8 12, 34 2, 52 4 C 76 6, 96 16, 92 38 C 98 56, 96 80, 82 92 C 64 102, 30 100, 16 88 C 2 76, 4 50, 14 30 Z",
    sand: "M18 30 C 14 15, 36 7, 52 8 C 74 10, 90 19, 87 38 C 92 56, 90 78, 78 88 C 62 98, 32 96, 20 85 C 8 74, 10 50, 18 30 Z",
    grass: "M26 32 C 24 20, 40 14, 54 15 C 70 17, 82 25, 79 40 C 83 56, 80 72, 70 80 C 57 89, 36 87, 27 77 C 18 67, 19 46, 26 32 Z",
  },
  wide: {
    spots: [[86, 70], [71, 36], [57, 68], [43, 34], [29, 66], [14, 36]],
    trail: "M86 70 C 80 52, 76 38, 71 36 S 61 66, 57 68 S 47 36, 43 34 S 33 62, 29 66 S 18 40, 14 36",
    halo: "M5 40 C 4 14, 30 4, 50 6 C 74 4, 97 12, 96 42 C 98 72, 86 96, 60 95 C 36 98, 3 94, 4 66 C 3 56, 4 48, 5 40 Z",
    sand: "M8 40 C 8 19, 30 11, 50 12 C 72 10, 93 17, 92 42 C 94 68, 84 89, 60 89 C 38 92, 7 88, 8 64 C 7 56, 8 48, 8 40 Z",
    grass: "M13 38 C 14 24, 32 19, 50 20 C 68 18, 87 24, 86 42 C 88 62, 79 79, 60 80 C 40 82, 13 79, 13 62 C 12 54, 13 46, 13 38 Z",
  },
};

const WIDE_QUERY = "(min-width: 760px)";
function subscribeWide(cb) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const isWide = () => window.matchMedia(WIDE_QUERY).matches;

// 2026-11-12 (Shir: "the maps - more invested, prettier; this is ugly; I really want them to see an
// island"): each topic is an island in the sea - a winding trail from the beach, a stone per stage
// (gold with its stars when done, glowing "שחקו!" where the child is, grey and locked ahead), palms, a
// hut, a boat - and the treasure at the top. All stages done: "כבשתם את האי!".
export default function StageMapPage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const topicInfo = getTopic(topic);

  const [map, setMap] = useState(null);
  const [error, setError] = useState("");
  const [lockedNudge, setLockedNudge] = useState(null);
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);
  const L = wide ? LAYOUTS.wide : LAYOUTS.tall;

  useEffect(() => {
    if (!ready || !topicInfo) return;
    let active = true;
    getStageMap(profile.id, topic)
      .then((data) => active && setMap(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [ready, profile, topic, topicInfo]);

  if (!ready) return null;
  if (!topicInfo) return <Navigate to="/topics" replace />;

  function openStage(stage) {
    if (stage.status === "LOCKED") {
      setLockedNudge(stage.stageNumber);
      setTimeout(() => setLockedNudge(null), 1800);
      return;
    }
    navigate(`/play/${topic}/${stage.stageNumber}`);
  }

  const stages = map?.stages ?? [];
  const maxStars = stages.length * 3;
  const current = stages.find((s) => s.status !== "LOCKED" && s.status !== "COMPLETED")
    ?? stages.filter((s) => s.status !== "LOCKED").slice(-1)[0];
  const allDone = stages.length > 0 && stages.every((s) => s.status === "COMPLETED");

  return (
    <div className="app-shell topic-island-shell" style={{ "--accent": topicInfo.color }}>
      <div className="topic-island__top">
        <button className="back-button" onClick={() => navigate("/topics")}>← לנושאים</button>
        {map && (
          <span className="topic-island__stars" aria-label={`${map.totalStars} כוכבים מתוך ${maxStars}`}>
            ⭐ {map.totalStars} <small>מתוך {maxStars}</small>
          </span>
        )}
      </div>

      <h1 className="topic-island__title">
        <span className="topic-island__flag" aria-hidden="true">{topicInfo.emoji}</span>
        האי של ה{topicInfo.name}
      </h1>

      <DolphinPerch message={allDone ? "כבשתם את האי! 🏆" : "בוחרים שלב ויוצאים לדרך!"} />

      {error && <p className="form-error">{error}</p>}

      {allDone && <p className="topic-island__won" role="status">🏆 כבשתם את האי! כל השלבים הושלמו</p>}

      <div className={`topic-island${wide ? " topic-island--wide" : ""}`}>
        <svg className="topic-island__land" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="sand" cx="50%" cy="55%" r="60%">
              <stop offset="0%" stopColor="#fbe7b0" />
              <stop offset="100%" stopColor="#efcf84" />
            </radialGradient>
            <radialGradient id="grass" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#a8e38a" />
              <stop offset="100%" stopColor="#6cc36a" />
            </radialGradient>
          </defs>
          <path d={L.halo} fill="#bfeefc" opacity="0.75" />
          <path d={L.sand} fill="url(#sand)" />
          <path d={L.grass} fill="url(#grass)" />
          <path d={L.trail} fill="none" stroke="#fff7df" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={L.trail} fill="none" stroke="#b9895a" strokeWidth="2.5" strokeDasharray="7 8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        <span className="island-deco island-deco--palm1" aria-hidden="true">🌴</span>
        <span className="island-deco island-deco--palm2" aria-hidden="true">🌴</span>
        <span className="island-deco island-deco--palm3" aria-hidden="true">🌴</span>
        <span className="island-deco island-deco--hut" aria-hidden="true">🛖</span>
        <span className="island-deco island-deco--boat" aria-hidden="true">⛵</span>
        <span className="island-deco island-deco--fish" aria-hidden="true">🐠</span>
        <span className="island-deco island-deco--shell" aria-hidden="true">🐚</span>

        {stages.map((stage, i) => {
          const [x, y] = L.spots[Math.min(i, L.spots.length - 1)];
          const locked = stage.status === "LOCKED";
          const done = stage.status === "COMPLETED";
          const here = current && current.stageNumber === stage.stageNumber && !allDone;
          const last = i === stages.length - 1;
          return (
            <div key={stage.stageNumber} className="island-stop" style={{ left: `${x}%`, top: `${y}%` }}>
              <button
                className={`island-stone${locked ? " is-locked" : ""}${done ? " is-done" : ""}${here ? " is-here" : ""}${last ? " is-treasure" : ""}${lockedNudge === stage.stageNumber ? " is-nudging" : ""}`}
                onClick={() => openStage(stage)}
                aria-label={`שלב ${stage.stageNumber}${locked ? " - נעול" : done ? ` - הושלם, ${stage.stars} כוכבים` : ""}`}
              >
                <span className="island-stone__face">{locked ? "🔒" : last ? (done ? "👑" : "🎁") : stage.stageNumber}</span>
              </button>
              {!locked && (
                <span className="island-stop__stars">
                  <StarRating value={stage.stars} size="sm" />
                </span>
              )}
              {here && <span className="island-stop__go">שחקו!</span>}
              {lockedNudge === stage.stageNumber && <span className="island-stop__nudge">קודם מסיימים את השלב הקודם</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
