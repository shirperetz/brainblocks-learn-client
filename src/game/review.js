// Answer choices for reviewing a past mistake: the right answer + 3 nearby whole numbers (never
// negative), shuffled. Only numeric answers can be reviewed this way; anything else -> null.

export function reviewOptions(correct, rnd = Math.random) {
  const n = Number(correct);
  if (correct === null || correct === undefined || String(correct).trim() === "" || !Number.isInteger(n) || n < 0) {
    return null;
  }
  const spread = n <= 20 ? 3 : n <= 100 ? 8 : Math.max(10, Math.round(n / 8));
  const set = new Set([n]);
  let guard = 0;
  while (set.size < 4 && guard++ < 500) {
    const c = n + Math.round((rnd() * 2 - 1) * spread);
    if (c >= 0) set.add(c);
  }
  for (let k = 1; set.size < 4; k++) set.add(n + k);
  const out = [...set].map(String);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
