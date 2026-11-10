// A large, friendly tappable button. `variant` picks the color
// (purple default / green / blue / ghost). Renders a real <button>.

export default function BigButton({ children, variant = "purple", className = "", ...props }) {
  const variantClass = variant === "purple" ? "" : `big-button--${variant}`;
  return (
    <button className={`big-button ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
