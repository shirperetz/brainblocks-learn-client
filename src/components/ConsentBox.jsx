import "../styles/pages/legal.css";

/**
 * 2026-11-14 (privacy, Shir: items 1-4 before going public): the checkbox every sign-up form must have.
 * kind "parent" - a child signs up: a parent agrees. kind "teacher" - an adult accepts the policy.
 * The policy opens in a new tab so the half-filled form stays.
 */
export default function ConsentBox({ kind = "parent", checked, onChange }) {
  const id = `consent-${kind}`;
  return (
    <div className="consent-box">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {kind === "parent" ? (
          <>
            <strong>הורה, זה בשבילך:</strong> קראתי את{" "}
            <a href="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</a> ואני מסכים/ה שהילד/ה שלי יירשם/תירשם לאתר.
          </>
        ) : (
          <>
            קראתי את <a href="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</a> ואני מסכים/ה לה.
          </>
        )}
      </label>
    </div>
  );
}
