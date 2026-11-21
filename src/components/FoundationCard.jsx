import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFoundation } from "../services/learnApi";
import { getTopic } from "../data/topics";
import "../styles/components/foundation-card.css";

/**
 * 2026-11-21 (Shir chose "finding the gap - the root, not the exercise"): when a topic goes badly the
 * server looks under it (Foundations.java). CHECK = a 5-question check of the base; PRACTICE = a short
 * practice of it. Worded as building, never as "going back a grade".
 */
const BASE_PLAY = {
  ADD20: ["ADDITION", 6],
  SUB20: ["SUBTRACTION", 6],
  TIMES: ["MULTIPLICATION", 6],
  DIVIDE: ["DIVISION", 6],
};

export default function FoundationCard({ profileId }) {
  const navigate = useNavigate();
  const [gap, setGap] = useState(null);
  useEffect(() => {
    let alive = true;
    getFoundation(profileId).then((g) => alive && setGap(g?.key ? g : null)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [profileId]);
  if (!gap || !BASE_PLAY[gap.key]) return null;

  const [topic, stage] = BASE_PLAY[gap.key];
  const forName = getTopic(gap.forTopic)?.name ?? "";
  const check = gap.status === "CHECK";
  return (
    <section className="foundation" aria-label="בונים יסודות">
      <span className="foundation__icon" aria-hidden="true">🧱</span>
      <div className="foundation__body">
        <b className="foundation__title">{check ? `בדיקה קצרה: ${gap.name}` : `בונים יסודות: ${gap.name}`}</b>
        <span className="foundation__sub">
          {check
            ? `6 תרגילים קצרים - ככה נדע איך לעזור לך ב${forName}`
            : `עוד קצת ${gap.name}, ו${forName} יהיה הרבה יותר קל`}
        </span>
        {!check && gap.pct != null && (
          <span className="foundation__bar" aria-label={`${gap.pct}% נכון`}>
            <i style={{ width: `${Math.max(6, gap.pct)}%` }} />
          </span>
        )}
      </div>
      <button type="button" className="foundation__go" onClick={() => navigate(`/play/${topic}/${stage}?foundation=${gap.key}`)}>
        {check ? "יאללה" : "לתרגל"}
      </button>
    </section>
  );
}
