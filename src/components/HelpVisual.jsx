/**
 * 2026-11-13 (Shir chose free explanations): a small drawing of the question inside "לא הבנתי" - the
 * question's own numbers only; the child does the last step. kinds: line, blocks, groups, share, fraction.
 */
const INK = "#3a2fa8", SOFT = "#c9c0ff", DOT = "#ff9f43", GREEN = "#2fbf55";

function NumberLine({ start, jump, sign }) {
  const from = sign === "+" ? start : start - jump;
  const to = sign === "+" ? start + jump : start;
  const n = to - from;
  const W = 320, pad = 20, step = (W - pad * 2) / Math.max(n, 1);
  const x = (v) => pad + (v - from) * step;
  const dir = sign === "+" ? 1 : -1;
  const arcs = [];
  for (let k = 0; k < jump; k++) {
    const a = x(start + dir * k), b = x(start + dir * (k + 1));
    arcs.push(<path key={k} d={`M${a},50 Q${(a + b) / 2},${22} ${b},50`} fill="none" stroke={GREEN} strokeWidth="2.5" />);
  }
  return (
    <svg viewBox={`0 0 ${W} 80`} className="help-visual__svg" role="img" aria-label={`קופצים ${jump} קפיצות מ-${start}`}>
      <line x1={pad - 8} y1="50" x2={W - pad + 8} y2="50" stroke={INK} strokeWidth="2" />
      {Array.from({ length: n + 1 }, (_, i) => from + i).map((v) => (
        <g key={v}>
          <line x1={x(v)} y1="45" x2={x(v)} y2="55" stroke={INK} strokeWidth="2" />
          {(n <= 12 || v === start) && (
            <text x={x(v)} y="72" textAnchor="middle" fontSize="12" fontWeight={v === start ? 900 : 600} fill={v === start ? DOT : INK}>{v}</text>
          )}
        </g>
      ))}
      <circle cx={x(start)} cy="50" r="6" fill={DOT} />
      {arcs}
    </svg>
  );
}

function Blocks({ numbers, sign }) {
  const parts = numbers.map((v) => ({ v, h: Math.floor(v / 100), t: Math.floor((v % 100) / 10), o: v % 10 }));
  return (
    <div className="help-visual__blocks" dir="ltr">
      {parts.map((p, i) => (
        <div key={i} className="help-visual__num-wrap">
          {i > 0 && <span className="help-visual__sign">{sign}</span>}
          <div className="help-visual__num">
            <b>{p.v}</b>
            <div className="help-visual__pieces" aria-label={`${p.h ? `${p.h} מאות, ` : ""}${p.t} עשרות ו-${p.o} אחדות`}>
              {Array.from({ length: p.h }, (_, k) => <span key={`h${k}`} className="hv-hundred" />)}
              {Array.from({ length: p.t }, (_, k) => <span key={`t${k}`} className="hv-ten" />)}
              {Array.from({ length: p.o }, (_, k) => <span key={`o${k}`} className="hv-one" />)}
            </div>
            <small dir="rtl">{p.h ? `${p.h} מאות · ` : ""}{p.t} עשרות · {p.o} אחדות</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function Groups({ groups, each }) {
  return (
    <div className="help-visual__groups" aria-label={`${groups} קבוצות, בכל אחת ${each}`}>
      {Array.from({ length: groups }, (_, g) => (
        <span key={g} className="hv-group">
          {Array.from({ length: each }, (_, k) => <span key={k} className="hv-dot" />)}
        </span>
      ))}
      <small className="help-visual__caption">{groups} קבוצות, בכל קבוצה {each}</small>
    </div>
  );
}

function Share({ total, groups }) {
  return (
    <div className="help-visual__groups" aria-label={`${total} לחלק ל-${groups} קבוצות שוות`}>
      <span className="hv-pile">{Array.from({ length: total }, (_, k) => <span key={k} className="hv-dot" />)}</span>
      <span className="hv-arrow" aria-hidden="true">⬇</span>
      <span className="hv-plates">{Array.from({ length: groups }, (_, g) => <span key={g} className="hv-plate" />)}</span>
      <small className="help-visual__caption">מחלקים {total} ל-{groups} צלחות שוות, אחד-אחד בכל סיבוב</small>
    </div>
  );
}

function Fraction({ parts, whole }) {
  const r = 46, c = 50;
  const slice = (i) => {
    const a0 = (i / whole) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / whole) * 2 * Math.PI - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`;
  };
  return (
    <div className="help-visual__groups">
      <svg viewBox="0 0 100 100" className="help-visual__pie" role="img" aria-label={`עיגול מחולק ל-${whole} חלקים שווים, ${parts} צבועים`}>
        {Array.from({ length: whole }, (_, i) => (
          <path key={i} d={slice(i)} fill={i < parts ? DOT : "#fff"} stroke={INK} strokeWidth="1.5" />
        ))}
      </svg>
      <small className="help-visual__caption">חילקנו ל-{whole} חלקים שווים (למטה), וצבענו {parts} (למעלה)</small>
    </div>
  );
}

export default function HelpVisual({ visual }) {
  if (!visual) return null;
  let body = null;
  if (visual.kind === "line") body = <NumberLine {...visual} />;
  else if (visual.kind === "blocks") body = <Blocks {...visual} />;
  else if (visual.kind === "groups") body = <Groups {...visual} />;
  else if (visual.kind === "share") body = <Share {...visual} />;
  else if (visual.kind === "fraction") body = <Fraction {...visual} />;
  if (!body) return null;
  return <div className="help-visual" style={{ "--soft": SOFT }}>{body}</div>;
}
