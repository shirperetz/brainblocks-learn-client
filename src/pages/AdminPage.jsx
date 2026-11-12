import { useCallback, useEffect, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { getGrade } from "../data/grades";
import { getCharacter } from "../data/characters";
import * as learnApi from "../services/learnApi";
import "../styles/pages/admin.css";

// 2026-11-11: Shir's admin screen - every child, reset a password (or give an old profile a
// username), block / unblock, and the join code. The server checks the admin flag on every call;
// hiding this screen from children is only for convenience. Nothing here deletes anything.
export default function AdminPage() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const [children, setChildren] = useState([]);
  const [code, setCode] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // { id, username, password, needsUsername }
  const [filter, setFilter] = useState("");

  const load = useCallback(
    () =>
      Promise.all([learnApi.adminChildren(), learnApi.adminJoinCode()])
        .then(([list, jc]) => {
          setChildren(list);
          setCode(jc.code);
          setCodeDraft(jc.code);
        })
        .catch((e) => setError(e.message)),
    [],
  );

  useEffect(() => {
    if (!profile?.admin) return undefined;
    let alive = true;
    Promise.all([learnApi.adminChildren(), learnApi.adminJoinCode()])
      .then(([list, jc]) => {
        if (!alive) return;
        setChildren(list);
        setCode(jc.code);
        setCodeDraft(jc.code);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [profile]);

  if (loading) return null;
  // 2026-11-11: the admin link (/admin) - not logged in yet: log in first, then come back here.
  if (!profile) return <Navigate to="/login" replace state={{ next: "/admin" }} />;
  if (!profile.admin) return <Navigate to="/" replace />;

  function done(text) {
    setMessage(text);
    setError("");
    load();
  }

  async function saveCode() {
    try {
      const r = await learnApi.adminChangeJoinCode(codeDraft);
      done(r.code ? "קוד ההצטרפות עודכן" : "ההרשמה סגורה (אין קוד)");
    } catch (e) {
      setError(e.message);
    }
  }

  async function savePassword() {
    try {
      await learnApi.adminSetPassword(editing.id, { username: editing.username || undefined, password: editing.password });
      setEditing(null);
      done("הסיסמה עודכנה. הילד צריך להיכנס מחדש בכל מכשיר");
    } catch (e) {
      setError(e.message);
    }
  }

  async function approve(c) {
    try {
      await learnApi.adminApprove(c.id);
      done(`${c.name} אושר/ה ויכול/ה להיכנס`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleBlock(c) {
    const request = !c.approved && !c.disabled; // a sign-up waiting: "not approved", not "blocked"
    const verb = request ? "לא לאשר את הבקשה של" : c.disabled ? "לבטל את החסימה של" : "לחסום את";
    if (!window.confirm(`${verb} ${c.name}${c.username ? ` (${c.username})` : ""}?`)) return;
    try {
      await learnApi.adminSetDisabled(c.id, !c.disabled);
      done(request ? "הבקשה לא אושרה (אפשר לשנות בכל רגע)" : c.disabled ? "החסימה בוטלה" : "המשתמש נחסם (אפשר לבטל בכל רגע)");
    } catch (e) {
      setError(e.message);
    }
  }

  const waiting = children.filter((c) => !c.approved && !c.disabled);
  const shown = children.filter((c) =>
    !filter || `${c.name} ${c.username ?? ""}`.toLowerCase().includes(filter.trim().toLowerCase()));
  const withUser = children.filter((c) => c.username).length;

  return (
    <div className="app-shell admin">
      <button className="back-button" onClick={() => navigate("/")}>
        ← חזרה
      </button>
      <h1 className="screen-title">ניהול</h1>
      <DolphinPerch />
      <p className="screen-subtitle">
        {children.length} פרופילים · {withUser} עם שם משתמש
      </p>

      {message && <p className="admin__message" role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {waiting.length > 0 && (
        <section className="admin__card admin__card--waiting">
          <h2>ממתינים לאישור ({waiting.length})</h2>
          <p className="admin__hint">בקשות הרשמה - ילדים ומורים. רק אחרי אישור שלך הם יכולים להיכנס.</p>
          <ul className="admin__list">
            {waiting.map((c) => (
              <li key={c.id} className="admin__child">
                <div className="admin__who">
                  <span className="admin__emoji" aria-hidden="true">{getCharacter(c.avatar).emoji}</span>
                  <div>
                    <strong>{c.name}</strong>
                    {c.teacher && <span className="admin__tag">👩‍🏫 מורה</span>}
                    <div className="admin__meta">
                      @{c.username} · {c.teacher ? "מורה" : getGrade(c.grade)?.label ?? "בלי כיתה"} · נרשם/ה{" "}
                      {c.createdAt ? new Date(c.createdAt).toLocaleString("he-IL") : ""}
                    </div>
                  </div>
                </div>
                <div className="admin__actions">
                  <button className="admin__btn" onClick={() => approve(c)}>✓ אישור</button>
                  <button className="admin__btn admin__btn--ghost" onClick={() => toggleBlock(c)}>✕ לא לאשר</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="admin__card">
        <h2>קוד הצטרפות</h2>
        <p className="admin__hint">ילד חדש צריך את הקוד כדי להירשם. ריק = ההרשמה סגורה.</p>
        <div className="admin__row">
          <input
            className="admin__input"
            type={showCode ? "text" : "password"}
            value={codeDraft}
            maxLength={20}
            onChange={(e) => setCodeDraft(e.target.value)}
            aria-label="קוד הצטרפות"
          />
          <button className="admin__btn admin__btn--ghost" onClick={() => setShowCode((v) => !v)}>
            {showCode ? "הסתר" : "הצג"}
          </button>
          <button className="admin__btn" onClick={saveCode} disabled={codeDraft === code}>
            שמירה
          </button>
        </div>
      </section>

      <section className="admin__card">
        <h2>ילדים</h2>
        <input
          className="admin__input admin__search"
          placeholder="חיפוש לפי שם או שם משתמש"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <ul className="admin__list">
          {shown.map((c) => (
            <li key={c.id} className={`admin__child${c.disabled ? " is-disabled" : ""}`}>
              <div className="admin__who">
                <span className="admin__emoji" aria-hidden="true">{getCharacter(c.avatar).emoji}</span>
                <div>
                  <strong>{c.name}</strong>
                  {c.admin && <span className="admin__tag">מנהלת</span>}
                  {c.disabled && <span className="admin__tag admin__tag--off">חסום</span>}
                  {c.teacher && <span className="admin__tag">👩‍🏫 מורה</span>}
                  {/* 2026-11-12 (Shir: "how do I approve - there's no button"; "not 'block' - a request waiting") */}
                  {!c.approved && !c.disabled && <span className="admin__tag admin__tag--wait">🕓 בקשת הרשמה - מחכה לאישור</span>}
                  <div className="admin__meta">
                    {c.username ? `@${c.username}` : "בלי שם משתמש"} · {c.teacher ? "מורה" : `${getGrade(c.grade)?.label ?? "בלי כיתה"} · ${c.totalPoints} נק׳ · ${c.sessions} משחקים · ${c.openMistakes} טעויות פתוחות`}
                  </div>
                  <div className="admin__meta">
                    שיחק לאחרונה: {c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleString("he-IL") : "—"}
                  </div>
                </div>
              </div>
              <div className="admin__actions">
                <button className="admin__btn admin__btn--ghost"
                  onClick={() => setEditing({ id: c.id, username: c.username ? "" : "", password: "", needsUsername: !c.username, name: c.name })}>
                  {c.username ? "סיסמה חדשה" : "לתת שם משתמש"}
                </button>
                {!c.approved && !c.disabled ? (
                  <>
                    <button className="admin__btn" onClick={() => approve(c)}>✓ אישור</button>
                    <button className="admin__btn admin__btn--ghost" onClick={() => toggleBlock(c)}>✕ לא לאשר</button>
                  </>
                ) : !c.admin && (
                  <button className="admin__btn admin__btn--ghost" onClick={() => toggleBlock(c)}>
                    {c.disabled ? "ביטול חסימה" : "חסימה"}
                  </button>
                )}
              </div>
              {editing?.id === c.id && (
                <div className="admin__edit">
                  {editing.needsUsername && (
                    <input className="admin__input" placeholder="שם משתמש (3–20 אותיות/ספרות)" value={editing.username}
                      onChange={(e) => setEditing({ ...editing, username: e.target.value.replace(/\s/g, "") })} />
                  )}
                  <input className="admin__input" placeholder="סיסמה חדשה (לפחות 4)" value={editing.password}
                    onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
                  <div className="admin__row">
                    <button className="admin__btn" onClick={savePassword}
                      disabled={editing.password.length < 4 || (editing.needsUsername && editing.username.length < 3)}>
                      שמירה
                    </button>
                    <button className="admin__btn admin__btn--ghost" onClick={() => setEditing(null)}>ביטול</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
