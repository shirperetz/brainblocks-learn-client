// Voice + sound effects for "אי המספרים" (2026-11-10).
// Voice: pre-made Hebrew clips in /public/audio/<key>.wav (scripts/make_audio.py, Katrine's local
// voice, every clip checked back with local Whisper). Kids in grades 1-2 who struggle to read hear
// every instruction. Effects are synthesized with WebAudio - no extra files.

let current = null; // the clip sequence playing now; a new say() cancels it
let muted = false;
const cache = new Map();

try {
  muted = localStorage.getItem("lc_muted") === "1";
} catch {
  /* private mode - sound stays on */
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem("lc_muted", value ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (value) stopVoice();
}

function clip(key) {
  if (!cache.has(key)) {
    const a = new Audio(`/audio/${key}.wav`);
    a.preload = "auto";
    cache.set(key, a);
  }
  return cache.get(key);
}

/** Preloads clips so the first instruction is not late. */
export function preload(keys) {
  keys.forEach(clip);
}

export function stopVoice() {
  if (current) {
    current.cancelled = true;
    current.audio?.pause();
    current = null;
  }
}

/**
 * Plays clips one after another ("howmuch", "n3", "plus", "n2").
 * Resolves when done or interrupted; never rejects (a blocked autoplay just stays silent).
 */
export function say(...keys) {
  stopVoice();
  if (muted) return Promise.resolve();
  const run = { cancelled: false, audio: null };
  current = run;
  return (async () => {
    for (const key of keys.flat()) {
      if (run.cancelled) return;
      const a = clip(key);
      run.audio = a;
      try {
        a.currentTime = 0;
        await a.play();
        await new Promise((res) => {
          a.onended = res;
          a.onerror = res;
          a.onpause = res;
        });
      } catch {
        return; // autoplay blocked before the first tap, or a missing file
      }
    }
    if (current === run) current = null;
  })();
}

/** Spoken form of a whole number 0..20 ("n7"). */
export const num = (n) => `n${n}`;

// ---- effects (WebAudio) -------------------------------------------------------------

let ctx = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = "sine", gain = 0.18) {
  const c = ac();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0, 0.08, "triangle", 0.12),
  correct: () => {
    tone(523, 0, 0.15);
    tone(659, 0.1, 0.15);
    tone(784, 0.2, 0.3);
  },
  wrong: () => {
    tone(330, 0, 0.18, "triangle", 0.12);
    tone(262, 0.15, 0.25, "triangle", 0.12);
  },
  pop: () => tone(900, 0, 0.06, "square", 0.08),
  star: () => {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.25, "sine", 0.14));
  },
};

const PRAISE = ["good1", "good2", "good3"];
export function praise() {
  return say(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
}
