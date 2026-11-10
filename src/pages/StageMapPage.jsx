import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Mascot from "../components/Mascot";
import StarRating from "../components/StarRating";
import { getTopic } from "../data/topics";
import { getStageMap } from "../services/learnApi";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/stage-map.css";

// Screen 5 — the winding path of stages for one topic.
export default function StageMapPage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const topicInfo = getTopic(topic);

  const [map, setMap] = useState(null);
  const [error, setError] = useState("");
  const [lockedNudge, setLockedNudge] = useState(null);

  useEffect(() => {
    if (!ready || !topicInfo) return;
    let active = true;
    getStageMap(profile.id, topic)
      .then((data) => active && setMap(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [ready, profile, topic, topicInfo]);

  if (!ready) return null;
  if (!topicInfo) return <Navigate to="/topics" replace />;

  function openStage(stage) {
    if (stage.status === "LOCKED") {
      setLockedNudge(stage.stageNumber);
      setTimeout(() => setLockedNudge(null), 1600);
      return;
    }
    navigate(`/play/${topic}/${stage.stageNumber}`);
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate("/topics")}>
        ← חזרה לנושאים
      </button>

      <div className="stage-map">
        <div className="stage-map__header">
          <Mascot avatarKey={profile.avatar} size="sm" />
          <h1 className="screen-title">
            <span aria-hidden="true">{topicInfo.emoji}</span> {topicInfo.name}
          </h1>
          {map && (
            <div className="stage-map__stars">
              <StarRating value={map.totalStars} max={18} size="sm" />
              <span>{map.totalStars} כוכבים</span>
            </div>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        {map && (
          <ol className="stage-path">
            {map.stages.map((stage) => {
              const locked = stage.status === "LOCKED";
              const completed = stage.status === "COMPLETED";
              return (
                <li
                  key={stage.stageNumber}
                  className={`stage-node-row stage-node-row--${(stage.stageNumber % 2) ? "start" : "end"}`}
                >
                  <button
                    className={`stage-node ${locked ? "is-locked" : ""} ${completed ? "is-completed" : ""} ${
                      lockedNudge === stage.stageNumber ? "is-nudging" : ""
                    }`}
                    style={{ "--accent": topicInfo.color }}
                    onClick={() => openStage(stage)}
                    aria-label={`שלב ${stage.stageNumber}`}
                  >
                    <span className="stage-node__num">{locked ? "🔒" : stage.stageNumber}</span>
                    {!locked && <StarRating value={stage.stars} size="sm" />}
                  </button>
                  {lockedNudge === stage.stageNumber && (
                    <span className="stage-node__nudge">סיים את השלב הקודם כדי לפתוח</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
