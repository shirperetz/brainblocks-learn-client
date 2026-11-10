// Grades 1-6 and difficulty levels. `key` matches the backend Grade / Difficulty enums.

export const GRADES = [
  { key: "G1", label: "כיתה א׳", letter: "א׳", blurb: "חיבור וחיסור עד 20", color: "var(--green)" },
  { key: "G2", label: "כיתה ב׳", letter: "ב׳", blurb: "חיבור וחיסור עד 100", color: "var(--blue)" },
  { key: "G3", label: "כיתה ג׳", letter: "ג׳", blurb: "כפל וחילוק בסיסי", color: "var(--purple)" },
  { key: "G4", label: "כיתה ד׳", letter: "ד׳", blurb: "מספרים גדולים ובעיות מילוליות", color: "var(--orange)" },
  { key: "G5", label: "כיתה ה׳", letter: "ה׳", blurb: "שברים וסדר פעולות", color: "var(--teal)" },
  { key: "G6", label: "כיתה ו׳", letter: "ו׳", blurb: "תרגול מעורב ואתגרים", color: "var(--pink)" },
];

export const DIFFICULTIES = [
  { key: "EASY", label: "קל" },
  { key: "MEDIUM", label: "בינוני" },
  { key: "HARD", label: "קשה" },
];

export function getGrade(key) {
  return GRADES.find((g) => g.key === key) ?? null;
}
