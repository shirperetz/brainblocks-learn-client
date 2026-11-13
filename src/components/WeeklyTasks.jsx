import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { topicInfo } from "../data/progress";
import { GAMES } from "../game/games";
import { getAssignments } from "../services/learnApi";
import ProgressBar from "./ProgressBar";
import "../styles/pages/challenges.css";

/**
 * 2026-11-12 (idea #5): "📅 משימה מהמורה" - the weekly tasks the child's teacher set for the class,
 * with a progress bar each. Tapping one opens that topic (or island game). Nothing when there are none.
 */
export default function WeeklyTasks({ profileId }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let alive = true;
    getAssignments(profileId)
      .then((list) => alive && setTasks(Array.isArray(list) ? list : []))
      .catch(() => alive && setTasks([]));
    return () => {
      alive = false;
    };
  }, [profileId]);

  if (tasks.length === 0) return null;

  return (
    <section className="weekly" aria-label="משימות מהמורה">
      <h2 className="weekly__title">📅 משימה מהמורה</h2>
      {tasks.map((t) => {
        const info = topicInfo(t.topic);
        const game = GAMES.find((g) => g.topic === t.topic);
        const done = t.done >= t.rounds;
        return (
          <button
            key={t.id}
            className={`weekly__task${done ? " is-done" : ""}`}
            onClick={() => navigate(game ? `/island/${game.key}` : `/map/${t.topic}`)}
          >
            <span className="weekly__icon" aria-hidden="true">{info.emoji}</span>
            <span className="weekly__body">
              <span className="weekly__name">
                {t.personal && "🎯 רק בשבילך: "}
                {t.rounds} {t.rounds === 1 ? "סבב" : "סבבים"} של {info.name}
              </span>
              <ProgressBar current={t.done} total={t.rounds} />
              <span className="weekly__sub">
                {done
                  ? "✔ כל הכבוד, סיימת!"
                  : `${t.done} מתוך ${t.rounds} · ${daysLeft(t.daysLeft)}`}
              </span>
            </span>
          </button>
        );
      })}
      <p className="weekly__hint">סבב נחשב כשעונים נכון על חצי מהשאלות לפחות</p>
    </section>
  );
}

function daysLeft(n) {
  if (n <= 1) return "נשאר היום";
  if (n === 2) return "נשארו יומיים";
  return `נשארו ${n} ימים`;
}
