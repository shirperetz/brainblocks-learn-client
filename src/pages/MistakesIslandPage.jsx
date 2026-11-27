import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnswerButton from "../components/AnswerButton";
import MathText from "../components/MathText";
import Mascot from "../components/Mascot";
import { useProfile } from "../context/profileStore";
import { sfx } from "../game/audio";
import { reviewOptions } from "../game/review";
import { cleanMistake, getAllMistakes, missMistake } from "../services/learnApi";
import "../styles/pages/play.css";
import "../styles/pages/mistakes-island.css";

/**
 * 2026-11-27 (Shir: idea #5): an island built from the exercises the child got wrong. Each open mistake
 * is a weed/rock; answering it right cleans that spot (it becomes a flower) and removes the mistake.
 * When the island is clean - a celebration. Reuses the mistakes the site already keeps.
 */
const WEEDS = ["🪨", "🌿", "🥀", "🍂", "🪵", "🐛"];

export default function MistakesIslandPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [cleaned, setCleaned] = useState({}); // id -> true
  const [open, setOpen] = useState(null); // the mistake being solved
  const [picked, setPicked] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!profile?.id) return undefined;
    let alive = true;
    getAllMistakes(profile.id)
      .then((ms) => alive && setItems(ms.map((m, i) => ({ ...m, options: reviewOptions(m.correctAnswer), weed: WEEDS[i % WEEDS.length] })).filter((m) => m.options)))
      .catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [profile?.id]);

  const left = useMemo(() => (items ?? []).filter((m) => !cleaned[m.id]).length, [items, cleaned]);
  if (!profile || profile.teacher || profile.admin) return null;

  function pick(opt) {
    if (picked !== null) return;
    setPicked(opt);
    if (opt === open.correctAnswer) {
      sfx.correct();
      cleanMistake(open.id, profile.id).catch(() => {});
      setTimeout(() => {
        setCleaned((c) => ({ ...c, [open.id]: true }));
        setOpen(null);
        setPicked(null);
      }, 900);
    } else {
      sfx.wrong();
      missMistake(open.id, profile.id).catch(() => {});
    }
  }

  function spotState(opt) {
    if (picked === null) return "idle";
    if (opt === picked) return opt === open.correctAnswer ? "correct" : "wrong";
    if (opt === open.correctAnswer) return "reveal";
    return "muted";
  }

  return (
    <div className="app-shell mi">
      <header className="mi__top">
        <button className="play__exit" onClick={() => navigate(-1)} aria-label="חזרה">✕</button>
        <h1>🏝️ אי הטעויות</h1>
      </header>

      {err && <p className="form-error">{err}</p>}
      {!items && !err && <p className="play__loading">טוען...</p>}

      {items && items.length === 0 && (
        <div className="mi__clean">
          <Mascot dolphin size="lg" play="success" />
          <h2>אין טעויות לתקן! 🌸</h2>
          <p>האי שלך נקי לגמרי. כל הכבוד!</p>
        </div>
      )}

      {items && items.length > 0 && (
        <>
          <p className="mi__count">{left > 0 ? `יש ${left} דברים לנקות - לחצו כדי לתקן` : "ניקית הכל! 🌸"}</p>
          {left === 0 && (
            <div className="mi__clean">
              <Mascot dolphin size="lg" play="success" />
              <h2>האי נקי! 🌸🌸</h2>
            </div>
          )}
          <div className="mi__field" aria-label="אי הטעויות">
            {items.map((m) => (
              <button
                key={m.id}
                className={`mi__spot${cleaned[m.id] ? " is-clean" : ""}`}
                disabled={cleaned[m.id]}
                onClick={() => { setOpen(m); setPicked(null); }}
                aria-label={cleaned[m.id] ? "נוקה" : "תרגיל לתיקון"}
              >
                {cleaned[m.id] ? "🌸" : m.weed}
              </button>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="mi__sheet" role="dialog" aria-modal="true" aria-label="תיקון טעות">
          <div className="mi__card card">
            <button className="play__exit mi__close" onClick={() => { setOpen(null); setPicked(null); }} aria-label="סגירה">✕</button>
            <p className="play__question-text"><MathText text={open.questionText} /></p>
            <div className="play__answers">
              {open.options.map((opt) => (
                <AnswerButton key={opt} label={opt} state={spotState(opt)} onClick={() => pick(opt)} disabled={picked !== null} />
              ))}
            </div>
            {picked !== null && picked !== open.correctAnswer && (
              <p className="mi__hint">התשובה הנכונה: <b>{open.correctAnswer}</b>. ננסה עוד פעם בפעם הבאה 💪</p>
            )}
            {picked === open.correctAnswer && <p className="mi__good">יש! ניקית את זה 🌸</p>}
          </div>
        </div>
      )}
    </div>
  );
}
