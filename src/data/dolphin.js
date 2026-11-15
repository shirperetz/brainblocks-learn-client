// 2026-11-12 (Shir: "a mascot for the site - a character that helps the children / accompanies the
// experience"): Shir's own dolphin frames (from Downloads/dolphine, 1024x1536 PNG -> 320x480 WebP in
// public/mascot/). Every animation starts and ends on the first idle frame, so any one can follow any
// other without a jump.

/** The dolphin's name - shown in its aria-label and the settings. Shir picks it. */
export const DOLPHIN_NAME = "הדולפין";

// frames = how many files (<anim>-01..NN.webp); fps = playback speed.
export const DOLPHIN_ANIMS = {
  idle: { frames: 8, fps: 7 },
  wave: { frames: 8, fps: 10 },
  smile: { frames: 10, fps: 11 },
  think: { frames: 12, fps: 9 },
  success: { frames: 12, fps: 12 },
  sad: { frames: 10, fps: 9 },
  bored: { frames: 10, fps: 8 },
  // 2026-11-15: Shir's light bulb over the head - the dolphin giving a hint.
  hint: { frames: 13, fps: 10 },
};

export function dolphinFrame(anim, i) {
  return `${import.meta.env.BASE_URL}mascot/${anim}-${String(i + 1).padStart(2, "0")}.webp`;
}

/** The still frame (also every animation's first and last). */
export const DOLPHIN_STILL = dolphinFrame("idle", 0);

const loaded = new Map(); // anim -> Promise (all its frames decoded)

/** Downloads and decodes every frame of `anim` once; resolves when it can play without flicker. */
export function preloadDolphin(anim) {
  if (!loaded.has(anim)) {
    const { frames } = DOLPHIN_ANIMS[anim];
    const all = Array.from({ length: frames }, (_, i) => {
      const img = new Image();
      img.src = dolphinFrame(anim, i);
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    });
    loaded.set(anim, Promise.all(all));
  }
  return loaded.get(anim);
}

/** Warm the cache after the page is up: idle first, then the rest, one by one. */
export function warmDolphin() {
  const rest = Object.keys(DOLPHIN_ANIMS).filter((a) => a !== "idle");
  preloadDolphin("idle").then(() =>
    rest.reduce((p, a) => p.then(() => preloadDolphin(a)), Promise.resolve()),
  );
}
