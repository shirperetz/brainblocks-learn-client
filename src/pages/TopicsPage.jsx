import { useEffect, useState } from "react";
import { hasIslands } from "../game/games";
import MyIslandButton from "../components/MyIslandButton";
import DolphinPerch from "../components/DolphinPerch";
import { useNavigate } from "react-router-dom";
import { getStats } from "../services/learnApi";
import "../styles/pages/challenges.css";
import OptionCard from "../components/OptionCard";
import WeeklyTasks from "../components/WeeklyTasks";
import FoundationCard from "../components/FoundationCard";
import "../styles/pages/room.css";
import ClassBuilding from "../components/ClassBuilding";
import { TOPICS, TOPIC_GROUPS, isTopicAllowedForGrade } from "../data/topics";
import { getGrade } from "../data/grades";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/onboarding.css";

// Screen 4 — choose what to practice. Tapping a topic opens its stage map.
export default function TopicsPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const [stats, setStats] = useState(null);
  // 2026-11-14 (Shir: "why both islands and the topics below?"): the topics fold behind one button,
  // so the page leads with the islands. Remembered for this tab - back from a topic map keeps it open.
  const [showTopics, setShowTopics] = useState(() => {
    try { return sessionStorage.getItem("topics-open") === "1"; } catch { return false; }
  });
  const toggleTopics = () => {
    setShowTopics((open) => {
      try { sessionStorage.setItem("topics-open", open ? "0" : "1"); } catch { /* private mode */ }
      return !open;
    });
  };

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
      <div className="onboarding onboarding--game-home">
        <div className="onboarding__header">
          <div className="steps" aria-hidden="true">
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
            <span className="steps__dot is-active" />
          </div>
          <h1 className="screen-title">מה משחקים היום?</h1>
          <DolphinPerch message="במה נתרגל היום?" />
        </div>

        {/* 2026-11-14 (Shir): the three quick challenges right under the dolphin */}
        <div className="challenge-row" role="group" aria-label="אתגרים">
          <button className="challenge-card" onClick={() => navigate("/daily", { state: { back: "/topics" } })}>
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

        {/* 2026-11-21 (finding the gap): a base skill under a topic that goes badly */}
        <FoundationCard profileId={profile.id} />

        {/* 2026-11-12 (Shir: the room code inside the game's home page, not at the entrance) */}
        <button className="room-entry" onClick={() => navigate("/room")}>🎮 יש לי קוד חדר מהמורה</button>
        {/* 2026-11-12 (Shir): ג׳ sees the islands too (א׳-ב׳ start there) */}
        {hasIslands(profile.grade) && (
          <button className="room-entry room-entry--sea" onClick={() => navigate("/island")}>🌊 לים האיים - משחקים</button>
        )}
        <MyIslandButton profileId={profile.id} />
        <WeeklyTasks profileId={profile.id} />

        {/* Grades without islands have only the topics - nothing to fold there. */}
        {hasIslands(profile.grade) && (
          <button className="topics-toggle" onClick={toggleTopics} aria-expanded={showTopics}>
            <span>📚 תרגול לפי נושא</span>
            <span className="topics-toggle__sub">{showTopics ? "▲ להסתיר" : "חיבור, כפל, שברים... ▼"}</span>
          </button>
        )}
        {(showTopics || !hasIslands(profile.grade)) && (
        <TopicGroups profile={profile} onOpen={(key) => navigate(`/map/${key}`)} />
        )}
        {/* 2026-11-21 (Shir): the class building moved here, as one slim row - full card on the class island */}
        <ClassBuilding profileId={profile.id} compact />
      </div>
    </div>
  );
}

/**
 * 2026-11-21 (design pass, apple-design: hierarchy + grouping, "show the common path first"): the
 * topics in sections by subject, two per row on a phone (27 one-per-row cards were ~5,000px), and what
 * opens in higher grades in its own quieter section at the end (Shir: "open on top, locked at the bottom").
 */
function TopicGroups({ profile, onOpen }) {
  const allowed = (t) => isTopicAllowedForGrade(t.key, profile.grade, profile.advanced);
  const locked = TOPICS.filter((t) => !allowed(t));
  const card = (t) => {
    const ok = allowed(t);
    const up = profile.advanced?.[t.key];
    return (
      <OptionCard
        key={t.key}
        icon={t.emoji}
        title={t.name}
        subtitle={!ok ? "נפתח בכיתה גבוהה יותר" : up ? `⭐ אתגר: רמת ${getGrade(up)?.label ?? "כיתה גבוהה"}` : t.blurb}
        color={t.color}
        locked={!ok}
        onClick={() => onOpen(t.key)}
      />
    );
  };
  return (
    <div className="topic-groups">
      {TOPIC_GROUPS.map((g) => {
        const open = TOPICS.filter((t) => g.keys.includes(t.key) && allowed(t));
        if (open.length === 0) return null;
        return (
          <section key={g.key} className="topic-group" aria-label={g.name}>
            <h2 className="topic-group__title"><span aria-hidden="true">{g.emoji}</span> {g.name}</h2>
            <div className="option-grid topic-grid">{open.map(card)}</div>
          </section>
        );
      })}
      {locked.length > 0 && (
        <section className="topic-group topic-group--locked" aria-label="בכיתות הבאות">
          <h2 className="topic-group__title"><span aria-hidden="true">🔒</span> בכיתות הבאות</h2>
          <div className="option-grid topic-grid">{locked.map(card)}</div>
        </section>
      )}
    </div>
  );
}
