import { useNavigate } from "react-router-dom";
import OptionCard from "../components/OptionCard";
import Mascot from "../components/Mascot";
import { TOPICS, isTopicAllowedForGrade } from "../data/topics";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/onboarding.css";

// Screen 4 — choose what to practice. Tapping a topic opens its stage map.
export default function TopicsPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();

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
