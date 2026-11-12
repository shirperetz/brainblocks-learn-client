// 2026-11-11: pages tell the companion what happened; it decides what to say.
// cheer("correct") / cheer("wrong") / cheer("levelPassed") / cheer("levelFailed") / cheer("gifts") / cheer("question")
// "question" = a new question is on the screen (restarts the "stuck?" timer).

const EVENT = "bb-companion";

export function cheer(kind, detail = {}) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind, ...detail } }));
}

export function onCheer(handler) {
  const fn = (e) => handler(e.detail);
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

// 2026-11-12 (Shir picked "C - sitting on the card"): a page marks where the dolphin sits with
// <DolphinPerch message="..."/>; the one Companion renders into it (portal). No perch = no dolphin.
let perch = null; // { el, message }
const perchListeners = new Set();
export function setPerch(next) {
  perch = next;
  perchListeners.forEach((fn) => fn());
}
export function getPerch() {
  return perch;
}
export function onPerch(fn) {
  perchListeners.add(fn);
  return () => perchListeners.delete(fn);
}
