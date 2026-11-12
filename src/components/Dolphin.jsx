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
  const timer = useRef(null);

  useEffect(() => {
    if (reducedMotion()) return undefined; // stays on the still frame
    let alive = true;
    const stop = () => clearTimeout(timer.current);

    function idle() {
      const { frames, fps } = DOLPHIN_ANIMS.idle;
      let i = 0;
      const step = () => {
        if (!alive) return;
        setSrc(dolphinFrame("idle", i));
        i += 1;
        // The last idle frame is the first one - rest there a little before the next loop.
        if (i >= frames - 1) {
          i = 0;
          timer.current = setTimeout(step, 1200 + Math.random() * 1800);
        } else {
          timer.current = setTimeout(step, 1000 / fps);
        }
      };
      preloadDolphin("idle").then(() => alive && step());
    }

    function once(anim) {
      const { frames, fps } = DOLPHIN_ANIMS[anim];
      preloadDolphin(anim).then(() => {
        if (!alive) return;
        stop();
        let i = 0;
        const step = () => {
          if (!alive) return;
          if (i >= frames) {
            idle();
            return;
          }
          setSrc(dolphinFrame(anim, i));
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
    };
  }, [play, playKey]);

  return <img className={`dolphin ${className}`} src={src} alt={label} draggable="false" />;
}
