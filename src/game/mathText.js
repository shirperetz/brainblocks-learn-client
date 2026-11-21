// Splits a Hebrew question into text and math parts, so math can be shown left-to-right.
// Math = numbers joined by + - × ÷ = (e.g. "363 + 852"), or a number series ("3, 7, 11, 15, ?").

// 2026-11-11: a number may be a fraction ("2/7 + 3/7 = ?", "ל-1/2"), drawn stacked by MathText.
// 2026-11-11: ":" (division - "7 : 8" came out as "8 : 7" inside Hebrew) and degrees ("140°" showed "°140").
// 2026-11-12 (Shir's screenshot "8 = 40 × ?"): an equation may also START with "?" ("? × 8 = 40",
// "? + 617 = 1032") - it was split, "? ×" read as Hebrew and the whole thing came out mirrored.
// 2026-11-21 (the new topics): numbers may be decimals ("0.3 + 0.4"), "x" ("4 × x + 3 = 47"), in
// brackets ("(4 + 7) × 2"), percents ("20%"). The night's screenshot: "x + 10 = 13" came out "3 = 10 + x".
const NUM = String.raw`(?:\d+(?:\.\d+)?(?:\/\d+)?%?|\?|x)`;
const TOKEN = String.raw`(?:\(\s*)*` + NUM + String.raw`(?:\s*\))*`;
const MATH = new RegExp(
  String.raw`(\d+(?:\s*,\s*\d+){2,}(?:\s*,\s*\?)?|` + TOKEN + String.raw`(?:\s*[+\-−×÷=:]\s*` + TOKEN + String.raw`)+|\d+\/\d+|\d+°|\d+(?:\.\d+)?%)`,
  "g",
);

export function mathParts(text) {
  const s = String(text ?? "");
  const parts = [];
  let last = 0;
  for (const m of s.matchAll(MATH)) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index), math: false });
    parts.push({ text: m[0], math: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ text: s.slice(last), math: false });
  return parts;
}
