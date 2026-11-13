import { useEffect } from "react";
import { markFormOpened } from "../services/learnApi";

/**
 * 2026-11-13 (security): a field no person sees (off screen, not reachable with Tab, hidden from screen
 * readers) - sign-up bots fill every field; the server refuses a filled one. Also starts the form's clock.
 */
export default function BotTrap() {
  useEffect(() => markFormOpened(), []);
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
