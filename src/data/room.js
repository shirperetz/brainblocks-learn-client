import { getCharacter } from "./characters";
import { topicInfo } from "./progress";

// 2026-11-12: small helpers shared by the live game room's screens.

/** mm:ss */
export function clock(s) {
  const n = Math.max(0, Number(s) || 0);
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

export function topicLabel(key) {
  return key === "MY" ? "התרגילים שלי" : topicInfo(key).name;
}

/** A child's character, or a guest's first letter. */
export function avatarOf(p) {
  return p.guest || !p.avatar ? (p.name?.[0] ?? "?") : getCharacter(p.avatar).emoji;
}
