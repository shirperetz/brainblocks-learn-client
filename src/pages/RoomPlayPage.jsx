import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MathText from "../components/MathText";
import QuestionPicture from "../components/QuestionPicture";
import DolphinPerch from "../components/DolphinPerch";
import ReadAloud from "../components/ReadAloud";
import Mascot from "../components/Mascot";
import { readAloudDefault } from "../game/readAloud";
import { useProfile } from "../context/profileStore";
import { cheer } from "../game/companion";
import { clock, topicLabel } from "../data/room";
import { roomAnswer, roomMe, roomQuestion } from "../services/learnApi";
import "../styles/pages/room.css";

const FEEDBACK_MS = 1100;

// 2026-11-12: the child in a live game room - waits for the teacher (approval / the start), then
// questions one after another until the time is up. The phone never gets the right answer first:
// the server checks each answer. The child sees only its own points (no ranking).
export default function RoomPlayPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [q, setQ] = useState(null);
  const [result, setResult] = useState(null); // { correct, right, gained, streak } after an answer
  const [chosen, setChosen] = useState(null);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const loadQuestion = useCallback(() => {
    roomQuestion(code)
      .then((x) => {
        setQ(x);
        if (x) cheer("question");
        setResult(null);
        setChosen(null);
      })
      .catch(() => setQ(null));
  }, [code]);

  // Poll the room every 2 s (state, time, points); the first time it's RUNNING, fetch a question.
  useEffect(() => {
    let alive = true;
    const load = () =>
      roomMe(code)
        .then((m) => {
          if (!alive) return;
          setMe(m);
          setError("");
        })
        .catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [code]);

  const { profile } = useProfile();
  // 2026-11-15 (room upgrade #8): the teacher paused - every screen waits.
  const paused = Boolean(me?.paused);
  const running = me?.state === "RUNNING" && me?.status === "IN" && !paused;
  useEffect(() => {
    if (running && !q && !result) loadQuestion();
  }, [running, q, result, loadQuestion]);

  async function answer(option) {
    if (busy.current || chosen !== null) return;
    busy.current = true;
    setChosen(option);
    try {
      const r = await roomAnswer(code, option);
      setResult(r);
      cheer(r.correct ? "correct" : "wrong"); // 2026-11-15: the dolphin plays along in the live room too
      setMe((m) => (m ? { ...m, points: r.points } : m));
      setTimeout(() => {
        busy.current = false;
        setQ(null);
        setResult(null);
      }, FEEDBACK_MS);
    } catch (e) {
      busy.current = false;
      setError(e.message);
    }
  }

  if (!me) {
    return (
      <div className="app-shell room-child">
        <button className="back-button" onClick={() => navigate("/")}>← בית</button>
        <p className="room-note">{error || "מתחברים לחדר..."}</p>
      </div>
    );
  }

  const optionClass = (o) =>
    chosen === null ? "" : result && o === result.right ? " is-right" : o === chosen ? " is-wrong" : " is-muted";

  return (
    <div className="app-shell room-child">
      {me.state !== "RUNNING" && <button className="back-button" onClick={() => navigate("/")}>← בית</button>}
      <div className="room-bar">
        <span className="room-pill">{clock(me.secondsLeft)}</span>
        <span className="room-bar__title">{me.title}</span>
        <span className="room-pill">{me.points} נק׳</span>
      </div>

      {me.status === "REJECTED" && <section className="room-card"><h1>המורה לא אישרה את הכניסה</h1><p className="room-note">אפשר לחזור הביתה.</p></section>}

      {me.status === "WAITING" && (
        <section className="room-card">
          <h1>מחכים לאישור המורה...</h1>
          <p className="room-note">שלום {me.name}! המורה תאשר אותך עוד רגע.</p>
        </section>
      )}

      {me.status === "IN" && me.state === "LOBBY" && (
        <section className="room-card">
          <h1>את/ה בחדר, {me.name}!</h1>
          <p className="room-note">{me.topics.map(topicLabel).join(" · ")} · {me.minutes} דקות</p>
          <p className="room-wait">⏳ מחכים שהמורה תתחיל...</p>
          <p className="room-note">{me.inRoom} ילדים בחדר</p>
        </section>
      )}

      {me.status === "IN" && me.state === "RUNNING" && paused && (
        <section className="room-card room-paused">
          <Mascot dolphin size="md" play="think" />
          <p className="room-big">⏸️</p>
          <h1>המורה עצרה רגע</h1>
          <p className="room-note">מקשיבים, ותיכף ממשיכים</p>
        </section>
      )}

      {running && q && (
        <>
          <DolphinPerch side />
          <section className="room-card room-question">
            <small>{q.retry ? "🔁 התרגיל מקודם - עוד ניסיון" : `שאלה ${q.number} · ${q.topic === "MIXED" ? "" : topicLabel(q.topic)}`}</small>
            <div className="room-question__row">
              <p className="room-question__text"><MathText text={q.text} /></p>
              <ReadAloud key={`${q.number}-${q.text}`} text={q.text} auto={readAloudDefault(profile?.grade)} />
            </div>
            <QuestionPicture visual={q.visual} />
          </section>
          <div className="room-answers">
            {q.options.map((o) => (
              <button key={o} className={`room-answer${optionClass(o)}`} disabled={chosen !== null} onClick={() => answer(o)}>
                <MathText text={o} />
              </button>
            ))}
          </div>
          {result?.correct && !result.retry && result.streak >= 3 && (
            <div className="room-streak" role="status">🔥 {result.streak} ברצף! +5 בונוס</div>
          )}
          {result && (
            <p className={`room-feedback ${result.correct ? "is-right" : "is-wrong"}`} role="status">
              {result.retry
                ? result.correct ? "הבנת! 👍" : "נתרגל את זה עוד"
                : result.correct ? `נכון! +${result.gained}${result.streak >= 3 ? ` · ${result.streak} ברצף` : ""}` : "כמעט! עוד מעט נחזור על התרגיל הזה"}
            </p>
          )}
        </>
      )}

      {me.state === "ENDED" && me.status === "IN" && (
        <section className="room-card room-end">
          <Mascot dolphin size="md" play={me.place > 0 && me.place <= 5 ? "success" : "smile"} />
          <h1>{me.place === 1 ? "🥇 מקום ראשון!" : me.place === 2 ? "🥈 מקום שני!" : me.place === 3 ? "🥉 מקום שלישי!" : me.place > 0 ? `מקום ${me.place}` : "🎉 המשחק נגמר!"}</h1>
          <p className="room-big">{me.points} נקודות</p>
          <p className="room-note">ענית נכון על <b>{me.right}</b> מתוך <b>{me.answered}</b>.</p>
          <p className="room-note">{me.place > 0 && me.place <= 5 ? "כל הכבוד! אתם בין המובילים 🎉" : me.answered > 0 && me.right / me.answered >= 0.7 ? "עבודה מצוינת! 💪" : "כל תרגיל מקדם אתכם. בפעם הבאה עוד יותר! 💪"}</p>
        </section>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
