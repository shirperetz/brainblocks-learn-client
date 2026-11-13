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
  { key: "all", name: "הכל" },
  { key: "home", name: "בתים" },
  { key: "food", name: "אוכל" },
  { key: "production", name: "ייצור" },
  { key: "decor", name: "קישוט" },
  { key: "animals", name: "חיות" },
  { key: "transport", name: "ספינות" },
];

/** A picture for each thing in the shop (the island draws it in 3D after it is built). */
const SEASON_ICON = { summer: "☀️", snow: "❄️", desert: "🏜️", sunset: "🌅" };

const ICON = {
  house: "🏠", farm: "🌾", stall: "🍉", mill: "🌬️", lighthouse: "🗼", tree: "🌳", palm: "🌴", flowers: "🌷", boat: "⛵", ship: "🚢",
  // 2026-11-13: the new things
  school: "🏫", well: "🪣", fountain: "⛲", playground: "🛝", pond: "🦆", sheep: "🐑", cow: "🐄", horse: "🐎",
  balloon: "🎈", rocket: "🚀", snowman: "⛄", igloo: "🧊", penguin: "🐧", cactus: "🌵", camel: "🐫", pyramid: "🔺", lantern: "🏮", campfire: "🔥",
};

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
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  // 2026-11-13 (Shir: "and if I bought everything?"): which of her islands is on screen (0 = the first)
  const [isle, setIsle] = useState(0);
  const [season, setSeason] = useState(null);

  const stRef = useRef(null);
  const show = useCallback((s) => {
    stRef.current = s;
    setSt(s);
    setSeason(s.season ?? "summer");
    sceneRef.current?.setBuildings(s.buildings, s.openSlots);
  }, []);

  // the island's state; the 3D scene is made once its season is known (a new island = a new scene)
  useEffect(() => {
    if (!ready) return;
    getMyIsland(profile.id, isle).then(show).catch((e) => setMsg(e.message));
  }, [ready, profile, isle, show]);

  useEffect(() => {
    if (!ready || !season) return;
    const phone = window.innerWidth < 700;
    const scene = new IslandScene(box.current, {
      seed: 1000 + profile.id * 7919 + isle * 104729,
      season,
      phone,
      onPick: (i) => {
        sfx.tap();
        setSlot(i);
        setOpen(true);
        setMsg("");
      },
    });
    sceneRef.current = scene;
    document.body.classList.add("on-island3d"); // the sound button moves to the top on this page
    box.current.islandScene = scene; // for the page tests (tap a place by number)
    if (stRef.current) scene.setBuildings(stRef.current.buildings, stRef.current.openSlots);
    return () => {
      document.body.classList.remove("on-island3d");
      scene.dispose();
      sceneRef.current = null;
    };
    // the scene belongs to one island: rebuilt only when the island or its season changes
  }, [ready, profile, isle, season]);

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
  // 2026-11-13 (Shir: "on every island new things"): new here = opens on this island; and a peek at the next
  const isNew = (c) => (isle > 0 && (c.fromIsle ?? 0) === isle ? 1 : 0);
  const soon = (st?.catalog ?? []).filter((c) => !c.season && (c.fromIsle ?? 0) === isle + 1);

  async function act(what, body, done) {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const s = await islandAction(profile.id, what, { isle, ...body });
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

  function replace() {
    act("remove", { slot }, () => "המקום פנוי. בחרו מה לבנות בו");
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
            <b>{st?.isles?.length > 1 ? st.isles[isle]?.name : `האי של ${profile.name}`}</b>
            <span>{st ? `${st.buildings.length} מבנים` : "טוען..."}</span>
          </div>
        </div>
        <div className="i3-money">
          <span className="i3-pill" aria-label={`${st?.coins ?? 0} מטבעות`}><Coin />{st ? st.coins.toLocaleString("he-IL") : "…"}</span>
          <span className="i3-pill i3-pill--star" aria-label={`${st?.stars ?? 0} כוכבים`}>★ {st?.stars ?? "…"}</span>
        </div>
      </header>

      {st?.isles?.length > 1 && (
        <nav className="i3-isles" aria-label="האיים שלי">
          {st.isles.map((x) => (
            <button key={x.index} className="i3-isle-chip" aria-pressed={x.index === isle}
              onClick={() => {
                if (x.index === isle) return;
                sfx.tap();
                setSlot(null);
                setMsg("");
                setSeason(null);
                setIsle(x.index);
              }}>
              {SEASON_ICON[x.season] ?? "🏝️"} {x.name}
            </button>
          ))}
        </nav>
      )}

      <section className={`i3-sheet${open ? "" : " is-closed"}`} aria-label="בנייה ושדרוג">
        <button className="i3-sheet__grip" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "להקטין" : "להגדיל"}>
          <span />
        </button>
        {open && (
          <div className="i3-sheet__body">
            {msg && <p className="i3-msg" role="status">{msg}</p>}
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

            {!st && <p className="i3-hint">טוען את האי...</p>}
            {st && slot == null && (
              <div className="i3-intro">
                <p className="i3-hint">לוחצים על עיגול לבן על האי כדי לבנות, או על מבנה כדי לשדרג.</p>
                {/* 2026-11-13 (Shir: "until the whole island is built, another doesn't open") */}
                {!st.nextIsle && isle === (st.isles?.length ?? 1) - 1 && (
                  <div className="i3-progress" aria-label={`בנית ${st.lastIsleBuilt} מתוך ${st.maxSlots} מקומות`}>
                    <span>🏝️ בנית <b>{st.lastIsleBuilt ?? 0}</b> מתוך {st.maxSlots} מקומות. כשכל האי בנוי - נפתח אי חדש!</span>
                    <span className="i3-progress__bar"><span style={{ width: `${Math.min(100, ((st.lastIsleBuilt ?? 0) / st.maxSlots) * 100)}%` }} /></span>
                  </div>
                )}
                {st.nextIsle && (
                  <div className="i3-new-isle">
                    <b>{SEASON_ICON[st.nextIsle.season]} האי מלא! אפשר לקנות אי חדש: {st.nextIsle.name}</b>
                    <span>אי ריק לבנייה בעונה אחרת. המחירים שם קצת גבוהים יותר.</span>
                    <button className="i3-btn i3-btn--gold" disabled={busy || st.coins < st.nextIsle.cost}
                      onClick={() => act("new-isle", {}, (s) => {
                        setSeason(null);
                        setIsle(s.isle);
                        return `קנית את ${s.isles[s.isle].name}! 🎉`;
                      })}>
                      לקנות אי · {st.nextIsle.cost} <Coin size={16} />
                    </button>
                  </div>
                )}
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
                <button className="i3-btn i3-btn--ghost" disabled={busy} onClick={replace}>
                  להחליף במבנה אחר (המטבעות חוזרים)
                </button>
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
                  {st.catalog
                    .filter((c) => (!c.season || c.season === st.season) && (c.fromIsle ?? 0) <= isle
                      && (cat === "all" || c.category === cat))
                    .sort((a, b) => isNew(b) - isNew(a))
                    .map((c) => (
                    <div key={c.kind} className="i3-item">
                      <span className="i3-item__icon" aria-hidden="true">{ICON[c.kind] ?? "🏗️"}</span>
                      <b>
                        {c.names[0]}
                        {isNew(c) ? <span className="i3-only"> · חדש!</span> : c.season && <span className="i3-only"> · רק כאן!</span>}
                      </b>
                      <span>{c.perks[0]}</span>
                      <button className="i3-btn i3-btn--green i3-btn--small" disabled={busy || st.coins < c.costs[0]}
                        onClick={() => act("build", { slot, kind: c.kind }, () => `בנית ${c.names[0]}!`)}>
                        {c.costs[0]} <Coin size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {soon.length > 0 && (
                  <p className="i3-soon">🔒 באי הבא: {soon.map((c) => `${ICON[c.kind] ?? ""} ${c.names[0]}`).join(" · ")}</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
