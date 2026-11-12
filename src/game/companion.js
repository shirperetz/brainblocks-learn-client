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
