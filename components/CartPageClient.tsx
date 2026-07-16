"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PillButton from "@/components/elora/PillButton";
import RevealOnScroll from "@/components/elora/RevealOnScroll";
import { trackAddToCart, trackBeginCheckout } from "@/lib/ga";

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
    lines?: CartLineItem[];
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
    const currentLine = cart.lines.find((line) => line.id === lineId);
    const addedQuantity =
      currentLine && quantity > currentLine.quantity
        ? quantity - currentLine.quantity
        : 0;

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

    if (currentLine && addedQuantity > 0) {
      trackAddToCart({
        currency: currentLine.unitPriceCurrency,
        value: getPriceNumber(currentLine.unitPriceAmount) * addedQuantity,
        items: [
          {
            item_id: currentLine.merchandiseId || currentLine.id,
            item_name: currentLine.title,
            item_variant: currentLine.variantTitle || undefined,
            currency: currentLine.unitPriceCurrency,
            price: getPriceNumber(currentLine.unitPriceAmount),
            quantity: addedQuantity,
          },
        ],
      });
    }
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

      if (Array.isArray(payload.cart.lines)) {
        setCart({ lines: payload.cart.lines });
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

      window.location.assign(payload.cart.checkoutUrl);
    } catch {
      setCartActionError("Error de conexion al crear checkout Shopify.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="elora-shop cart-page-shell relative mx-auto min-h-screen w-full max-w-3xl px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-12 lg:px-8">
      <div className="elora-bg" aria-hidden="true" />
      <RevealOnScroll as="section" className="elora-shop-panel p-4 sm:p-6">
        <div className="mb-5 text-center">
          <p className="elora-shop-eyebrow">Carrito</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Finaliza tu compra
          </h1>
        </div>

        {cartActionError ? (
          <div className="elora-shop-msg mb-4">
            {cartActionError}
          </div>
        ) : null}

        {cart.lines.length === 0 ? (
          <div className="elora-shop-soft p-5 text-center">
            <p className="elora-shop-muted text-sm">
              Tu carrito esta vacio. Agrega productos desde el catalogo para continuar.
            </p>
            <Link href="/" className="elora-pill is-outline elora-shop-cta-sm mt-4">
              <span className="elora-pill-label">Explorar catálogo</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.lines.map((line) => (
                <article
                  key={line.id}
                  className="elora-shop-line p-3"
                >
                  <div className="flex gap-3">
                    <div className="elora-shop-media h-20 w-20 shrink-0 overflow-hidden">
                      <Image
                        src={line.imageUrl}
                        alt={line.imageAlt}
                        width={220}
                        height={220}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-sm font-semibold">
                        {line.title}
                      </h2>
                      <p className="elora-shop-muted mt-1 text-xs">{line.variantTitle}</p>
                      <p className="elora-shop-price mt-1 text-sm">
                        {formatMoney(line.unitPriceAmount, line.unitPriceCurrency)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="elora-shop-qty">
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.id, line.quantity - 1)}
                            className="elora-shop-qty-btn"
                            aria-label="Disminuir cantidad"
                          >
                            -
                          </button>
                          <span className="elora-shop-qty-value">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                            className="elora-shop-qty-btn"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateLineQuantity(line.id, 0)}
                          className="elora-shop-remove"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="elora-shop-divide mt-3 flex items-center justify-between pt-3 text-xs">
                    <span className="elora-shop-muted">Subtotal</span>
                    <span className="elora-shop-price text-sm">
                      {formatMoney(line.lineTotalAmount, line.lineTotalCurrency)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="elora-shop-summary mt-5 p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="elora-shop-muted">Total productos</span>
                <span className="text-base font-semibold text-[#5c2340]">{cartTotalQuantity}</span>
              </div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="elora-shop-muted">Subtotal</span>
                <span className="elora-shop-price text-lg">
                  {formatMoney(cartSubtotalAmount, cartCurrency)}
                </span>
              </div>
              <div className="elora-shop-divide mb-4 flex items-center justify-between pt-3 text-sm">
                <span className="text-[#5c2340]">Total</span>
                <span className="elora-shop-price text-xl">
                  {formatMoney(cartSubtotalAmount, cartCurrency)}
                </span>
              </div>
              <PillButton
                onClick={() => void handleFinalizeCheckout()}
                disabled={checkoutLoading}
                className="elora-shop-cta"
              >
                {checkoutLoading ? "Abriendo checkout seguro..." : "Finalizar compra"}
              </PillButton>
              {checkoutLoading ? (
                <p className="elora-shop-muted mt-3 text-center text-xs">
                  Conectando con el checkout seguro de Shopify. Esto puede tardar unos segundos.
                </p>
              ) : null}
            </div>
          </>
        )}
      </RevealOnScroll>
    </main>
  );
}
