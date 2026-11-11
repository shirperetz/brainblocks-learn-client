import "../styles/components/question-picture.css";

/**
 * The picture of a fraction / geometry question (2026-11-11), drawn from the server's VisualModel:
 * FRACTION_PIE / FRACTION_BAR (a of b parts coloured), RECT / SQUARE (sides a, b in cm),
 * TRIANGLE (two angles a°, b°), RIGHT_TRIANGLE (base a, height b), POLYGON (a sides).
 * Other visual types (the emoji pictures of the help) are not drawn here.
 */
export default function QuestionPicture({ visual }) {
  if (!visual?.type) return null;
  const { type, a, b } = visual;
  const shape = SHAPES[type];
  if (!shape) return null;
  return (
    <figure className="q-picture" aria-label={LABELS[type]?.(a, b) ?? "ציור"}>
      <svg viewBox="0 0 220 180" role="img" aria-hidden="true">
        {shape(a, b)}
      </svg>
    </figure>
  );
}

const LABELS = {
  FRACTION_PIE: (a, b) => `עיגול מחולק ל-${b} חלקים, ${a} צבועים`,
  FRACTION_BAR: (a, b) => `מלבן מחולק ל-${b} חלקים, ${a} צבועים`,
  RECT: (a, b) => `מלבן ${a} על ${b}`,
  SQUARE: (a) => `ריבוע שצלעו ${a}`,
  TRIANGLE: (a, b) => `משולש עם זוויות ${a} ו-${b} מעלות`,
  RIGHT_TRIANGLE: (a, b) => `משולש ישר-זווית, בסיס ${a} גובה ${b}`,
  POLYGON: () => "צורה",
};

const FILL = "var(--orange)";
const EMPTY = "#fff";
const LINE = "var(--ink)";

function pie(a, b) {
  const cx = 110, cy = 90, r = 78;
  return Array.from({ length: b }, (_, i) => {
    const s = (i / b) * 2 * Math.PI - Math.PI / 2;
    const e = ((i + 1) / b) * 2 * Math.PI - Math.PI / 2;
    const large = e - s > Math.PI ? 1 : 0;
    const d = `M${cx},${cy} L${cx + r * Math.cos(s)},${cy + r * Math.sin(s)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(e)},${cy + r * Math.sin(e)} Z`;
    return <path key={i} d={d} fill={i < a ? FILL : EMPTY} stroke={LINE} strokeWidth="2.5" />;
  });
}

function bar(a, b) {
  const w = 200 / b;
  return Array.from({ length: b }, (_, i) => (
    <rect key={i} x={10 + i * w} y={55} width={w} height={70} fill={i < a ? FILL : EMPTY} stroke={LINE} strokeWidth="2.5" />
  ));
}

/** A rectangle scaled to fit, its sides labelled in cm. */
function rect(a, b) {
  const scale = Math.min(170 / a, 120 / b);
  const w = a * scale, h = b * scale;
  const x = (220 - w) / 2, y = (170 - h) / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill="var(--card-2)" stroke={LINE} strokeWidth="3" rx="2" />
      <text x={110} y={y + h + 18} className="q-picture__label">{a} ס״מ</text>
      <text x={x - 6} y={y + h / 2} className="q-picture__label" textAnchor="end" dominantBaseline="middle">{b} ס״מ</text>
    </>
  );
}

function triangle(a, b) {
  const A = [25, 150], B = [195, 150], C = [125, 25];
  return (
    <>
      <polygon points={`${A} ${B} ${C}`} fill="var(--card-2)" stroke={LINE} strokeWidth="3" />
      <text x={A[0] + 30} y={A[1] - 10} className="q-picture__label">{a}°</text>
      <text x={B[0] - 30} y={B[1] - 10} className="q-picture__label">{b}°</text>
      <text x={C[0]} y={C[1] + 32} className="q-picture__label q-picture__label--ask">?</text>
    </>
  );
}

function rightTriangle(a, b) {
  const scale = Math.min(170 / a, 125 / b);
  const w = a * scale, h = b * scale;
  const x = (220 - w) / 2 + 10, y = 150;
  return (
    <>
      <polygon points={`${x},${y} ${x + w},${y} ${x},${y - h}`} fill="var(--card-2)" stroke={LINE} strokeWidth="3" />
      <polyline points={`${x},${y - 14} ${x + 14},${y - 14} ${x + 14},${y}`} fill="none" stroke={LINE} strokeWidth="2" />
      <text x={x + w / 2} y={y + 20} className="q-picture__label">{a} ס״מ</text>
      <text x={x - 6} y={y - h / 2} className="q-picture__label" textAnchor="end" dominantBaseline="middle">{b} ס״מ</text>
    </>
  );
}

function polygon(n) {
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI - Math.PI / 2;
    return `${110 + 75 * Math.cos(t)},${92 + 75 * Math.sin(t)}`;
  }).join(" ");
  return <polygon points={pts} fill="var(--card-2)" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />;
}

const SHAPES = {
  FRACTION_PIE: pie,
  FRACTION_BAR: bar,
  RECT: rect,
  SQUARE: (a) => rect(a, a),
  TRIANGLE: triangle,
  RIGHT_TRIANGLE: rightTriangle,
  POLYGON: (a) => polygon(a),
};
