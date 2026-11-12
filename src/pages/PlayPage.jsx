import { useEffect, useRef, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { useNavigate, useParams } from "react-router-dom";
import AnswerButton from "../components/AnswerButton";
import ProgressBar from "../components/ProgressBar";
import HelpButton from "../components/HelpButton";
import ReadAloud from "../components/ReadAloud";
import { readAloudDefault } from "../game/readAloud";
import QuestionPicture from "../components/QuestionPicture";
import MathText from "../components/MathText";
import { getTopic } from "../data/topics";
import { getQuestions, submitSession } from "../services/learnApi";
import { useProfile } from "../context/profileStore";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/play.css";
import { cheer } from "../game/companion";

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
  // 2026-11-12: the up-to-date list (a wrong answer adds its exercise again) for advance() in a timeout.
  const questionsRef = useRef([]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // 2026-11-11: a new question on the screen -> the companion's "stuck?" timer starts again.
  useEffect(() => {
    if (questions.length) cheer("question");
  }, [index, questions.length]);
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
    cheer(isCorrect ? "correct" : "wrong");

    // 2026-11-12 (Shir: "always different exercises, unless the child got it wrong - then the same one
    // again, to check it was understood"): a wrong answer brings the same exercise back 3 questions
    // later, options in another order. The second try doesn't count in points, stars or the saved
    // round (the first answer did) - it only tells the child whether it got it now.
    if (current.retry) {
      setTimeout(advance, FEEDBACK_MS);
      return;
    }
    if (!isCorrect) {
      const again = retryOf(current);
      setQuestions((qs) => {
        const at = Math.min(index + 1 + RETRY_AFTER, qs.length);
        return [...qs.slice(0, at), again, ...qs.slice(at)];
      });
    }

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
      skill: current.skill,
    });

    setTimeout(advance, FEEDBACK_MS);
  }

  function advance() {
    helpUsedRef.current = false;
    if (index + 1 < questionsRef.current.length) {
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

  const mascotMessage = current?.retry
    ? feedback === "correct" ? "הבנת! 👍 כל הכבוד" : feedback === "wrong" ? "נתרגל את זה עוד פעם בחזרה" : "🔁 התרגיל מקודם - עוד ניסיון"
    : feedback === "correct" ? "כל הכבוד! תשובה נכונה!" : feedback === "wrong" ? "כמעט! עוד מעט נחזור על התרגיל הזה" : null;

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
            <DolphinPerch side message={mascotMessage} />
            <div className="play__question card" style={{ "--accent": topicInfo?.color }}>
              <div className="play__question-row">
                <p className="play__question-text">
                  <MathText text={current.text} />
                </p>
                <ReadAloud key={`${index}-${current.text}`} text={current.text} auto={readAloudDefault(profile.grade)} />
              </div>
              <QuestionPicture visual={current.visual} />
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

          </>
        )}
      </div>
    </div>
  );
}

/** How many questions after a wrong answer its exercise comes back. */
const RETRY_AFTER = 2;

/** The same exercise again, its options in another order (so the child can't just remember the place). */
function retryOf(q) {
  const right = q.options[q.correctIndex];
  let options = [...q.options];
  for (let tries = 0; tries < 5; tries++) {
    options = [...q.options].sort(() => Math.random() - 0.5);
    if (options.indexOf(right) !== q.correctIndex) break;
  }
  return { ...q, options, correctIndex: options.indexOf(right), retry: true };
}
