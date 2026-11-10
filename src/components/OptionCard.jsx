import "../styles/components/option-card.css";

/**
 * A big, tappable selection card used on the character / grade / topic screens.
 * Shows an icon (emoji or text), a title, and an optional subtitle. The accent
 * color drives the selected-state glow.
 */
export default function OptionCard({
  icon,
  title,
  subtitle,
  color = "var(--purple)",
  selected = false,
  locked = false,
  onClick,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      className={`option-card ${selected ? "is-selected" : ""} ${locked ? "is-locked" : ""}`.trim()}
      style={{ "--accent": color }}
      onClick={onClick}
      disabled={locked}
      aria-pressed={selected}
      aria-label={ariaLabel ?? title}
    >
      <span className="option-card__icon" aria-hidden="true">
        {locked ? "🔒" : icon}
      </span>
      <span className="option-card__title">{title}</span>
      {subtitle && <span className="option-card__subtitle">{subtitle}</span>}
      {selected && <span className="option-card__check" aria-hidden="true">✓</span>}
    </button>
  );
}
