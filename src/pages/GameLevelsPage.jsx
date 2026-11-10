import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getGame } from "../game/games";
import { say, sfx } from "../game/audio";
import { getStageMap } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/island.css";

/** The six levels of one island game: a path of big numbered stones with stars. */
export default function GameLevelsPage() {
  const { game: gameKey } = useParams();
  const game = getGame(gameKey);
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [stages, setStages] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !game?.ready) return;
    say("pick_level");
    let active = true;
    getStageMap(profile.id, game.topic)
      .then((m) => active && setStages(m.stages))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [ready, profile, game]);

  if (!game || !game.ready) return <Navigate to="/island" replace />;
  if (!ready) return null;

  function play(s) {
    if (s.status === "LOCKED") {
      sfx.wrong();
      return;
    }
    sfx.tap();
    navigate(`/island/${game.key}/${s.stageNumber}`);
  }

  return (
    <div className="app-shell island-shell" style={{ "--hut": game.color }}>
      <header className="island__top">
        <button className="round-btn" onClick={() => navigate("/island")} aria-label="חזרה לאי">
          🏝️
        </button>
        <h1 className="levels__title">
          <span aria-hidden="true">{game.emoji}</span> {game.name}
        </h1>
        <span className="round-btn round-btn--ghost" aria-hidden="true" />
      </header>

      {error && <p className="form-error">{error}</p>}
      {!stages && !error && <p className="play__loading">טוען...</p>}

      {stages && (
        <div className="levels">
          {stages.map((s, i) => (
            <button
              key={s.stageNumber}
              className={`stone stone--${s.status.toLowerCase()} ${i % 2 ? "is-left" : ""}`}
              onClick={() => play(s)}
              aria-label={`שלב ${s.stageNumber}`}
            >
              <span className="stone__num">{s.status === "LOCKED" ? "🔒" : s.stageNumber}</span>
              <span className="stone__stars" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= s.stars ? "is-on" : ""}>
                    ★
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
