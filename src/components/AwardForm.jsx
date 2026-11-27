import { useState } from "react";
import { staffGiveAward } from "../services/learnApi";

/**
 * 2026-11-27 (Shir: idea #10): the teacher's prize - a badge, coins for the island and one personal
 * sentence. For one child ({childId}) or the whole class ({classId}).
 */
const EMOJI = ["⭐", "🏆", "💪", "🎉", "🧠", "❤️"];
const COINS = [0, 5, 10, 20];

export default function AwardForm({ childId, classId, who, onGiven }) {
  const [emoji, setEmoji] = useState("⭐");
  const [coins, setCoins] = useState(10);
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function give() {
    setBusy(true);
    try {
      const r = await staffGiveAward({ ...(childId ? { childId } : { classId }), emoji, coins, message });
      const skipped = r.skipped?.length ? ` (בלי ${r.skipped.join(", ")} - כבר קיבלו 3 היום)` : "";
      setMsg(r.given === 0 ? "לא נשלח - כבר קיבלו 3 פרסים היום" : `${emoji} הפרס נשלח${classId ? ` ל-${r.given} ילדים` : ""}!${skipped}`);
      setErr("");
      setMessage("");
      onGiven?.();
    } catch (e) {
      setErr(e.message);
      setMsg("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-card award-form">
      <h2>🏆 פרס {classId ? "לכל הכיתה" : `ל${who}`}</h2>
      <p className="staff-card__hint">
        {who ? `${who} יראה/תראה אותו בכניסה הבאה` : "כל ילד בכיתה יראה אותו בכניסה הבאה"}. המטבעות נכנסים לאי.
      </p>
      <div className="award-form__row" aria-label="סמל">
        {EMOJI.map((e) => (
          <button key={e} className={`award-form__pick${emoji === e ? " is-on" : ""}`} onClick={() => setEmoji(e)} aria-pressed={emoji === e}>
            {e}
          </button>
        ))}
      </div>
      <div className="award-form__row" aria-label="מטבעות">
        {COINS.map((c) => (
          <button key={c} className={`award-form__pick${coins === c ? " is-on" : ""}`} onClick={() => setCoins(c)} aria-pressed={coins === c}>
            {c === 0 ? "בלי" : `🪙 ${c}`}
          </button>
        ))}
      </div>
      <input
        className="admin__input award-form__msg"
        value={message}
        maxLength={140}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="משפט אישי (למשל: כל הכבוד על ההתמדה!)"
        aria-label="משפט אישי"
      />
      <button className="admin__btn" disabled={busy || (!message.trim() && coins === 0)} onClick={give}>
        {busy ? "שולחים..." : "🎁 שליחת הפרס"}
      </button>
      {msg && <p className="admin__message" role="status">{msg}</p>}
      {err && <p className="form-error">{err}</p>}
    </section>
  );
}
