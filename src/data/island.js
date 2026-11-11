// 2026-11-11 "האי שלי" (Shir: "at every level they get something, and when they finish they can build
// the island"). Every topic/game is an area; every level (1-6) is one spot with 3 things to choose from.
// Which spots are earned comes from the server (passed levels); the child's choice is saved there.
import { GAMES, startsOnIsland } from "../game/games";
import { TOPICS, isTopicAllowedForGrade } from "./topics";

export const AREAS = {
  // ---- אי המספרים (א׳-ב׳) ----
  DRAGON: { name: "מערת הדרקון", bg: "#d8f5e6", spots: [["🍓", "🍒", "🍇"], ["🪨", "⛰️", "🌋"], ["🔥", "🕯️", "💎"], ["🥚", "🐣", "🐉"], ["👑", "💰", "🏺"], ["🏰", "🗿", "⛩️"]] },
  BALLOONS: { name: "יריד הבלונים", bg: "#ffe3f1", spots: [["🎈", "🪁", "🎀"], ["🎠", "🎡", "🎢"], ["🍭", "🍦", "🧁"], ["🎪", "⛺", "🛖"], ["🤹", "🎭", "🎨"], ["🎆", "🎇", "🌈"]] },
  BRIDGE: { name: "נהר הגשרים", bg: "#ddefff", spots: [["🐟", "🐠", "🐡"], ["🦆", "🦢", "🐸"], ["🛶", "⛵", "🚤"], ["🌉", "🌁", "🏞️"], ["🐢", "🦦", "🦫"], ["⛲", "🏝️", "🗽"]] },
  TRAIN: { name: "תחנת הרכבת", bg: "#ffecd9", spots: [["🚃", "🚋", "🚞"], ["🚦", "🚥", "🛤️"], ["🧳", "🎒", "📦"], ["🕰️", "⏰", "🔔"], ["🚂", "🚄", "🚝"], ["🏛️", "🏟️", "🗼"]] },
  // ---- הנושאים ----
  ADDITION: { name: "הכפר", bg: "#e3f8ee", spots: [["🏠", "🏡", "🛖"], ["🌳", "🌲", "🌴"], ["🐶", "🐱", "🐰"], ["⛲", "🎠", "🪴"], ["🚲", "🛴", "🛹"], ["🏰", "🏯", "🕌"]] },
  SUBTRACTION: { name: "החווה", bg: "#fff1dc", spots: [["🐄", "🐑", "🐖"], ["🌻", "🌷", "🌾"], ["🚜", "🛞", "🪣"], ["🐔", "🦃", "🦆"], ["🍎", "🍐", "🍊"], ["🏚️", "🛖", "🏡"]] },
  MULTIPLICATION: { name: "הגן הקסום", bg: "#efe7ff", spots: [["🌸", "🌺", "🌼"], ["🍄", "🌵", "🎋"], ["🦋", "🐝", "🐞"], ["🦄", "🐉", "🦚"], ["🧚", "🧙", "🧞"], ["🌈", "⭐", "🌙"]] },
  DIVISION: { name: "המאפייה", bg: "#e2f1ff", spots: [["🥐", "🥖", "🥨"], ["🍕", "🥧", "🎂"], ["🍪", "🍩", "🧇"], ["🧁", "🍰", "🍮"], ["☕", "🧃", "🥤"], ["🏪", "🏬", "🏨"]] },
  COMPARISON: { name: "גן החיות", bg: "#dbf7f7", spots: [["🐘", "🦒", "🦓"], ["🦁", "🐯", "🐻"], ["🐒", "🦍", "🦧"], ["🦜", "🦩", "🦉"], ["🐧", "🦭", "🐻‍❄️"], ["🎪", "🏟️", "🎡"]] },
  SEQUENCES: { name: "שביל הכוכבים", bg: "#ffe3f1", spots: [["⭐", "🌟", "✨"], ["🔭", "🛰️", "📡"], ["🪐", "🌍", "🌕"], ["☄️", "🌠", "💫"], ["👽", "🛸", "🤖"], ["🚀", "🌌", "🏙️"]] },
  WORD_PROBLEMS: { name: "הספרייה", bg: "#ffe6ea", spots: [["📚", "📖", "📜"], ["🖍️", "✏️", "🖌️"], ["🧸", "🪀", "🎲"], ["🗺️", "🧭", "🔍"], ["🎻", "🎹", "🥁"], ["🏫", "🏛️", "🕍"]] },
  FRACTIONS: { name: "השוק", bg: "#fff1dc", spots: [["🍉", "🍍", "🥥"], ["🧀", "🥚", "🥖"], ["🍕", "🥧", "🍰"], ["🧺", "🛒", "⚖️"], ["🏮", "🎏", "🪔"], ["🏬", "🏪", "🏤"]] },
  ANGLES: { name: "הנמל", bg: "#dbf7f7", spots: [["⚓", "🛟", "🪝"], ["⛵", "🛥️", "🚢"], ["🐬", "🐳", "🦈"], ["🦀", "🦞", "🐙"], ["🏖️", "🌅", "⛱️"], ["🗼", "🏰", "🛕"]] },
  ANGLE_CALC: { name: "ההרים", bg: "#ffe3f1", spots: [["⛰️", "🏔️", "🗻"], ["🌲", "🌳", "🍁"], ["🦅", "🐐", "🦌"], ["⛺", "🏕️", "🔥"], ["🚡", "🚠", "🪂"], ["🏯", "🛖", "🏔️"]] },
  PERIMETER: { name: "גדר הממלכה", bg: "#e2f1ff", spots: [["🧱", "🪵", "🪨"], ["🚪", "🪟", "🛎️"], ["🐎", "🐴", "🦄"], ["🛡️", "⚔️", "🏹"], ["🚩", "🎌", "🏳️‍🌈"], ["🏰", "🏯", "🗼"]] },
  AREA: { name: "השדות", bg: "#efe7ff", spots: [["🌾", "🌽", "🥕"], ["🍓", "🍅", "🍆"], ["🐝", "🐛", "🐌"], ["💧", "🚿", "🌧️"], ["🧑‍🌾", "👩‍🌾", "🧺"], ["🌞", "🌈", "🌻"]] },
};

/** The areas this child builds: the island games for א׳-ב׳, the grade's topics for ג׳-ו׳ (never MIXED/GEOMETRY). */
export function areasFor(grade) {
  if (startsOnIsland(grade)) return GAMES.filter((g) => g.ready).map((g) => ({ key: g.topic, emoji: g.emoji, title: g.name }));
  return TOPICS.filter((t) => AREAS[t.key] && isTopicAllowedForGrade(t.key, grade)).map((t) => ({
    key: t.key,
    emoji: t.emoji,
    title: t.name,
  }));
}

/** Everything the island page needs, from the server's { earned: [{spot, stars}], choices: {spot: item} }. */
export function buildIsland(grade, server) {
  const earned = new Map((server?.earned ?? []).map((e) => [e.spot, e.stars]));
  const choices = server?.choices ?? {};
  const areas = areasFor(grade).map((a) => {
    const def = AREAS[a.key];
    const spots = def.spots.map((options, i) => {
      const spot = `${a.key}-${i + 1}`;
      const stars = earned.get(spot);
      return {
        spot,
        level: i + 1,
        options,
        earned: stars != null,
        golden: stars === 3,
        item: choices[spot] ?? null,
      };
    });
    const done = spots.filter((s) => s.earned).length;
    return { ...a, name: def.name, bg: def.bg, spots, done, complete: done === spots.length };
  });
  const total = areas.reduce((n, a) => n + a.spots.length, 0);
  const built = areas.reduce((n, a) => n + a.spots.filter((s) => s.earned && s.item).length, 0);
  const earnedCount = areas.reduce((n, a) => n + a.done, 0);
  const waiting = areas.reduce((n, a) => n + a.spots.filter((s) => s.earned && !s.item).length, 0);
  return { areas, total, built, earned: earnedCount, waiting, finished: total > 0 && earnedCount === total };
}

/** For the stage map: what the next level gives ("עוד שלב אחד → 🏰"). */
export function rewardFor(topic, level) {
  return AREAS[topic]?.spots[level - 1]?.[0] ?? null;
}
