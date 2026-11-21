import "../styles/components/question-picture.css";

/**
 * The picture of a fraction / geometry question (2026-11-11), drawn from the server's VisualModel:
 * FRACTION_PIE / FRACTION_BAR (a of b parts coloured), RECT / SQUARE (sides a, b in cm),
 * TRIANGLE (two angles a°, b°), RIGHT_TRIANGLE (base a, height b), POLYGON (a sides).
 * Other visual types (the emoji pictures of the help) are not drawn here.
 */
export default function QuestionPicture({ visual }) {
  if (!visual?.type) return null;
  const { type, a, b, result } = visual;
  const wide = type === "BAR_CHART";
  const shape = SHAPES[type];
  if (!shape) return null;
  return (
    <figure className={`q-picture${wide ? " q-picture--wide" : ""}`} aria-label={LABELS[type]?.(a, b, result, visual) ?? "ציור"}>
      <svg viewBox={wide ? "0 0 300 200" : "0 0 220 180"} role="img" aria-hidden="true">
        {shape(a, b, result, visual)}
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
  TRIANGLE_SIDES: (a, b, c) => `משולש עם צלעות ${a}, ${b}, ${c}`,
  LINE_ANGLE: (a) => `זווית של ${a} מעלות על קו ישר`,
  // 2026-11-21: the new topics
  BAR_CHART: (a, b, r, v) => `גרף עמודות: ${barData(v).map((d) => `${d.label} ${d.value}`).join(", ")}`,
  CIRCLE: () => "עיגול עם המרכז, רדיוס וקוטר",
  BOX: (a, b, c) => `תיבה ${a} על ${b}${c ? ` על ${c}` : ""}`,
};

/** "תפוח:5|בננה:8" -> [{label, value}] (the server sends the chart's data in the emoji field). */
function barData(v) {
  return String(v?.emoji ?? "")
    .split("|")
    .filter(Boolean)
    .map((p) => {
      const [label, value] = p.split(":");
      return { label, value: Number(value) || 0 };
    });
}

/**
 * 2026-11-21 (data / graphs): a bar chart with a numbered scale and grid lines, no numbers on the bars
 * (reading them IS the question). The first category is on the right, as Hebrew is read.
 */
function barChart(max, n, r, v) {
  const data = barData(v);
  const top = Math.max(max || 10, ...data.map((d) => d.value));
  const step = top <= 10 ? 1 : top <= 20 ? 2 : 5;
  const x0 = 34, x1 = 290, y0 = 165, y1 = 14;
  const h = (val) => ((y0 - y1) * val) / top;
  const slot = (x1 - x0) / Math.max(1, data.length);
  const colors = ["var(--blue)", "var(--orange)", "var(--green)", "var(--purple)", "var(--pink)"];
  const ticks = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x0} y1={y0 - h(t)} x2={x1} y2={y0 - h(t)} stroke="var(--line, #d9dce8)" strokeWidth={t === 0 ? 2.5 : 1} />
          <text x={x0 - 6} y={y0 - h(t) + 4} className="q-picture__tick" textAnchor="end">{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = x1 - slot * (i + 0.5); // first category on the right
        const w = Math.min(38, slot * 0.6);
        return (
          <g key={d.label}>
            <rect x={cx - w / 2} y={y0 - h(d.value)} width={w} height={h(d.value)} rx="4" fill={colors[i % colors.length]} />
            <text x={cx} y={y0 + 22} className="q-picture__label q-picture__label--small">{d.label}</text>
          </g>
        );
      })}
    </>
  );
}

function circleShape() {
  const cx = 110, cy = 90, r = 72;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="var(--card-2)" stroke={LINE} strokeWidth="3" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--blue)" strokeWidth="3" strokeDasharray="6 5" />
      <line x1={cx} y1={cy} x2={cx + r * Math.cos(-1.1)} y2={cy + r * Math.sin(-1.1)} stroke="var(--orange)" strokeWidth="3.5" />
      <circle cx={cx} cy={cy} r="4.5" fill={LINE} />
      <text x={cx - 24} y={cy - 30} className="q-picture__label q-picture__label--small">רדיוס</text>
      <text x={cx - 38} y={cy + 20} className="q-picture__label q-picture__label--small">קוטר</text>
    </>
  );
}

/** A box drawn in oblique view, its three edges labelled ("?" for the one that is asked). */
function box(a, b, c) {
  const L = 110, H = 70, D = 40;
  const x = 40, y = 70;
  const front = `${x},${y} ${x + L},${y} ${x + L},${y + H} ${x},${y + H}`;
  const topF = `${x},${y} ${x + D},${y - D * 0.7} ${x + L + D},${y - D * 0.7} ${x + L},${y}`;
  const side = `${x + L},${y} ${x + L + D},${y - D * 0.7} ${x + L + D},${y + H - D * 0.7} ${x + L},${y + H}`;
  return (
    <>
      <polygon points={front} fill="var(--card-2)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points={topF} fill="#fff" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points={side} fill="var(--line, #d9dce8)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <text x={x + L / 2} y={y + H + 20} className="q-picture__label">{a}</text>
      <text x={x + L + D / 2 + 14} y={y + H - D * 0.35 + 14} className="q-picture__label">{b}</text>
      <text x={x - 8} y={y + H / 2 + 5} className={`q-picture__label${c ? "" : " q-picture__label--ask"}`} textAnchor="end">{c || "?"}</text>
    </>
  );
}

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
  // 2026-11-11: 58 units on the left are kept for the side label ("10 ס״מ"), so it is never cut off.
  const scale = Math.min(150 / a, 120 / b);
  const w = a * scale, h = b * scale;
  const x = 58 + (155 - w) / 2, y = (170 - h) / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill="var(--card-2)" stroke={LINE} strokeWidth="3" rx="2" />
      <text x={x + w / 2} y={y + h + 18} className="q-picture__label">{a} ס״מ</text>
      <text x={x - 6} y={y + h / 2} className="q-picture__label q-picture__label--left" textAnchor="end" dominantBaseline="middle">{b} ס״מ</text>
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
  const scale = Math.min(150 / a, 125 / b);
  const w = a * scale, h = b * scale;
  const x = 58 + (155 - w) / 2, y = 150;
  return (
    <>
      <polygon points={`${x},${y} ${x + w},${y} ${x},${y - h}`} fill="var(--card-2)" stroke={LINE} strokeWidth="3" />
      <polyline points={`${x},${y - 14} ${x + 14},${y - 14} ${x + 14},${y}`} fill="none" stroke={LINE} strokeWidth="2" />
      <text x={x + w / 2} y={y + 20} className="q-picture__label">{a} ס״מ</text>
      <text x={x - 6} y={y - h / 2} className="q-picture__label q-picture__label--left" textAnchor="end" dominantBaseline="middle">{b} ס״מ</text>
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

/** A triangle with its three side lengths written next to the sides (2026-11-11). */
function triangleSides(a, b, c) {
  const A = [30, 150], B = [190, 150], C = [95, 30];
  return (
    <>
      <polygon points={`${A} ${B} ${C}`} fill="var(--card-2)" stroke={LINE} strokeWidth="3" />
      <text x={110} y={172} className="q-picture__label">{a} ס״מ</text>
      <text x={52} y={88} className="q-picture__label q-picture__label--left" textAnchor="end">{b}</text>
      <text x={158} y={88} className="q-picture__label q-picture__label--right" textAnchor="start">{c}</text>
    </>
  );
}

/** A straight line with a ray: one angle given, the other one asked. */
function lineAngle(a) {
  const r = 70, cx = 110, cy = 140;
  const t = Math.PI - (a * Math.PI) / 180;
  const end = [cx + r * Math.cos(t), cy - r * Math.sin(t)];
  return (
    <>
      <line x1={15} y1={cy} x2={205} y2={cy} stroke={LINE} strokeWidth="3" />
      <line x1={cx} y1={cy} x2={end[0]} y2={end[1]} stroke={LINE} strokeWidth="3" />
      <text x={cx - 45} y={cy - 12} className="q-picture__label">{a}°</text>
      <text x={cx + 45} y={cy - 12} className="q-picture__label q-picture__label--ask">?</text>
    </>
  );
}

const SHAPES = {
  TRIANGLE_SIDES: triangleSides,
  LINE_ANGLE: (a) => lineAngle(a),
  FRACTION_PIE: pie,
  FRACTION_BAR: bar,
  RECT: rect,
  SQUARE: (a) => rect(a, a),
  TRIANGLE: triangle,
  RIGHT_TRIANGLE: rightTriangle,
  POLYGON: (a) => polygon(a),
  BAR_CHART: barChart,
  CIRCLE: circleShape,
  BOX: box,
};
