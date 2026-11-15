import { useEffect, useRef, useState } from "react";
import { DOLPHIN_ANIMS, DOLPHIN_NAME, DOLPHIN_STILL, dolphinFrame, preloadDolphin } from "../data/dolphin";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Shir's dolphin, frame by frame. Swims in "idle" (one loop, then a short rest on the first frame -
 * like breathing). `play` = a one-shot animation ("wave" | "smile" | "think" | "success" | "sad" |
 * "bored"); change `playKey` to play the same one again. When it ends -> back to idle.
 * Frames are decoded before an animation starts, so it never flickers. Reduced motion = a still frame.
 */
export default function Dolphin({ play = null, playKey = 0, className = "", label = DOLPHIN_NAME }) {
  const [src, setSrc] = useState(DOLPHIN_STILL);
  // 2026-11-15 (Shir: "it must look real, not like a picture"): the frame we leave fades out under the
  // new animation's first frame (no jump), and the body moves with the feeling (data-anim -> CSS).
  const [prev, setPrev] = useState(null);
  const [mood, setMood] = useState("idle");
  const timer = useRef(null);
  const fadeTimer = useRef(null);
  const srcRef = useRef(DOLPHIN_STILL);
  const show = (next) => {
    srcRef.current = next;
    setSrc(next);
  };

  useEffect(() => {
    if (reducedMotion()) return undefined; // stays on the still frame
    let alive = true;
    const stop = () => clearTimeout(timer.current);

    function idle() {
      const { frames, fps } = DOLPHIN_ANIMS.idle;
      let i = 0;
      const step = () => {
        if (!alive) return;
        show(dolphinFrame("idle", i));
        i += 1;
        // The last idle frame is the first one - rest there a little before the next loop.
        if (i >= frames - 1) {
          i = 0;
          timer.current = setTimeout(step, 1200 + Math.random() * 1800);
        } else {
          timer.current = setTimeout(step, 1000 / fps);
        }
      };
      setMood("idle");
      preloadDolphin("idle").then(() => alive && step());
    }

    function once(anim) {
      const { frames, fps } = DOLPHIN_ANIMS[anim];
      preloadDolphin(anim).then(() => {
        if (!alive) return;
        stop();
        // cross-fade from the frame on screen into the new animation
        setPrev(srcRef.current);
        clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(() => setPrev(null), 220);
        setMood(anim);
        let i = 0;
        const step = () => {
          if (!alive) return;
          if (i >= frames) {
            idle();
            return;
          }
          show(dolphinFrame(anim, i));
          i += 1;
          timer.current = setTimeout(step, 1000 / fps);
        };
        step();
      });
    }

    if (play && DOLPHIN_ANIMS[play]) once(play);
    else idle();
    return () => {
      alive = false;
      stop();
      clearTimeout(fadeTimer.current);
    };
  }, [play, playKey]);

  return (
    <span className={`dolphin-body ${className}`} data-anim={mood}>
      {prev && <img className="dolphin dolphin--leaving" src={prev} alt="" aria-hidden="true" draggable="false" />}
      <img className="dolphin" src={src} alt={label} draggable="false" />
      <span className="dolphin-shadow" aria-hidden="true" />
    </span>
  );
}
