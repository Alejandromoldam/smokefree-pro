"use client";

import { useEffect, useMemo, useState } from "react";

const BENEFIT_ITEMS = [
  "🚚 Envíos a todo el Mundo",
  "🔒 Pago Seguro",
  "💬 Soporte por WhatsApp",
  "⭐ Productos Seleccionados",
];

export default function TopBenefitsBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % BENEFIT_ITEMS.length);
        setVisible(true);
      }, 220);
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const currentItem = useMemo(() => BENEFIT_ITEMS[index], [index]);

  return (
    <div className="top-benefits-bar" aria-live="polite">
      <p
        className={`top-benefits-bar-text ${
          visible ? "is-visible" : "is-hidden"
        }`}
      >
        {currentItem}
      </p>
    </div>
  );
}
