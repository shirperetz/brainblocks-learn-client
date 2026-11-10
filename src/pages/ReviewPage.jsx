import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import AnswerButton from "../components/AnswerButton";
import HelpButton from "../components/HelpButton";
import MathText from "../components/MathText";
import { getMistakes, resolveMistake } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import { reviewOptions } from "../game/review";
import "../styles/pages/play.css";
import "../styles/pages/challenges.css";

// 🔁 Back to what was hard: past wrong answers, one at a time. Right this time -> it leaves the list.
export default function ReviewPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [fixed, setFixed] = useState(0);
  const [error, setError] = useState("");

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
      resolveMistake(m.id, profile.id).catch(() => {});
    }
  }

  function next() {
    setPicked(null);
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
        {error && <p className="form-error">{error}</p>}
        {items === null && !error && <p className="play__loading">טוען...</p>}

        {items && items.length === 0 && (
          <div className="challenge__intro card">
            <Mascot avatarKey={profile.avatar} size="sm" message="אין מה לחזור - כל הכבוד!" />
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
                <p>{picked === m.correctAnswer ? "🎉 נכון! זה כבר לא קשה לכם." : `התשובה: ${m.correctAnswer}. ${m.explanation ?? ""}`}</p>
                <BigButton variant="green" onClick={next}>
                  הבא ←
                </BigButton>
              </div>
            )}
          </>
        )}

        {items && items.length > 0 && index >= items.length && (
          <div className="challenge__intro card">
            <Mascot avatarKey={profile.avatar} size="sm" message={`תיקנתם ${fixed} מתוך ${items.length}!`} />
            <BigButton variant="blue" onClick={() => navigate("/topics")}>
              לנושאים
            </BigButton>
          </div>
        )}
      </div>
    </div>
  );
}
