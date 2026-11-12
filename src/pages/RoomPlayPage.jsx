import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MathText from "../components/MathText";
import QuestionPicture from "../components/QuestionPicture";
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

  const running = me?.state === "RUNNING" && me?.status === "IN";
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

      {running && q && (
        <>
          <section className="room-card room-question">
            <small>{q.retry ? "🔁 התרגיל מקודם - עוד ניסיון" : `שאלה ${q.number} · ${q.topic === "MIXED" ? "" : topicLabel(q.topic)}`}</small>
            <p className="room-question__text"><MathText text={q.text} /></p>
            <QuestionPicture visual={q.visual} />
          </section>
          <div className="room-answers">
            {q.options.map((o) => (
              <button key={o} className={`room-answer${optionClass(o)}`} disabled={chosen !== null} onClick={() => answer(o)}>
                <MathText text={o} />
              </button>
            ))}
          </div>
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
        <section className="room-card">
          <h1>🎉 המשחק נגמר!</h1>
          <p className="room-big">{me.points} נקודות</p>
          <p className="room-note">ענית נכון על {me.right} מתוך {me.answered}. כל הכבוד!</p>
        </section>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
