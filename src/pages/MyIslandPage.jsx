import { useEffect, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { getCharacter } from "../data/characters";
import { buildIsland } from "../data/island";
import { sfx } from "../game/audio";
import { cheer } from "../game/companion";
import { chooseIslandItem, getIsland, staffChildIsland, staffReport } from "../services/learnApi";
import "../styles/pages/my-island.css";

/**
 * 2026-11-11 "האי שלי" (Shir: "a map; at every level they pass they get something; when they finish
 * they can build the island - a goal to finish everything"). One area per topic, one spot per level:
 * 🔒 not yet / 🎁 earned - tap and choose / the chosen thing (gold with 3 stars). A whole area lit up
 * when its 6 levels are done; the whole island = a party and a certificate.
 * /staff/child/:id/island shows a child's island to the teacher, read-only.
 */
export default function MyIslandPage() {
  const { id } = useParams();
  const staffView = Boolean(id);
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [server, setServer] = useState(null);
  const [child, setChild] = useState(null);
  const [picking, setPicking] = useState(null); // spot object
  const [error, setError] = useState("");
  const [justBuilt, setJustBuilt] = useState(null);

  useEffect(() => {
    if (!profile) return undefined;
    let alive = true;
    const load = staffView
      ? Promise.all([staffChildIsland(id), staffReport(id)]).then(([isl, rep]) => {
          if (alive) setChild(rep.child);
          return isl;
        })
      : getIsland(profile.id);
    load
      .then((d) => {
        if (!alive) return;
        setServer(d);
        // 2026-11-11: the companion points at the gifts (the child's own island only).
        if (!staffView && (d.earned ?? []).some((e) => !(d.choices ?? {})[e.spot])) setTimeout(() => cheer("gifts"), 600);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [profile, id, staffView]);

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  if (staffView && !(profile.admin || profile.teacher)) return <Navigate to="/" replace />;

  const who = staffView ? child : profile;
  const island = server && who ? buildIsland(server.grade ?? who.grade, server) : null;

  async function choose(item) {
    const spot = picking.spot;
    sfx.star();
    setPicking(null);
    try {
      setServer(await chooseIslandItem(profile.id, spot, item));
      setJustBuilt(spot);
      setTimeout(() => setJustBuilt(null), 1200);
    } catch (e) {
      setError(e.message);
    }
  }

  function tapSpot(s) {
    if (staffView) return;
    if (!s.earned) {
      sfx.wrong();
      return;
    }
    sfx.tap();
    setPicking(s);
  }

  const me = who ? getCharacter(who.avatar) : null;

  return (
    <div className="app-shell my-island">
      <button className="back-button" onClick={() => navigate(staffView ? `/staff/child/${id}` : "/")}>
        ← {staffView ? "לדוח" : "בית"}
      </button>
      <header className="my-island__head">
        {/* Shir 12.11: no child emoji on the child's own screens - only a teacher viewing sees whose island */}
        {me && staffView && (
          <span className="my-island__avatar" style={{ background: me.color }} aria-hidden="true">
            {me.emoji}
          </span>
        )}
        <div>
          <h1>🏝️ {staffView ? `האי של ${who?.name ?? ""}` : "האי שלי"}</h1>
          {island && (
            <p>
              {island.finished
                ? "בנית את כל האי! 🎉"
                : `${island.earned} מתוך ${island.total} חלקים · כל שלב שעוברים = חלק חדש`}
            </p>
          )}
        </div>
      </header>
      <DolphinPerch />

      {error && <p className="form-error">{error}</p>}
      {!island && !error && <p className="my-island__loading">טוען...</p>}

      {island && (
        <>
          <div className="build-bar" role="progressbar" aria-valuemin={0} aria-valuemax={island.total} aria-valuenow={island.earned}>
            <span style={{ width: `${island.total ? (island.earned / island.total) * 100 : 0}%` }} />
          </div>

          {!staffView && island.waiting > 0 && (
            <p className="my-island__gifts">🎁 יש לך {island.waiting} מתנות! לוחצים על 🎁 ובוחרים מה לבנות</p>
          )}

          {island.finished && (
            <section className="party" aria-live="polite">
              <div className="party__fireworks" aria-hidden="true">🎆 🎇 🎆</div>
              <h2>כל הכבוד! סיימת את כל האי!</h2>
              {!staffView && (
                <button className="party__cert" onClick={() => window.print()}>🖨️ להדפיס תעודה</button>
              )}
              <div className="certificate" aria-hidden={!island.finished}>
                <h3>תעודת הצטיינות</h3>
                <p>
                  ל<b>{who?.name}</b> שבנה/תה את כל האי בעולם החשבון!
                </p>
                <p className="certificate__date">{new Date().toLocaleDateString("he-IL")}</p>
              </div>
            </section>
          )}

          <div className="island-map">
            {island.areas.map((a) => (
              <section
                key={a.key}
                className={`area ${a.complete ? "is-complete" : ""} ${a.done === 0 ? "is-empty" : ""}`}
                style={{ "--area": a.bg }}
              >
                <header className="area__head">
                  <span aria-hidden="true">{a.emoji}</span>
                  <strong>{a.name}</strong>
                  <small>
                    {a.title} · {a.done}/6
                  </small>
                  {a.complete && <span className="area__done" title="האזור הושלם">✨</span>}
                </header>
                <div className="area__spots">
                  {a.spots.map((s) => (
                    <button
                      key={s.spot}
                      className={`spot ${s.earned ? (s.item ? "is-built" : "is-gift") : "is-locked"} ${s.golden ? "is-golden" : ""} ${justBuilt === s.spot ? "is-new" : ""}`}
                      onClick={() => tapSpot(s)}
                      aria-label={
                        s.earned ? (s.item ? `שלב ${s.level}: ${s.item}` : `שלב ${s.level}: מתנה לבחור`) : `שלב ${s.level}: עוד לא`
                      }
                      disabled={staffView && !s.item}
                    >
                      <span className="spot__item">{s.earned ? s.item ?? (staffView ? "🎁" : "🎁") : "🔒"}</span>
                      <small className="spot__level">{s.level}</small>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          {island.areas.length === 0 && <p className="my-island__loading">בוחרים כיתה, ומתחילים לבנות!</p>}
        </>
      )}

      {picking && (
        <div className="picker" role="dialog" aria-label="מה לבנות כאן?" onClick={() => setPicking(null)}>
          <div className="picker__box" onClick={(e) => e.stopPropagation()}>
            <h2>מה לבנות כאן?</h2>
            <p>שלב {picking.level}{picking.golden ? " · ⭐⭐⭐ זהב!" : ""}</p>
            <div className="picker__options">
              {picking.options.map((o) => (
                <button
                  key={o}
                  className={`picker__opt ${picking.item === o ? "is-on" : ""} ${picking.golden ? "is-golden" : ""}`}
                  onClick={() => choose(o)}
                >
                  {o}
                </button>
              ))}
            </div>
            <button className="text-link" onClick={() => setPicking(null)}>אחר כך</button>
          </div>
        </div>
      )}
    </div>
  );
}
