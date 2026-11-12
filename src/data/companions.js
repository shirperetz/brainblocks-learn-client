// 2026-11-11 (Shir: "an animal that is always on every page of the children, to help and encourage
// them"). `key` matches the server (LearnerProfileService.COMPANIONS). null on the profile = FOX.

export const COMPANIONS = [
  { key: "FOX", emoji: "🦊", name: "שועלי", color: "#ffb36b" },
  { key: "PANDA", emoji: "🐼", name: "פנדי", color: "#d9d5ef" },
  { key: "PUPPY", emoji: "🐶", name: "כלבלב", color: "#ffd9a0" },
  { key: "CAT", emoji: "🐱", name: "חתולית", color: "#ffe28a" },
  { key: "OWL", emoji: "🦉", name: "ינשופי", color: "#c9b6ff" },
  { key: "TURTLE", emoji: "🐢", name: "צבי", color: "#9fe3c2" },
];

export function getCompanion(key) {
  if (key === "NONE") return null;
  return COMPANIONS.find((c) => c.key === key) ?? COMPANIONS[0];
}

/** What the companion says. Short, warm, never the answer. One is picked at random each time. */
export const LINES = {
  hello: ["היי! אני פה איתך 💛", "יאללה, נלמד ביחד!", "שמח לראות אותך!"],
  correct: ["יש! 🎉", "כל הכבוד!", "מעולה!", "איזה יופי!", "צדקת!"],
  streak: ["וואו, 3 ברצף! 🔥", "את/ה על גל!", "אין עליך! 🔥"],
  wrong: ["לא נורא, ננסה שוב 💪", "טעויות עוזרות ללמוד!", "קרוב! עוד ניסיון", "אני מאמין בך!"],
  stuck: ["צריך עזרה? לחצו על 🤔 לא הבנתי", "אפשר לקרוא שוב לאט 🙂", "לא חייבים למהר 🐢"],
  levelPassed: ["עברת שלב! 🎁 יש מתנה באי שלך", "איזה כיף! מתנה חדשה לאי 🏝️", "שלב חדש נפתח! 🚀"],
  levelFailed: ["כמעט! עוד פעם ונצליח 💪", "אפשר לנסות שוב - כל פעם קל יותר", "לא מוותרים! 🙂"],
  gifts: ["יש לך מתנות! לחצו על 🎁", "בוא/י נבנה משהו באי! 🎁"],
  tap: ["אני פה אם צריך 💛", "את/ה מדהים/ה!", "עוד קצת ועוד קצת - ונהיה אלופים", "לחשוב לאט זה בסדר גמור", "כל תשובה נכונה = כוכב ⭐"],
};

export function pickLine(kind) {
  const list = LINES[kind] ?? LINES.tap;
  return list[Math.floor(Math.random() * list.length)];
}
