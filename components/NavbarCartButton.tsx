"use client";

import { useEffect, useState } from "react";

const LOCAL_CART_STORAGE_KEY = "sf_local_cart_v1";
const LOCAL_CART_EVENT = "sf-local-cart-updated";

type StoredCart = {
  lines?: Array<{
    quantity?: number;
  }>;
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

function CartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M2.5 3.5h2l1.6 8.1a1 1 0 0 0 1 .8h7.3a1 1 0 0 0 .97-.76L17.2 6H5.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="16" r="1.1" fill="currentColor" />
      <circle cx="14.2" cy="16" r="1.1" fill="currentColor" />
    </svg>
  );
}

export default function NavbarCartButton() {
  return <NavbarCartButtonWithHref href="/cart" />;
}

type NavbarCartButtonProps = {
  href?: string;
};

export function NavbarCartButtonWithHref({ href = "/cart" }: NavbarCartButtonProps) {
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
    <a href={href} className="btn-premium px-3 py-2 text-xs font-semibold sm:text-sm">
      <span className="relative inline-flex items-center gap-2">
        <CartIcon />
        Carrito
        {quantity > 0 ? (
          <span className="absolute -right-3 -top-2 inline-flex min-w-5 items-center justify-center rounded-full border border-cyan-200/50 bg-cyan-300 px-1.5 py-0.5 text-[10px] font-bold leading-none text-black">
            {quantity}
          </span>
        ) : null}
      </span>
    </a>
  );
}
