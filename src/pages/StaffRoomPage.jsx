import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { avatarOf, clock, topicLabel } from "../data/room";
import * as api from "../services/learnApi";
import "../styles/pages/staff.css";
import "../styles/pages/room.css";

// 2026-11-12: the teacher's room - lobby (code, who's in, approvals) -> live table -> results.
// Refreshes every 2 seconds.
export default function StaffRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const isStaff = Boolean(profile && (profile.admin || profile.teacher));

  useEffect(() => {
    if (!isStaff) return undefined;
    let alive = true;
    const load = () => api.roomLive(id).then((r) => alive && (setRoom(r), setError(""))).catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id, isStaff]);

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace state={{ next: `/staff/room/${id}` }} />;
  if (!isStaff) return <Navigate to="/" replace />;

  const act = (action) => api.roomAction(id, action).then(setRoom).catch((e) => setError(e.message));
  const decide = (pid, ok) => api.roomDecide(id, pid, ok).then(() => api.roomLive(id).then(setRoom)).catch((e) => setError(e.message));

  return (
    <div className="app-shell staff room">
      <div className="staff__top">
        <button className="back-button" onClick={() => navigate("/staff")}>← לכיתות</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {!room && !error && <p className="staff__loading">טוען...</p>}
      {room && (
        <>
          <div className="room-head">
            <div>
              <small>{room.title}</small>
              <h1>{room.state === "LOBBY" ? "חדר משחק" : room.state === "RUNNING" ? "בזמן אמת" : "המשחק נגמר"} · {room.topics.map(topicLabel).join(" + ")}</h1>
            </div>
            <span className="room-clock">{clock(room.secondsLeft)}</span>
            <div className="room-actions">
              {room.state === "LOBBY" && (
                <button className="admin__btn room-start" onClick={() => act("start")}>מתחילים! ({room.players.length} ילדים)</button>
              )}
              {room.state !== "ENDED" && <button className="admin__btn admin__btn--ghost" onClick={() => act("extend")}>+ דקה</button>}
              <a className="admin__btn admin__btn--ghost room-link" href={`/staff/room/${id}/board`} target="_blank" rel="noreferrer">הצג על הלוח</a>
              {room.state === "RUNNING" && <button className="admin__btn room-end" onClick={() => window.confirm("לסיים את המשחק?") && act("end")}>סיום</button>}
            </div>
          </div>

          {room.state === "LOBBY" && (
            <section className="staff-card room-code-card">
              <span>קוד החדר</span>
              <strong className="room-code">{room.code.slice(0, 3)} {room.code.slice(3)}</strong>
              <span>הילדים לוחצים "🎮 יש לי קוד חדר מהמורה" במסך הנושאים (או באי) ומקלידים אותו</span>
              <span>ילד/ה בלי משתמש: <b dir="ltr">{window.location.origin}/room</b> - שם + קוד, ואת מאשרת</span>
            </section>
          )}

          {room.waiting.length > 0 && (
            <section className="staff-card staff-card--waiting">
              <h2>⏳ ממתינים לאישור שלך ({room.waiting.length})</h2>
              <ul className="people">
                {room.waiting.map((p) => (
                  <li key={p.id} className="person">
                    <span className="person__avatar" aria-hidden="true">{avatarOf(p)}</span>
                    <div className="person__who">
                      <strong>{p.name}</strong>
                      <small>{p.guest ? "אורח/ת · בלי משתמש" : "מכיתה אחרת"}</small>
                    </div>
                    <div className="person__actions">
                      <button className="admin__btn" onClick={() => decide(p.id, true)}>✓ אישור</button>
                      <button className="admin__btn admin__btn--ghost" onClick={() => decide(p.id, false)}>✕ לא</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {room.state === "LOBBY" ? (
            <section className="staff-card">
              <h2>בחדר ({room.players.length})</h2>
              {room.notYet.length > 0 && <p className="staff-card__hint">עוד לא נכנסו: {room.notYet.join(", ")}</p>}
              <div className="room-kids">
                {room.players.map((p) => (
                  <div key={p.id} className="room-kid">
                    <span className="room-kid__avatar" aria-hidden="true">{avatarOf(p)}</span>
                    <span>{p.name}</span>
                    <small>{p.guest ? "אורח/ת" : "מוכן/ה"}</small>
                  </div>
                ))}
              </div>
              {room.players.length === 0 && <p className="staff-card__empty">מחכים שהילדים ייכנסו...</p>}
            </section>
          ) : (
            <div className="room-live">
              <section className="staff-card">
                <h2>{room.state === "ENDED" ? "🏆 התוצאות" : "מי מוביל"}</h2>
                <div className="room-table" role="table" aria-label="טבלת המשחק">
                  <div className="room-row room-row--head" role="row">
                    <span>מקום</span><span>ילד/ה</span><span>נקודות</span><span>נכון</span><span>מצב</span>
                  </div>
                  {room.players.map((p) => (
                    <div key={p.id} className={`room-row${p.place <= 3 ? " is-top" : ""}`} role="row">
                      <span className="room-place">{p.place}</span>
                      <span className="room-name"><span aria-hidden="true">{avatarOf(p)}</span> {p.name}{p.guest ? " (אורח/ת)" : ""}</span>
                      <span className="room-points">{p.points}</span>
                      <span>{p.right}/{p.answered}</span>
                      <span className={p.stuck ? "room-stuck" : "room-ok"}>{room.state === "ENDED" ? "סיים/ה" : p.stuck ? "תקוע/ה" : "פותר/ת"}</span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="room-side">
                <section className="staff-card">
                  <h2>הכי קשה לכיתה</h2>
                  {room.hardest.length === 0 && <p className="staff-card__hint">עוד אין מספיק תשובות</p>}
                  {room.hardest.map((h) => (
                    <div key={h.skill} className="room-hard"><span>{h.skill}</span><strong>{h.pct}%</strong></div>
                  ))}
                </section>
                <section className="staff-card">
                  <h2>כל הכיתה</h2>
                  <p className="staff-card__hint">{room.answered} תשובות · {room.pct}% נכון</p>
                  <p className="staff-card__hint">{room.players.length} בחדר{room.guests ? ` · ${room.guests} אורחים` : ""}</p>
                  {room.players.filter((p) => p.stuck).length > 0 && (
                    <p className="staff-card__hint">תקועים (30 שנ׳ בלי תשובה): {room.players.filter((p) => p.stuck).map((p) => p.name).join(", ")}</p>
                  )}
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
