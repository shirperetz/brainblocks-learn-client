import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { pickLine } from "../data/companions";
import { DOLPHIN_NAME, warmDolphin } from "../data/dolphin";
import { cheer, getPerch, onCheer, onPerch } from "../game/companion";
import { sfx } from "../game/audio";
import Dolphin from "./Dolphin";
import "../styles/components/companion.css";

// Child screens only - not the welcome / log-in / sign-up / teachers' / admin screens. The summary has
// its own big dolphin. Each screen also marks WHERE it sits (<DolphinPerch/>, Shir's option C).
const CHILD_PATHS = /^\/(island|topics|map|play|review|daily|timed|my-island|settings)(\/|$)/;
// Shir (the admin) asked to have the dolphin too - also on her own admin / staff screens.
const ADMIN_PATHS = /^\/(admin|staff)(\/|$)/;
const STUCK_MS = 25_000;
const BORED_MS = 40_000;
const SHOW_MS = 3_200;

/**
 * 2026-11-12 (Shir: "a mascot - a character that helps / accompanies the children"): her dolphin on every
 * child screen (it replaces the emoji animals of 11.11). Not in the corner (Shir: "I didn't like it on the
 * side") - it sits on top of the page's main card, wherever the page put its <DolphinPerch/>. Pages send it events
 * (game/companion.js); bubbles only - no voice, so it never talks over the read-aloud.
 *   new screen -> wave · right -> smile · 3 in a row / stage passed -> success · wrong / stage failed -> sad
 *   25 s on one question or "🤔 לא הבנתי" -> think · 40 s without a touch -> bored · a tap -> smile
 * Hidden when the child turned it off in Settings (profile.companion = "NONE").
 */
export default function Companion() {
  const { profile } = useProfile();
  const { pathname } = useLocation();
  const [bubble, setBubble] = useState(null);
  // 2026-11-15 (sketch C): on a game page the dolphin gives hints - ready after a mistake or 25 s stuck.
  const [hintReady, setHintReady] = useState(false);
  const [hintsGiven, setHintsGiven] = useState(0);
  const [anim, setAnim] = useState({ name: "wave", key: 0 });
  // A new screen: wave hello (set while rendering - React's pattern for state that follows a prop).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setAnim((a) => ({ name: "wave", key: a.key + 1 }));
  }
  const streak = useRef(0);
  const hideTimer = useRef(null);
  const stuckTimer = useRef(null);
  const boredTimer = useRef(null);

  const onScreen = profile?.admin
    ? CHILD_PATHS.test(pathname) || ADMIN_PATHS.test(pathname)
    : Boolean(profile && !profile.teacher && CHILD_PATHS.test(pathname));
  const visible = Boolean(profile && profile.companion !== "NONE" && onScreen);
  const perch = useSyncExternalStore(onPerch, getPerch, () => null);

  function act(name) {
    setAnim((a) => ({ name, key: a.key + 1 }));
  }

  useEffect(() => {
    if (visible) warmDolphin();
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    function say(kind, motion) {
      clearTimeout(hideTimer.current);
      setBubble({ text: pickLine(kind), path: window.location.pathname });
      act(motion);
      hideTimer.current = setTimeout(() => setBubble(null), SHOW_MS);
    }
    function armStuck() {
      clearTimeout(stuckTimer.current);
      stuckTimer.current = setTimeout(() => {
        if (getPerch()?.hint) return readyHint();
        say("stuck", "think");
      }, STUCK_MS);
    }
    // A hint is waiting: glow + "💡 רמז?"; the very first time, the dolphin says how it works.
    function readyHint() {
      setHintReady(true);
      act("think");
      let first = false;
      try { first = !localStorage.getItem("bb_hint_seen"); localStorage.setItem("bb_hint_seen", "1"); } catch { /* fine */ }
      if (first) {
        clearTimeout(hideTimer.current);
        setBubble({ text: "לחצו עליי ואתן לכם רמז! 💡", path: window.location.pathname });
        hideTimer.current = setTimeout(() => setBubble(null), SHOW_MS + 1500);
      }
    }
    const off = onCheer(({ kind, wrongSoFar }) => {
      if (kind === "question") {
        setHintsGiven(0);
        setHintReady(Boolean(wrongSoFar && getPerch()?.hint));
        return armStuck();
      }
      clearTimeout(stuckTimer.current);
      if (kind === "correct") {
        streak.current += 1;
        if (streak.current % 3 === 0) say("streak", "success");
        else say("correct", "smile");
        return undefined;
      }
      if (kind === "wrong") {
        streak.current = 0;
        setHintReady(false);
        say("wrong", "sad");
        return undefined;
      }
      if (kind === "help") return act("think");
      if (kind === "levelPassed") return say("levelPassed", "success");
      if (kind === "levelFailed") return say("levelFailed", "sad");
      if (kind === "gifts") return say("gifts", "smile");
      return undefined;
    });

    // Bored: nothing touched for a while -> one bored sigh, then wait for the next quiet spell.
    function armBored() {
      clearTimeout(boredTimer.current);
      boredTimer.current = setTimeout(() => act("bored"), BORED_MS);
    }
    armBored();
    window.addEventListener("pointerdown", armBored);
    window.addEventListener("keydown", armBored);
    return () => {
      off();
      clearTimeout(hideTimer.current);
      clearTimeout(stuckTimer.current);
      clearTimeout(boredTimer.current);
      window.removeEventListener("pointerdown", armBored);
      window.removeEventListener("keydown", armBored);
    };
  }, [visible]);

  // A new screen: forget the streak and the "stuck?" timer.
  useEffect(() => {
    streak.current = 0;
    clearTimeout(stuckTimer.current);
  }, [pathname]);

  if (!visible || !perch?.el) return null;

  const lines = perch.hint?.lines || [];
  function tap() {
    sfx.pop();
    clearTimeout(hideTimer.current);
    if (lines.length && hintReady && hintsGiven < Math.min(2, lines.length)) {
      const n = hintsGiven;
      setHintsGiven(n + 1);
      setBubble({ title: "💡 רמז", text: lines[n], path: pathname, stay: true });
      act("hint");
      cheer("hintShown", { n: n + 1, key: perch.hint?.key });
      return;
    }
    if (lines.length && !hintReady) {
      setBubble({ text: "נסו קודם לבד, אני כאן אם צריך 💪", path: pathname });
    } else if (lines.length) {
      setBubble({ text: "נתתי את כל הרמזים לשאלה הזאת. אתם יכולים! 💪", path: pathname });
    } else {
      setBubble({ text: pickLine("tap"), path: pathname });
    }
    act("smile");
    hideTimer.current = setTimeout(() => setBubble(null), SHOW_MS);
  }

  const shown = bubble && bubble.path === pathname ? bubble : null;
  const text = shown ? shown.text : perch.message;
  const glowing = lines.length > 0 && hintReady && hintsGiven < Math.min(2, lines.length);
  return createPortal(
    <div className="companion" aria-live="polite">
      <button type="button" className={`companion__dolphin${glowing ? " is-hint" : ""}`} onClick={tap}
        aria-label={glowing ? "רמז מהדולפין - לחצו" : `${DOLPHIN_NAME} - לחצו לעידוד`}>
        <Dolphin play={anim.name} playKey={anim.key} label="" />
      </button>
      {text && (
        <div key={text} className={`companion__bubble${shown?.title ? " companion__bubble--hint" : ""}`}>
          {shown?.title && <b className="companion__hint-title">{shown.title}</b>}
          {text}
        </div>
      )}
    </div>,
    perch.el,
  );
}
