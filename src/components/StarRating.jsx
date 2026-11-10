import "../styles/components/star-rating.css";

// Shows `value` filled stars out of `max`. `size` = "sm" | "md" | "lg".
// When `animate` is on, earned stars pop in one after another.
export default function StarRating({ value = 0, max = 3, size = "md", animate = false }) {
  return (
    <div className={`star-rating star-rating--${size}`} aria-label={`${value} מתוך ${max} כוכבים`}>
      {Array.from({ length: max }).map((_, i) => {
        const earned = i < value;
        return (
          <span
            key={i}
            className={`star ${earned ? "is-earned" : ""} ${animate && earned ? "is-animated" : ""}`}
            style={animate ? { animationDelay: `${i * 0.18}s` } : undefined}
            aria-hidden="true"
          >
            {earned ? "⭐" : "☆"}
          </span>
        );
      })}
    </div>
  );
}
