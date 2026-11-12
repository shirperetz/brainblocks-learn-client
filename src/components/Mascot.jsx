import { getCharacter } from "../data/characters";
import Dolphin from "./Dolphin";
import "../styles/components/mascot.css";

// The child's companion character. Shows the avatar emoji on a colored bubble,
// with an optional speech bubble for encouragement. `size` = "sm" | "md" | "lg".
// 2026-11-12: `dolphin` = Shir's dolphin instead of the emoji (welcome / log-in / grade / summary);
// `play` = which animation it does when the screen opens (default: wave).
export default function Mascot({ avatarKey = "ROBOT", message = null, size = "md", float = false, dolphin = false, play = "wave" }) {
  if (dolphin) {
    return (
      <div className={`mascot mascot--${size} mascot--dolphin`}>
        {message && <div className="mascot__bubble">{message}</div>}
        <div className="mascot__dolphin">
          <Dolphin play={play} />
        </div>
      </div>
    );
  }
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
