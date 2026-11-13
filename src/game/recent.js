// 2026-11-12 (Shir: "I don't want it to repeat the same questions - an endless pool of questions"):
// the island games remember, per child and level, the questions answered RIGHT lately on this device,
// and the next run avoids them while fresh ones exist. A mistake is not remembered, so it can come back
// ("if the child didn't know it, it returns at some point - to see the progress").
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

/**
 * 2026-11-13: the child's last wrong answer to an island exercise (by its key), kept on this device -
 * when the exercise comes back, "לא הבנתי" explains that mistake. At most 200 kept.
 */
const WRONG = (profileId) => `lc_wrong_${profileId}`;

export function rememberWrong(profileId, key, chosen) {
  if (!profileId || !key || chosen == null) return;
  try {
    const m = JSON.parse(localStorage.getItem(WRONG(profileId)) || "{}");
    delete m[key];
    m[key] = String(chosen);
    const keys = Object.keys(m);
    for (const k of keys.slice(0, Math.max(0, keys.length - 200))) delete m[k];
    localStorage.setItem(WRONG(profileId), JSON.stringify(m));
  } catch {
    /* storage blocked - no tailored sentence, the rest works */
  }
}

export function lastWrong(profileId, key) {
  try {
    return JSON.parse(localStorage.getItem(WRONG(profileId)) || "{}")[key];
  } catch {
    return undefined;
  }
}
