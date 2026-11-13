import PickRound from "./PickRound";
import { remLabel } from "./levelsTimes";

/** ✖️ אי הכפל והחילוק (2026-11-13): baskets, sharing cookies, a building of windows. */

function GroupsArt({ round, hint, solved }) {
  return (
    <div className="times-art">
      <div className="baskets">
        {Array.from({ length: round.n }, (_, i) => (
          <div key={i} className="basket">
            {round.pictures ? (
              <span className="basket__items" aria-hidden="true">
                {Array.from({ length: round.k }, (_, j) => (
                  <span key={j}>{round.item}</span>
                ))}
              </span>
            ) : (
              <span className="basket__num">
                {round.k} <span aria-hidden="true">{round.item}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="times-art__q">כמה יש בסך הכל?</p>
      {(round.ex || solved) && (
        <p className="times-art__ex" dir="ltr">
          {round.n} × {round.k} = {solved ? round.answer : "?"}
        </p>
      )}
      {hint && !solved && (
        <p className="times-art__tip" dir="ltr">
          {Array.from({ length: round.n }, () => round.k).join(" + ")}
        </p>
      )}
    </div>
  );
}

export function GroupsRound(props) {
  return <PickRound {...props} Art={GroupsArt} />;
}

function ShareArt({ round, hint, solved }) {
  const show = hint || solved; // the cookies dealt onto the plates
  const many = !round.pictures;
  const kidsShown = round.mode === "kids" ? (show ? round.kids : 0) : round.kids;
  return (
    <div className="times-art">
      <div className="cookie-pile" aria-label={`${round.total} עוגיות`}>
        {many || show ? (
          <span className="cookie-pile__num">🍪 × {round.total}</span>
        ) : (
          Array.from({ length: round.total }, (_, i) => <span key={i}>🍪</span>)
        )}
      </div>
      {round.mode === "kids" && <p className="times-art__q">כל ילד מקבל {round.each} 🍪. לכמה ילדים יספיקו?</p>}
      <div className="plates">
        {Array.from({ length: kidsShown }, (_, i) => (
          <div key={i} className="plate">
            <span className="plate__kid" aria-hidden="true">🧒</span>
            <span className="plate__dish">{show ? (many ? `${round.each}🍪` : "🍪".repeat(round.each)) : "?"}</span>
          </div>
        ))}
        {round.mode === "kids" && !show && <p className="times-art__kids">🧒 ? ילדים</p>}
      </div>
      {round.mode === "rem" && show && <p className="times-art__tip">נשארו {round.rem} 🍪</p>}
      {round.mode !== "kids" && (
        <p className="times-art__q">{round.mode === "rem" ? "כמה יקבל כל ילד, וכמה יישארו?" : "כמה עוגיות יקבל כל ילד?"}</p>
      )}
      {round.ex && (
        <p className="times-art__ex" dir="ltr">
          {round.total} : {round.mode === "kids" ? round.each : round.kids} = ?
        </p>
      )}
    </div>
  );
}

export function ShareRound(props) {
  const labels = props.round.mode === "rem" ? Object.fromEntries(props.round.options.map((v) => [v, remLabel(v)])) : undefined;
  return <PickRound {...props} round={labels ? { ...props.round, labels } : props.round} Art={ShareArt} wide={Boolean(labels)} />;
}

function BuildingArt({ round, hint, solved }) {
  const cover = round.mode === "floors" && !solved; // only the top floor shows, the rest is in a cloud
  return (
    <div className="times-art">
      <div className="building" style={{ "--cols": round.cols }}>
        <span className="building__roof" aria-hidden="true" />
        {Array.from({ length: round.rows }, (_, r) => (
          <div key={r} className={`building__floor${cover && r > 0 ? " is-hidden" : ""}`}>
            {hint && !cover && <small className="building__n">{r + 1}</small>}
            {Array.from({ length: round.cols }, (_, c) => (
              <span key={c} className="building__win" />
            ))}
          </div>
        ))}
        {cover && <div className="building__cloud">☁️ {round.total} חלונות</div>}
      </div>
      <p className="times-art__q">
        {round.mode === "which" ? "איזה תרגיל מתאים לבניין?" : round.mode === "floors" ? "כמה קומות יש בבניין?" : "כמה חלונות יש בבניין?"}
      </p>
      {round.mode === "floors" && (
        <p className="times-art__ex" dir="ltr">
          ? × {round.cols} = {round.total}
        </p>
      )}
      {hint && round.mode === "floors" && (
        <p className="times-art__tip" dir="ltr">
          {round.cols}, {round.cols * 2}, {round.cols * 3}...
        </p>
      )}
    </div>
  );
}

export function ArraysRound(props) {
  return <PickRound {...props} Art={BuildingArt} wide={props.round.mode === "which"} />;
}
