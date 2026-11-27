import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { sfx } from "../game/audio";
import { markBadgesSeen, newBadges } from "../services/learnApi";

/**
 * 2026-11-27 (Shir: idea #6): a new badge pops up once, on the home / map screens only (never mid-round),
 * and never over the dolphin's tour or a teacher's prize. "יש!" marks it seen on the server.
 */
const WHERE = ["/", "/topics", "/island", "/sea"];

export default function BadgePopup() {
  const { profile } = useProfile();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const kid = Boolean(profile && !profile.teacher && !profile.admin);
  const here = WHERE.includes(pathname);
  const id = profile?.id;
  const [blocked, setBlocked] = useState(true);

  useEffect(() => {
    const check = () => setBlocked(Boolean(document.querySelector(".guide, .award-pop")));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!kid || !here || !id) return undefined;
    let alive = true;
    newBadges(id)
      .then((a) => {
        if (alive && a?.length) setBadges(a);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [kid, here, id]);

  useEffect(() => {
    if (badges.length > 0 && !blocked) sfx.star();
  }, [badges.length, blocked]);

  if (!kid || !here || badges.length === 0 || blocked) return null;

  async function done(go) {
    setBadges([]);
    try {
      await markBadgesSeen(id);
    } catch {
      /* shown again next time - fine */
    }
    if (go) navigate("/collection");
  }

  return (
    <div className="award-pop" role="dialog" aria-modal="true" aria-label="תג חדש">
      <div className="award-pop__card">
        <div className="award-pop__emoji" aria-hidden="true">{badges.map((b) => b.emoji).join(" ")}</div>
        <h2>{badges.length > 1 ? "תגים חדשים!" : "תג חדש!"}</h2>
        {badges.map((b) => <p key={b.key} className="award-pop__line">{b.emoji} {b.name}</p>)}
        <div className="award-pop__row">
          <button className="admin__btn" onClick={() => done(true)}>לאוסף שלי</button>
          <button className="admin__btn admin__btn--ghost" onClick={() => done(false)}>יש! 🎉</button>
        </div>
      </div>
    </div>
  );
}
