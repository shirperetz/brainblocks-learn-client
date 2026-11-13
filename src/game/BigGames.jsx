import PickRound from "./PickRound";
import { fmt } from "./levelsBig";

/** 🏰 אי המספרים הגדולים (2026-11-13): base-ten blocks, the number line, bigger/smaller and rounding. */

/** Thousands (big cubes), hundreds (flats), tens (rods), ones (small cubes) - left to right. */
export function Blocks({ b, small = false, labels = false }) {
  const group = (n, cls, name) =>
    n > 0 && (
      <span className={`blocks__group blocks__group--${cls}`}>
        <span className="blocks__row">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className={`block block--${cls}`} />
          ))}
        </span>
        {labels && <small className="blocks__label">{n} {name}</small>}
      </span>
    );
  return (
    <div className={`blocks${small ? " blocks--small" : ""}`} dir="ltr" aria-hidden="true">
      {group(b.th ?? 0, "th", "אלפים")}
      {group(b.h, "h", "מאות")}
      {group(b.t, "t", "עשרות")}
      {group(b.o, "o", "אחדות")}
    </div>
  );
}

function PvArt({ round, hint }) {
  if (round.mode === "digit") {
    const s = String(round.value);
    return (
      <div className="big-art">
        <p className="big-art__num" dir="ltr">
          {[...s].map((d, i) => (
            <span key={i} className={i === round.pos ? "is-marked" : ""}>
              {d}
            </span>
          ))}
        </p>
        <p className="big-art__q">כמה שווה הספרה הצבועה?</p>
        {hint && <p className="big-art__tip">אחדות, עשרות, מאות, אלפים - סופרים מימין את המקום של הספרה.</p>}
      </div>
    );
  }
  if (round.mode === "build")
    return (
      <div className="big-art">
        <p className="big-art__num" dir="ltr">{fmt(round.value)}</p>
        <p className="big-art__q">איזה ציור מראה את המספר?</p>
      </div>
    );
  return (
    <div className="big-art">
      <Blocks b={round.blocks} labels={hint} />
      <p className="big-art__q">איזה מספר זה?</p>
      {hint && <p className="big-art__tip">עשר עשרות הן מאה אחת. סופרים קודם את הגדולים.</p>}
    </div>
  );
}

const OptBlocks = ({ v, round }) => <Blocks b={round.look[v]} small />;

export function PlaceValueRound(props) {
  const r = props.round;
  const labels = r.mode === "build" ? undefined : Object.fromEntries(r.options.map((v) => [v, fmt(v)]));
  return <PickRound {...props} round={labels ? { ...r, labels } : r} Art={PvArt} Opt={r.mode === "build" ? OptBlocks : undefined} />;
}

function LineArt({ round, hint, solved }) {
  const W = 340;
  const x0 = 20;
  const x1 = W - 20;
  const X = (v) => x0 + ((v - round.from) / (round.to - round.from)) * (x1 - x0);
  const ticks = [];
  for (let v = round.from; v <= round.to; v += round.tick) ticks.push(v);
  return (
    <div className="big-art">
      <svg viewBox={`0 0 ${W} 96`} className="num-line" aria-hidden="true">
        <line x1={x0} y1="60" x2={x1} y2="60" className="num-line__axis" />
        {ticks.map((v, i) => (
          <g key={v}>
            <line x1={X(v)} y1={i % 2 && ticks.length > 12 ? 54 : 50} x2={X(v)} y2="66" className="num-line__tick" />
            {(round.marks.includes(v) || (hint && !round.estimate)) && (
              <text x={X(v)} y="84" className={`num-line__label${round.marks.includes(v) ? "" : " is-hint"}`}>
                {fmt(v)}
              </text>
            )}
          </g>
        ))}
        <g transform={`translate(${X(round.at)} 0)`}>
          <path d="M-9 18 H9 L0 40 Z" className="num-line__arrow" />
          {solved && (
            <text y="12" className="num-line__answer">
              {fmt(round.answer)}
            </text>
          )}
        </g>
      </svg>
      <p className="big-art__q">{round.estimate ? "בערך איזה מספר מסמן החץ?" : "איזה מספר מסמן החץ?"}</p>
      {hint && round.estimate && <p className="big-art__tip">החץ קרוב לאמצע? להתחלה? לסוף? מחפשים את המספר שמתאים למקום.</p>}
    </div>
  );
}

export function LineRound(props) {
  const r = props.round;
  return <PickRound {...props} round={{ ...r, labels: Object.fromEntries(r.options.map((v) => [v, fmt(v)])) }} Art={LineArt} />;
}

function BiggerArt({ round, hint, solved }) {
  if (round.mode === "sign")
    return (
      <div className="big-art">
        <p className="big-art__num big-art__num--sign" dir="ltr">
          {fmt(round.a)} <span className="big-art__box">{solved ? round.answer : "?"}</span> {fmt(round.b)}
        </p>
        <p className="big-art__q">איזה סימן מתאים?</p>
        {hint && <p className="big-art__tip">משווים ספרה-ספרה משמאל. הפה של הסימן פתוח לצד של הגדול.</p>}
      </div>
    );
  if (round.mode === "round10" || round.mode === "round100")
    return (
      <div className="big-art">
        <p className="big-art__num" dir="ltr">{fmt(round.n)}</p>
        <p className="big-art__q">{round.to === 10 ? "מה המספר מעוגל לעשרות?" : "מה המספר מעוגל למאות?"}</p>
        {hint && (
          <p className="big-art__tip" dir="ltr">
            {fmt(Math.floor(round.n / round.to) * round.to)} ← {fmt(round.n)} → {fmt(Math.floor(round.n / round.to) * round.to + round.to)}
          </p>
        )}
      </div>
    );
  return (
    <div className="big-art">
      <p className="big-art__q big-art__q--big">{round.mode === "max" ? "איזה מספר הכי גדול?" : "איזה מספר הכי קטן?"}</p>
      {hint && <p className="big-art__tip">קודם מסתכלים על הספרה הראשונה משמאל - היא הכי חשובה.</p>}
    </div>
  );
}

export function BiggerRound(props) {
  const r = props.round;
  const labels = r.mode === "sign" ? undefined : Object.fromEntries(r.options.map((v) => [v, fmt(v)]));
  return <PickRound {...props} round={labels ? { ...r, labels } : r} Art={BiggerArt} />;
}
