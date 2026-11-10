// Splits a Hebrew question into text and math parts, so math can be shown left-to-right.
// Math = numbers joined by + - × ÷ = (e.g. "363 + 852"), or a number series ("3, 7, 11, 15, ?").

const MATH = /(\d+(?:\s*,\s*\d+){2,}(?:\s*,\s*\?)?|\d+(?:\s*[+\-−×÷=]\s*(?:\d+|\?))+)/g;

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
