import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats } from "../services/learnApi";
import "../styles/pages/challenges.css";
import OptionCard from "../components/OptionCard";
import Mascot from "../components/Mascot";
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
      <button className="back-button" onClick={() => navigate("/grade")}>
        ← חזרה
      </button>
      <div className="onboarding">
        <div className="onboarding__header">
          <div className="steps" aria-hidden="true">
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
          </div>
          <Mascot avatarKey={profile.avatar} size="sm" message="במה נתרגל היום?" />
          <h1 className="screen-title">בחר נושא</h1>
        </div>

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
