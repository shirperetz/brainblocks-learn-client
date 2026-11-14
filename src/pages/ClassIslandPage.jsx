import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IslandScene } from "../island3d/IslandScene";
import { getClassIsland, staffClassIsland } from "../services/learnApi";
import { sfx } from "../game/audio";
import { useRequireProfile } from "../hooks/useRequireProfile";
import ClassBuilding from "../components/ClassBuilding";
import "../styles/pages/island3d.css";
import "../styles/pages/class-island.css";

/**
 * 2026-11-14 (Shir: "a class island - in 3D like the children's, and more upgraded"; direction A):
 * the class's own 3D island. Every week the class completes its building, a new building stays here for
 * the year; a full round of weeks grows the older ones. This week's building is a construction site
 * with a crane. Under it: this week (with "donate coins") and the league of classes - classes only.
 * /class-island = my class (a child); /staff/class/:id/island = a teacher's class.
 */
const SITE_SLOT = 10; // the construction site's place - after the ten buildings of a round

export default function ClassIslandPage() {
  const navigate = useNavigate();
  const { id: staffClassId } = useParams();
  const { profile, ready } = useRequireProfile();
  const box = useRef(null);
  const sceneRef = useRef(null);
  const [st, setSt] = useState(null);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null);
  const [open, setOpen] = useState(true);
  const staff = staffClassId != null;

  useEffect(() => {
    if (!ready) return;
    (staff ? staffClassIsland(staffClassId) : getClassIsland(profile.id))
      .then((s) => (s && s.className ? setSt(s) : setError("עוד אין לך כיתה. מצטרפים עם הקוד מהמורה.")))
      .catch((e) => setError(e.message));
  }, [ready, profile, staff, staffClassId]);

  useEffect(() => {
    if (!st || !box.current) return;
    const scene = new IslandScene(box.current, {
      seed: 50000 + st.classId * 7919,
      season: "summer",
      phone: window.innerWidth < 700,
      onPick: (i) => {
        sfx.tap();
        setPicked(i);
        setOpen(true);
      },
    });
    const stage = Math.max(0, Math.min(5, st.week?.stage ?? 0));
    const builds = [...st.buildings, { slot: SITE_SLOT, kind: "site", level: st.week?.done ? 5 : stage }];
    scene.setBuildings(builds, 0);
    sceneRef.current = scene;
    box.current.islandScene = scene;
    document.body.classList.add("on-island3d");
    return () => {
      document.body.classList.remove("on-island3d");
      scene.dispose();
      sceneRef.current = null;
    };
  }, [st]);

  if (!ready) return null;
  const back = () => navigate(staff ? "/staff" : "/topics");
  if (error) {
    return (
      <div className="app-shell">
        <button className="back-button" onClick={back}>← חזרה</button>
        <p className="form-error" role="alert">{error}</p>
      </div>
    );
  }

  const chosen = picked == null ? null : picked === SITE_SLOT ? "site" : st?.buildings.find((b) => b.slot === picked);
  const levelName = (l) => (l >= 3 ? " (רמה 3 - עם דגל זהב)" : l === 2 ? " (רמה 2)" : "");

  return (
    <div className="i3 ci" dir="rtl">
      <div ref={box} className="i3-stage" aria-label="האי של הכיתה בתלת-ממד: גוררים לסובב, לוחצים על מבנה כדי לראות מה הוא" />

      <header className="i3-top">
        <button className="i3-round" onClick={back} aria-label="חזרה">←</button>
        <div className="i3-who">
          <img src="/mascot/success-06.webp" alt="" className="i3-avatar" />
          <div>
            <b>{st ? `האי של ${st.className}` : "האי של הכיתה"}</b>
            <span>{st ? `${st.weeksDone} שבועות מושלמים · ${st.buildings.length} מבנים` : "טוען..."}</span>
          </div>
        </div>
      </header>

      <section className={`i3-sheet${open ? "" : " is-closed"}`} aria-label="האי של הכיתה">
        <button className="i3-sheet__grip" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "להקטין" : "להגדיל"}>
          <span />
        </button>
        {open && st && (
          <div className="i3-sheet__body ci-body">
            {chosen === "site" && (
              <p className="ci-picked" role="status">
                🏗️ כאן נבנה השבוע: <b>{st.next.name}</b>{st.next.upgrade ? " (שדרוג)" : ""}. כל תשובה נכונה של מישהו בכיתה = לבנה.
              </p>
            )}
            {chosen && chosen !== "site" && (
              <p className="ci-picked" role="status">
                ✨ <b>{chosen.name}</b>{levelName(chosen.level)} - נבנה בשבוע שהכיתה השלימה יחד.
              </p>
            )}

            <div className="ci-next">
              <b>השבוע בונים: {st.next.name}{st.next.upgrade ? " - שדרוג לרמה " + st.next.level : ""}</b>
              <span>כשהבניין של השבוע גמור, הוא נשאר על האי לכל השנה.</span>
            </div>

            {staff ? <ClassBuilding classId={st.classId} /> : <ClassBuilding profileId={profile.id} />}

            <div className="ci-league">
              <h2>🏆 ליגת הכיתות השבוע</h2>
              <p className="ci-league__hint">ממוצע לבנים לכל ילד - כך כיתה קטנה וכיתה גדולה מתחרות בהוגנות. בלי דירוג של ילדים.</p>
              <ol className="ci-league__list">
                {st.league.map((r) => {
                  const top = Math.max(1, ...st.league.map((x) => x.perChild));
                  return (
                    <li key={r.place + r.name} className={`ci-row${r.mine ? " is-mine" : ""}`}>
                      <span className="ci-row__place">{r.place}</span>
                      <span className="ci-row__name">{r.name}{r.mine ? " (אתם)" : ""}{r.done ? " ✓" : ""}</span>
                      <span className="ci-row__bar" aria-hidden="true"><span style={{ width: `${(r.perChild / top) * 100}%` }} /></span>
                      <span className="ci-row__num">{r.perChild}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
