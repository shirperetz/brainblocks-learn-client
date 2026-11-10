// The island's games (2026-11-10). `topic` is the server Topic used for stars/progress.
// Quarter 1 builds the dragon and the balloons; bridge and train come next.

export const GAMES = [
  {
    key: "dragon",
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
    topic: "BALLOONS",
    emoji: "🎈",
    name: "בלונים",
    skill: "חיבור וחיסור",
    color: "#ff6fb5",
    intro: "balloon_intro",
    ready: true,
  },
  { key: "bridge", topic: "BRIDGE", emoji: "🌉", name: "הגשר", skill: "משלימים לעשר", color: "#4aa8ff", ready: false },
  { key: "train", topic: "TRAIN", emoji: "🚂", name: "הרכבת", skill: "סדר המספרים", color: "#ff9f43", ready: false },
];

export function getGame(key) {
  return GAMES.find((g) => g.key === key) ?? null;
}

/** Grades 1-2 start on the island (little reading); older grades keep the topic list. */
export function startsOnIsland(grade) {
  return !grade || grade === "G1" || grade === "G2";
}
