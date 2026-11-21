// Math topics. `key` matches the backend Topic enum. `blurb` is a one-line,
// child-friendly explanation shown on the topic card.

export const TOPICS = [
  // 2026-11-21: a round built like the grade-5 מיצ"ב (ה׳-ו׳) - fractions, numbers, geometry and data
  { key: "MEITZAV", emoji: "📝", name: "תרגול מיצ״ב", blurb: "כמו במבחן: שברים, מספרים, גיאומטריה ונתונים", color: "var(--purple)" },
  { key: "ADDITION", emoji: "➕", name: "חיבור", blurb: "מחברים מספרים ומגלים כמה יש ביחד", color: "var(--green)" },
  { key: "SUBTRACTION", emoji: "➖", name: "חיסור", blurb: "מורידים ומגלים כמה נשאר", color: "var(--orange)" },
  { key: "MULTIPLICATION", emoji: "✖️", name: "כפל", blurb: "קבוצות שוות", color: "var(--purple)" },
  { key: "DIVISION", emoji: "➗", name: "חילוק", blurb: "מחלקים שווה בשווה", color: "var(--blue)" },
  { key: "COMPARISON", emoji: "⚖️", name: "השוואת מספרים", blurb: "מי גדול ומי קטן", color: "var(--teal)" },
  { key: "SEQUENCES", emoji: "🔢", name: "סדרות מספרים", blurb: "ממשיכים את הסדרה", color: "var(--pink)" },
  { key: "WORD_PROBLEMS", emoji: "📖", name: "בעיות מילוליות", blurb: "סיפור שצריך לפתור", color: "var(--red-soft)" },
  // 2026-11-11: שברים (ה׳-ו׳) וגיאומטריה (ו׳) - with pictures (QuestionPicture).
  { key: "FRACTIONS", emoji: "🍕", name: "שברים", blurb: "חלקים של שלם - חצי, רבע ועוד", color: "var(--orange)" },
  // 2026-11-11 (Shir): geometry as three separate tracks, six levels each.
  { key: "ANGLES", emoji: "📐", name: "זוויות", blurb: "חדה, ישרה, קהה ושטוחה - להכיר זוויות", color: "var(--teal)" },
  { key: "ANGLE_CALC", emoji: "🔺", name: "חישוב זוויות", blurb: "כמה מעלות חסרות - בקו ישר, במשולש ומסביב", color: "var(--pink)" },
  { key: "PERIMETER", emoji: "📏", name: "צלעות והיקף", blurb: "צלעות, צורות והיקף", color: "var(--blue)" },
  { key: "AREA", emoji: "⬛", name: "שטח", blurb: "כמה מקום יש בתוך הצורה", color: "var(--purple)" },
  // 2026-11-21 (Shir, overnight: "all the material of every grade, by the curriculum and the מיצ"ב")
  { key: "EVEN_ODD", emoji: "👯", name: "זוגי ואי-זוגי", blurb: "מתחלק לשניים - או שנשאר אחד?", color: "var(--teal)" },
  { key: "MAKE_TEN", emoji: "🤝", name: "השלמה לעשר", blurb: "כמה חסר עד 10, 20 ו-100", color: "var(--green)" },
  { key: "ORDER_OPS", emoji: "🧮", name: "סדר פעולות", blurb: "מה מחשבים קודם - סוגריים, כפל, חיבור", color: "var(--purple)" },
  { key: "ROUNDING", emoji: "🎯", name: "עיגול ואומדן", blurb: "בערך כמה? מעגלים לעשרות ולמאות", color: "var(--orange)" },
  { key: "DIVISIBILITY", emoji: "🧩", name: "התחלקות וראשוניים", blurb: "מחלקים, כפולות ומספרים ראשוניים", color: "var(--blue)" },
  { key: "MEASURE", emoji: "⏳", name: "מדידות", blurb: "מטר, ק״ג, ליטר, שעות ודקות", color: "var(--pink)" },
  { key: "DECIMALS", emoji: "🔟", name: "מספרים עשרוניים", blurb: "עשיריות, מאיות והנקודה", color: "var(--teal)" },
  { key: "PERCENT", emoji: "💯", name: "אחוזים", blurb: "חצי, רבע, 10% והנחות", color: "var(--red-soft)" },
  { key: "RATIO", emoji: "🍳", name: "יחס", blurb: "על כל 2... יש 3, מתכונים ומפות", color: "var(--orange)" },
  { key: "DATA", emoji: "📊", name: "נתונים וגרפים", blurb: "קוראים גרף, ממוצע וסיכוי", color: "var(--blue)" },
  { key: "CIRCLE", emoji: "⭕", name: "עיגול", blurb: "רדיוס, קוטר, היקף ושטח", color: "var(--pink)" },
  { key: "VOLUME", emoji: "📦", name: "נפח", blurb: "תיבות, קוביות ושטח פנים", color: "var(--purple)" },
  { key: "EQUATIONS", emoji: "❓", name: "מה x?", blurb: "המספר המסתתר במשוואה", color: "var(--green)" },
  { key: "MIXED", emoji: "🎲", name: "תרגול מעורב", blurb: "קצת מהכל", color: "var(--yellow)" },
];

export function getTopic(key) {
  return TOPICS.find((t) => t.key === key) ?? null;
}

// Which topics are appropriate for each grade. Topics outside the list are shown
// dimmed/locked on the topic screen ("you'll grow into these"). MIXED is always on.
// 2026-11-21: the new topics per grade - the same as the server (ExtraTopicsQuestions.levelCap > 0).
const NEW_BY_GRADE = {
  G1: ["EVEN_ODD", "MAKE_TEN"],
  G2: ["EVEN_ODD", "MAKE_TEN", "MEASURE", "DATA"],
  G3: ["EVEN_ODD", "MAKE_TEN", "ORDER_OPS", "ROUNDING", "DIVISIBILITY", "MEASURE", "DATA", "EQUATIONS"],
  G4: ["EVEN_ODD", "MAKE_TEN", "ORDER_OPS", "ROUNDING", "DIVISIBILITY", "MEASURE", "DECIMALS", "DATA", "EQUATIONS"],
  G5: ["EVEN_ODD", "MAKE_TEN", "ORDER_OPS", "ROUNDING", "DIVISIBILITY", "MEASURE", "DECIMALS", "DATA", "VOLUME", "EQUATIONS"],
  G6: ["EVEN_ODD", "MAKE_TEN", "ORDER_OPS", "ROUNDING", "DIVISIBILITY", "MEASURE", "DECIMALS", "PERCENT", "RATIO", "DATA", "CIRCLE", "VOLUME", "EQUATIONS"],
};
const ALL_NEW = NEW_BY_GRADE.G6;
const OLD = TOPICS.map((t) => t.key).filter((k) => !ALL_NEW.includes(k));

const TOPICS_BY_GRADE = {
  G1: ["ADDITION", "SUBTRACTION", "COMPARISON", "SEQUENCES", "MIXED", ...NEW_BY_GRADE.G1],
  // 2026-11-12 (curriculum by grade): same lists as the server's GradeTopics.
  G2: ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "COMPARISON", "SEQUENCES", "MIXED", ...NEW_BY_GRADE.G2],
  G3: ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "COMPARISON", "SEQUENCES", "FRACTIONS", "ANGLES", "PERIMETER", "MIXED", ...NEW_BY_GRADE.G3],
  G4: ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "COMPARISON", "SEQUENCES", "WORD_PROBLEMS", "FRACTIONS", "ANGLES", "PERIMETER", "AREA", "MIXED", ...NEW_BY_GRADE.G4],
  G5: [...OLD, ...NEW_BY_GRADE.G5], // 2026-11-11: גיאומטריה גם לכיתה ה׳
  G6: [...OLD, ...NEW_BY_GRADE.G6],
};

/**
 * [advanced] (profile.advanced, 2026-11-21): topics a teacher opened at a higher grade for this child -
 * { FRACTIONS: "G6" }. Such a topic is open when it belongs to the approved grade.
 */
export function isTopicAllowedForGrade(topicKey, gradeKey, advanced) {
  if (!gradeKey) return true; // no grade chosen yet -> show everything as available
  const allowed = TOPICS_BY_GRADE[gradeKey] ?? TOPICS.map((t) => t.key);
  if (allowed.includes(topicKey)) return true;
  const up = advanced?.[topicKey];
  return Boolean(up && (TOPICS_BY_GRADE[up] ?? []).includes(topicKey));
}
