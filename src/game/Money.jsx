/**
 * One Israeli coin or bill, drawn (2026-11-12, the clock-and-money island). Coins 1/2/5 silver,
 * 10 gold; bills 20 red, 50 green - like the real ones, so children recognize them in the shop.
 */
export default function Money({ v, small = false, as: Tag = "span", ...rest }) {
  const bill = v >= 20;
  const cls = bill ? `bill bill--${v}` : `coin coin--${v}`;
  return (
    <Tag className={`${cls}${small ? " is-small" : ""}`} aria-label={`${v} שקלים`} {...rest}>
      <span className="money__v">{v}</span>
      <span className="money__s">₪</span>
    </Tag>
  );
}
