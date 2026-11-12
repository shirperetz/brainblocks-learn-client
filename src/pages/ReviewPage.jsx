import { useEffect, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import AnswerButton from "../components/AnswerButton";
import HelpButton from "../components/HelpButton";
import MathText from "../components/MathText";
import { getMistakes, missMistake, resolveMistake } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import { reviewOptions } from "../game/review";
import "../styles/pages/play.css";
import "../styles/pages/challenges.css";

// 2026-11-12 (idea #4): after the 1st/2nd/3rd right answer it comes back in a day / 3 days / a week.
const AGAIN = { 1: "מחר", 2: "בעוד 3 ימים", 3: "בעוד שבוע" };

// 🔁 Back to what was hard: past wrong answers, one at a time. Right this time -> it leaves the list.
export default function ReviewPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [fixed, setFixed] = useState(0);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!ready) return;
    getMistakes(profile.id)
      .then((ms) => setItems(ms.map((m) => ({ ...m, options: reviewOptions(m.correctAnswer) })).filter((m) => m.options)))
      .catch((e) => setError(e.message));
  }, [ready, profile]);

  if (!ready) return null;

  const m = items?.[index];

  function pick(opt) {
    if (picked !== null) return;
    setPicked(opt);
    if (opt === m.correctAnswer) {
      setFixed((n) => n + 1);
      // 2026-11-12: right -> it comes back after 1, 3, 7 days (then it is learned).
      resolveMistake(m.id, profile.id)
        .then((r) => setNote(r.resolved ? "🎓 למדת את זה לגמרי!" : `👍 נחזור על זה ${AGAIN[r.step] ?? "בעוד כמה ימים"}`))
        .catch(() => {});
    } else {
      // wrong -> tomorrow, from the start
      missMistake(m.id, profile.id).catch(() => {});
      setNote("לא נורא - נחזור על זה מחר 💪");
    }
  }

  function next() {
    setPicked(null);
    setNote("");
    setIndex((i) => i + 1);
  }

  function state(opt) {
    if (picked === null) return "idle";
    if (opt === picked) return opt === m.correctAnswer ? "correct" : "wrong";
    if (opt === m.correctAnswer) return "reveal";
    return "muted";
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate("/topics")}>
        ← חזרה
      </button>
      <div className="challenge">
        <h1 className="screen-title">🔁 חוזרים על מה שהיה קשה</h1>
        <DolphinPerch side
          message={
            items && items.length === 0
              ? "אין חזרות להיום - כל הכבוד! 🌟"
              : items && index >= items.length
                ? `תיקנתם ${fixed} מתוך ${items.length}!`
                : null
          }
        />
        {error && <p className="form-error">{error}</p>}
        {items === null && !error && <p className="play__loading">טוען...</p>}

        {items && items.length === 0 && (
          <div className="challenge__intro card">
            <BigButton variant="blue" onClick={() => navigate("/topics")}>
              לנושאים
            </BigButton>
          </div>
        )}

        {m && (
          <>
            <p className="challenge__count">
              {index + 1} מתוך {items.length}
            </p>
            <div className="play__question card">
              <p className="play__question-text">
                <MathText text={m.questionText} />
              </p>
              {m.givenAnswer && <p className="review__was">בפעם הקודמת עניתם {m.givenAnswer}</p>}
            </div>
            {picked === null && (
              <HelpButton
                key={m.id}
                question={{ text: m.questionText, correct: m.correctAnswer, chosen: m.givenAnswer, hint: "" }}
                grade={profile.grade}
              />
            )}
            <div className="play__answers">
              {m.options.map((opt) => (
                <AnswerButton key={opt} label={opt} state={state(opt)} disabled={picked !== null} onClick={() => pick(opt)} />
              ))}
            </div>
            {picked !== null && (
              <div className="challenge__intro card">
                <p>{picked === m.correctAnswer ? "🎉 נכון!" : `התשובה: ${m.correctAnswer}. ${m.explanation ?? ""}`}</p>
                {note && <p className="review__note">{note}</p>}
                <BigButton variant="green" onClick={next}>
                  הבא ←
                </BigButton>
              </div>
            )}
          </>
        )}

        {items && items.length > 0 && index >= items.length && (
          <div className="challenge__intro card">
            <BigButton variant="blue" onClick={() => navigate("/topics")}>
              לנושאים
            </BigButton>
          </div>
        )}
      </div>
    </div>
  );
}
