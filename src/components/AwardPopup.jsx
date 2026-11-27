import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { sfx } from "../game/audio";
import { markAwardsSeen, myNewAwards } from "../services/learnApi";

/**
 * 2026-11-27 (Shir: idea #10): a prize from the teacher pops up once on the child's home / map screens
 * (never in the middle of a round). "תודה!" marks it seen on the server.
 */
const WHERE = ["/", "/topics", "/island", "/sea"];

export default function AwardPopup() {
  const { profile } = useProfile();
  const { pathname } = useLocation();
  const [awards, setAwards] = useState([]);
  const kid = Boolean(profile && !profile.teacher && !profile.admin);
  const here = WHERE.includes(pathname);
  const id = profile?.id;

  useEffect(() => {
    if (!kid || !here || !id) return undefined;
    let alive = true;
    myNewAwards(id)
      .then((a) => {
        if (!alive || !a?.length) return;
        setAwards(a);
        sfx.star();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [kid, here, id]);

  if (!kid || !here || awards.length === 0) return null;
  const coins = awards.reduce((s, a) => s + (a.coins || 0), 0);

  async function thanks() {
    setAwards([]);
    try {
      await markAwardsSeen(id);
    } catch {
      /* it shows again next time - fine */
    }
  }

  return (
    <div className="award-pop" role="dialog" aria-modal="true" aria-label="פרס מהמורה">
      <div className="award-pop__card">
        <div className="award-pop__emoji" aria-hidden="true">{awards.map((a) => a.emoji).join(" ")}</div>
        <h2>קיבלת פרס!</h2>
        {awards.map((a) => (
          <p key={a.id} className="award-pop__line">
            {a.message ? `״${a.message}״` : "כל הכבוד!"}{" "}
            <span className="award-pop__from">- {a.from}{a.wholeClass ? " (לכל הכיתה)" : ""}</span>
          </p>
        ))}
        {coins > 0 && <p className="award-pop__coins">🪙 +{coins} מטבעות לאי שלך</p>}
        <button className="admin__btn award-pop__ok" onClick={thanks} autoFocus>
          תודה! 💙
        </button>
      </div>
    </div>
  );
}
