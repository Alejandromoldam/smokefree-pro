"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";

type RevealOnScrollProps = {
  children: ReactNode;
  /** Stagger index 0-4 -> maps to a CSS transition-delay. */
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
  as?: ElementType;
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Fades + lifts its children into view when scrolled to.
 * - Respects prefers-reduced-motion (shows content immediately).
 * - Safety net: reveals after 3.5s in case the observer never fires.
 */
export default function RevealOnScroll({
  children,
  delay = 0,
  className = "",
  as,
}: RevealOnScrollProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(node);

    // Safety net: never leave content permanently hidden if the observer misses it.
    const fallback = window.setTimeout(() => setInView(true), 3500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`elora-reveal ${inView ? "is-visible" : ""} elora-reveal-d${delay} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
