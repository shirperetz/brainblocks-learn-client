import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import AnswerButton from "../components/AnswerButton";
import { getQuestions, getStats, submitSession } from "../services/learnApi";
import { useProfile } from "../context/profileStore";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/play.css";
import "../styles/pages/challenges.css";

const SECONDS = 60;

// ⏱️ 60 seconds: as many questions as you can. Beat your own best - no one else's.
export default function TimedPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { refreshProfile } = useProfile();
  const [best, setBest] = useState(null);
  const [phase, setPhase] = useState("intro"); // intro | play | done
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [flash, setFlash] = useState(null); // "correct" | "wrong"
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [error, setError] = useState("");
  const answers = useRef([]);
  const fetching = useRef(false);

  useEffect(() => {
    if (!ready) return;
    getStats(profile.id).then((s) => setBest(s.bestTimed)).catch((e) => setError(e.message));
  }, [ready, profile]);

  const clock = useRef(null);
  useEffect(() => () => clearTimeout(clock.current), []);

  if (!ready) return null;

  function more() {
    if (fetching.current) return;
    fetching.current = true;
    getQuestions({ profileId: profile.id, topic: "MIXED", stage: 2, count: 20 })
      .then((qs) => setQuestions((old) => [...old, ...qs]))
      .catch((e) => setError(e.message))
      .finally(() => (fetching.current = false));
  }

  function start() {
    answers.current = [];
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setLeft(SECONDS);
    setNewBest(false);
    more();
    setPhase("play");
    // The clock: started by the tap, ends the round by itself.
    // eslint-disable-next-line react-hooks/purity -- runs from the start button, not during render
    const deadline = Date.now() + SECONDS * 1000;
    const tick = () => {
      const rest = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(rest);
      if (rest <= 0) end();
      else clock.current = setTimeout(tick, 250);
    };
    clearTimeout(clock.current);
    clock.current = setTimeout(tick, 250);
  }

  function pick(j) {
    const q = questions[index];
    if (!q || flash) return;
    const correct = j === q.correctIndex;
    answers.current.push({
      questionText: q.text,
      chosenAnswer: q.options[j],
      correctAnswer: q.options[q.correctIndex],
      correct,
      hintUsed: false,
      topic: q.topic,
      explanation: q.explanation,
    });
    if (correct) setScore((s) => s + 1);
    setFlash(correct ? "correct" : "wrong");
    setTimeout(() => {
      setFlash(null);
      setIndex((i) => i + 1);
      if (questions.length - index < 6) more();
    }, 350);
  }

  function end() {
    setPhase("done");
    const got = answers.current.filter((a) => a.correct).length;
    if (best !== null && got > best) setNewBest(true);
    if (answers.current.length === 0) return;
    submitSession({
      profileId: profile.id,
      topic: "MIXED",
      stage: 1,
      mode: "TIMED",
      durationMs: SECONDS * 1000,
      answers: answers.current,
    })
      .then(() => {
        refreshProfile();
        return getStats(profile.id).then((s) => setBest(s.bestTimed));
      })
      .catch((e) => setError(e.message));
  }

  const q = questions[index];

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate("/topics")}>
        ← חזרה
      </button>
      <div className="challenge">
        <h1 className="screen-title">⏱️ אתגר 60 שניות</h1>
        {error && <p className="form-error">{error}</p>}

        {phase === "intro" && (
          <div className="challenge__intro card">
            <Mascot avatarKey={profile.avatar} size="sm" message="כמה תספיקו בדקה אחת?" />
            <p className="challenge__big">{best ? `השיא שלכם: ${best} ⭐` : "עוד אין שיא - זה הזמן!"}</p>
            <BigButton variant="green" onClick={start}>
              מוכנים? צאו!
            </BigButton>
          </div>
        )}

        {phase === "play" && (
          <>
            <div className="timer" aria-label={`נשארו ${left} שניות`}>
              <div className="timer__bar" style={{ width: `${(left / SECONDS) * 100}%` }} />
              <span className="timer__num" dir="ltr">
                {left}
              </span>
              <span className="timer__score">✔ {score}</span>
            </div>
            {q ? (
              <>
                <div className={`play__question card ${flash ? `flash--${flash}` : ""}`}>
                  <p className="play__question-text">{q.text}</p>
                </div>
                <div className="play__answers">
                  {q.options.map((opt, j) => (
                    <AnswerButton key={`${index}-${j}`} label={opt} state="idle" disabled={!!flash} onClick={() => pick(j)} />
                  ))}
                </div>
              </>
            ) : (
              <p className="play__loading">מכינים שאלות... 🧮</p>
            )}
          </>
        )}

        {phase === "done" && (
          <div className="challenge__intro card">
            <p className="challenge__big">{newBest ? "🏆 שיא חדש!" : "⏰ הזמן נגמר!"}</p>
            <p className="challenge__big">{score} תשובות נכונות</p>
            {best !== null && <p>השיא שלכם: {Math.max(best, score)}</p>}
            <BigButton variant="green" onClick={start}>
              עוד פעם!
            </BigButton>
            <BigButton variant="ghost" onClick={() => navigate("/topics")}>
              חזרה לנושאים
            </BigButton>
          </div>
        )}
      </div>
    </div>
  );
}
