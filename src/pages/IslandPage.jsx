import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GAMES } from "../game/games";
import { LEVELS_PER_GAME } from "../game/levels";
import { isMuted, preload, say, setMuted, sfx } from "../game/audio";
import { getCharacter } from "../data/characters";
import { getStageMap } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/island.css";

/** אי המספרים - the game hub for grades 1-2: four big pictures, spoken, almost no reading. */
export default function IslandPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [stars, setStars] = useState({});
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    if (!ready) return;
    preload(["island_intro", "locked", ...GAMES.filter((g) => g.intro).map((g) => g.intro)]);
    say("island_intro");
    let active = true;
    GAMES.filter((g) => g.ready).forEach((g) =>
      getStageMap(profile.id, g.topic)
        .then((m) => active && setStars((s) => ({ ...s, [g.key]: m.totalStars })))
        .catch(() => {}),
    );
    return () => {
      active = false;
    };
  }, [ready, profile]);

  if (!ready) return null;
  const me = getCharacter(profile.avatar);

  function open(g) {
    sfx.tap();
    if (!g.ready) {
      say("locked");
      return;
    }
    navigate(`/island/${g.key}`);
  }

  function toggleSound() {
    setMuted(!muted);
    setMutedState(!muted);
  }

  return (
    <div className="app-shell island-shell">
      <header className="island__top">
        <div className="island__me">
          <span className="island__avatar" style={{ background: me.color }}>
            {me.emoji}
          </span>
          <span className="island__name">{profile.name}</span>
        </div>
        <button className="round-btn" onClick={toggleSound} aria-label={muted ? "להפעיל קול" : "להשתיק"}>
          {muted ? "🔇" : "🔊"}
        </button>
      </header>

      <h1 className="island__title">🏝️ אי המספרים</h1>

      <div className="island__grid">
        {GAMES.map((g) => (
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

      <button className="text-link island__grown" onClick={() => navigate("/topics")}>
        לכל נושאי החשבון (לגדולים)
      </button>
    </div>
  );
}
