import type { ReactNode } from "react";

type MarqueeProps = {
  items: ReactNode[];
  /** Seconds for one full loop. */
  durationSeconds?: number;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
};

/**
 * Infinite horizontal marquee. Items are duplicated so the -50% translate
 * loops seamlessly. The animation is paused under prefers-reduced-motion
 * (handled in globals.css).
 */
export default function Marquee({
  items,
  durationSeconds = 26,
  className = "",
  itemClassName = "",
  ariaLabel,
}: MarqueeProps) {
  const loop = [...items, ...items];

  return (
    <div className={`elora-marquee ${className}`.trim()} aria-label={ariaLabel} role="marquee">
      <div
        className="elora-marquee-track"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((item, index) => (
          <span
            key={index}
            className={`elora-marquee-item ${itemClassName}`.trim()}
            aria-hidden={index >= items.length}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
