// Shows a number as dots in rows of five (5 = one full row) - how first graders "see" a number.
export default function Dots({ n, className = "" }) {
  const rows = [];
  for (let i = 0; i < n; i += 5) rows.push(Math.min(5, n - i));
  return (
    <div className={`dots ${className}`} aria-hidden="true" dir="ltr">
      {rows.map((len, r) => (
        <div className="dots__row" key={r}>
          {Array.from({ length: len }, (_, i) => (
            <span className="dots__dot" key={i} />
          ))}
        </div>
      ))}
    </div>
  );
}
