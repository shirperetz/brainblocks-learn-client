import { useEffect } from "react";
import { createPortal } from "react-dom";
import MathText from "./MathText";
import { getTopic } from "../data/topics";
import "../styles/components/worksheet.css";

/**
 * 2026-11-27 (Shir: idea #11): "מה ללמד מחר" as a printable worksheet - the exercises the class got
 * wrong this week, with space to solve, and the answers on a separate page for the teacher.
 * Printed with the browser (also "save as PDF"); nothing is sent anywhere.
 */
export default function Worksheet({ focus, className, onDone }) {
  useEffect(() => {
    const done = () => onDone?.();
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [onDone]);

  const parts = focus.filter((f) => f.examples?.length);
  const date = new Date().toLocaleDateString("he-IL");
  let n = 0;

  return createPortal(
    <div className="ws" dir="rtl">
      <header className="ws__head">
        <h1>דף עבודה{className ? ` · ${className}` : ""}</h1>
        <p>עולם החשבון · {date}</p>
        <p className="ws__name">שם: ______________________</p>
      </header>
      {parts.map((f) => (
        <section key={f.skill} className="ws__part">
          <h2>{getTopic(f.topic)?.emoji ?? ""} {f.name}</h2>
          {f.mistake?.tip && f.mistake.name !== "-" && <p className="ws__tip">💡 {f.mistake.tip}</p>}
          <ol className="ws__list" start={n + 1}>
            {f.examples.map((e) => {
              n++;
              return (
                <li key={e.text}>
                  <span className="ws__q"><MathText text={e.text} /></span>
                  <span className="ws__line" aria-hidden="true" />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <section className="ws__answers">
        <h2>פתרונות (למורה)</h2>
        <ol>
          {parts.flatMap((f) => f.examples).map((e) => (
            <li key={e.text}><MathText text={e.text} /> → <b>{e.right}</b></li>
          ))}
        </ol>
      </section>
    </div>,
    document.body,
  );
}
