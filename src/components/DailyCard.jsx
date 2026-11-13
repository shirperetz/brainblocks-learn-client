import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats } from "../services/learnApi";
import "../styles/pages/challenges.css";

/**
 * 2026-11-13 (Shir chose "a daily task and a streak"): the daily challenge in the sea of islands too
 * (it was only on the topics page) - 5 questions, 5 coins a day, +10 on every 3rd day in a row.
 */
export default function DailyCard({ profileId, back }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getStats(profileId).then(setStats).catch(() => setStats(null));
  }, [profileId]);
  if (!stats) return null;
  const streak = stats.dailyStreak ?? 0;
  const toBonus = 3 - (streak % 3);
  return (
    <button className={`daily-card${stats.dailyDone ? " is-done" : ""}`} onClick={() => navigate("/daily", { state: { back } })}>
      <span className="daily-card__icon" aria-hidden="true">🔥</span>
      <span className="daily-card__body">
        <b>{stats.dailyDone ? "המשימה היומית בוצעה!" : "המשימה היומית: 5 שאלות"}</b>
        <span>
          {streak > 0 ? `${streak} ${streak === 1 ? "יום" : "ימים"} ברצף · ` : ""}
          {stats.dailyDone
            ? "נתראה מחר"
            : toBonus === 1 && streak > 0
              ? "היום: 5 מטבעות + בונוס 10!"
              : "היום: 5 מטבעות לאי"}
        </span>
      </span>
    </button>
  );
}
