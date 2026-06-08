"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { trackBeginCheckout } from "@/lib/ga";

type CartLineItem = {
  id: string;
  merchandiseId?: string;
  quantity: number;
  title: string;
  variantTitle: string;
  imageUrl: string;
  imageAlt: string;
  unitPriceAmount: string;
  unitPriceCurrency: string;
  lineTotalAmount: string;
  lineTotalCurrency: string;
  availableForSale: boolean;
  productUrl: string;
};

type CartPayload = {
  lines: CartLineItem[];
};

type CheckoutApiResponse = {
  ok: boolean;
  error: string | null;
  cart: {
    checkoutUrl?: string;
  } | null;
};

const LOCAL_CART_STORAGE_KEY = "sf_local_cart_v1";
const LOCAL_CART_EVENT = "sf-local-cart-updated";
const LOCAL_CART_EVENT_SOURCE = "cart-page";

function formatMoney(amount: string, currencyCode: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return `${amount} ${currencyCode}`;
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

function getPriceNumber(amount: string) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
}

function getLineTotalAmount(unitPriceAmount: string, quantity: number) {
  return (getPriceNumber(unitPriceAmount) * Math.max(1, quantity)).toFixed(2);
}

function readLocalCartFromStorage(): CartPayload {
  if (typeof window === "undefined") {
    return { lines: [] };
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    if (!raw) return { lines: [] };
    const parsed = JSON.parse(raw) as CartPayload;
    if (!Array.isArray(parsed?.lines)) return { lines: [] };
    return { lines: parsed.lines };
  } catch {
    return { lines: [] };
  }
}

export default function CartPageClient() {
  const [cart, setCart] = useState<CartPayload>({ lines: [] });
  const [cartHydrated, setCartHydrated] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartActionError, setCartActionError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("cart-page-active");
    setCart(readLocalCartFromStorage());
    setCartHydrated(true);

    const syncFromStorage = () => setCart(readLocalCartFromStorage());
    const syncFromEvent = () => syncFromStorage();

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(LOCAL_CART_EVENT, syncFromEvent as EventListener);

    return () => {
      document.body.classList.remove("cart-page-active");
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(LOCAL_CART_EVENT, syncFromEvent as EventListener);
    };
  }, []);

  const cartTotalQuantity = useMemo(
    () => cart.lines.reduce((acc, line) => acc + line.quantity, 0),
    [cart.lines]
  );

  const cartCurrency = cart.lines[0]?.unitPriceCurrency || "MXN";
  const cartSubtotalAmount = useMemo(
    () =>
      cart.lines
        .reduce(
          (acc, line) => acc + getPriceNumber(line.unitPriceAmount) * line.quantity,
          0
        )
        .toFixed(2),
    [cart.lines]
  );

  useEffect(() => {
    if (!cartHydrated) return;
    window.localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(
      new CustomEvent(LOCAL_CART_EVENT, {
        detail: {
          quantity: cartTotalQuantity,
          source: LOCAL_CART_EVENT_SOURCE,
        },
      })
    );
  }, [cart, cartHydrated, cartTotalQuantity]);

  function updateLineQuantity(lineId: string, quantity: number) {
    setCartActionError(null);
    setCart((current) => {
      if (quantity <= 0) {
        return { lines: current.lines.filter((line) => line.id !== lineId) };
      }
      return {
        lines: current.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                quantity,
                lineTotalAmount: getLineTotalAmount(line.unitPriceAmount, quantity),
              }
            : line
        ),
      };
    });
  }

  async function handleFinalizeCheckout() {
    if (checkoutLoading) return;
    setCartActionError(null);

    const lines = cart.lines
      .map((line) => ({
        merchandiseId: line.merchandiseId,
        quantity: line.quantity,
      }))
      .filter(
        (line) =>
          Boolean(line.merchandiseId) &&
          String(line.merchandiseId).startsWith("gid://shopify/ProductVariant/")
      ) as Array<{ merchandiseId: string; quantity: number }>;

    if (lines.length === 0) {
      setCartActionError(
        "No hay variantes validas para checkout Shopify. Agrega productos disponibles desde el catalogo."
      );
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lines }),
      });
      const payload = (await response.json()) as CheckoutApiResponse;

      if (!response.ok || !payload.ok || !payload.cart?.checkoutUrl) {
        setCartActionError(payload.error || "No se pudo generar checkout Shopify.");
        return;
      }

      trackBeginCheckout({
        currency: cartCurrency,
        value: getPriceNumber(cartSubtotalAmount),
        items: cart.lines.map((line) => ({
          item_id: line.merchandiseId || line.id,
          item_name: line.title,
          item_variant: line.variantTitle,
          currency: line.unitPriceCurrency,
          price: getPriceNumber(line.unitPriceAmount),
          quantity: line.quantity,
        })),
      });

      window.location.href = payload.cart.checkoutUrl;
    } catch {
      setCartActionError("Error de conexion al crear checkout Shopify.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="cart-page-shell mx-auto min-h-screen w-full max-w-3xl px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-12 lg:px-8">
      <section className="rounded-[2rem] border border-white/12 bg-[rgba(4,10,20,0.92)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.38)] sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Carrito</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Finaliza tu compra
          </h1>
        </div>

        {cartActionError ? (
          <div className="mb-4 rounded-xl border border-amber-300/35 bg-amber-300/10 p-3 text-sm text-amber-100">
            {cartActionError}
          </div>
        ) : null}

        {cart.lines.length === 0 ? (
          <div className="rounded-2xl border border-white/12 bg-black/20 p-5">
            <p className="text-sm text-gray-300">
              Tu carrito esta vacio. Agrega productos desde el catalogo para continuar.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.lines.map((line) => (
                <article
                  key={line.id}
                  className="rounded-2xl border border-white/12 bg-black/20 p-3"
                >
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      <Image
                        src={line.imageUrl}
                        alt={line.imageAlt}
                        width={220}
                        height={220}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-sm font-semibold text-white">
                        {line.title}
                      </h2>
                      <p className="mt-1 text-xs text-gray-400">{line.variantTitle}</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatMoney(line.unitPriceAmount, line.unitPriceCurrency)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line.id, line.quantity - 1)}
                          className="btn-ghost px-3 py-1 text-xs font-semibold"
                        >
                          -
                        </button>
                        <span className="rounded-lg border border-white/12 px-3 py-1 text-xs text-white">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                          className="btn-ghost px-3 py-1 text-xs font-semibold"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line.id, 0)}
                          className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-200 transition hover:text-rose-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-gray-300">
                    <span>Subtotal</span>
                    <span className="text-sm font-semibold text-white">
                      {formatMoney(line.lineTotalAmount, line.lineTotalCurrency)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/12 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between text-sm text-gray-300">
                <span>Total productos</span>
                <span className="text-base font-semibold text-white">{cartTotalQuantity}</span>
              </div>
              <div className="mb-3 flex items-center justify-between text-sm text-gray-300">
                <span>Subtotal</span>
                <span className="text-lg font-semibold text-white">
                  {formatMoney(cartSubtotalAmount, cartCurrency)}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm text-gray-200">
                <span>Total</span>
                <span className="text-xl font-semibold text-white">
                  {formatMoney(cartSubtotalAmount, cartCurrency)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleFinalizeCheckout()}
                disabled={checkoutLoading}
                className="btn-premium w-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {checkoutLoading ? "Generando checkout..." : "Finalizar compra"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
