// 2026-11-12 (Shir: "I don't want it to repeat the same questions - an endless pool of questions"):
// the island games remember, per child and level, the questions played lately on this device, and the
// next run avoids them while fresh ones exist (the generators fall back only when a level runs out).
// localStorage only - a convenience, never required: if storage is blocked the game just plays.

const KEEP = 80; // per child + game + level

const slot = (profileId, game, level) => `lc_recent:${profileId ?? "anon"}:${game}:${level}`;

export function recentKeys(profileId, game, level) {
  try {
    return new Set(JSON.parse(localStorage.getItem(slot(profileId, game, level)) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function rememberKeys(profileId, game, level, keys) {
  try {
    const old = JSON.parse(localStorage.getItem(slot(profileId, game, level)) ?? "[]");
    const next = [...old.filter((k) => !keys.includes(k)), ...keys].slice(-KEEP);
    localStorage.setItem(slot(profileId, game, level), JSON.stringify(next));
  } catch {
    /* storage blocked - nothing to remember */
  }
}
