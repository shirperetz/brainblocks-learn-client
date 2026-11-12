import { useCallback, useEffect, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { getCharacter } from "../data/characters";
import { GRADES, getGrade } from "../data/grades";
import { TREND, columnsFor, levelOf, timeAgo, topicInfo } from "../data/progress";
import * as api from "../services/learnApi";
import { Legend } from "./ChildReportPage";
import StaffWeeklyTasks from "../components/StaffWeeklyTasks";
import ClassBuilding from "../components/ClassBuilding";
import "../styles/pages/staff.css";

// 2026-11-11 (Shir: "teachers look at their students, I look at mine, and I oversee everything"):
// the teachers' / admin's home. A teacher sees only her classes (the server enforces it); the admin
// also sees "בלי כיתה" (her own children), every class and the teachers. Nothing is deleted here.
export default function StaffPage() {
  const navigate = useNavigate();
  const { profile, loading, resetProfile } = useProfile();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("all"); // "all" | classId | 0 (no class, admin)
  const [overview, setOverview] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherCode, setTeacherCode] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isStaff = Boolean(profile && (profile.admin || profile.teacher));
  const isAdmin = Boolean(profile?.admin);
  const classId = tab === "all" ? undefined : tab;

  const [reload, setReload] = useState(0);
  const load = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    if (!isStaff) return undefined;
    let alive = true;
    fetchAll(classId, isAdmin)
      .then((d) => {
        if (!alive) return;
        setMe(d.me);
        setOverview(d.overview);
        // 2026-11-12: on a class tab - only that class's waiting children (it showed every class's).
        setWaiting(d.kids.filter((k) => !k.approved && !k.disabled && (classId == null || (k.classId ?? 0) === classId)));
        setTeachers(d.teachers);
        setTeacherCode(d.teacherCode);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [isStaff, classId, isAdmin, reload]);

  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace state={{ next: "/staff" }} />;
  if (!isStaff) return <Navigate to="/" replace />;

  async function act(fn, text) {
    try {
      await fn();
      setMessage(text);
      setError("");
      load();
    } catch (e) {
      setError(e.message);
      setMessage("");
    }
  }

  const rows = overview?.children ?? [];
  const approvedRows = rows.filter((r) => !waiting.some((w) => w.id === r.child.id));
  const cols = columnsFor(approvedRows);
  const attention = approvedRows.filter((r) => r.attention.length > 0);
  const classes = me?.classes ?? [];
  const waitingTeachers = teachers.filter((t) => !t.approved && !t.disabled);

  return (
    <div className="app-shell staff">
      <div className="staff__top">
        <button className="back-button" onClick={() => navigate("/")}>← בית</button>
        {isAdmin && (
          <button className="text-link" onClick={() => navigate("/admin")}>⚙️ חשבונות וקוד הצטרפות</button>
        )}
      </div>
      <h1 className="screen-title">{isAdmin ? "כל הילדים" : "הכיתות שלי"}</h1>
      <DolphinPerch />
      {/* 2026-11-12: the live game room */}
      <button className="admin__btn staff__room-btn" onClick={() => navigate("/staff/room/new")}>🎮 פתיחת חדר משחק</button>
      <p className="screen-subtitle">
        שלום {profile.name} · {approvedRows.length} ילדים{classes.length ? ` · ${classes.length} כיתות` : ""}
      </p>

      {message && <p className="admin__message" role="status">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      {/* ---- tabs ---- */}
      <nav className="tabs" aria-label="כיתות">
        <button className={tab === "all" ? "is-on" : ""} onClick={() => setTab("all")}>הכל</button>
        {classes.map((c) => (
          <button key={c.id} className={tab === c.id ? "is-on" : ""} onClick={() => setTab(c.id)}>
            {c.name}
            {c.waiting > 0 && <span className="tabs__badge">{c.waiting}</span>}
          </button>
        ))}
        {isAdmin && (
          <button className={tab === 0 ? "is-on" : ""} onClick={() => setTab(0)}>בלי כיתה</button>
        )}
      </nav>

      {/* ---- waiting children ---- */}
      {waiting.length > 0 && (
        <section className="staff-card staff-card--waiting">
          <h2>⏳ ממתינים לאישור ({waiting.length})</h2>
          <p className="staff-card__hint">נרשמו עם קוד של כיתה. רק אחרי אישור הם יכולים להיכנס.</p>
          <ul className="people">
            {waiting.map((c) => (
              <li key={c.id} className="person">
                <span className="person__avatar" aria-hidden="true">{getCharacter(c.avatar).emoji}</span>
                <div className="person__who">
                  <strong>{c.name}</strong>
                  <small>
                    @{c.username} · {getGrade(c.grade)?.label ?? "—"} · {className(classes, c.classId)}
                  </small>
                </div>
                <div className="person__actions">
                  <button className="admin__btn" onClick={() => act(() => api.staffApprove(c.id), `${c.name} אושר/ה`)}>
                    ✓ אישור
                  </button>
                  <button
                    className="admin__btn admin__btn--ghost"
                    onClick={() =>
                      window.confirm(`לחסום את ${c.name}? (אפשר לבטל בכל רגע)`) &&
                      act(() => api.staffSetDisabled(c.id, true), "נחסם/ה")
                    }
                  >
                    ✗ לא מכירה
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- the weekly task of the class on the tab (idea #5) ---- */}
      {typeof tab === "number" && tab !== 0 && classes.find((c) => c.id === tab) && (
        <>
          <ClassBuilding key={`b${tab}`} classId={tab} />
          <StaffWeeklyTasks key={tab} cls={classes.find((c) => c.id === tab)} />
        </>
      )}
      {typeof tab !== "number" && classes.length > 0 && (
        <p className="staff-card__hint">📅 למשימה שבועית - בחרי כיתה למעלה.</p>
      )}

      {/* ---- needs attention ---- */}
      {attention.length > 0 && (
        <section className="staff-card staff-card--attention">
          <h2>⚠️ צריך תשומת לב</h2>
          <ul className="people">
            {attention.map((r) => (
              <li key={r.child.id} className="person person--link" onClick={() => navigate(`/staff/child/${r.child.id}`)}>
                <span className="person__avatar" aria-hidden="true">{getCharacter(r.child.avatar).emoji}</span>
                <div className="person__who">
                  <strong>{r.child.name}</strong>
                  <small>{r.attention.join(" · ")}</small>
                </div>
                <span className="person__go" aria-hidden="true">←</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- common difficulties ---- */}
      {overview?.commonHard?.length > 0 && (
        <section className="staff-card">
          <h2>👥 קשיים משותפים</h2>
          <p className="staff-card__hint">מיומנויות שכמה ילדים מתקשים בהן - אולי כדאי לעבור עליהן בכיתה.</p>
          <ul className="chips">
            {overview.commonHard.map((h) => (
              <li key={h.skill} className="chip lvl-hard">
                {h.name} <b>{h.children} ילדים</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- 2026-11-12 stage 2/B: the same kind of mistake in several children ---- */}
      {overview?.commonMistakes?.length > 0 && (
        <section className="staff-card">
          <h2>🔍 טעויות שחוזרות בכיתה</h2>
          <p className="staff-card__hint">אותה טעות אצל כמה ילדים - אפשר להסביר אותה לכולם יחד.</p>
          <ul className="pattern-list">
            {overview.commonMistakes.map((m) => (
              <li key={m.type} className="pattern">
                <div className="pattern__top">
                  <strong className="pattern__label">{m.label}</strong>
                  <span className="pattern__count">{m.children} ילדים</span>
                </div>
                <p className="pattern__tip">💡 {m.tip}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- the class table ---- */}
      <section className="staff-card">
        <h2>📋 מפת הכיתה</h2>
        <Legend />
        {!overview ? (
          <p className="staff__loading">טוען...</p>
        ) : approvedRows.length === 0 ? (
          <p className="staff-card__empty">
            {classes.length === 0 && !isAdmin
              ? "פתחי כיתה למטה ושלחי להורים את קוד הכיתה."
              : "עוד אין ילדים כאן."}
          </p>
        ) : (
          <div className="heat-wrap">
            <table className="heat">
              <thead>
                <tr>
                  <th scope="col">ילד/ה</th>
                  {cols.map((k) => (
                    <th key={k} scope="col" title={topicInfo(k).name}>
                      <span aria-hidden="true">{topicInfo(k).emoji}</span>
                      <span className="heat__col-name">{topicInfo(k).name}</span>
                    </th>
                  ))}
                  <th scope="col">השבוע</th>
                </tr>
              </thead>
              <tbody>
                {approvedRows.map((r) => {
                  const trend = TREND[r.trendDirection] ?? TREND.UNKNOWN;
                  return (
                    <tr key={r.child.id} onClick={() => navigate(`/staff/child/${r.child.id}`)}>
                      <th scope="row">
                        <span aria-hidden="true">{getCharacter(r.child.avatar).emoji}</span> {r.child.name}
                        <small>{timeAgo(r.child.lastActiveAt)}</small>
                      </th>
                      {cols.map((k) => {
                        const t = r.topics[k];
                        const lvl = levelOf(t?.level);
                        return (
                          <td key={k} className={`heat__cell ${lvl.className}`} title={`${topicInfo(k).name}: ${lvl.long}`}>
                            {t && t.level !== "NONE" ? (t.level === "NEW" ? "🌱" : `${t.pct}%`) : ""}
                          </td>
                        );
                      })}
                      <td className="heat__week">
                        {r.week.minutes} דק׳ <span title={trend.label}>{trend.emoji}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---- classes ---- */}
      <section className="staff-card">
        <h2>🏫 {isAdmin ? "כל הכיתות" : "הכיתות שלי"}</h2>
        <p className="staff-card__hint">
          לכל כיתה קוד משלה. ילד שנרשם עם הקוד מגיע אלייך לאישור. סגירה עוצרת הרשמות חדשות (הילדים נשארים).
        </p>
        <ul className="classes">
          {classes.map((c) => (
            <li key={c.id} className={`class-row${c.closed ? " is-closed" : ""}`}>
              <div>
                <strong>{c.name}</strong>
                <small>
                  {c.children} ילדים{isAdmin && c.teacherName ? ` · ${c.teacherName}` : ""}
                  {c.closed ? " · סגורה להרשמה" : ""}
                </small>
              </div>
              <code className="class-row__code" title="קוד הכיתה">{c.joinCode}</code>
              {/* 2026-11-12: the class's grade - every child in it practices only this grade (locked) */}
              <select
                className="class-row__grade"
                value={c.grade ?? ""}
                aria-label={`הכיתה שמתרגלים ב${c.name}`}
                onChange={(e) => {
                  const g = e.target.value;
                  const label = GRADES.find((x) => x.key === g)?.label;
                  if (window.confirm(g ? `כל הילדים ב${c.name} יתרגלו רק ${label}. להמשיך?` : `לבטל את הנעילה של ${c.name}?`)) {
                    act(() => api.staffUpdateClass(c.id, { grade: g }), g ? `${c.name}: כולם מתרגלים ${label} 🔒` : "הנעילה בוטלה");
                  }
                }}
              >
                <option value="">🎓 כיתה: חופשי</option>
                {GRADES.map((g) => (
                  <option key={g.key} value={g.key}>🔒 {g.label}</option>
                ))}
              </select>
              <div className="person__actions">
                <button className="admin__btn admin__btn--ghost"
                  onClick={() => window.confirm("קוד חדש? הקוד הישן יפסיק לעבוד") &&
                    act(() => api.staffUpdateClass(c.id, { newCode: true }), "נוצר קוד חדש")}>
                  קוד חדש
                </button>
                <button className="admin__btn admin__btn--ghost"
                  onClick={() => act(() => api.staffUpdateClass(c.id, { closed: !c.closed }), c.closed ? "הכיתה פתוחה להרשמה" : "הכיתה נסגרה להרשמה")}>
                  {c.closed ? "פתיחה" : "סגירה"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="admin__row">
          <input className="admin__input" placeholder="שם כיתה חדשה (למשל ה׳2)" maxLength={30} value={newClass}
            onChange={(e) => setNewClass(e.target.value)} />
          <select className="class-row__grade" value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)}
            aria-label="איזו כיתה מתרגלים">
            <option value="">כיתה: חופשי</option>
            {GRADES.map((g) => (
              <option key={g.key} value={g.key}>🔒 {g.label}</option>
            ))}
          </select>
          <button className="admin__btn" disabled={!newClass.trim()}
            onClick={() => act(async () => {
              await api.staffCreateClass(newClass.trim(), undefined, newClassGrade || undefined);
              setNewClass("");
              setNewClassGrade("");
            }, "הכיתה נפתחה")}>
            + כיתה חדשה
          </button>
        </div>
      </section>

      {/* ---- admin: teachers ---- */}
      {isAdmin && (
        <section className="staff-card">
          <h2>👩‍🏫 מורים</h2>
          <p className="staff-card__hint">מורה נרשמת ב&quot;אני חדש/ה&quot; ← &quot;אני מורה&quot;, ונכנסת רק אחרי אישור שלך.</p>
          <TeacherCode key={teacherCode} code={teacherCode} onSave={(c) => act(() => api.staffChangeTeacherCode(c), c ? "קוד המורים עודכן" : "הרשמת מורים סגורה")} />
          {waitingTeachers.length > 0 && (
            <p className="staff-card__hint">🕓 {waitingTeachers.length} בקשות הרשמה מחכות לאישור שלך (למעלה ברשימה)</p>
          )}
          <ul className="people">
            {[...waitingTeachers, ...teachers.filter((t) => !waitingTeachers.includes(t))].map((t) => (
              <li key={t.id} className={`person${t.disabled ? " is-off" : ""}`}>
                <span className="person__avatar" aria-hidden="true">👩‍🏫</span>
                <div className="person__who">
                  <strong>
                    {t.name}
                    {/* 2026-11-12 (Shir: "don't write 'block' - say there's a request waiting for approval") */}
                    {!t.approved && !t.disabled && <span className="admin__tag admin__tag--wait">🕓 בקשת הרשמה - מחכה לאישור</span>}
                    {t.disabled && <span className="admin__tag admin__tag--off">חסומה</span>}
                  </strong>
                  <small>@{t.username} · {t.classes.length ? t.classes.join(", ") : "אין כיתות"} · {timeAgo(t.lastActiveAt)}</small>
                </div>
                <div className="person__actions">
                  {!t.approved && !t.disabled && (
                    <button className="admin__btn" onClick={() => act(() => api.staffApproveTeacher(t.id), `${t.name} אושרה`)}>✓ אישור</button>
                  )}
                  {!t.approved && !t.disabled ? (
                    <button className="admin__btn admin__btn--ghost"
                      onClick={() => window.confirm(`לא לאשר את הבקשה של ${t.name}? (אפשר לשנות אחר כך)`) &&
                        act(() => api.staffSetTeacherDisabled(t.id, true), "הבקשה לא אושרה")}>
                      ✕ לא לאשר
                    </button>
                  ) : (
                    <button className="admin__btn admin__btn--ghost"
                      onClick={() => window.confirm(`${t.disabled ? "לבטל חסימה של" : "לחסום את"} ${t.name}?`) &&
                        act(() => api.staffSetTeacherDisabled(t.id, !t.disabled), t.disabled ? "החסימה בוטלה" : "נחסמה")}>
                      {t.disabled ? "ביטול חסימה" : "חסימה"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {teachers.length === 0 && <p className="staff-card__empty">עוד אין מורים.</p>}
        </section>
      )}

      <button className="text-link staff__logout" onClick={() => { resetProfile(); navigate("/login"); }}>
        יציאה מהמשתמש
      </button>
    </div>
  );
}

async function fetchAll(classId, isAdmin) {
  const [me, overview, kids] = await Promise.all([api.staffMe(), api.staffOverview(classId), api.staffChildren()]);
  const [teachers, tc] = isAdmin ? await Promise.all([api.staffTeachers(), api.staffTeacherCode()]) : [[], { code: "" }];
  return { me, overview, kids, teachers, teacherCode: tc.code };
}

function className(classes, id) {
  return classes.find((c) => c.id === id)?.name ?? "בלי כיתה";
}

function TeacherCode({ code, onSave }) {
  // Remounted with key={code} when the saved code changes, so the draft starts from it.
  const [draft, setDraft] = useState(code);
  const [show, setShow] = useState(false);
  return (
    <div className="admin__row">
      <input className="admin__input" type={show ? "text" : "password"} value={draft} maxLength={20}
        placeholder="קוד מורים (6-20 אותיות/ספרות)" onChange={(e) => setDraft(e.target.value)} aria-label="קוד מורים" />
      <button className="admin__btn admin__btn--ghost" onClick={() => setShow((v) => !v)}>{show ? "הסתר" : "הצג"}</button>
      <button className="admin__btn" disabled={draft === code} onClick={() => onSave(draft)}>שמירה</button>
    </div>
  );
}
