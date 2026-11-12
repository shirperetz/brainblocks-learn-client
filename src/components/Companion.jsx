import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { getCompanion, pickLine } from "../data/companions";
import { onCheer } from "../game/companion";
import { sfx } from "../game/audio";
import "../styles/components/companion.css";

// Child screens only - not the welcome / log-in / sign-up / teachers' / admin screens.
const CHILD_PATHS = /^\/(island|topics|map|play|summary|review|daily|timed|my-island|settings)(\/|$)/;
const STUCK_MS = 25_000;
const SHOW_MS = 3_200;

/**
 * 2026-11-11 (Shir: "an animal that is always on every page of the children, to help and encourage").
 * Sits in the corner; pages send it events (game/companion.js). Bubbles only - no voice, so it never
 * talks over the game's own voice. 3 right answers in a row = a streak cheer; 25 s on one question
 * = "need help?"; a tap = a random encouragement. The child picks it in Settings (or hides it).
 */
export default function Companion() {
  const { profile } = useProfile();
  const { pathname } = useLocation();
  const [bubble, setBubble] = useState(null);
  const [mood, setMood] = useState("idle"); // idle | happy | sad | party
  const streak = useRef(0);
  const hideTimer = useRef(null);
  const stuckTimer = useRef(null);

  const visible = Boolean(profile && !profile.teacher && !profile.admin && CHILD_PATHS.test(pathname));
  const animal = profile ? getCompanion(profile.companion) : null;

  useEffect(() => {
    if (!visible || !animal) return undefined;
    function say(kind, nextMood) {
      clearTimeout(hideTimer.current);
      setBubble({ text: pickLine(kind), path: window.location.pathname });
      setMood(nextMood);
      hideTimer.current = setTimeout(() => {
        setBubble(null);
        setMood("idle");
      }, SHOW_MS);
    }
    function armStuck() {
      clearTimeout(stuckTimer.current);
      stuckTimer.current = setTimeout(() => say("stuck", "idle"), STUCK_MS);
    }
    const off = onCheer(({ kind }) => {
      if (kind === "question") return armStuck();
      clearTimeout(stuckTimer.current);
      if (kind === "correct") {
        streak.current += 1;
        if (streak.current > 0 && streak.current % 3 === 0) say("streak", "party");
        else say("correct", "happy");
        return;
      }
      if (kind === "wrong") {
        streak.current = 0;
        say("wrong", "sad");
        return;
      }
      if (kind === "levelPassed") return say("levelPassed", "party");
      if (kind === "levelFailed") return say("levelFailed", "sad");
      if (kind === "gifts") return say("gifts", "happy");
      return undefined;
    });
    return () => {
      off();
      clearTimeout(hideTimer.current);
      clearTimeout(stuckTimer.current);
    };
  }, [visible, animal]);

  // A new screen: forget the streak and the "stuck?" timer (an old bubble is not shown - see below).
  useEffect(() => {
    streak.current = 0;
    clearTimeout(stuckTimer.current);
  }, [pathname]);

  if (!visible || !animal) return null;

  function tap() {
    sfx.pop();
    clearTimeout(hideTimer.current);
    setBubble({ text: pickLine("tap"), path: pathname });
    setMood("happy");
    hideTimer.current = setTimeout(() => {
      setBubble(null);
      setMood("idle");
    }, SHOW_MS);
  }

  return (
    <div className="companion" aria-live="polite">
      {bubble && bubble.path === pathname && <div className="companion__bubble">{bubble.text}</div>}
      <button
        type="button"
        className={`companion__animal companion__animal--${mood}`}
        style={{ "--c": animal.color }}
        onClick={tap}
        aria-label={`${animal.name} - לחצו לעידוד`}
      >
        <span aria-hidden="true">{animal.emoji}</span>
      </button>
    </div>
  );
}
