/* eslint-disable react-refresh/only-export-components -- ask()/askText() are helpers that open the dialog */
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles/components/dialog.css";

/*
 * 2026-11-13 (Shir: "it's ugly like this - design it, and everything else that looks like this"): the
 * browser's grey confirm()/prompt() boxes (with the site's address on top) replaced by the site's own
 * window. await ask("...") -> true/false; await askText("...", "25") -> the text, or null on cancel.
 */
let host = null;

function mount(render) {
  if (!host) {
    host = document.createElement("div");
    host.id = "bb-dialog-root";
    document.body.appendChild(host);
  }
  const box = document.createElement("div");
  host.appendChild(box);
  const root = createRoot(box);
  return new Promise((resolve) => {
    const done = (v) => {
      root.unmount();
      box.remove();
      resolve(v);
    };
    root.render(render(done));
  });
}

const DANGER = /למחוק|מחיקה|לחסום|אי אפשר לבטל|לסיים|לצאת/;

function Dialog({ message, input, value, inputMode, secret, okText, cancelText, danger, done }) {
  const [text, setText] = useState(value ?? "");
  const okRef = useRef(null);
  const inRef = useRef(null);
  useEffect(() => {
    (input ? inRef.current : okRef.current)?.focus();
    const key = (e) => {
      if (e.key === "Escape") done(input ? null : false);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [input, done]);
  const [title, ...rest] = String(message).split("\n");
  const body = rest.join("\n").trim();
  const ok = () => done(input ? text : true);
  return (
    <div className="bb-dialog" role="presentation" onPointerDown={(e) => e.target === e.currentTarget && done(input ? null : false)}>
      <div className="bb-dialog__card" role="dialog" aria-modal="true" aria-labelledby="bb-dialog-title" dir="rtl">
        <span className={`bb-dialog__icon${danger ? " is-danger" : ""}`} aria-hidden="true">{danger ? "⚠️" : input ? "✏️" : "❓"}</span>
        <h2 id="bb-dialog-title" className="bb-dialog__title">{title}</h2>
        {body && <p className="bb-dialog__body">{body}</p>}
        {input && (
          <input ref={inRef} className="bb-dialog__input" value={text} inputMode={inputMode} type={secret ? "password" : "text"} dir="auto"
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ok()} aria-label={title} />
        )}
        <div className="bb-dialog__actions">
          <button ref={okRef} type="button" className={`bb-dialog__btn bb-dialog__btn--ok${danger ? " is-danger" : ""}`} onClick={ok}>
            {okText}
          </button>
          {cancelText && (
            <button type="button" className="bb-dialog__btn bb-dialog__btn--cancel" onClick={() => done(input ? null : false)}>
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Yes / no. Resolves true on "אישור". */
export function ask(message, { okText, danger } = {}) {
  const d = danger ?? DANGER.test(message);
  return mount((done) => (
    <Dialog message={message} okText={okText ?? (d ? "כן, להמשיך" : "אישור")} cancelText="ביטול" danger={d} done={done} />
  ));
}

/** A short answer. Resolves the text, or null on "ביטול". */
export function askText(message, value = "", { inputMode = "text", okText = "שמירה", secret = false } = {}) {
  return mount((done) => (
    <Dialog message={message} input value={String(value ?? "")} inputMode={inputMode} secret={secret} okText={okText} cancelText="ביטול" done={done} />
  ));
}
