import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../services/learnApi";
import { avatarOf, clock, topicLabel } from "../data/room";
import "../styles/pages/room.css";

// 2026-11-12 (Shir chose: the teacher + a board in class, top five only): the projector view.
export default function RoomBoardPage() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () => api.roomBoard(id).then((r) => alive && (setB(r), setError(""))).catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  return (
    <div className="board">
      {error && <p className="board__error">{error}</p>}
      {b && (
        <>
          <div className="board__head">
            <h1>{b.title} · {b.topics.map(topicLabel).join(" + ")}</h1>
            <span className="board__clock">{b.state === "LOBBY" ? `קוד: ${b.code}` : b.state === "ENDED" ? "הסתיים!" : clock(b.secondsLeft)}</span>
          </div>
          <ol className="board__list">
            {b.top.map((p) => (
              <li key={p.id} className={p.place === 1 ? "is-first" : ""}>
                <span className="board__place">{p.place}</span>
                <span className="board__avatar" aria-hidden="true">{avatarOf(p)}</span>
                <span className="board__name">{p.name}</span>
                <span className="board__points">{p.points}</span>
              </li>
            ))}
          </ol>
          {b.top.length === 0 && <p className="board__wait">מחכים שהמשחק יתחיל...</p>}
          <div className="board__foot">
            <span>רק 5 המובילים מוצגים - כל הכבוד לכל {b.count} הילדים בחדר!</span>
            <span>כל הכיתה: {b.pct}% נכון</span>
          </div>
        </>
      )}
    </div>
  );
}
