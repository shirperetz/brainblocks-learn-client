import { useEffect, useState } from "react";
import { hasIslands } from "../game/games";
import MyIslandButton from "../components/MyIslandButton";
import DolphinPerch from "../components/DolphinPerch";
import { useNavigate } from "react-router-dom";
import { getStats } from "../services/learnApi";
import "../styles/pages/challenges.css";
import OptionCard from "../components/OptionCard";
import WeeklyTasks from "../components/WeeklyTasks";
import "../styles/pages/room.css";
import ClassBuilding from "../components/ClassBuilding";
import { TOPICS, isTopicAllowedForGrade } from "../data/topics";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/onboarding.css";

// Screen 4 — choose what to practice. Tapping a topic opens its stage map.
export default function TopicsPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!ready) return;
    getStats(profile.id).then(setStats).catch(() => setStats(null));
  }, [ready, profile]);

  if (!ready) return null;

  return (
    <div className="app-shell">
      {/* 2026-11-11: back goes home (settings, admin, switch user) - it used to go to the grade
          screen, whose back came here again, so there was no way home. The grade has its own link. */}
      <button className="back-button" onClick={() => navigate("/")}>
        ← בית
      </button>
      <div className="onboarding">
        <div className="onboarding__header">
          <div className="steps" aria-hidden="true">
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
          </div>
          <h1 className="screen-title">בחר נושא</h1>
          <DolphinPerch message="במה נתרגל היום?" />
        </div>

        {/* 2026-11-12 (Shir: the room code inside the game's home page, not at the entrance) */}
        <button className="room-entry" onClick={() => navigate("/room")}>🎮 יש לי קוד חדר מהמורה</button>
        {/* 2026-11-12 (Shir): ג׳ sees the islands too (א׳-ב׳ start there) */}
        {hasIslands(profile.grade) && (
          <button className="room-entry room-entry--sea" onClick={() => navigate("/island")}>🌊 לים האיים - משחקים</button>
        )}
        <MyIslandButton profileId={profile.id} />
        <WeeklyTasks profileId={profile.id} />
        <ClassBuilding profileId={profile.id} />

        <div className="challenge-row" role="group" aria-label="אתגרים">
          <button className="challenge-card" onClick={() => navigate("/daily")}>
            <span className="challenge-card__icon">🔥</span>
            <span className="challenge-card__title">אתגר יומי</span>
            <span className="challenge-card__sub">
              {stats?.dailyDone ? "✔ בוצע היום" : stats?.dailyStreak ? `רצף ${stats.dailyStreak}` : "5 שאלות"}
            </span>
          </button>
          <button className="challenge-card" onClick={() => navigate("/timed")}>
            <span className="challenge-card__icon">⏱️</span>
            <span className="challenge-card__title">60 שניות</span>
            <span className="challenge-card__sub">{stats?.bestTimed ? `שיא ${stats.bestTimed}` : "כמה תספיקו?"}</span>
          </button>
          <button className="challenge-card" onClick={() => navigate("/review")}>
            <span className="challenge-card__icon">🔁</span>
            <span className="challenge-card__title">חזרה</span>
            <span className="challenge-card__sub">{stats?.openMistakes ? `${stats.openMistakes} לתרגל` : "על מה שהיה קשה"}</span>
          </button>
        </div>

        <div className="option-grid option-grid--wide" role="group" aria-label="נושאים">
          {TOPICS.map((t) => {
            const allowed = isTopicAllowedForGrade(t.key, profile.grade);
            return (
              <OptionCard
                key={t.key}
                icon={t.emoji}
                title={t.name}
                subtitle={allowed ? t.blurb : "נפתח בכיתה גבוהה יותר"}
                color={t.color}
                locked={!allowed}
                onClick={() => navigate(`/map/${t.key}`)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
