/**
 * 2026-11-21 (Shir chose "step by step - the closest thing to a teacher sitting next to the child"):
 * after a mistake, the exercise is solved TOGETHER in small steps - each step one small question the
 * child answers (3 choices). Built from the question's text and the right answer, which the child
 * already saw at that point - nothing new is revealed. Exercises it can't split return null (no button).
 *
 * A step: { say, ask, answer, options } - say = what we do now, ask = the small exercise.
 */

const PLACES = ["האחדות", "העשרות", "המאות", "האלפים", "עשרות האלפים", "מאות האלפים"];
const clean = (t) => String(t ?? "").replace(/[‎‏⁦-⁩]/g, "").replace(/−/g, "-").trim();

/** 3 choices around a number answer: ±1 and ±10 (the mistakes children really make), shuffled. */
function choices(answer, rng) {
  if (typeof answer === "string") return null; // text choices are given by the step itself
  const near = [answer + 1, answer - 1, answer + 10, answer - 10, answer + 2].filter((x) => x >= 0 && x !== answer);
  const picked = [];
  for (const x of near) if (!picked.includes(x) && picked.length < 2) picked.push(x);
  return shuffle([answer, ...picked], rng);
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const digits = (n) => String(n).split("").reverse().map(Number); // units first

function addition(a, b) {
  const big = Math.max(a, b), small = Math.min(a, b), sum = a + b;
  if (sum <= 10) {
    const path = Array.from({ length: small }, (_, i) => big + i + 1);
    return [{ say: `מתחילים מהמספר הגדול, ${big}, וסופרים ${small} צעדים קדימה: ${path.slice(0, -1).join(", ")}${small > 1 ? ", ..." : "..."}`, ask: "לאיזה מספר הגענו?", answer: sum }];
  }
  if (big < 10) {
    // through ten: 8 + 5 = 8 + 2 + 3
    const need = 10 - big, rest = small - need;
    return [
      { say: `קודם משלימים את ${big} ל-10.`, ask: `כמה חסר ל-${big} כדי להגיע ל-10?`, answer: need },
      { say: `מפרקים את ${small}: ${need} הלכו להשלים ל-10.`, ask: `${small} = ${need} + ?`, answer: rest },
      { say: "עכשיו קל: עשר ועוד מה שנשאר.", ask: `10 + ${rest} = ?`, answer: sum },
    ];
  }
  // column by column, with carrying
  const da = digits(a), db = digits(b), steps = [];
  let carry = 0;
  const len = Math.max(da.length, db.length);
  for (let p = 0; p < len; p++) {
    const x = da[p] ?? 0, y = db[p] ?? 0;
    const s = x + y + carry;
    const carried = carry ? " (ועוד 1 שהעברנו)" : "";
    const place = PLACES[p] ?? "הספרה הבאה";
    steps.push({ say: `מחברים את ${place}${carried}.`, ask: `${x} + ${y}${carry ? " + 1" : ""} = ?`, answer: s });
    if (s >= 10 && p < len - 1) steps.push({ say: `${s} זה יותר מ-9: כותבים ${s % 10} ב${place} ומעבירים 1 ל${PLACES[p + 1]}.`, ask: `איזו ספרה כותבים ב${place}?`, answer: s % 10 });
    carry = s >= 10 ? 1 : 0;
  }
  steps.push({ say: "מחברים את כל הספרות שכתבנו למספר אחד.", ask: `אז כמה זה ${a} + ${b}?`, answer: sum });
  return steps;
}

function subtraction(a, b) {
  const r = a - b;
  if (a <= 10) {
    const path = Array.from({ length: b }, (_, i) => a - i - 1);
    return [{ say: `מתחילים מ-${a} והולכים ${b} צעדים אחורה: ${path.slice(0, -1).join(", ")}${b > 1 ? ", ..." : "..."}`, ask: "לאיזה מספר הגענו?", answer: r }];
  }
  if (a < 20 && b < 10 && a % 10 < b) {
    // through ten: 13 - 5 = 13 - 3 - 2
    const u = a % 10, rest = b - u;
    return [
      { say: `קודם יורדים עד 10: מורידים את ה-${u} של ${a}.`, ask: `${a} - ${u} = ?`, answer: 10 },
      { say: `היינו צריכים להוריד ${b}, הורדנו כבר ${u}.`, ask: `כמה עוד להוריד? ${b} - ${u} = ?`, answer: rest },
      { say: "עכשיו מ-10:", ask: `10 - ${rest} = ?`, answer: r },
    ];
  }
  // column by column, with borrowing
  const da = digits(a), db = digits(b), steps = [];
  let borrow = 0;
  for (let p = 0; p < da.length; p++) {
    const y = db[p] ?? 0;
    let x = da[p] - borrow;
    if (p >= db.length && borrow === 0) break; // nothing more to take away here
    const place = PLACES[p] ?? "הספרה הבאה";
    const took = borrow ? ` (לקחנו ממנה 1, אז נשאר ${x})` : "";
    if (x < 0) {
      // a 0 that lent its 1: it borrows from the next place too and becomes 9
      steps.push({ say: `ב${place} היה 0 ולקחנו ממנו, אז גם הוא פורט מ${PLACES[p + 1]} - והופך ל-9.`, ask: `9 - ${y} = ?`, answer: 9 - y });
      borrow = 1;
    } else if (x < y) {
      steps.push({ say: `ב${place}${took}: אי אפשר להוריד ${y} מ-${x}, אז פורטים - לוקחים 1 מ${PLACES[p + 1]} והופכים אותו ל-10.`, ask: `${x + 10} - ${y} = ?`, answer: x + 10 - y });
      borrow = 1;
    } else {
      steps.push({ say: `מורידים ב${place}${took}.`, ask: `${x} - ${y} = ?`, answer: x - y });
      borrow = 0;
    }
  }
  steps.push({ say: "שמים את הספרות שקיבלנו יחד.", ask: `אז כמה זה ${a} - ${b}?`, answer: r });
  return steps;
}

function multiplication(a, b) {
  const big = Math.max(a, b), small = Math.min(a, b), prod = a * b;
  if (small === 1) return [{ say: `פעם אחת ${big} זה פשוט ${big}.`, ask: `${a} × ${b} = ?`, answer: prod }];
  if (small === 10 || big === 10) {
    const other = big === 10 ? small : big;
    return [{ say: "כופלים ב-10: מוסיפים אפס בסוף המספר.", ask: `${other} × 10 = ?`, answer: prod }];
  }
  if (big <= 10) {
    if (small <= 3) {
      return [{ say: `${small} קבוצות של ${big}.`, ask: `${Array(small).fill(big).join(" + ")} = ?`, answer: prod }];
    }
    if (big > 5) {
      // 7 × 8 = 7 × 5 + 7 × 3
      return [
        { say: `מפרקים את ${big} ל-5 ועוד ${big - 5}. קודם ${small} פעמים 5:`, ask: `${small} × 5 = ?`, answer: small * 5 },
        { say: `עכשיו ${small} פעמים ${big - 5}:`, ask: `${small} × ${big - 5} = ?`, answer: small * (big - 5) },
        { say: "מחברים את שני החלקים:", ask: `${small * 5} + ${small * (big - 5)} = ?`, answer: prod },
      ];
    }
    return [
      { say: `${small} קבוצות של ${big}. קודם 2 קבוצות:`, ask: `${big} + ${big} = ?`, answer: big * 2 },
      { say: `ועוד ${small - 2} קבוצות:`, ask: `${big * 2} + ${big * (small - 2)} = ?`, answer: prod },
    ];
  }
  // beyond the table: split by tens - 23 × 4 = 20 × 4 + 3 × 4
  const split = small >= 10 ? b : big; // the number that is split into tens and units
  const other = split === b ? a : b;
  const tens = split - (split % 10), units = split % 10;
  const steps = [
    { say: `מפרקים את ${split} ל-${tens} ועוד ${units}. קודם העשרות:`, ask: `${other} × ${tens} = ?`, answer: other * tens },
  ];
  if (units > 0) {
    steps.push({ say: "עכשיו האחדות:", ask: `${other} × ${units} = ?`, answer: other * units });
    steps.push({ say: "מחברים את שני החלקים:", ask: `${other * tens} + ${other * units} = ?`, answer: prod });
  }
  return steps;
}

function division(a, b) {
  const q = a / b;
  if (!Number.isInteger(q) || b === 0) return null;
  if (q <= 5) {
    const hops = Array.from({ length: q }, (_, i) => b * (i + 1));
    return [{ say: `סופרים בקפיצות של ${b} עד ${a}: ${hops.slice(0, -1).join(", ")}${q > 1 ? ", " : ""}${a}`, ask: "כמה קפיצות עשינו?", answer: q }];
  }
  if (q <= 10) {
    const rest = a - 5 * b;
    return [
      { say: `שואלים: איזה מספר כפול ${b} נותן ${a}? מתחילים מ-5 פעמים:`, ask: `${b} × 5 = ?`, answer: 5 * b },
      { say: `כמה עוד חסר עד ${a}?`, ask: `${a} - ${5 * b} = ?`, answer: rest },
      { say: `כמה פעמים ${b} נכנס ב-${rest}?`, ask: `${rest} ÷ ${b} = ?`, answer: rest / b },
      { say: "מחברים את הפעמים:", ask: `5 + ${rest / b} = ?`, answer: q },
    ];
  }
  const t = Math.floor(q / 10) * 10, rest = a - t * b;
  const steps = [
    { say: `שואלים: כמה פעמים ${b} נכנס ב-${a}? מתחילים מ-${t} פעמים:`, ask: `${b} × ${t} = ?`, answer: b * t },
  ];
  if (rest > 0) {
    steps.push({ say: `כמה נשאר עד ${a}?`, ask: `${a} - ${b * t} = ?`, answer: rest });
    steps.push({ say: `כמה פעמים ${b} נכנס ב-${rest}?`, ask: `${rest} ÷ ${b} = ?`, answer: rest / b });
    steps.push({ say: "מחברים את הפעמים:", ask: `${t} + ${rest / b} = ?`, answer: q });
  } else {
    steps.push({ say: `${b} × ${t} = ${a} בדיוק!`, ask: `אז ${a} ÷ ${b} = ?`, answer: q });
  }
  return steps;
}

const SOLVE = { "+": addition, "-": subtraction, "×": multiplication, "÷": division };
const CALC = { "+": (a, b) => a + b, "-": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => a / b };
const INVERSE = { "+": "-", "-": "+", "×": "÷", "÷": "×" };

/** "? + 5 = 12" -> which exercise finds the hidden number: [op, x, y] (x op y = hidden). */
function inverseOf(op, a, b, r, hideFirst) {
  if (op === "+") return ["-", r, hideFirst ? b : a];
  if (op === "×") return ["÷", r, hideFirst ? b : a];
  if (op === "-") return hideFirst ? ["+", r, b] : ["-", a, r];
  return hideFirst ? ["×", r, b] : ["÷", a, r]; // ÷
}

/**
 * { steps, done } for a question text + its right answer, or null when it can't be split.
 * rng - for the order of the choices (tests pass their own).
 */
export function stepsFor(text, right, rng = Math.random) {
  const t = clean(text);
  const ans = Number(String(right ?? "").replace(/,/g, ""));
  if (!Number.isFinite(ans)) return null;
  let m = /^כמה זה (\d+) ([+\-×÷]) (\d+)\?$/.exec(t);
  let steps, done;
  if (m) {
    const a = Number(m[1]), op = m[2], b = Number(m[3]);
    if (CALC[op](a, b) !== ans) return null;
    steps = SOLVE[op](a, b);
    done = `${a} ${op} ${b} = ${ans}`;
  } else {
    m = /^מה המספר החסר\? (\?|\d+) ([+\-×÷]) (\?|\d+) = (\d+)$/.exec(t);
    if (!m || (m[1] === "?") === (m[3] === "?")) return null;
    const op = m[2], hideFirst = m[1] === "?", r = Number(m[4]);
    const a = hideFirst ? ans : Number(m[1]), b = hideFirst ? Number(m[3]) : ans;
    if (CALC[op](a, b) !== r) return null;
    const [iop, x, y] = inverseOf(op, a, b, r, hideFirst);
    const wrong = `${x} ${INVERSE[iop]} ${y}`;
    const first = {
      say: "המספר החסר נמצא בעזרת התרגיל ההפוך.",
      ask: "איזה תרגיל ימצא אותו?",
      answer: `${x} ${iop} ${y}`,
      options: shuffle([`${x} ${iop} ${y}`, wrong], rng),
    };
    const inner = SOLVE[iop](x, y) ?? [];
    steps = [first, ...inner];
    done = `${hideFirst ? ans : a} ${op} ${hideFirst ? b : ans} = ${r}`;
  }
  if (!steps || steps.length === 0) return null;
  return {
    steps: steps.map((s) => ({ ...s, options: s.options ?? choices(s.answer, rng) })),
    done,
  };
}
