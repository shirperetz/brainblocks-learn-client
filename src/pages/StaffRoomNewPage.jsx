import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { GRADES } from "../data/grades";
import { TOPICS, isTopicAllowedForGrade } from "../data/topics";
import { topicLabel } from "../data/room";
import * as api from "../services/learnApi";
import "../styles/pages/staff.css";
import "../styles/pages/room.css";

// 2026-11-12 (Shir: "the teacher opens a room... picks the topics... can add her own exercises, saved"):
// open a live game room for a class - topics of its grade + "התרגילים שלי", how long - and the bank of
// her own exercises (never deleted, can be switched off).
export default function StaffRoomNewPage() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [grade, setGrade] = useState("G4");
  const [topics, setTopics] = useState([]);
  const [minutes, setMinutes] = useState(5);
  const [bank, setBank] = useState([]);
  const [draft, setDraft] = useState({ text: "", correct: "", wrong1: "", wrong2: "", wrong3: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [reload, setReload] = useState(0);
  // 2026-11-22: coins for the island (#5), two groups (#9), save this room (#10), saved rooms
  const [coins, setCoins] = useState(true);
  const [teams, setTeams] = useState(false);
  const [save, setSave] = useState(false);
  const [saved, setSaved] = useState([]);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const isStaff = Boolean(profile && (profile.admin || profile.teacher));

  useEffect(() => {
    if (!isStaff) return undefined;
    let alive = true;
    Promise.all([api.staffMe(), api.myQuestions(), api.roomTemplates().catch(() => [])])
      .then(([me, qs, ts]) => {
        if (!alive) return;
        setClasses(me.classes ?? []);
        setBank(qs);
        setSaved(ts);
        setClassId((c) => c || String(me.classes?.[0]?.id ?? ""));
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [isStaff, reload]);

  // 2026-11-22 (Shir: "warm it up when the teacher enters"): the first questions after an update were slow -
  // the server makes one question of each topic in the background while she is choosing.
  useEffect(() => {
    if (isStaff) api.roomWarmup(profile?.grade).catch(() => {});
  }, [isStaff, profile?.grade]);

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace state={{ next: "/staff" }} />;
  if (!isStaff) return <Navigate to="/" replace />;

  const cls = classes.find((c) => String(c.id) === String(classId));
  const roomGrade = cls?.grade ?? grade;
  const options = TOPICS.filter((t) => isTopicAllowedForGrade(t.key, roomGrade));
  const activeBank = bank.filter((q) => !q.off);
  const toggle = (key) => setTopics((ts) => (ts.includes(key) ? ts.filter((t) => t !== key) : [...ts, key]));

  async function open() {
    try {
      if (save) {
        const name = `${topics.map((t) => (t === "MY" ? "התרגילים שלי" : topicLabel(t))).join(" + ")} · ${minutes} דק׳`;
        await api.saveRoomTemplate({ name: name.slice(0, 40), classId: classId || 0, grade: cls?.grade ? undefined : grade, topics, minutes, coins, teams });
      }
      const r = await api.roomCreate({ classId: classId || 0, topics, minutes, grade: cls?.grade ? undefined : grade, coins, teams });
      navigate(`/staff/room/${r.id}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function add() {
    try {
      await api.addMyQuestion(draft);
      setDraft({ text: "", correct: "", wrong1: "", wrong2: "", wrong3: "" });
      setMsg("התרגיל נשמר");
      setError("");
      refresh();
    } catch (e) {
      setError(e.message);
      setMsg("");
    }
  }

  return (
    <div className="app-shell staff">
      <div className="staff__top">
        <button className="back-button" onClick={() => navigate("/staff")}>← לכיתות</button>
      </div>
      <h1 className="screen-title">🎮 פתיחת חדר משחק</h1>
      <p className="screen-subtitle">הילדים נכנסים עם קוד, ואת רואה בזמן אמת מי מוביל</p>
      {error && <p className="form-error">{error}</p>}

      {saved.length > 0 && (
        <section className="staff-card">
          <h2>📋 החדרים השמורים שלי</h2>
          <ul className="room-bank">
            {saved.map((t) => (
              <li key={t.id}>
                <div>
                  <strong>{t.name}</strong>
                  <small>
                    {classes.find((c) => c.id === t.classId)?.name ?? "בלי כיתה"}
                    {t.coins ? " · 🪙 מטבעות" : ""}{t.teams ? " · 👥 קבוצות" : ""}
                  </small>
                </div>
                <div className="room-saved__actions">
                  <button className="admin__btn" onClick={() => api.openRoomTemplate(t.id).then((r) => navigate(`/staff/room/${r.id}`)).catch((e) => setError(e.message))}>
                    לפתוח שוב
                  </button>
                  <button className="admin__btn admin__btn--ghost" aria-label={`למחוק את ${t.name}`} onClick={() => api.deleteRoomTemplate(t.id).then(refresh)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="staff-card">
        <h2>1 · לאיזו כיתה</h2>
        <div className="admin__row">
          <select className="class-row__grade" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="כיתה">
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="">בלי כיתה (כל מי שנכנס - באישור שלך)</option>
          </select>
          {!cls?.grade && (
            <select className="class-row__grade" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="רמת השאלות">
              {GRADES.map((g) => (
                <option key={g.key} value={g.key}>שאלות של {g.label}</option>
              ))}
            </select>
          )}
        </div>
        <p className="staff-card__hint">ילדים מהכיתה נכנסים ישר. ילדים אחרים ואורחים (בלי משתמש) מחכים לאישור שלך.</p>
      </section>

      <section className="staff-card">
        <h2>2 · נושאים</h2>
        <div className="room-topics">
          {options.map((t) => (
            <label key={t.key} className={`room-topic${topics.includes(t.key) ? " is-on" : ""}`}>
              <input type="checkbox" checked={topics.includes(t.key)} onChange={() => toggle(t.key)} />
              <span aria-hidden="true">{t.emoji}</span> {t.name}
            </label>
          ))}
          <label className={`room-topic${topics.includes("MY") ? " is-on" : ""}${activeBank.length === 0 ? " is-disabled" : ""}`}>
            <input type="checkbox" checked={topics.includes("MY")} disabled={activeBank.length === 0} onChange={() => toggle("MY")} />
            <span aria-hidden="true">📚</span> התרגילים שלי ({activeBank.length})
          </label>
        </div>
      </section>

      <section className="staff-card">
        <h2>3 · כמה זמן</h2>
        <div className="room-topics">
          {[3, 5, 10, 15].map((m) => (
            <label key={m} className={`room-topic${minutes === m ? " is-on" : ""}`}>
              <input type="radio" name="minutes" checked={minutes === m} onChange={() => setMinutes(m)} /> {m} דקות
            </label>
          ))}
        </div>
        <h2 className="room-options__title">4 · איך משחקים</h2>
        <div className="room-topics">
          <label className={`room-topic${coins ? " is-on" : ""}`}>
            <input type="checkbox" checked={coins} onChange={() => setCoins(!coins)} /> 🪙 מטבעות לאי (5 לכל אחד, 15 למקומות 1–3)
          </label>
          <label className={`room-topic${teams ? " is-on" : ""}`}>
            <input type="checkbox" checked={teams} onChange={() => setTeams(!teams)} /> 👥 שתי קבוצות מאוזנות
          </label>
          <label className={`room-topic${save ? " is-on" : ""}`}>
            <input type="checkbox" checked={save} onChange={() => setSave(!save)} /> 📋 לשמור את החדר לפעם הבאה
          </label>
        </div>
        <button className="admin__btn room-open" disabled={topics.length === 0} onClick={open}>
          🎮 פתיחת החדר
        </button>
      </section>

      <section className="staff-card">
        <h2>📚 התרגילים שלי</h2>
        <p className="staff-card__hint">תרגילים שאת כותבת - נשמרים, ואפשר לבחור אותם כנושא בחדר. תשובה שהיא מספר: אפשר בלי תשובות שגויות (נוסיף לבד).</p>
        {msg && <p className="admin__message" role="status">{msg}</p>}
        <div className="room-bank-form">
          <label>השאלה<input className="admin__input" maxLength={160} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder="כמה רגליים לשלוש חתולות?" /></label>
          <label>התשובה הנכונה<input className="admin__input" maxLength={40} value={draft.correct} onChange={(e) => setDraft({ ...draft, correct: e.target.value })} placeholder="12" /></label>
          <label>תשובה שגויה 1<input className="admin__input" maxLength={40} value={draft.wrong1} onChange={(e) => setDraft({ ...draft, wrong1: e.target.value })} /></label>
          <label>תשובה שגויה 2<input className="admin__input" maxLength={40} value={draft.wrong2} onChange={(e) => setDraft({ ...draft, wrong2: e.target.value })} /></label>
          <label>תשובה שגויה 3<input className="admin__input" maxLength={40} value={draft.wrong3} onChange={(e) => setDraft({ ...draft, wrong3: e.target.value })} /></label>
          <button className="admin__btn" disabled={!draft.text.trim() || !draft.correct.trim()} onClick={add}>+ הוספת תרגיל</button>
        </div>
        <ul className="room-bank">
          {bank.map((q) => (
            <li key={q.id} className={q.off ? "is-off" : ""}>
              <div>
                <strong>{q.text}</strong>
                <small>✓ {q.correct}{q.wrong.length ? ` · ✕ ${q.wrong.join(", ")}` : ""}</small>
              </div>
              <button className="admin__btn admin__btn--ghost" onClick={() => api.setMyQuestionOff(q.id, !q.off).then(refresh)}>
                {q.off ? "החזרה" : "כיבוי"}
              </button>
            </li>
          ))}
        </ul>
        {bank.length === 0 && <p className="staff-card__empty">עוד אין תרגילים שלך.</p>}
      </section>
    </div>
  );
}
