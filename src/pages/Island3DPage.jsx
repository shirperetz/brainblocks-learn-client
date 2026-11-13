import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IslandScene } from "../island3d/IslandScene";
import { getMyIsland, islandAction } from "../services/learnApi";
import { sfx } from "../game/audio";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/island3d.css";

/**
 * 2026-11-13 (Shir chose the live 3D island, "exactly like this"; HUD inspired by the picture she
 * sent): the child's own island. A coin for every star; tap a free place to build, tap a building to
 * upgrade it; finished islands of the sea give a treasure chest. The server checks every price.
 */
const CATEGORIES = [
  { key: "home", name: "בתים" },
  { key: "food", name: "אוכל" },
  { key: "production", name: "ייצור" },
  { key: "decor", name: "קישוט" },
  { key: "transport", name: "ספינות" },
];

function Coin({ size = 20 }) {
  return <span className="i3-coin" style={{ width: size, height: size }} aria-hidden="true" />;
}

export default function Island3DPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const box = useRef(null);
  const sceneRef = useRef(null);
  const [st, setSt] = useState(null);
  const [slot, setSlot] = useState(null);
  const [cat, setCat] = useState("home");
  const [open, setOpen] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const show = useCallback((s) => {
    setSt(s);
    sceneRef.current?.setBuildings(s.buildings, s.openSlots);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const phone = window.innerWidth < 700;
    const scene = new IslandScene(box.current, {
      seed: 1000 + profile.id * 7919,
      phone,
      onPick: (i) => {
        sfx.tap();
        setSlot(i);
        setOpen(true);
        setMsg("");
      },
    });
    sceneRef.current = scene;
    box.current.islandScene = scene; // for the page tests (tap a place by number)
    getMyIsland(profile.id).then(show).catch((e) => setMsg(e.message));
    return () => scene.dispose();
  }, [ready, profile, show]);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s || !st) return;
    s.select(slot);
    s.setBuildings(st.buildings, st.openSlots);
  }, [slot, st]);

  if (!ready) return null;

  const built = st?.buildings.find((b) => b.slot === slot);
  const kindOf = (k) => st?.catalog.find((c) => c.kind === k);
  const locked = st && slot != null && slot >= st.openSlots;
  const bk = built ? kindOf(built.kind) : null;

  async function act(what, body, done) {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const s = await islandAction(profile.id, what, body);
      sfx.star();
      show(s);
      setMsg(done(s));
    } catch (e) {
      sfx.wrong();
      setMsg(e.message.includes("מטבעות") ? "אין מספיק מטבעות. כל שלב שעוברים נותן עד 3!" : e.message);
    } finally {
      setBusy(false);
    }
  }

  function upgrade() {
    act("upgrade", { slot }, () => `שודרג ל${bk.names[built.level]}!`);
  }

  return (
    <div className="i3" dir="rtl">
      <div ref={box} className="i3-stage" aria-label="האי שלי בתלת-ממד: גוררים לסובב, לוחצים על מקום כדי לבנות" />

      <header className="i3-top">
        <button className="i3-round" onClick={() => navigate("/")} aria-label="חזרה הביתה">←</button>
        <div className="i3-who">
          <img src="/mascot/smile-01.webp" alt="" className="i3-avatar" />
          <div>
            <b>האי של {profile.name}</b>
            <span>{st ? `${st.buildings.length} מבנים` : "טוען..."}</span>
          </div>
        </div>
        <div className="i3-money">
          <span className="i3-pill" aria-label={`${st?.coins ?? 0} מטבעות`}><Coin />{st?.coins ?? "…"}</span>
          <span className="i3-pill i3-pill--star" aria-label={`${st?.stars ?? 0} כוכבים`}>★ {st?.stars ?? "…"}</span>
        </div>
      </header>

      {st?.chests?.length > 0 && (
        <div className="i3-chest">
          <span className="i3-chest__box" aria-hidden="true" />
          <div>
            <b>תיבת אוצר!</b>
            <span>סיימת את {st.chests[0].name}</span>
          </div>
          <button className="i3-btn i3-btn--gold" disabled={busy} onClick={() => act("chest", { isleKey: st.chests[0].isleKey }, (s) => `פתחת את התיבה: +${s.opened} מטבעות!`)}>
            לפתוח
          </button>
        </div>
      )}

      <section className={`i3-sheet${open ? "" : " is-closed"}`} aria-label="בנייה ושדרוג">
        <button className="i3-sheet__grip" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "להקטין" : "להגדיל"}>
          <span />
        </button>
        {open && (
          <div className="i3-sheet__body">
            {msg && <p className="i3-msg" role="status">{msg}</p>}
            {!st && <p className="i3-hint">טוען את האי...</p>}
            {st && slot == null && (
              <div className="i3-intro">
                <p className="i3-hint">לוחצים על עיגול לבן על האי כדי לבנות, או על מבנה כדי לשדרג.</p>
                {st.nextLandCost != null && (
                  <button className="i3-btn i3-btn--blue" disabled={busy} onClick={() => act("land", {}, () => "האי גדל! נפתחו 2 מקומות חדשים")}>
                    להגדיל את האי · {st.nextLandCost} <Coin size={16} />
                  </button>
                )}
              </div>
            )}
            {st && locked && <p className="i3-hint">המקום הזה עוד לא שלך. מגדילים את האי כדי לפתוח אותו.</p>}

            {st && built && bk && (
              <div className="i3-upgrade">
                <h2>{bk.names[built.level - 1]}{bk.costs.length > 1 && <span className="i3-level">רמה {built.level} / {bk.costs.length}</span>}</h2>
                {built.level >= bk.costs.length ? (
                  <p className="i3-hint">זו הרמה הכי גבוהה. כל הכבוד!</p>
                ) : (
                  <>
                    <div className="i3-before-after">
                      <span>{bk.names[built.level - 1]}</span>
                      <span className="i3-arrow" aria-hidden="true">←</span>
                      <b>{bk.names[built.level]}</b>
                    </div>
                    <p className="i3-perk">מה מקבלים: {bk.perks[built.level]}</p>
                    <button className="i3-btn i3-btn--green" disabled={busy || st.coins < bk.costs[built.level]} onClick={upgrade}>
                      שדרוג · {bk.costs[built.level]} <Coin size={18} />
                    </button>
                  </>
                )}
              </div>
            )}

            {st && slot != null && !built && !locked && (
              <div className="i3-shop">
                <div className="i3-tabs" role="tablist" aria-label="קטגוריות">
                  {CATEGORIES.map((c) => (
                    <button key={c.key} role="tab" aria-selected={cat === c.key} className="i3-tab" onClick={() => setCat(c.key)}>
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="i3-items">
                  {st.catalog.filter((c) => c.category === cat).map((c) => (
                    <div key={c.kind} className="i3-item">
                      <b>{c.names[0]}</b>
                      <span>{c.perks[0]}</span>
                      <button className="i3-btn i3-btn--green i3-btn--small" disabled={busy || st.coins < c.costs[0]}
                        onClick={() => act("build", { slot, kind: c.kind }, () => `בנית ${c.names[0]}!`)}>
                        {c.costs[0]} <Coin size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
