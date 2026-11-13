import PickRound from "./PickRound";
import { SHAPE_NAMES } from "./levelsShapes";

/**
 * 🔷 אי הצורות (2026-11-13): the three games' pictures. Every flat shape arrives as points in a
 * 100x100 box (made in levelsShapes.js); solids are drawn here.
 */

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

function Solid({ kind, fill }) {
  const dark = shade(fill, 0.25);
  const darker = shade(fill, 0.45);
  if (kind === "cube")
    return (
      <g stroke="#2b2350" strokeWidth="1.6" strokeLinejoin="round">
        <polygon points="22,36 62,36 62,82 22,82" fill={fill} />
        <polygon points="22,36 40,20 80,20 62,36" fill={shade(fill, -0.25)} />
        <polygon points="62,36 80,20 80,66 62,82" fill={dark} />
      </g>
    );
  if (kind === "sphere")
    return (
      <g>
        <defs>
          <radialGradient id={`sp${fill.slice(1)}`} cx="38%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="35%" stopColor={fill} />
            <stop offset="100%" stopColor={darker} />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill={`url(#sp${fill.slice(1)})`} stroke="#2b2350" strokeWidth="1.6" />
        <ellipse cx="50" cy="50" rx="38" ry="10" fill="none" stroke="#2b2350" strokeOpacity="0.35" strokeDasharray="3 3" />
      </g>
    );
  if (kind === "cylinder")
    return (
      <g stroke="#2b2350" strokeWidth="1.6">
        <path d="M24 26 V76 A26 9 0 0 0 76 76 V26" fill={dark} />
        <rect x="24" y="26" width="52" height="50" fill={fill} stroke="none" />
        <path d="M24 26 V76 A26 9 0 0 0 76 76 V26" fill="none" />
        <ellipse cx="50" cy="26" rx="26" ry="9" fill={shade(fill, -0.25)} />
      </g>
    );
  return (
    <g stroke="#2b2350" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M50 12 L82 76 A32 10 0 0 1 18 76 Z" fill={fill} />
      <ellipse cx="50" cy="76" rx="32" ry="10" fill={dark} />
    </g>
  );
}

/** One shape: {kind, pts?, r?, fill}. numbered = the corners get 1, 2, 3... (the hint). */
export function ShapeSvg({ s, numbered = false, className = "" }) {
  const solid = ["cube", "sphere", "cylinder", "cone"].includes(s.kind);
  return (
    <svg viewBox="0 0 100 100" className={`shape-svg ${className}`} aria-hidden="true">
      {solid ? (
        <Solid kind={s.kind} fill={s.fill} />
      ) : s.kind === "circle" ? (
        <circle cx="50" cy="50" r={s.r ?? 40} fill={s.fill} stroke="#2b2350" strokeWidth="1.6" />
      ) : (
        <polygon points={s.pts.map((p) => p.join(",")).join(" ")} fill={s.fill} stroke="#2b2350" strokeWidth="1.6" strokeLinejoin="round" />
      )}
      {numbered &&
        s.pts?.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill="#fff" stroke="#2b2350" strokeWidth="1" />
            <text x={x} y={y} className="shape-svg__n">
              {i + 1}
            </text>
          </g>
        ))}
    </svg>
  );
}

const OptShape = ({ v, round }) => <ShapeSvg s={round.look[v]} />;

const TIPS = {
  circle: "לעיגול אין פינות - הוא עגול מסביב.",
  square: "לריבוע 4 צלעות שוות ו-4 פינות ישרות.",
  triangle: "למשולש יש 3 צלעות ו-3 פינות.",
  rectangle: "למלבן 4 צלעות ו-4 פינות ישרות - שתיים ארוכות ושתיים קצרות.",
  pentagon: "למחומש יש 5 צלעות.",
  hexagon: "למשושה יש 6 צלעות.",
  cube: "לקובייה יש 6 פאות, כולן ריבועים.",
  sphere: "כדור עגול מכל הצדדים ומתגלגל לכל כיוון.",
  cylinder: "לגליל יש שני עיגולים - למעלה ולמטה.",
  cone: "לחרוט יש עיגול למטה, וחוד למעלה.",
};

function NameArt({ round, hint }) {
  return (
    <div className="shape-ask">
      {round.mode === "like" ? (
        <>
          <span className="shape-ask__emoji" aria-hidden="true">{round.emoji}</span>
          <p className="shape-ask__q">לאיזה גוף דומה {round.thing}?</p>
        </>
      ) : (
        <p className="shape-ask__q">איפה ה<b>{SHAPE_NAMES[round.target]}</b>?</p>
      )}
      {hint && <p className="shape-ask__tip">{TIPS[round.target]}</p>}
    </div>
  );
}

export function ShapeNameRound(props) {
  return <PickRound {...props} Art={NameArt} Opt={OptShape} />;
}

function SidesArt({ round, hint, solved }) {
  if (round.mode === "find")
    return (
      <div className="shape-ask">
        <p className="shape-ask__q">איפה הצורה עם <b>{round.n}</b> צלעות?</p>
        {hint && <p className="shape-ask__tip">סופרים את הצלעות של כל צורה, אחת אחת.</p>}
      </div>
    );
  return (
    <div className="shape-ask">
      <ShapeSvg s={round.shape} numbered={hint || solved} className="shape-svg--big" />
      <p className="shape-ask__q">{round.ask === "corners" ? "כמה פינות יש לצורה?" : "כמה צלעות יש לצורה?"}</p>
    </div>
  );
}

export function SidesRound(props) {
  return <PickRound {...props} Art={SidesArt} Opt={props.round.mode === "find" ? OptShape : undefined} />;
}

function PatternArt({ round, hint, solved }) {
  return (
    <div className="shape-ask">
      <div className="pattern-row" dir="ltr">
        {round.seq.map((t, i) =>
          i === round.gap && !solved ? (
            <span key={i} className="pattern-row__gap">?</span>
          ) : (
            <span key={i} className={`pattern-row__item${i === round.gap ? " is-filled" : ""}`}>
              <ShapeSvg s={t} />
            </span>
          ),
        )}
      </div>
      {hint && <p className="shape-ask__tip">מחפשים מה חוזר שוב ושוב - צורה, צבע, גודל או סיבוב.</p>}
    </div>
  );
}

export function PatternRound(props) {
  return <PickRound {...props} Art={PatternArt} Opt={OptShape} />;
}
