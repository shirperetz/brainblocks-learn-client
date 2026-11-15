// 2026-11-15 (Shir picked sketch C: "touch the dolphin for a hint - 'רמז' on top, then the hint"):
// two hints per question, never the answer. Hint 1 = the question's own hint from the server (the same
// one "לא הבנתי" starts from); hint 2 = a strategy line for the kind of exercise. Pure, unit-tested.

const OP = /\d\s*([+\-−×x*÷:])\s*\d/;

export function strategyLine(text = "") {
  const op = OP.exec(text)?.[1];
  if (op === "+") return "קודם מחברים את האחדות (הספרות הצהובות), ואחר כך את העשרות. יצא יותר מ-9? מעבירים 1 לעשרות.";
  if (op === "-" || op === "−") return "מתחילים מהאחדות (הספרות הצהובות). אי אפשר להוריד? פורטים עשרת אחת ל-10 אחדות.";
  if (op === "×" || op === "x" || op === "*") return "כפל זה חיבור שחוזר על עצמו: חברו את אותו מספר שוב ושוב, כמה פעמים שכתוב.";
  if (op === "÷" || op === ":") return "חילוק: כמה פעמים המספר הקטן נכנס בגדול? אפשר לבדוק בעזרת כפל.";
  return "קראו את השאלה לאט, ונסו קודם לפסול תשובה אחת שלא יכולה להיות נכונה.";
}

/** The two hints for a question: [the question's hint (if any), the strategy line]. */
export function hintsFor(question) {
  const first = (question?.hint || "").trim();
  const second = strategyLine(question?.text || "");
  return first && first !== second ? [first, second] : [second];
}

/** + / − with a number of 2+ digits: the units digits are worth highlighting. */
export function marksUnits(text = "") {
  return /\d{2,}\s*[+\-−]\s*\d|\d\s*[+\-−]\s*\d{2,}/.test(text);
}
