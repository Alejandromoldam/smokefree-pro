"use client";

import { useEffect, useState } from "react";

const LOCAL_CART_STORAGE_KEY = "sf_local_cart_v1";
const LOCAL_CART_EVENT = "sf-local-cart-updated";

type StoredCart = {
  lines?: Array<{ quantity?: number }>;
};

function readCartQuantity() {
  try {
    const raw = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as StoredCart;
    const lines = Array.isArray(parsed?.lines) ? parsed.lines : [];
    return lines.reduce((acc, line) => acc + Math.max(1, Number(line.quantity || 1)), 0);
  } catch {
    return 0;
  }
}

/**
 * Elora-styled cart pill for the nav. Reads the same local cart storage/event
 * used across the store so the existing cart + checkout flow stays intact.
 */
export default function EloraCartLink() {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const syncFromStorage = () => setQuantity(readCartQuantity());
    const syncFromEvent = (event: Event) => {
      const custom = event as CustomEvent<{ quantity?: number }>;
      if (typeof custom.detail?.quantity === "number") {
        setQuantity(custom.detail.quantity);
        return;
      }
      syncFromStorage();
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(LOCAL_CART_EVENT, syncFromEvent as EventListener);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(LOCAL_CART_EVENT, syncFromEvent as EventListener);
    };
  }, []);

  return (
    <a
      href="/cart"
      className="elora-icon-btn"
      aria-label={`Ir al carrito${quantity > 0 ? ` con ${quantity} producto${quantity === 1 ? "" : "s"}` : ""}`}
    >
      <span aria-hidden="true">🛍️</span>
      {quantity > 0 ? <span className="elora-cart-count">{quantity}</span> : null}
    </a>
  );
}
