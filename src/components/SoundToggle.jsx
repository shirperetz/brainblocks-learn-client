import { useState } from "react";
import { useLocation } from "react-router-dom";
import { isMuted, setMuted } from "../game/audio";
import "../styles/components/sound-toggle.css";

/**
 * One sound button on every screen (2026-11-11, Shir: "כפתור לשלוט אם היא תדבר ואם לא").
 * Mutes the voice and the effects together; the choice is remembered on this device.
 */
export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());
  // 2026-11-22: the classroom board (projector) has no voice - the button sat on top of its clock.
  const { pathname } = useLocation();
  if (/\/board$/.test(pathname)) return null;
  if (pathname.startsWith("/parent/")) return null; // 2026-11-27 (Shir): not on the parents' report

  function toggle() {
    setMuted(!muted);
    setMutedState(!muted);
  }

  return (
    <button
      type="button"
      className={`sound-toggle ${muted ? "is-muted" : ""}`}
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? "הדמות שותקת - להפעיל קול" : "הדמות מדברת - להשתיק"}
      title={muted ? "להפעיל קול" : "להשתיק"}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
      <span className="sound-toggle__label">{muted ? "קול כבוי" : "קול פועל"}</span>
    </button>
  );
}
