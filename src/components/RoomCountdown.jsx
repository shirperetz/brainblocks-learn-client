import { useEffect, useState } from "react";

/**
 * 2026-11-22 (Shir: "3, 2, 1 when the teacher presses start, so everyone starts together"): a big
 * count over the screen while the server holds the first question. [ms] = what the server said is left;
 * the count runs on this device's clock from there.
 */
export default function RoomCountdown({ ms, dark = false }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!(ms > 0)) {
      // the server says it's over (the next poll): "יוצאים לדרך!" for a moment, then gone
      const go = setTimeout(() => setLeft((l) => (l === null ? null : 0)), 0);
      const hide = setTimeout(() => setLeft(null), 700);
      return () => {
        clearTimeout(go);
        clearTimeout(hide);
      };
    }
    const end = Date.now() + ms;
    const tick = () => setLeft(end - Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 100);
    const stop = setTimeout(() => clearInterval(t), ms + 800);
    return () => {
      clearTimeout(first);
      clearTimeout(stop);
      clearInterval(t);
    };
  }, [ms]);

  if (left === null || left < -700) return null;
  const n = Math.ceil(left / 1000);
  return (
    <div className={`room-countdown${dark ? " room-countdown--dark" : ""}`} role="status" aria-live="assertive">
      <span key={n} className="room-countdown__n">{n > 0 ? n : "יוצאים לדרך!"}</span>
    </div>
  );
}
