import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import QuickQuiz from "../components/QuickQuiz";
import { getQuestions, getStats, submitSession } from "../services/learnApi";
import { useProfile } from "../context/profileStore";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/challenges.css";

const COUNT = 5;

// 🔥 The daily challenge: 5 mixed questions at the child's grade, once a day keeps the streak alive.
export default function DailyPage() {
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { refreshProfile } = useProfile();
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const answers = useRef([]);
  const started = useRef(0);

  useEffect(() => {
    if (!ready) return;
    getStats(profile.id).then(setStats).catch((e) => setError(e.message));
  }, [ready, profile]);

  if (!ready) return null;

  function start() {
    answers.current = [];
    setResult(null);
    getQuestions({ profileId: profile.id, topic: "MIXED", stage: 3, count: COUNT })
      .then((qs) => {
        started.current = Date.now();
        setQuestions(qs);
      })
      .catch((e) => setError(e.message));
  }

  function finish() {
    submitSession({
      profileId: profile.id,
      topic: "MIXED",
      stage: 1,
      mode: "DAILY",
      durationMs: Date.now() - started.current,
      answers: answers.current,
    })
      .then((summary) => {
        refreshProfile();
        setQuestions(null);
        setResult(summary);
        return getStats(profile.id).then(setStats);
      })
      .catch((e) => setError(e.message));
  }

  return (
    <div className="app-shell">
      <button className="back-button" onClick={() => navigate("/topics")}>
        ← חזרה
      </button>
      <div className="challenge">
        <h1 className="screen-title">🔥 האתגר היומי</h1>
        {error && <p className="form-error">{error}</p>}

        {!questions && !result && stats && (
          <div className="challenge__intro card">
            <Mascot avatarKey={profile.avatar} size="sm" message={stats.dailyDone ? "כבר עשיתם היום! אפשר שוב בשביל הכיף" : "5 שאלות, כל יום"} />
            <p className="challenge__big">
              {stats.dailyStreak > 0 ? `🔥 ${stats.dailyStreak} ${stats.dailyStreak === 1 ? "יום" : "ימים"} ברצף` : "מתחילים רצף חדש!"}
            </p>
            <BigButton variant="green" onClick={start}>
              {stats.dailyDone ? "לשחק שוב" : "יאללה, מתחילים!"}
            </BigButton>
          </div>
        )}

        {questions && (
          <QuickQuiz
            questions={questions}
            grade={profile.grade}
            onAnswer={(a) => answers.current.push(a)}
            onDone={finish}
          />
        )}

        {result && (
          <div className="challenge__intro card">
            <p className="challenge__big">
              {result.correct} / {result.total} נכונות
            </p>
            <p>{stats?.dailyStreak > 0 ? `🔥 רצף של ${stats.dailyStreak} ${stats.dailyStreak === 1 ? "יום" : "ימים"}! נתראה מחר.` : ""}</p>
            <BigButton variant="blue" onClick={() => navigate("/topics")}>
              חזרה לנושאים
            </BigButton>
          </div>
        )}
      </div>
    </div>
  );
}
