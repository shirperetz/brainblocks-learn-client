import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../services/learnApi";
import { avatarOf, clock, topicLabel } from "../data/room";
import RoomQr from "../components/RoomQr";
import RoomCountdown from "../components/RoomCountdown";
import "../styles/pages/room.css";

// 2026-11-12 (Shir chose: the teacher + a board in class, top five only): the projector view.
// 2026-11-22: a QR code + the code while waiting, "3, 2, 1" at the start, the two groups' points.
export default function RoomBoardPage() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () => api.roomBoard(id).then((r) => alive && (setB(r), setError(""))).catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 1000);
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
            <span className="board__clock">{b.state === "ENDED" ? "הסתיים!" : clock(b.secondsLeft)}</span>
          </div>

          {b.state === "LOBBY" && (
            <div className="board__join">
              <RoomQr code={b.code} size={260} label={false} />
              <div className="board__join-text">
                <span>מצלמים את הקוד, או מקלידים:</span>
                <strong className="board__code">{b.code.slice(0, 3)} {b.code.slice(3)}</strong>
                <span>{b.count > 0 ? `${b.count} ילדים כבר בחדר` : "מחכים לילדים..."}</span>
              </div>
            </div>
          )}

          {b.teamScores?.length === 2 && b.state !== "LOBBY" && (
            <div className="board__teams">
              {b.teamScores.map((t, i) => (
                <div key={t.name} className={`board__team board__team--${i}`}>
                  <span>{t.name}</span>
                  <strong>{t.points}</strong>
                </div>
              ))}
            </div>
          )}

          {b.state !== "LOBBY" && (
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
          )}
          {b.state !== "LOBBY" && b.top.length === 0 && <p className="board__wait">מחכים לתשובה הראשונה...</p>}
          {b.state !== "LOBBY" && (
            <div className="board__foot">
              <span>רק 5 המובילים מוצגים - כל הכבוד לכל {b.count} הילדים בחדר!</span>
              <span>כל הכיתה: {b.pct}% נכון</span>
            </div>
          )}
          {b.state === "RUNNING" && <RoomCountdown ms={b.countdownMs} dark />}
        </>
      )}
    </div>
  );
}
