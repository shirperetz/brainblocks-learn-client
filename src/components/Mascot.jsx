import { getCharacter } from "../data/characters";
import "../styles/components/mascot.css";

// The child's companion character. Shows the avatar emoji on a colored bubble,
// with an optional speech bubble for encouragement. `size` = "sm" | "md" | "lg".
export default function Mascot({ avatarKey = "ROBOT", message = null, size = "md", float = false }) {
  const character = getCharacter(avatarKey);
  return (
    <div className={`mascot mascot--${size}`}>
      {message && <div className="mascot__bubble">{message}</div>}
      <div
        className={`mascot__face ${float ? "mascot__face--float" : ""}`}
        style={{ background: character.color }}
        role="img"
        aria-label={character.name}
      >
        <span className="mascot__emoji">{character.emoji}</span>
      </div>
    </div>
  );
}
