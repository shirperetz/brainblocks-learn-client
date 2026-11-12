import { useEffect, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { GAMES, getIsle } from "../game/games";
import { LEVELS_PER_GAME } from "../game/levels";
import { preload, say, sfx } from "../game/audio";
import { getStageMap } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/island.css";

/**
 * One island and its games (2026-11-10 אי המספרים; 2026-11-12 every island on the sea map: /isle/:isle).
 * Big pictures, spoken, almost no reading.
 */
export default function IslandPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { isle: isleKey } = useParams();
  const isle = getIsle(isleKey);
  const games = GAMES.filter((g) => g.isle === isleKey);
  const [stars, setStars] = useState({});

  useEffect(() => {
    if (!ready || !isle?.ready) return;
    preload([isle.intro, "locked", ...games.filter((g) => g.intro).map((g) => g.intro)]);
    say(isle.intro);
    let active = true;
    games.filter((g) => g.ready).forEach((g) =>
      getStageMap(profile.id, g.topic)
        .then((m) => active && setStars((s) => ({ ...s, [g.key]: m.totalStars })))
        .catch(() => {}),
    );
    return () => {
      active = false;
    };
  }, [ready, profile, isle]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  if (!isle?.ready) return <Navigate to="/island" replace />;
  // A child locked by the teacher to a grade this island isn't made for goes back to the sea.
  if (profile.gradeLocked && profile.grade && !isle.grades.includes(profile.grade)) return <Navigate to="/island" replace />;

  function open(g) {
    sfx.tap();
    if (!g.ready) {
      say("locked");
      return;
    }
    navigate(`/island/${g.key}`);
  }

  return (
    <div className="app-shell island-shell">
      <button className="back-button" onClick={() => navigate("/island")}>
        ← לים
      </button>

      <h1 className="island__title">{isle.emoji} {isle.name}</h1>
      <DolphinPerch message="לאיזה משחק הולכים?" />

      <div className="island__grid">
        {games.map((g) => (
          <button
            key={g.key}
            className={`hut ${g.ready ? "" : "is-locked"}`}
            style={{ "--hut": g.color }}
            onClick={() => open(g)}
          >
            <span className="hut__emoji" aria-hidden="true">
              {g.emoji}
            </span>
            <span className="hut__name">{g.name}</span>
            {g.ready ? (
              <span className="hut__stars">
                ⭐ {stars[g.key] ?? 0}/{LEVELS_PER_GAME * 3}
              </span>
            ) : (
              <span className="hut__lock">🔒 בקרוב</span>
            )}
          </button>
        ))}
      </div>

    </div>
  );
}
