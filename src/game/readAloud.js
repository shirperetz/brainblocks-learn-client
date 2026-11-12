// 2026-11-12: "read each question by itself" - a per-device setting; on by default for א׳-ב׳.

export function readAloudDefault(grade) {
  try {
    const v = localStorage.getItem("lc_read_aloud");
    if (v === "1" || v === "0") return v === "1";
  } catch {
    /* blocked storage */
  }
  return grade === "G1" || grade === "G2";
}

export function setReadAloud(on) {
  try {
    localStorage.setItem("lc_read_aloud", on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
