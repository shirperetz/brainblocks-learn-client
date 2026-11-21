import { useEffect, useRef, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { hintsFor, marksUnits } from "../game/dolphinHint";
import { onCheer } from "../game/companion";
import { useNavigate, useParams } from "react-router-dom";
import AnswerButton from "../components/AnswerButton";
import OpenAnswer from "../components/OpenAnswer";
import { isOpenQuestion } from "../game/openAnswer";
import ProgressBar from "../components/ProgressBar";
import HelpButton from "../components/HelpButton";
import ReadAloud from "../components/ReadAloud";
import { readAloudDefault } from "../game/readAloud";
import QuestionPicture from "../components/QuestionPicture";
import MathText from "../components/MathText";
import { getTopic } from "../data/topics";
import { getQuestions, submitSession, submitIsleSession, answerQuestion, getHelp } from "../services/learnApi";
import { withRetry } from "../services/apiClient";
import BigButton from "../components/BigButton";
import HelpVisual from "../components/HelpVisual";
import { useProfile } from "../context/profileStore";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/play.css";
import { cheer } from "../game/companion";
import { ask } from "../components/dialog";

const FEEDBACK_MS = 1300;

// Screen 6 — answer 10 questions. Correct = green + sparkle; wrong = gentle shake.
export default function PlayPage() {
  const { topic, stage, isleKey } = useParams();
  // 2026-11-13: played on a generated island ("gen-3") - harder questions, results kept on the island
  const tier = Number(/^gen-(\d+)$/.exec(isleKey ?? "")?.[1] ?? 0);
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { refreshProfile } = useProfile();
  const topicInfo = getTopic(topic);

  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // chosen option index, or null
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false); // waiting for the server to check an answer
  // 2026-11-13 (Shir: "the explanation after he got it wrong; help is for before - limited, unless the
  // child is struggling"): after a mistake the game waits on an explanation card; help in a round is
  // limited to HELP_LIMIT questions, unlimited once the child has made STRUGGLING mistakes in it.
  const [wrongHelp, setWrongHelp] = useState(null); // { text, visual, right } | "loading" | null
  const [helpCount, setHelpCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const answersRef = useRef([]);
  const streakRef = useRef(0);
  // 2026-11-12: the up-to-date list (a wrong answer adds its exercise again) for advance() in a timeout.
  const questionsRef = useRef([]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // 2026-11-11: a new question on the screen -> the companion's "stuck?" timer starts again.
  // The dolphin's hint shown -> the units digits in the question light up (+ / − only).
  // (kept per question: the key of the question whose hint was shown)
  const [unitsMarkedFor, setUnitsMarkedFor] = useState(null);
  // 2026-11-15: after a mistake in this round, the dolphin's hint is ready at once on the next questions.
  const wrongSoFarRef = useRef(0);
  useEffect(() => {
    wrongSoFarRef.current = wrongCount;
  }, [wrongCount]);
  useEffect(() => {
    if (questions.length) cheer("question", { wrongSoFar: wrongSoFarRef.current });
  }, [index, questions.length]);
  useEffect(() => onCheer(({ kind, key }) => { if (kind === "hintShown") setUnitsMarkedFor(key); }), []);
  const helpUsedRef = useRef(false); // "לא הבנתי" opened on the current question
  const startRef = useRef(0); // set to the real start time in the effect below

  useEffect(() => {
    if (!ready || !topicInfo) return;
    let active = true;
    answersRef.current = [];
    startRef.current = Date.now();
    // 2026-11-12 (stage 2): secure - the right answer stays on the server until the child answers.
    getQuestions({ profileId: profile.id, topic, stage, count: 10, secure: true, tier })
      .then((data) => {
        if (!active) return;
        if (!data || data.length === 0) setError("לא הצלחנו להכין שאלות. נסו שוב.");
        else setQuestions(data);
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [ready, profile, topic, stage, topicInfo, tier]);

  if (!ready) return null;

  const current = questions[index];
  const total = questions.length;

  async function handleAnswer(optionIndex, typed) {
    if (selected !== null || checking || !current) return;
    let q = current;
    let chosenText = typed ?? q.options[optionIndex];
    // 2026-11-12 (stage 2): the server checks (a retry already knows the answer - it doesn't count).
    if (!q.retry && q.bankId) {
      setChecking(true);
      try {
        const r = await answerQuestion(q.bankId, chosenText);
        q = { ...q, correctIndex: r.correctIndex, explanation: r.explanation };
        // 2026-11-21 (open answers): a typed number - right = the right option; else the option it equals, or none
        if (typed != null) {
          optionIndex = r.correct ? r.correctIndex : q.options.findIndex((o) => o.replace(/,/g, "") === typed.replace(/,/g, ""));
          if (r.correct) chosenText = q.options[r.correctIndex];
          q = { ...q, typed: chosenText, typedRight: r.correct };
        }
        const at = index;
        setQuestions((qs) => qs.map((x, i) => (i === at ? q : x)));
      } catch (e) {
        setChecking(false);
        // 2026-11-21 (night bot got stuck): the server doesn't know this question any more -> don't
        // leave the child stuck on it forever; move on (the question is simply not counted).
        if (e?.status === 404) {
          setError("");
          advance();
          return;
        }
        setError(e?.status === 429 ? "רגע, לאט לאט 🙂 נסו שוב בעוד כמה שניות" : "לא הצלחנו לבדוק את התשובה - בדקו את החיבור ונסו שוב");
        return;
      }
      setChecking(false);
      setError("");
    }
    const isCorrect = typed != null ? Boolean(q.typedRight) : optionIndex === q.correctIndex;
    if (typed != null) setQuestions((qs) => qs.map((x, i) => (i === index ? q : x)));
    setSelected(optionIndex);
    setFeedback(isCorrect ? "correct" : "wrong");
    cheer(isCorrect ? "correct" : "wrong");

    // 2026-11-12 (Shir: "always different exercises, unless the child got it wrong - then the same one
    // again, to check it was understood"): a wrong answer brings the same exercise back 3 questions
    // later, options in another order. The second try doesn't count in points, stars or the saved
    // round (the first answer did) - it only tells the child whether it got it now.
    if (!isCorrect) {
      setWrongCount((n) => n + 1);
      explainMistake(q, chosenText);
    }
    if (current.retry) {
      if (isCorrect) setTimeout(advance, FEEDBACK_MS);
      return;
    }
    if (!isCorrect) {
      const again = retryOf(q, chosenText);
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
      bankId: q.bankId, // the server judges this answer from the bank
      questionText: q.text,
      chosenAnswer: chosenText,
      correctAnswer: q.options[q.correctIndex],
      correct: isCorrect,
      hintUsed: helpUsedRef.current,
      topic: q.topic,
      explanation: q.explanation,
      skill: q.skill,
    });

    if (isCorrect) setTimeout(advance, FEEDBACK_MS);
  }

  /** After a wrong answer: the right answer + why (the mistake sentence, a way, a drawing) - free, from code. */
  function explainMistake(q, chosen) {
    const right = q.options[q.correctIndex];
    setWrongHelp("loading");
    getHelp({ questionText: q.text, correctAnswer: right, chosenAnswer: chosen, grade: profile.grade, attempt: 0, fallbackHint: q.hint, bankId: q.bankId })
      .then((h) => setWrongHelp({ ...h, right }))
      .catch(() => setWrongHelp({ text: q.explanation || q.hint || "", right }));
  }

  function continueAfterMistake() {
    setWrongHelp(null);
    advance();
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
    setSaveFailed(false);
    setError("");
    const sent = withRetry(() => tier
      ? submitIsleSession(profile.id, isleKey, { topic, stage: Number(stage), durationMs, answers: answersRef.current }).then((s) => ({
          ...s,
          correct: Math.round((s.scorePct * answersRef.current.length) / 100),
          total: answersRef.current.length,
          encouragement: s.passed ? "כל הכבוד! עברתם את השלב 🎉" : "כמעט! עוד ניסיון ותצליחו 💪",
          nextStageUnlocked: false,
        }))
      : submitSession({
          profileId: profile.id,
          topic,
          stage: Number(stage),
          mode: "STAGE",
          durationMs,
          answers: answersRef.current,
        }));
    sent
      .then((summary) => {
        refreshProfile();
        navigate(`/summary/${topic}/${stage}`, { state: { summary, back: tier ? `/sea/${isleKey}` : null } });
      })
      .catch((err) => {
        setError(err.message);
        setSaveFailed(true);
        setSubmitting(false);
      });
  }

  async function handleExit() {
    if (await ask("לצאת מהשלב? ההתקדמות בשלב הזה לא תישמר.")) {
      navigate(tier ? `/sea/${isleKey}` : `/map/${topic}`);
    }
  }

  const struggling = wrongCount >= STRUGGLING;
  const helpOpen = struggling || helpCount < HELP_LIMIT;

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
        {saveFailed && !submitting && (
          <BigButton variant="green" onClick={finish}>💾 לשמור את הסבב שוב</BigButton>
        )}

        {submitting && <p className="play__loading">בודקים את התשובות... 🎉</p>}

        {!error && !submitting && !current && <p className="play__loading">מכינים שאלות... 🧮</p>}

        {current && !submitting && (
          <>
            <DolphinPerch side message={mascotMessage} hint={{ lines: hintsFor(current), key: `${index}-${current.text}` }} />
            <div className="play__question card" style={{ "--accent": topicInfo?.color }}>
              <div className="play__question-row">
                <p className="play__question-text">
                  <MathText text={current.text} markUnits={unitsMarkedFor === `${index}-${current.text}` && marksUnits(current.text)} />
                </p>
                <ReadAloud key={`${index}-${current.text}`} text={current.text} auto={readAloudDefault(profile.grade)} />
              </div>
              <QuestionPicture visual={current.visual} />
            </div>

            {selected === null && !helpOpen && (
              <p className="play__help-left">🦉 העזרה בסבב הזה נגמרה - נסו לבד, אתם יכולים!</p>
            )}
            {selected === null && helpOpen && (
              <HelpButton
                key={`${index}-${current.text}`}
                question={{ text: current.text, correct: current.options[current.correctIndex], chosen: current.chosen, hint: current.hint, bankId: current.bankId }}
                grade={profile.grade}
                onUsed={() => {
                  helpUsedRef.current = true;
                  setHelpCount((n) => n + 1);
                }}
              />
            )}

            {isOpenQuestion(current, index, Number(stage)) ? (
              <OpenAnswer
                key={`open-${index}-${current.text}`}
                done={selected !== null}
                checking={checking}
                typed={current.typed}
                right={current.typedRight}
                onSubmit={(v) => handleAnswer(-1, v)}
              />
            ) : (
            <div className="play__answers">
              {current.options.map((opt, j) => (
                <AnswerButton
                  key={j}
                  label={opt}
                  state={optionState(j)}
                  disabled={selected !== null || checking}
                  onClick={() => handleAnswer(j)}
                />
              ))}
            </div>
            )}

            {wrongHelp && (
              <div className="mistake-card" role="status">
                {wrongHelp === "loading" ? (
                  <p>רגע, מסבירים... 🦉</p>
                ) : (
                  <>
                    <p className="mistake-card__right">✔ התשובה הנכונה: <b><MathText text={String(wrongHelp.right)} /></b></p>
                    {wrongHelp.text && <p className="mistake-card__text">{wrongHelp.text}</p>}
                    <HelpVisual visual={wrongHelp.visual} />
                    <button type="button" className="mistake-card__go" onClick={continueAfterMistake} autoFocus>
                      הבנתי, ממשיכים ←
                    </button>
                  </>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}

/** Help in one round: this many questions; unlimited after this many mistakes in the round (struggling). */
const HELP_LIMIT = 3;
const STRUGGLING = 2;

/** How many questions after a wrong answer its exercise comes back. */
const RETRY_AFTER = 2;

/** The same exercise again, its options in another order (so the child can't just remember the place). */
function retryOf(q, chosen) {
  const right = q.options[q.correctIndex];
  let options = [...q.options];
  for (let tries = 0; tries < 5; tries++) {
    options = [...q.options].sort(() => Math.random() - 0.5);
    if (options.indexOf(right) !== q.correctIndex) break;
  }
  // 2026-11-13: what the child chose the first time - "לא הבנתי" then explains THAT mistake
  return { ...q, options, correctIndex: options.indexOf(right), retry: true, chosen };
}
