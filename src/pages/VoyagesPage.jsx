import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import DolphinPerch from "../components/DolphinPerch";
import QuickQuiz from "../components/QuickQuiz";
import { useProfile } from "../context/profileStore";
import { sfx } from "../game/audio";
import { getQuestions, getVoyages, voyageReward } from "../services/learnApi";
import "../styles/pages/challenges.css";
import "../styles/pages/voyages.css";

const COUNT = 5;
const PASS = 4; // of 5

/**
 * 2026-11-27 (Shir: idea #7): the ship the child built sails to a place. The voyage is a round of
 * mixed exercises; getting at least 4 of 5 right brings back a treasure of coins for the island -
 * once per place per day. Needs a ship on the island first.
 */
export default function VoyagesPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useProfile();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [sailing, setSailing] = useState(null); // the destination being played
  const [questions, setQuestions] = useState(null);
  const [result, setResult] = useState(null); // { passed, coins, already, name }
  const answers = useRef([]);

  function load() {
    getVoyages(profile.id).then(setData).catch((e) => setErr(e.message));
  }
  useEffect(() => {
    if (profile?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!profile || profile.teacher || profile.admin) return null;

  function start(dest) {
    answers.current = [];
    setResult(null);
    setSailing(dest);
    getQuestions({ profileId: profile.id, topic: "MIXED", stage: 3, count: COUNT, secure: true })
      .then(setQuestions)
      .catch((e) => setErr(e.message));
  }

  async function finish() {
    const correct = answers.current.filter((a) => a.correct).length;
    const passed = correct >= PASS;
    setQuestions(null);
    if (!passed) {
      setResult({ passed: false, name: sailing.name });
      return;
    }
    sfx.star();
    try {
      const r = await voyageReward(profile.id, sailing.key);
      refreshProfile();
      setResult({ passed: true, coins: r.coins, already: r.already, name: sailing.name });
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate(-1)}>← חזרה</button>
      <div className="challenge voyages">
        <h1 className="screen-title">⛵ מסעות הספינה</h1>
        <DolphinPerch side message={data && !data.hasShip ? "בנו ספינה באי שלי קודם!" : !questions && !result ? "לאן מפליגים היום?" : null} />
        {err && <p className="form-error">{err}</p>}

        {data && !data.hasShip && !questions && (
          <div className="challenge__intro card">
            <p>כדי להפליג צריך קודם לבנות ספינה באי שלך 🚢</p>
            <BigButton variant="blue" onClick={() => navigate("/my-island")}>לאי שלי ←</BigButton>
          </div>
        )}

        {data && data.hasShip && !questions && !result && (
          <div className="voyages__list">
            {data.destinations.map((d) => (
              <button key={d.key} className={`voyages__dest card${d.doneToday ? " is-done" : ""}`}
                disabled={d.doneToday} onClick={() => start(d)}>
                <span className="voyages__emoji" aria-hidden="true">{d.emoji}</span>
                <span className="voyages__name">{d.name}</span>
                <span className="voyages__coins">{d.doneToday ? "הפלגתם היום ✓" : `🪙 ${d.coins} אוצר`}</span>
              </button>
            ))}
          </div>
        )}

        {questions && (
          <QuickQuiz questions={questions} grade={profile.grade}
            onAnswer={(a) => answers.current.push(a)} onDone={finish} />
        )}

        {result && (
          <div className="challenge__intro card voyages__result">
            {result.passed ? (
              <>
                <p className="voyages__treasure">🏴‍☠️💰</p>
                <p>{result.already ? `חזרת מ${result.name} - כבר קיבלת את האוצר היום.` : `חזרת מ${result.name} עם אוצר! 🪙 +${result.coins} מטבעות לאי.`}</p>
              </>
            ) : (
              <p>כמעט! צריך {PASS} נכונות כדי להביא אוצר מ{result.name}. אפשר לנסות שוב 💪</p>
            )}
            <BigButton variant="green" onClick={() => { setResult(null); setSailing(null); }}>חזרה לנמל</BigButton>
          </div>
        )}
      </div>
    </div>
  );
}
