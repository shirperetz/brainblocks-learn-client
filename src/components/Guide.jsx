import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useProfile } from "../context/profileStore";
import { findTarget, guideFor, markGuideSeen, seenGuides } from "../data/guide";
import { readAloudDefault } from "../game/readAloud";
import { sayUrl, sfx, stopVoice } from "../game/audio";
import { speakUrl } from "../services/learnApi";
import Dolphin from "./Dolphin";
import "../styles/components/guide.css";

/**
 * The kids' guide (2026-11-19, Shir chose א׳+ב׳): a first-visit tour on every screen, led by the site's
 * own dolphin (the same frames, nothing redrawn), and a "?" tab on the side that lists what is on the
 * screen - tap a line to light that thing up, or replay the tour. Steps live in data/guide.js.
 */
const spoken = (t) => t.replace(/[\p{Extended_Pictographic}️]/gu, "").replace(/"/g, "").trim();

function say(text) {
  speakUrl(spoken(text)).then((u) => u && sayUrl(u));
}

export default function Guide() {
  const { pathname } = useLocation();
  const { profile } = useProfile();
  const guide = guideFor(pathname, profile);
  if (!guide) return null;
  // A new screen = a fresh guide (closed drawer, no tour from the last screen).
  return <ScreenGuide key={pathname} guide={guide} profile={profile} />;
}

function ScreenGuide({ guide, profile }) {
  const [tour, setTour] = useState(null); // { steps: [...found steps], i }
  const [drawer, setDrawer] = useState(false);
  const [flash, setFlash] = useState(null); // an element lit from the "?" list
  const voice = readAloudDefault(profile?.grade);

  // Steps whose element is on the screen now (a step that never appears is skipped).
  const liveSteps = useCallback(
    () => guide.steps.filter((s) => s.center || findTarget(s.target)),
    [guide],
  );

  const start = useCallback(() => {
    const steps = liveSteps();
    if (!steps.length) return;
    setDrawer(false);
    setTour({ steps, i: 0 });
  }, [liveSteps]);

  // First visit to this screen -> start the tour once the screen has settled.
  useEffect(() => {
    if (!profile?.id || seenGuides(profile.id).has(guide.key)) return undefined;
    const t = setTimeout(start, 1200);
    return () => { clearTimeout(t); stopVoice(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function end() {
    if (profile?.id) markGuideSeen(profile.id, guide.key);
    stopVoice();
    setTour(null);
  }

  const step = tour ? tour.steps[tour.i] : null;
  useEffect(() => {
    if (step && voice) say(`${step.title}. ${step.text}`);
  }, [step, voice]);

  return (
    <>
      {!tour && (
        <button type="button" className="guide-tab" onClick={() => { sfx.tap?.(); setDrawer((d) => !d); }}
          aria-expanded={drawer} aria-label="מה יש במסך הזה?">?</button>
      )}
      {drawer && (
        <Drawer guide={guide} onClose={() => setDrawer(false)} onTour={start}
          onShow={(s) => { setDrawer(false); setFlash(s); if (voice) say(`${s.title}. ${s.text}`); }} />
      )}
      {tour && step && (
        <Spot step={step} key={tour.i}>
          <Card step={step} index={tour.i} count={tour.steps.length}
            onNext={() => (tour.i + 1 < tour.steps.length ? setTour({ ...tour, i: tour.i + 1 }) : end())}
            onBack={tour.i > 0 ? () => setTour({ ...tour, i: tour.i - 1 }) : null}
            onSkip={end} onSay={() => say(`${step.title}. ${step.text}`)} />
        </Spot>
      )}
      {flash && !tour && (
        <Spot step={flash} key={flash.title} onDismiss={() => setFlash(null)}>
          <Card step={flash} onNext={() => setFlash(null)} nextLabel="הבנתי" onSay={() => say(`${flash.title}. ${flash.text}`)} />
        </Spot>
      )}
    </>
  );
}

/** Darkens the screen except the step's element, and places the card next to it. */
function Spot({ step, children, onDismiss }) {
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);
  const [cardTop, setCardTop] = useState(null);

  useLayoutEffect(() => {
    if (step.center) return undefined;
    const el = findTarget(step.target);
    if (!el) return undefined;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const t = setInterval(measure, 250); // follows the smooth scroll and layout changes
    window.addEventListener("resize", measure);
    return () => { clearInterval(t); window.removeEventListener("resize", measure); };
  }, [step]);

  // Card under the element if it fits, else above it; in the middle for a whole-screen step.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const h = card.offsetHeight;
    const vh = window.innerHeight;
    if (!rect) { setCardTop(Math.max(16, (vh - h) / 2)); return; }
    const below = rect.top + rect.height + 14;
    const above = rect.top - h - 14;
    setCardTop(below + h < vh - 8 ? below : above > 8 ? above : Math.max(8, vh - h - 8));
  }, [rect]);

  const pad = 8;
  return createPortal(
    <div className="guide" role="dialog" aria-modal="true" aria-label={step.title}>
      {rect ? (
        <div className="guide__spot" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      ) : (
        <div className="guide__dim" />
      )}
      <div className="guide__catch" onClick={onDismiss} />
      <div ref={cardRef} className="guide__card" style={{ top: cardTop ?? -9999 }}>{children}</div>
    </div>,
    document.body,
  );
}

function Card({ step, index = null, count = 0, onNext, onBack = null, onSkip = null, onSay, nextLabel }) {
  const last = index !== null && index + 1 >= count;
  return (
    <div className="guide__inner">
      <div className="guide__dolphin" aria-hidden="true">
        <Dolphin play={index === 0 || index === null ? "wave" : "smile"} playKey={index ?? 0} label="" />
      </div>
      <div className="guide__body">
        <b className="guide__title">{step.title}</b>
        <p className="guide__text">{step.text}</p>
        <div className="guide__nav">
          {onSkip && !last ? <button type="button" className="guide__link" onClick={onSkip}>דלג</button> : <span />}
          <button type="button" className="guide__link" onClick={onSay} aria-label="להקריא">🔊</button>
          {count > 1 && <span className="guide__dots" aria-label={`${index + 1} מתוך ${count}`}>{index + 1}/{count}</span>}
          {onBack && <button type="button" className="guide__link" onClick={onBack}>‹ הקודם</button>}
          <button type="button" className="guide__go" onClick={onNext} autoFocus>
            {nextLabel || (last ? "סיימנו! 👍" : "הבא ›")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "?" on the side: everything on this screen, one line each. */
function Drawer({ guide, onClose, onTour, onShow }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return createPortal(
    <div className="guide-drawer" role="dialog" aria-label={`מה יש ב${guide.name}?`}>
      <div className="guide-drawer__back" onClick={onClose} />
      <aside className="guide-drawer__panel">
        <div className="guide-drawer__head">
          <div className="guide-drawer__dolphin" aria-hidden="true"><Dolphin label="" /></div>
          <div>
            <b>מה יש כאן?</b>
            <span>{guide.name}</span>
          </div>
          <button type="button" className="guide-drawer__x" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
        <button type="button" className="guide-drawer__tour" onClick={onTour}>📖 להראות לי את הסיור שוב</button>
        <ul className="guide-drawer__list">
          {guide.steps.map((s) => {
            const here = s.center || !!findTarget(s.target);
            return (
              <li key={s.title}>
                <button type="button" disabled={!here} onClick={() => onShow(s)}>
                  <b>{s.title}</b>
                  <span>{s.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>,
    document.body,
  );
}
