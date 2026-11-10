// The five companion characters. `key` matches the backend Avatar enum.
// v1 uses big emoji on a colored card; real illustrations can replace `emoji` later.

export const CHARACTERS = [
  { key: "BOY", emoji: "👦", name: "ילד", color: "var(--blue)" },
  { key: "GIRL", emoji: "👧", name: "ילדה", color: "var(--pink)" },
  { key: "ROBOT", emoji: "🤖", name: "רובוט", color: "var(--teal)" },
  { key: "ANIMAL", emoji: "🦊", name: "חיה חמודה", color: "var(--orange)" },
  { key: "SPACESHIP", emoji: "🚀", name: "חללית", color: "var(--purple)" },
];

export function getCharacter(key) {
  return CHARACTERS.find((c) => c.key === key) ?? CHARACTERS[0];
}
