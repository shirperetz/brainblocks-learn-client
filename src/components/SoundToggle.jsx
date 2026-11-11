import { useState } from "react";
import { isMuted, setMuted } from "../game/audio";
import "../styles/components/sound-toggle.css";

/**
 * One sound button on every screen (2026-11-11, Shir: "כפתור לשלוט אם היא תדבר ואם לא").
 * Mutes the voice and the effects together; the choice is remembered on this device.
 */
export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());

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
