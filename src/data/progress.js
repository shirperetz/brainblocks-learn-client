// 2026-11-11: the progress screen's words and colors - one place, so the class table, the child's
// report and the legend always agree. Levels come from the server (ProgressReport.level).
import { TOPICS } from "./topics";
import { GAMES } from "../game/games";

export const LEVELS = {
  STRONG: { label: "חזק", long: "שולט/ת בזה", emoji: "💪", className: "lvl-strong" },
  OK: { label: "בדרך", long: "בדרך הנכונה", emoji: "🙂", className: "lvl-ok" },
  HARD: { label: "מתקשה", long: "צריך עזרה", emoji: "🆘", className: "lvl-hard" },
  NEW: { label: "התחיל", long: "עוד מעט נדע (מעט תשובות)", emoji: "🌱", className: "lvl-new" },
  NONE: { label: "—", long: "עוד לא ניסה", emoji: "", className: "lvl-none" },
};

export const LEVEL_ORDER = ["STRONG", "OK", "HARD", "NEW", "NONE"];

export function levelOf(key) {
  return LEVELS[key] ?? LEVELS.NONE;
}

/** Topics and island games in one list: { key, emoji, name }. */
export function topicInfo(key) {
  const t = TOPICS.find((x) => x.key === key);
  if (t) return { key, emoji: t.emoji, name: t.name };
  const g = GAMES.find((x) => x.topic === key);
  if (g) return { key, emoji: g.emoji, name: g.name };
  return { key, emoji: "📘", name: key };
}

/** Columns of the class table: island games first (א׳-ב׳), then the topics, in the game's order. */
export function columnsFor(rows) {
  const seen = new Set();
  rows.forEach((r) => Object.keys(r.topics ?? {}).forEach((k) => seen.add(k)));
  const order = [...GAMES.map((g) => g.topic), ...TOPICS.map((t) => t.key)];
  return order.filter((k) => seen.has(k));
}

export function timeAgo(iso) {
  if (!iso) return "אף פעם";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 2) return "עכשיו";
  if (min < 60) return `לפני ${min} דק׳`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  if (d === 1) return "אתמול";
  if (d < 30) return `לפני ${d} ימים`;
  return new Date(iso).toLocaleDateString("he-IL");
}

export const TREND = {
  UP: { label: "משתפר/ת", emoji: "📈", className: "trend-up" },
  DOWN: { label: "ירידה", emoji: "📉", className: "trend-down" },
  STEADY: { label: "יציב", emoji: "➡️", className: "trend-steady" },
  UNKNOWN: { label: "עוד אין מספיק נתונים", emoji: "⏳", className: "trend-unknown" },
};
