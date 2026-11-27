import { useNavigate } from "react-router-dom";
import BigButton from "../components/BigButton";
import Mascot from "../components/Mascot";
import GuestIntro from "../components/GuestIntro";
import { lastUsername, useProfile } from "../context/profileStore";
import { startsOnIsland } from "../game/games";
import "../styles/pages/landing.css";
import "../styles/pages/legal.css";

// Screen 1 — the warm welcome. One clear action: start playing.
export default function LandingPage() {
  const navigate = useNavigate();
  const { hasProfile, profile, loading, logout } = useProfile();

  function handleStart() {
    // Returning child jumps straight in; a new child starts with the grade (then the character).
    // 2026-11-12: someone new is first asked "a child or a teacher?" (/who), then the child goes on to the grade.
    navigate(hasProfile ? (startsOnIsland(profile?.grade) ? "/island" : "/topics") : "/who");
  }

  return (
    <div className="landing">
      <div className="landing__sky" aria-hidden="true">
        <span className="landing__floaty landing__floaty--1">7</span>
        <span className="landing__floaty landing__floaty--2">⭐</span>
        <span className="landing__floaty landing__floaty--3">5</span>
        <span className="landing__floaty landing__floaty--4">➕</span>
        <span className="landing__floaty landing__floaty--5">🌟</span>
        <span className="landing__floaty landing__floaty--6">3</span>
      </div>

      <div className="landing__content">
        <Mascot dolphin size="lg" message="שלום! בואו נלמד יחד" />

        <h1 className="screen-title landing__title">ברוכים הבאים לעולם החשבון</h1>
        <p className="screen-subtitle">לומדים חשבון בכיף, במשחקים ובשלבים</p>

        {/* 2026-11-11 children's accounts: a new child signs up, a returning one logs in;
            on a device where a child is already logged in - continue, or switch child. */}
        <div className="landing__actions">
          {hasProfile ? (
            <>
              {profile.teacher ? (
                <BigButton variant="green" onClick={() => navigate("/staff")}>
                  {`📊 הכיתות שלי, ${profile.name}`}
                </BigButton>
              ) : (
                <>
                  <BigButton variant="green" onClick={handleStart} disabled={loading}>
                    {`להמשיך לשחק, ${profile.name}`}
                  </BigButton>
                  {/* 2026-11-12 (Shir: "children inside the site type the code the teacher shows on the
                      board and join her game") - right on the home screen. */}
                  <BigButton variant="blue" onClick={() => navigate("/room")}>
                    🎮 יש לי קוד מהמורה - להיכנס למשחק
                  </BigButton>
                  <BigButton variant="ghost" onClick={() => navigate("/collection")}>
                    🏅 האוסף שלי
                  </BigButton>
                  <BigButton variant="ghost" onClick={() => navigate("/mistakes-island")}>
                    🧹 אי הטעויות
                  </BigButton>
                  <BigButton variant="blue" onClick={() => navigate("/my-island")}>
                    🏝️ האי שלי
                  </BigButton>
                  {/* 2026-11-13: joining a teacher's class with an account she already has */}
                  <BigButton variant="ghost" onClick={() => navigate("/join-class")}>
                    🏫 הצטרפות לכיתה עם קוד
                  </BigButton>
                  <BigButton variant="ghost" onClick={() => navigate("/settings")}>
                    ⚙️ הגדרות
                  </BigButton>
                </>
              )}
              {/* 2026-11-12 (Shir: "I still don't see where to open a room"): right on the home screen. */}
              {(profile.admin || profile.teacher) && (
                <BigButton variant="green" onClick={() => navigate("/staff/room/new")}>
                  🎮 פתיחת חדר משחק
                </BigButton>
              )}
              {profile.admin && (
                <>
                  <BigButton variant="blue" onClick={() => navigate("/staff")}>
                    📊 התקדמות הילדים
                  </BigButton>
                  <BigButton variant="ghost" onClick={() => navigate("/admin")}>
                    ⚙️ ניהול
                  </BigButton>
                </>
              )}
              <BigButton variant="ghost" onClick={async () => { await logout(); navigate("/login"); }}>
                🚪 התנתקות
              </BigButton>
            </>
          ) : lastUsername() ? (
            // 2026-11-12: this device already had a login (logged out after 30 minutes) - log in first.
            // "אני חדש/ה" starts a whole new child (grade -> character -> exercises): the small option.
            <>
              <BigButton variant="green" onClick={() => navigate("/login")} disabled={loading}>
                {`כניסה - ${lastUsername()}`}
              </BigButton>
              <BigButton variant="ghost" onClick={handleStart} disabled={loading}>
                אני ילד/ה חדש/ה
              </BigButton>
            </>
          ) : (
            <>
              <BigButton variant="green" onClick={handleStart} disabled={loading}>
                אני חדש/ה - בואו נתחיל
              </BigButton>
              <BigButton variant="ghost" onClick={() => navigate("/login")} disabled={loading}>
                כבר יש לי משתמש - כניסה
              </BigButton>
            </>
          )}
        </div>

        <button className="text-link landing__parents" onClick={() => navigate("/parent")}>
          להורים ולמורים
        </button>
        {!hasProfile && !loading && <GuestIntro />}
        {/* 2026-11-14 (privacy / accessibility, before going public) */}
        <nav className="site-footer" aria-label="מידע על האתר">
          <a href="/privacy">מדיניות פרטיות</a>
          <a href="/accessibility">הצהרת נגישות</a>
          <a href="/contact?kind=other">צור קשר</a>
          <a href="/contact?kind=problem&from=/">🐞 דיווח על בעיה</a>
        </nav>
      </div>
    </div>
  );
}
