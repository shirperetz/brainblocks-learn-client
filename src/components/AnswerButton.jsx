import "../styles/components/answer-button.css";

/**
 * A big answer choice. `state` controls the look:
 *  idle    — selectable
 *  correct — the option the child picked, and it was right (green + sparkle)
 *  wrong   — the option the child picked, and it was wrong (red shake)
 *  reveal  — the correct option, highlighted softly after a wrong guess
 *  muted   — other options once the question is answered
 */
export default function AnswerButton({ label, state = "idle", onClick, disabled }) {
  return (
    <button
      type="button"
      className={`answer-button answer-button--${state}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="answer-button__label">{label}</span>
      {state === "correct" && <span className="answer-button__mark" aria-hidden="true">✓</span>}
      {state === "wrong" && <span className="answer-button__mark" aria-hidden="true">✗</span>}
    </button>
  );
}
