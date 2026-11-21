// 2026-11-21 (Shir chose "open answers"): which questions the child types instead of picking.
const NUMERIC = /^-?[\d,]+(\.\d+)?$/;

/** Every third question from stage 2 on, when all its options are plain numbers (never a retry). */
export function isOpenQuestion(q, index, stage) {
  return Boolean(q && !q.retry && q.bankId && stage >= 2 && index % 3 === 2 && q.options?.length && q.options.every((o) => NUMERIC.test(String(o).trim())));
}
