import { useState } from "react";
import BigButton from "./BigButton";
import Mascot from "./Mascot";
import { loginWithCode, loginWithPasskey, passkeysSupported } from "../services/passkey";

/**
 * 2026-11-14 (Shir: "another password or my fingerprint"): after the admin's right password on the public
 * site - her fingerprint / face / PIN on a device she added, or one of her one-time backup codes (a new
 * phone). The ticket lasts 5 minutes; after that she starts again with the password.
 */
export default function AdminSecondStep({ step, onDone, onRestart }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canKey = step.passkeys?.length > 0 && passkeysSupported();

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      onDone(await fn());
    } catch (e) {
      setBusy(false);
      // the person closed the fingerprint window / no key on this device
      setError(e?.name === "NotAllowedError" ? "האימות בוטל או שאין במכשיר הזה טביעת אצבע רשומה. אפשר קוד גיבוי." : e.message);
    }
  }

  return (
    <div className="app-shell">
      <div className="onboarding">
        <div className="onboarding__header">
          <Mascot dolphin size="md" message="עוד צעד אחד" />
          <h1 className="screen-title">🔐 אימות מנהלת</h1>
          <p className="screen-subtitle">הסיסמה נכונה. עכשיו מוודאים שזו באמת את.</p>
        </div>

        {canKey && (
          <div className="onboarding__actions">
            <BigButton variant="green" onClick={() => run(() => loginWithPasskey(step))} disabled={busy}>
              {busy ? "רגע..." : "👆 טביעת אצבע / פנים"}
            </BigButton>
          </div>
        )}

        <div className="account-box">
          <div className="name-field">
            <label htmlFor="backup-code">{canKey ? "או קוד גיבוי" : "קוד גיבוי"} (נשארו {step.codesLeft})</label>
            <input
              id="backup-code"
              type="text"
              value={code}
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              placeholder="XXXX-XXXX-XXXX"
              dir="ltr"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && code.length >= 12 && run(() => loginWithCode(step, code))}
            />
          </div>
          <p className="screen-subtitle">כל קוד עובד פעם אחת בלבד.</p>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="onboarding__actions">
          <BigButton variant={canKey ? "blue" : "green"} onClick={() => run(() => loginWithCode(step, code))}
            disabled={busy || code.replace(/[^A-Z0-9]/gi, "").length < 12}>
            כניסה עם קוד
          </BigButton>
        </div>
        <button className="text-link login-switch" onClick={onRestart}>
          ← חזרה לסיסמה
        </button>
      </div>
    </div>
  );
}
