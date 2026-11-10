import "../styles/components/progress-bar.css";

// A chunky, friendly progress bar. Pass current / total (e.g. question 3 of 10).
export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
