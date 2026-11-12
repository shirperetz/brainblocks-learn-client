import { useEffect, useRef, useState } from "react";
import AnswerButton from "./AnswerButton";
import HelpButton from "./HelpButton";
import ReadAloud from "./ReadAloud";
import { readAloudDefault } from "../game/readAloud";
import MathText from "./MathText";
import { cheer } from "../game/companion";
import { answerQuestion } from "../services/learnApi";
import "../styles/pages/play.css";

const FEEDBACK_MS = 900;

/**
 * One question at a time with four big answers - used by the daily challenge, the 60-second
 * challenge and the mistake review. Reports each answer as the server's AnswerDto shape.
 *
 * questions: [{ text, options, correctIndex, hint, explanation, topic }]
 * onAnswer(answerDto, question) - after each answer;  onDone() - after the last one.
 * help: show "לא הבנתי" (off in the timed challenge - the clock is running).
 */
export default function QuickQuiz({ questions, grade, onAnswer, onDone, help = true, feedbackMs = FEEDBACK_MS }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  // 2026-11-12 (stage 2): a bank question comes without its answer - the server checks it.
  const [checked, setChecked] = useState(null); // { index, correctIndex, explanation }
  const [busy, setBusy] = useState(false);
  const [checkError, setCheckError] = useState("");
  const helpUsed = useRef(false);
  const timer = useRef(null);
  const raw = questions[index];
  const q = raw && checked && checked.index === index
    ? { ...raw, correctIndex: checked.correctIndex, explanation: checked.explanation ?? raw.explanation }
    : raw;

  useEffect(() => () => clearTimeout(timer.current), []);

  // 2026-11-11: the companion - not in the 60-second race (help off), where it would distract.
  useEffect(() => {
    if (help && questions[index]) cheer("question");
  }, [help, index, questions]);

  if (!q) return null;

  async function pick(j) {
    if (selected !== null || busy) return;
    let correctIndex = q.correctIndex;
    let explanation = q.explanation;
    if (q.bankId && correctIndex < 0) {
      setBusy(true);
      try {
        const r = await answerQuestion(q.bankId, q.options[j]);
        correctIndex = r.correctIndex;
        explanation = r.explanation || explanation;
        setChecked({ index, correctIndex, explanation });
        setCheckError("");
      } catch {
        setBusy(false);
        setCheckError("לא הצלחנו לבדוק את התשובה - בדקו את החיבור ונסו שוב");
        return;
      }
      setBusy(false);
    }
    setSelected(j);
    const correct = j === correctIndex;
    if (help) cheer(correct ? "correct" : "wrong");
    onAnswer?.(
      {
        bankId: q.bankId,
        questionText: q.text,
        chosenAnswer: q.options[j],
        correctAnswer: q.options[correctIndex],
        correct,
        hintUsed: helpUsed.current,
        topic: q.topic,
        explanation,
      skill: q.skill,
      },
      q,
    );
    timer.current = setTimeout(() => {
      helpUsed.current = false;
      setSelected(null);
      if (index + 1 < questions.length) setIndex(index + 1);
      else onDone?.();
    }, feedbackMs);
  }

  function state(j) {
    if (selected === null) return "idle";
    if (j === selected) return j === q.correctIndex ? "correct" : "wrong";
    if (j === q.correctIndex) return "reveal";
    return "muted";
  }

  return (
    <>
      <div className="play__question card">
        <div className="play__question-row">
          <p className="play__question-text">
            <MathText text={q.text} />
          </p>
          {/* 2026-11-12: 🔊 - not in the 60-second race, where reading aloud would cost time */}
          {help && <ReadAloud key={`${index}-${q.text}`} text={q.text} auto={readAloudDefault(grade)} />}
        </div>
      </div>
      {help && selected === null && (
        <HelpButton
          key={`${index}-${q.text}`}
          question={{ text: q.text, correct: q.options[q.correctIndex], hint: q.hint, bankId: q.bankId }}
          grade={grade}
          onUsed={() => (helpUsed.current = true)}
        />
      )}
      <div className="play__answers">
        {q.options.map((opt, j) => (
          <AnswerButton key={j} label={opt} state={state(j)} disabled={selected !== null || busy} onClick={() => pick(j)} />
        ))}
      </div>
      {checkError && <p className="form-error">{checkError}</p>}
    </>
  );
}
