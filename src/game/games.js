// The island's games (2026-11-10). `topic` is the server Topic used for stars/progress.
// Quarter 1 builds the dragon and the balloons; bridge and train come next.

export const GAMES = [
  {
    key: "dragon",
    isle: "numbers",
    topic: "DRAGON",
    emoji: "🐲",
    name: "הדרקון הרעב",
    skill: "סופרים",
    color: "#25c685",
    intro: "dragon_intro",
    ready: true,
  },
  {
    key: "balloons",
    isle: "numbers",
    topic: "BALLOONS",
    emoji: "🎈",
    name: "בלונים",
    skill: "חיבור וחיסור",
    color: "#ff6fb5",
    intro: "balloon_intro",
    ready: true,
  },
  // 2026-11-11: opened (Shir: "open the locked things").
  {
    key: "bridge",
    isle: "numbers",
    topic: "BRIDGE",
    emoji: "🌉",
    name: "הגשר",
    skill: "משלימים לעשר",
    color: "#4aa8ff",
    intro: "bridge_intro",
    ready: true,
  },
  {
    key: "train",
    isle: "numbers",
    topic: "TRAIN",
    emoji: "🚂",
    name: "הרכבת",
    skill: "סדר המספרים",
    color: "#ff9f43",
    intro: "train_intro",
    ready: true,
  },
  // 2026-11-12 (Shir: "more islands for grades 1-3"): 🕐 אי השעון והכסף.
  {
    key: "clock",
    isle: "clock",
    topic: "CLOCK",
    emoji: "🕐",
    name: "מה השעה?",
    skill: "קוראים שעון",
    color: "#ff9f43",
    intro: "clock_intro",
    ready: true,
  },
  {
    key: "shop",
    isle: "clock",
    topic: "SHOP",
    emoji: "🛒",
    name: "החנות",
    skill: "משלמים בדיוק",
    color: "#25c685",
    intro: "shop_intro",
    ready: true,
  },
  {
    key: "coins",
    isle: "clock",
    topic: "COINS",
    emoji: "🪙",
    name: "כמה כסף?",
    skill: "סופרים כסף",
    color: "#f2b705",
    intro: "coins_intro",
    ready: true,
  },
  // 2026-11-13 (Shir: "the 3 missing islands"): 🔷 shapes, ✖️ times, 🏰 big numbers.
  { key: "shapename", isle: "shapes", topic: "SHAPE_NAME", emoji: "🔍", name: "איזו צורה?", skill: "מכירים צורות", color: "#4aa8ff", intro: "shapename_intro", ready: true },
  { key: "sides", isle: "shapes", topic: "SHAPE_SIDES", emoji: "✋", name: "כמה צלעות?", skill: "צלעות ופינות", color: "#25c685", intro: "sides_intro", ready: true },
  { key: "pattern", isle: "shapes", topic: "SHAPE_PATTERN", emoji: "🧩", name: "מה בא אחר כך?", skill: "תבניות", color: "#ff6fb5", intro: "pattern_intro", ready: true },
  { key: "groups", isle: "times", topic: "GROUPS", emoji: "🧺", name: "סלים שווים", skill: "כפל", color: "#ff9f43", intro: "groups_intro", ready: true },
  { key: "share", isle: "times", topic: "SHARING", emoji: "🍪", name: "מחלקים עוגיות", skill: "חילוק", color: "#a77bff", intro: "share_intro", ready: true },
  { key: "arrays", isle: "times", topic: "ARRAYS", emoji: "🏢", name: "חלונות בבניין", skill: "כפל במערך", color: "#4aa8ff", intro: "arrays_intro", ready: true },
  { key: "placevalue", isle: "big", topic: "PLACE_VALUE", emoji: "🧱", name: "מאות, עשרות, אחדות", skill: "ערך המקום", color: "#25c685", intro: "pv_intro", ready: true },
  { key: "numline", isle: "big", topic: "NUMBER_LINE", emoji: "📏", name: "ישר המספרים", skill: "איפה המספר", color: "#ff9f43", intro: "nl_intro", ready: true },
  { key: "bigger", isle: "big", topic: "BIGGER", emoji: "⚖️", name: "מי גדול יותר?", skill: "משווים ומעגלים", color: "#ff6fb5", intro: "bigger_intro", ready: true },
];

/**
 * 2026-11-12: the islands on the sea map. grades = who it is made for (a child locked to a grade sees
 * the others closed); ready = built. x/y = where it floats on the map (% of the sea, tall = phone,
 * wide = computer).
 */
export const ISLES = [
  { key: "numbers", name: "אי המספרים", emoji: "🏝️", grades: ["G1", "G2"], color: "#25c685", intro: "island_intro", ready: true, tall: [30, 85], wide: [82, 66] },
  { key: "clock", name: "אי השעון והכסף", emoji: "🕐", grades: ["G1", "G2", "G3"], color: "#ff9f43", intro: "clockisle_intro", ready: true, tall: [70, 67], wide: [60, 30] },
  { key: "shapes", name: "אי הצורות", emoji: "🔷", grades: ["G1", "G2", "G3"], color: "#4aa8ff", intro: "shapesisle_intro", ready: true, tall: [30, 49], wide: [42, 70] },
  { key: "times", name: "אי הכפל והחילוק", emoji: "✖️", grades: ["G2", "G3"], color: "#a77bff", intro: "timesisle_intro", ready: true, tall: [70, 31], wide: [24, 30] },
  { key: "big", name: "אי המספרים הגדולים", emoji: "🏰", grades: ["G3"], color: "#ff6fb5", intro: "bigisle_intro", ready: true, tall: [30, 13], wide: [16, 72] },
];

export function getIsle(key) {
  return ISLES.find((i) => i.key === key) ?? null;
}

/** Grades א׳-ג׳ have the islands (ג׳ also has the topic list). */
export function hasIslands(grade) {
  return !grade || grade === "G1" || grade === "G2" || grade === "G3";
}

export function getGame(key) {
  return GAMES.find((g) => g.key === key) ?? null;
}

/** Grades 1-2 start on the island (little reading); older grades keep the topic list. */
export function startsOnIsland(grade) {
  return !grade || grade === "G1" || grade === "G2";
}
