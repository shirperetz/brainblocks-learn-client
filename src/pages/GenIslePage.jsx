import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DolphinPerch from "../components/DolphinPerch";
import { GAMES } from "../game/games";
import { getTopic } from "../data/topics";
import { sfx } from "../game/audio";
import { getIsles } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/island.css";
import "../styles/pages/sea.css";

/**
 * 2026-11-13 (infinite islands): a generated island ("gen-3") - three of the games, at this island's
 * tier (bigger numbers), six stages each. Its progress comes from the server (GET /isles).
 */
export default function GenIslePage() {
  const { isleKey } = useParams();
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [isle, setIsle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    getIsles(profile.id)
      .then((sea) => {
        const found = sea.isles.find((i) => i.key === isleKey);
        if (!found) setError("האי הזה עוד לא נפתח");
        else setIsle(found);
      })
      .catch((e) => setError(e.message));
  }, [ready, profile, isleKey]);

  if (!ready) return null;

  return (
    <div className="app-shell island-shell sea-shell gen-isle" style={{ "--isle": isle?.color ?? "#4aa8ff" }}>
      <button className="back-button" onClick={() => navigate("/island")}>← לים</button>
      {error && <p className="form-error">{error}</p>}
      {isle && (
        <>
          <header className="gen-isle__head">
            <span className="gen-isle__mark" aria-hidden="true">{isle.mark}</span>
            <div>
              <h1 className="island__title">{isle.name}</h1>
              <p className="gen-isle__sub">
                אי {isle.tier} · ⭐ {isle.stars} · {isle.passed} מתוך {isle.total} שלבים
              </p>
            </div>
          </header>
          <DolphinPerch message={isle.open ? "תרגילים חדשים וקשים יותר - בהצלחה!" : "האי עוד נעול"} />
          {!isle.open && <p className="gen-isle__locked">🔒 עוד נעול: צריך לעבור עוד שלבים באי הקודם.</p>}
          <div className="gen-isle__games">
            {isle.games.map((g) => {
              // 2026-11-13: an island game, or a topic of the question screen (ד׳-ו׳ and the topic islands)
              const t = getTopic(g.topic);
              const game = GAMES.find((x) => x.topic === g.topic) ?? (t && { key: null, emoji: t.icon ?? t.emoji ?? "📘", name: t.name ?? t.title ?? g.topic, color: t.color ?? "#4aa8ff" });
              if (!game) return null;
              return (
                <section key={g.topic} className="gen-game" style={{ "--hut": game.color }}>
                  <h2 className="gen-game__title">
                    <span aria-hidden="true">{game.emoji}</span> {game.name}
                  </h2>
                  <div className="gen-game__stages">
                    {g.stages.map((s) => (
                      <button
                        key={s.stage}
                        className={`gen-stage gen-stage--${s.status.toLowerCase()}`}
                        disabled={s.status === "LOCKED"}
                        aria-label={`שלב ${s.stage}${s.status === "LOCKED" ? " - נעול" : ""}`}
                        onClick={() => {
                          sfx.tap();
                          navigate(game.key ? `/sea/${isle.key}/${game.key}/${s.stage}` : `/sea/${isle.key}/q/${g.topic}/${s.stage}`);
                        }}
                      >
                        <span className="gen-stage__n">{s.status === "LOCKED" ? "🔒" : s.stage}</span>
                        <span className="gen-stage__stars" aria-hidden="true">
                          {"★".repeat(s.stars)}
                          {"☆".repeat(3 - s.stars)}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
