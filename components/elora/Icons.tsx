type IconProps = {
  className?: string;
};

/** Shared line-icon set for the Elora Skin "Glow Ritual" theme. Monochrome
 * SVGs only — the brand rule is zero colored emoji/stickers anywhere. */

export function BagIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7.5 8.2V6.8a4.5 4.5 0 0 1 9 0v1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M5.6 8.2h12.8l.9 11.2a2 2 0 0 1-2 2.15H6.7a2 2 0 0 1-2-2.15l.9-11.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PackageIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 3.4 20.2 8v8L12 20.6 3.8 16V8L12 3.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3.8 8 12 12.4 20.2 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12.4v8.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function LockIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="5.6" y="10.6" width="12.8" height="9.6" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.6 10.6V8.4a3.4 3.4 0 0 1 6.8 0v2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LeafIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M18.8 5.2c.7 6.4-2.4 12.2-9 13.6-3.6.8-5-1.3-4.4-4.6C6.3 8 12 3.6 18.8 5.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M17.8 6.2 6.6 17.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 19.4 4.9 12.6a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6a4.6 4.6 0 0 1 6.5 6.5L12 19.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DropIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3.6c3 4 5.8 7.7 5.8 11a5.8 5.8 0 1 1-11.6 0c0-3.3 2.8-7 5.8-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BubbleIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12.5" r="7.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="5.6" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.6 10.2c.5-.9 1.6-1.4 2.6-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function BrushIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M15.2 3.6 20.4 8.8l-7.1 7.1-5.2-5.2 7.1-7.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M8.1 10.7 5 15.4c-.8 1.2-.7 2.9.4 4 1.1 1.1 2.8 1.2 4 .4l4.7-3.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LightningIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M13 3 5.5 13.4h5.1L10.4 21l8.1-11.1h-5.2L13 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Four-point sparkle star used for the gold decorative shimmer. */
export function SparkleStar({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2c.6 4.6 2.4 7.4 6 8-3.6.6-5.4 3.4-6 8-.6-4.6-2.4-7.4-6-8 3.6-.6 5.4-3.4 6-8Z" />
    </svg>
  );
}

/** Curved petal shape used for the falling-petals hero decoration. */
export function PetalShape({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1c4.5 2 8 5.6 8 9.4C18 15 14.4 19 10 19S2 15 2 10.4C2 6.6 5.5 3 10 1Z" />
    </svg>
  );
}
