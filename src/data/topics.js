// Math topics. `key` matches the backend Topic enum. `blurb` is a one-line,
// child-friendly explanation shown on the topic card.

export const TOPICS = [
  { key: "ADDITION", emoji: "➕", name: "חיבור", blurb: "מחברים מספרים ומגלים כמה יש ביחד", color: "var(--green)" },
  { key: "SUBTRACTION", emoji: "➖", name: "חיסור", blurb: "מורידים ומגלים כמה נשאר", color: "var(--orange)" },
  { key: "MULTIPLICATION", emoji: "✖️", name: "כפל", blurb: "קבוצות שוות", color: "var(--purple)" },
  { key: "DIVISION", emoji: "➗", name: "חילוק", blurb: "מחלקים שווה בשווה", color: "var(--blue)" },
  { key: "COMPARISON", emoji: "⚖️", name: "השוואת מספרים", blurb: "מי גדול ומי קטן", color: "var(--teal)" },
  { key: "SEQUENCES", emoji: "🔢", name: "סדרות מספרים", blurb: "ממשיכים את הסדרה", color: "var(--pink)" },
  { key: "WORD_PROBLEMS", emoji: "📖", name: "בעיות מילוליות", blurb: "סיפור שצריך לפתור", color: "var(--red-soft)" },
  { key: "MIXED", emoji: "🎲", name: "תרגול מעורב", blurb: "קצת מהכל", color: "var(--yellow)" },
];

export function getTopic(key) {
  return TOPICS.find((t) => t.key === key) ?? null;
}

// Which topics are appropriate for each grade. Topics outside the list are shown
// dimmed/locked on the topic screen ("you'll grow into these"). MIXED is always on.
const TOPICS_BY_GRADE = {
  G1: ["ADDITION", "SUBTRACTION", "COMPARISON", "SEQUENCES", "MIXED"],
  G2: ["ADDITION", "SUBTRACTION", "COMPARISON", "SEQUENCES", "MIXED"],
  G3: ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "COMPARISON", "SEQUENCES", "MIXED"],
  G4: ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "COMPARISON", "SEQUENCES", "WORD_PROBLEMS", "MIXED"],
  G5: TOPICS.map((t) => t.key),
  G6: TOPICS.map((t) => t.key),
};

export function isTopicAllowedForGrade(topicKey, gradeKey) {
  if (!gradeKey) return true; // no grade chosen yet -> show everything as available
  const allowed = TOPICS_BY_GRADE[gradeKey] ?? TOPICS.map((t) => t.key);
  return allowed.includes(topicKey);
}
