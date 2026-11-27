import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { getBadges } from "../services/learnApi";
import "../styles/pages/collection.css";

/**
 * 2026-11-27 (Shir: idea #6): "האוסף שלי" - the child's badges (earned bright, locked greyed with how
 * far they are) and a line about what they built on their islands (seen in full on "האי שלי").
 */
export default function CollectionPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!profile?.id) return undefined;
    let alive = true;
    getBadges(profile.id).then((d) => alive && setData(d)).catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [profile?.id]);

  if (!profile || (profile.teacher || profile.admin)) return null;

  return (
    <div className="app-shell collection">
      <header className="collection__top">
        <button className="play__exit" onClick={() => navigate(-1)} aria-label="חזרה">✕</button>
        <h1>🏅 האוסף שלי</h1>
      </header>

      {err && <p className="form-error">{err}</p>}
      {!data && !err && <p className="play__loading">טוען...</p>}

      {data && (
        <>
          <p className="collection__count">אספת <b>{data.earned}</b> מתוך {data.total} תגים</p>
          <div className="collection__grid">
            {data.badges.map((b) => (
              <div key={b.key} className={`badge${b.earned ? " is-earned" : " is-locked"}`} title={b.name}>
                <span className="badge__emoji" aria-hidden="true">{b.earned ? b.emoji : "🔒"}</span>
                <span className="badge__name">{b.name}</span>
                {!b.earned && (
                  <span className="badge__bar" aria-label={`${b.have} מתוך ${b.need}`}>
                    <span className="badge__fill" style={{ width: `${Math.round((100 * b.have) / b.need)}%` }} />
                    <span className="badge__nums">{b.have}/{b.need}</span>
                  </span>
                )}
              </div>
            ))}
          </div>

          <section className="collection__album">
            <h2>🏝️ מה שבניתי</h2>
            <p>
              {data.album.length > 0
                ? `בנית ${data.album.length} דברים באיים שלך.`
                : "עוד לא בנית כלום באי - כל כוכב נותן מטבע לבנייה!"}
            </p>
            <button className="admin__btn" onClick={() => navigate("/my-island")}>לאי שלי ←</button>
          </section>
        </>
      )}
    </div>
  );
}
