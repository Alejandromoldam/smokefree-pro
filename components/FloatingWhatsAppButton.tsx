"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { trackClickWhatsApp } from "@/lib/ga";

const LOCAL_CART_EVENT = "sf-local-cart-updated";
const CART_DRAWER_EVENT = "sf-cart-drawer-visibility";
const DEFAULT_WHATSAPP_NUMBER = "525545424195";

const HOME_MESSAGE =
  "Hola, estoy viendo la tienda All In One y necesito ayuda con un producto.";
const CART_MESSAGE =
  "Hola, tengo productos en mi carrito de All In One y necesito ayuda para completar mi compra.";

type ProductApiResponse = {
  ok?: boolean;
  product?: {
    title?: string;
  };
};

const productTitleCache = new Map<string, string>();

function buildWhatsAppLink(rawNumber: string, message: string) {
  const digits = rawNumber.replace(/[^\d]/g, "");
  if (!digits) return null;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encodedText}`;
}

function getProductHandle(pathname: string) {
  const cleanPath = pathname.replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments[0] !== "products" || !segments[1]) {
    return null;
  }
  return decodeURIComponent(segments.slice(1).join("/"));
}

function fallbackProductNameFromHandle(handle: string) {
  return handle
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function fetchProductTitle(handle: string) {
  if (!handle) return null;
  if (productTitleCache.has(handle)) {
    return productTitleCache.get(handle) || null;
  }

  try {
    const response = await fetch(`/api/product/${encodeURIComponent(handle)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ProductApiResponse;
    const title = payload?.ok ? payload.product?.title?.trim() : "";
    if (!title) return null;
    productTitleCache.set(handle, title);
    return title;
  } catch {
    return null;
  }
}

export default function FloatingWhatsAppButton() {
  const pathname = usePathname() || "/";
  const rawNumber = DEFAULT_WHATSAPP_NUMBER;

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [productName, setProductName] = useState<string | null>(null);

  useEffect(() => {
    const syncFromHash = () => {
      setCartDrawerOpen(window.location.hash === "#carrito");
    };

    const onCartEvent = (event: Event) => {
      const custom = event as CustomEvent<{ openDrawer?: boolean }>;
      if (custom.detail?.openDrawer) {
        setCartDrawerOpen(true);
      }
    };

    const onDrawerVisibility = (event: Event) => {
      const custom = event as CustomEvent<{ open?: boolean }>;
      if (typeof custom.detail?.open === "boolean") {
        setCartDrawerOpen(custom.detail.open);
      }
    };

    syncFromHash();

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener(LOCAL_CART_EVENT, onCartEvent as EventListener);
    window.addEventListener(CART_DRAWER_EVENT, onDrawerVisibility as EventListener);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener(LOCAL_CART_EVENT, onCartEvent as EventListener);
      window.removeEventListener(CART_DRAWER_EVENT, onDrawerVisibility as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCartDrawerOpen(window.location.hash === "#carrito");
  }, [pathname]);

  useEffect(() => {
    const productHandle = getProductHandle(pathname);
    if (!productHandle) {
      setProductName(null);
      return;
    }

    let active = true;
    setProductName(fallbackProductNameFromHandle(productHandle));

    void (async () => {
      const liveTitle = await fetchProductTitle(productHandle);
      if (!active || !liveTitle) return;
      setProductName(liveTitle);
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  const whatsappMessage = useMemo(() => {
    if (cartDrawerOpen) {
      return CART_MESSAGE;
    }

    if (pathname.startsWith("/products/")) {
      const resolvedName = productName || "Producto";
      return `Hola, estoy interesado en:\n${resolvedName}\n\n¿Podrían ayudarme?`;
    }

    return HOME_MESSAGE;
  }, [cartDrawerOpen, pathname, productName]);

  const whatsappUrl = useMemo(
    () => buildWhatsAppLink(rawNumber, whatsappMessage),
    [rawNumber, whatsappMessage]
  );

  const whatsappContext = useMemo(() => {
    if (cartDrawerOpen) return "cart";
    if (pathname.startsWith("/products/")) return "product";
    return "home";
  }, [cartDrawerOpen, pathname]);

  if (!whatsappUrl) {
    return null;
  }

  return (
    <div className="whatsapp-float-root">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float-btn"
        aria-label="Hablar con asesor por WhatsApp"
        onClick={() =>
          trackClickWhatsApp({
            location: "floating_button",
            context: whatsappContext,
            productName: pathname.startsWith("/products/")
              ? productName || undefined
              : undefined,
          })
        }
      >
        <span className="whatsapp-float-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M20.2 12a8.2 8.2 0 0 1-12 7.3L4 20l.9-4a8.2 8.2 0 1 1 15.3-4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 8.8c.2-.4.4-.4.7-.4h.4c.1 0 .4 0 .5.3l.7 1.8c.1.3 0 .5-.1.7l-.4.5c-.1.1-.2.3-.1.5.2.5.7 1.1 1.3 1.7.7.6 1.4 1.1 2 1.3.2.1.4 0 .5-.1l.5-.4c.2-.2.5-.2.7-.1l1.7.8c.3.1.3.4.3.5v.4c0 .3 0 .5-.3.7-.4.2-1 .4-1.8.2-1.1-.3-2.4-.9-3.8-2.3-1.4-1.3-2-2.6-2.3-3.7-.2-.8 0-1.4.2-1.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="whatsapp-float-copy">
          <span className="whatsapp-float-title">{"\u00bfNecesitas ayuda?"}</span>
          <span className="whatsapp-float-subtitle">Te respondemos en minutos.</span>
        </span>
      </a>
    </div>
  );
}
