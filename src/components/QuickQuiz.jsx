import { useEffect, useRef, useState } from "react";
import AnswerButton from "./AnswerButton";
import HelpButton from "./HelpButton";
import MathText from "./MathText";
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
  const helpUsed = useRef(false);
  const timer = useRef(null);
  const q = questions[index];

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!q) return null;

  function pick(j) {
    if (selected !== null) return;
    setSelected(j);
    const correct = j === q.correctIndex;
    onAnswer?.(
      {
        questionText: q.text,
        chosenAnswer: q.options[j],
        correctAnswer: q.options[q.correctIndex],
        correct,
        hintUsed: helpUsed.current,
        topic: q.topic,
        explanation: q.explanation,
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
        <p className="play__question-text">
          <MathText text={q.text} />
        </p>
      </div>
      {help && selected === null && (
        <HelpButton
          key={`${index}-${q.text}`}
          question={{ text: q.text, correct: q.options[q.correctIndex], hint: q.hint }}
          grade={grade}
          onUsed={() => (helpUsed.current = true)}
        />
      )}
      <div className="play__answers">
        {q.options.map((opt, j) => (
          <AnswerButton key={j} label={opt} state={state(j)} disabled={selected !== null} onClick={() => pick(j)} />
        ))}
      </div>
    </>
  );
}
