"use client";

import { useEffect, useRef, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

type MobileNavProps = {
  items: NavItem[];
};

/**
 * Accessible mobile nav for the Elora header. Desktop nav links are hidden
 * below 980px (see .elora-nav-links in globals.css) with no replacement, so
 * this fills that gap: hamburger toggle, focus trap, Escape to close, and a
 * body scroll lock while the panel is open.
 */
export default function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstLink = panelRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "a, button:not([disabled])"
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="elora-mobile-toggle"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="elora-mobile-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`elora-mobile-toggle-bar ${open ? "is-open" : ""}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="elora-mobile-overlay" role="presentation" onClick={close}>
          <div
            id="elora-mobile-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="elora-mobile-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="elora-mobile-panel-head">
              <span className="elora-logo">
                Elora <span>Skin</span>
              </span>
              <button
                type="button"
                className="elora-mobile-close"
                aria-label="Cerrar menú"
                onClick={close}
              >
                ✕
              </button>
            </div>
            <nav aria-label="Navegación principal">
              <ul className="elora-mobile-links">
                {items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} onClick={close}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
