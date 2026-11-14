import { useEffect, useRef, useState } from "react";
import { isMuted, sayText, stopVoice } from "../game/audio";
import { speakUrl } from "../services/learnApi";
import "../styles/components/read-aloud.css";

/**
 * 2026-11-12 (idea #2): 🔊 reads the question aloud - for children who find reading hard. The server
 * turns the math into words first (SpokenMath: "38 + 27" -> "שלושים ושמונה ועוד עשרים ושבע"), with
 * Katrine's local voice. `auto`: read each new question by itself (setting; on by default for א׳-ב׳).
 * Respects the mute button; stops the game's own voice first so they never talk over each other.
 */
const cache = new Map(); // text -> object URL (this tab)
let playing = null;

async function urlFor(text) {
  if (cache.has(text)) return cache.get(text);
  const url = await speakUrl(text);
  if (url) cache.set(text, url);
  return url;
}

function stopPlaying() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* no speech */
  }
  if (playing) {
    playing.pause();
    playing = null;
  }
}

export default function ReadAloud({ text, auto = false }) {
  const [state, setState] = useState("idle"); // idle | loading | playing | none
  const alive = useRef(true);

  async function read() {
    if (!text || isMuted()) return;
    stopVoice();
    stopPlaying();
    setState("loading");
    const url = await urlFor(text);
    if (!alive.current) return;
    if (!url) {
      setState("none"); // no voice on this computer / server - the button stays, quietly
      return;
    }
    if (url.startsWith("speech:")) {
      // 2026-11-14: the browser's own voice (no voice on the public server)
      setState("playing");
      await sayText(url.slice(7));
      if (alive.current) setState("idle");
      return;
    }
    const a = new Audio(url);
    playing = a;
    a.onended = () => alive.current && setState("idle");
    a.onerror = () => alive.current && setState("idle");
    setState("playing");
    a.play().catch(() => alive.current && setState("idle")); // autoplay blocked before the first tap
  }

  useEffect(() => {
    alive.current = true;
    if (auto && text) {
      const t = setTimeout(read, 350); // after the screen settles (and the game's "good!" sound)
      return () => {
        clearTimeout(t);
        alive.current = false;
        stopPlaying();
      };
    }
    return () => {
      alive.current = false;
      stopPlaying();
    };
  }, [text, auto]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      className={`read-aloud read-aloud--${state}`}
      onClick={read}
      aria-label="להקריא את השאלה"
      title={state === "none" ? "אין קול כרגע" : "להקריא את השאלה"}
      disabled={state === "loading"}
    >
      <span aria-hidden="true">{state === "loading" ? "⏳" : state === "playing" ? "🔉" : "🔊"}</span>
    </button>
  );
}
