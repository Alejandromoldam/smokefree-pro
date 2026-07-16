import type { ReactNode } from "react";

type PillButtonProps = {
  children: ReactNode;
  /** When provided the button renders as an anchor. */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "solid" | "outline";
  target?: string;
  rel?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Elora Skin pill button with a shimmer sweep on hover.
 * Renders an <a> when `href` is set, otherwise a <button>.
 */
export default function PillButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "solid",
  target,
  rel,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: PillButtonProps) {
  const classes = `elora-pill ${variant === "outline" ? "is-outline" : ""} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        className={classes}
      >
        <span className="elora-pill-label">{children}</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
    >
      <span className="elora-pill-label">{children}</span>
    </button>
  );
}
