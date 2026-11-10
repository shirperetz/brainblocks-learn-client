import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AnswerButton from "../components/AnswerButton";
import ProgressBar from "../components/ProgressBar";
import Mascot from "../components/Mascot";
import HelpButton from "../components/HelpButton";
import { getTopic } from "../data/topics";
import { getQuestions, submitSession } from "../services/learnApi";
import { useProfile } from "../context/profileStore";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/play.css";

const FEEDBACK_MS = 1300;

// Screen 6 — answer 10 questions. Correct = green + sparkle; wrong = gentle shake.
export default function PlayPage() {
  const { topic, stage } = useParams();
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { refreshProfile } = useProfile();
  const topicInfo = getTopic(topic);

  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // chosen option index, or null
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef([]);
  const streakRef = useRef(0);
  const helpUsedRef = useRef(false); // "לא הבנתי" opened on the current question
  const startRef = useRef(0); // set to the real start time in the effect below

  useEffect(() => {
    if (!ready || !topicInfo) return;
    let active = true;
    answersRef.current = [];
    startRef.current = Date.now();
    getQuestions({ profileId: profile.id, topic, stage, count: 10 })
      .then((data) => {
        if (!active) return;
        if (!data || data.length === 0) setError("לא הצלחנו להכין שאלות. נסו שוב.");
        else setQuestions(data);
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [ready, profile, topic, stage, topicInfo]);

  if (!ready) return null;

  const current = questions[index];
  const total = questions.length;

  function handleAnswer(optionIndex) {
    if (selected !== null || !current) return;
    const isCorrect = optionIndex === current.correctIndex;
    setSelected(optionIndex);
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      streakRef.current += 1;
      setPoints((p) => p + 10 + (streakRef.current >= 3 ? 5 : 0));
    } else {
      streakRef.current = 0;
    }

    answersRef.current.push({
      questionText: current.text,
      chosenAnswer: current.options[optionIndex],
      correctAnswer: current.options[current.correctIndex],
      correct: isCorrect,
      hintUsed: helpUsedRef.current,
      topic: current.topic,
      explanation: current.explanation,
    });

    setTimeout(advance, FEEDBACK_MS);
  }

  function advance() {
    helpUsedRef.current = false;
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      finish();
    }
  }

  function finish() {
    setSubmitting(true);
    // eslint-disable-next-line react-hooks/purity -- end-of-run timing; this runs from a timeout, not during render
    const durationMs = Date.now() - startRef.current;
    submitSession({
      profileId: profile.id,
      topic,
      stage: Number(stage),
      mode: "STAGE",
      durationMs,
      answers: answersRef.current,
    })
      .then((summary) => {
        refreshProfile();
        navigate(`/summary/${topic}/${stage}`, { state: { summary } });
      })
      .catch((err) => {
        setError(err.message);
        setSubmitting(false);
      });
  }

  function handleExit() {
    if (window.confirm("לצאת מהשלב? ההתקדמות בשלב הזה לא תישמר.")) {
      navigate(`/map/${topic}`);
    }
  }

  function optionState(j) {
    if (selected === null) return "idle";
    if (j === selected) return feedback === "correct" ? "correct" : "wrong";
    if (j === current.correctIndex) return "reveal";
    return "muted";
  }

  const mascotMessage =
    feedback === "correct" ? "כל הכבוד! תשובה נכונה!" : feedback === "wrong" ? "כמעט! ננסה שוב" : null;

  return (
    <div className="app-shell">
      <div className="play">
        <header className="play__top">
          <button className="play__exit" onClick={handleExit} aria-label="יציאה">
            ✕
          </button>
          <div className="play__counter">{total > 0 ? `שאלה ${index + 1} מתוך ${total}` : "טוען..."}</div>
          <div className="play__points">⭐ {points}</div>
        </header>

        {total > 0 && <ProgressBar current={index + 1} total={total} />}

        {error && <p className="form-error">{error}</p>}

        {submitting && <p className="play__loading">בודקים את התשובות... 🎉</p>}

        {!error && !submitting && !current && <p className="play__loading">מכינים שאלות... 🧮</p>}

        {current && !submitting && (
          <>
            <div className="play__question card" style={{ "--accent": topicInfo?.color }}>
              <p className="play__question-text">{current.text}</p>
            </div>

            {selected === null && (
              <HelpButton
                key={`${index}-${current.text}`}
                question={{ text: current.text, correct: current.options[current.correctIndex], hint: current.hint }}
                grade={profile.grade}
                onUsed={() => (helpUsedRef.current = true)}
              />
            )}

            <div className="play__answers">
              {current.options.map((opt, j) => (
                <AnswerButton
                  key={j}
                  label={opt}
                  state={optionState(j)}
                  disabled={selected !== null}
                  onClick={() => handleAnswer(j)}
                />
              ))}
            </div>

            <div className="play__mascot">
              <Mascot avatarKey={profile.avatar} size="sm" message={mascotMessage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
