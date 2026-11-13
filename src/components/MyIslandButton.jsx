import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyIsland } from "../services/learnApi";
import "../styles/pages/island3d.css";

/**
 * 2026-11-13 (Shir: "a button somewhere, so a child who wants to use the coins can come and press it"):
 * a big button to the 3D island, with how many coins are waiting to be spent.
 */
export default function MyIslandButton({ profileId }) {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(null);
  useEffect(() => {
    let on = true;
    getMyIsland(profileId)
      .then((s) => on && setCoins(s.coins))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [profileId]);
  return (
    <button className="my-island-btn" onClick={() => navigate("/my-island")}>
      <span className="my-island-btn__icon" aria-hidden="true">🏝️</span>
      <span className="my-island-btn__text">
        <b>האי שלי - לבנות ולקנות</b>
        <span>{coins == null ? "המטבעות שלך מחכים" : `יש לך ${coins.toLocaleString("he-IL")} מטבעות`}</span>
      </span>
      <span className="my-island-btn__coin" aria-hidden="true" />
    </button>
  );
}
