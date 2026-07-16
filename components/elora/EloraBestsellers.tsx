"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { trackAddToCart } from "@/lib/ga";
import type { CatalogProduct } from "@/lib/shopifyCatalog";
import RevealOnScroll from "./RevealOnScroll";

type CatalogApiResponse = {
  ok: boolean;
  error: string | null;
  products: CatalogProduct[];
};

// Same local-cart contract used by CartPageClient — kept identical so the
// existing cart + Shopify checkout flow stays intact.
const LOCAL_CART_STORAGE_KEY = "sf_local_cart_v1";
const LOCAL_CART_EVENT = "sf-local-cart-updated";

type CartLine = {
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

function formatMoney(amount: string, currencyCode: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return `${amount} ${currencyCode}`;
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function readCart(): { lines: CartLine[] } {
  try {
    const raw = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    if (!raw) return { lines: [] };
    const parsed = JSON.parse(raw) as { lines?: CartLine[] };
    return { lines: Array.isArray(parsed?.lines) ? parsed.lines : [] };
  } catch {
    return { lines: [] };
  }
}

function addProductToLocalCart(product: CatalogProduct) {
  const current = readCart();
  const lineId = product.variantId || product.id;
  const price = Number(product.priceAmount);
  const unitPrice = Number.isFinite(price) ? price : 0;
  const existing = current.lines.find((line) => line.id === lineId);

  let nextLines: CartLine[];
  if (existing) {
    const quantity = existing.quantity + 1;
    nextLines = current.lines.map((line) =>
      line.id === lineId
        ? {
            ...line,
            quantity,
            lineTotalAmount: (unitPrice * quantity).toFixed(2),
          }
        : line
    );
  } else {
    const variantTitle = product.variantId ? "Variante seleccionada" : "Variante unica";
    nextLines = [
      ...current.lines,
      {
        id: lineId,
        merchandiseId: product.variantId || undefined,
        quantity: 1,
        title: product.title,
        variantTitle,
        imageUrl: product.imageUrl,
        imageAlt: product.imageAlt,
        unitPriceAmount: product.priceAmount,
        unitPriceCurrency: product.priceCurrency,
        lineTotalAmount: unitPrice.toFixed(2),
        lineTotalCurrency: product.priceCurrency,
        availableForSale: product.availableForSale,
        productUrl: product.productUrl,
      },
    ];
  }

  const totalQuantity = nextLines.reduce((acc, line) => acc + line.quantity, 0);
  window.localStorage.setItem(
    LOCAL_CART_STORAGE_KEY,
    JSON.stringify({ lines: nextLines })
  );
  window.dispatchEvent(
    new CustomEvent(LOCAL_CART_EVENT, {
      detail: { quantity: totalQuantity, openDrawer: false, source: "elora-bestsellers" },
    })
  );

  trackAddToCart({
    currency: product.priceCurrency,
    value: unitPrice,
    items: [
      {
        item_id: product.variantId || product.id,
        item_name: product.title,
        item_variant: product.variantId ? "Variante seleccionada" : "Variante unica",
        currency: product.priceCurrency,
        price: unitPrice,
        quantity: 1,
      },
    ],
  });
}

export default function EloraBestsellers({
  initialProducts = [],
}: {
  initialProducts?: CatalogProduct[];
}) {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialProducts.length > 0) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const payload = (await response.json()) as CatalogApiResponse;
        if (!active) return;
        if (response.ok && payload.ok && Array.isArray(payload.products)) {
          setProducts(payload.products);
        }
      } catch {
        /* keep empty state */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialProducts]);

  const selected = useMemo(() => products.slice(0, 5), [products]);

  function handleAdd(product: CatalogProduct) {
    if (!product.availableForSale) return;
    addProductToLocalCart(product);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((current) => (current === product.id ? null : current));
    }, 1600);
  }

  if (!loading && selected.length === 0) {
    // Never invent placeholder products: hide the section if the catalog is empty.
    return null;
  }

  const [feature, ...rest] = selected;

  return (
    <section className="elora-section" id="bestsellers">
      <RevealOnScroll className="elora-section-head" as="div">
        <span className="elora-eyebrow">Bestsellers</span>
        <h2 className="elora-h2">
          Los favoritos de la comunidad
          <span className="elora-underline" />
        </h2>
        <p className="elora-section-sub">
          Nuestros esenciales más queridos — elegidos por lo que de verdad
          funciona, no por lo que luce bonito en la repisa.
        </p>
      </RevealOnScroll>

      {loading ? (
        <div className="elora-bento">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`bento-skeleton-${index}`}
              className={`elora-skeleton ${index === 0 ? "elora-bento-feature" : "elora-card"}`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div className="elora-bento">
          {feature ? (
            <RevealOnScroll as="article" className="elora-bento-feature">
              <span className="elora-badge">Más vendido</span>
              <div className="elora-feature-media">
                <Image
                  src={feature.imageUrl}
                  alt={feature.imageAlt || feature.title}
                  width={640}
                  height={640}
                  sizes="(max-width: 980px) 90vw, 40vw"
                  className="elora-product-img"
                />
              </div>
              <h3 className="elora-feature-title">{feature.title}</h3>
              <p className="elora-feature-desc">{feature.descriptionShort}</p>
              <div className="elora-price">
                {formatMoney(feature.priceAmount, feature.priceCurrency)}
              </div>
              <div className="elora-card-actions">
                <button
                  type="button"
                  className="elora-add"
                  onClick={() => handleAdd(feature)}
                  disabled={!feature.availableForSale}
                >
                  {!feature.availableForSale
                    ? "Agotado"
                    : addedId === feature.id
                    ? "Agregado ✓"
                    : "Agregar al ritual"}
                </button>
                <a className="elora-card-link" href={feature.productUrl}>
                  Ver detalle
                </a>
              </div>
            </RevealOnScroll>
          ) : null}

          {rest.map((product, index) => (
            <RevealOnScroll
              as="article"
              key={product.id}
              className="elora-card"
              delay={(Math.min(index + 1, 4) as 1 | 2 | 3 | 4)}
            >
              <a className="elora-card-media" href={product.productUrl} aria-label={`Ver ${product.title}`}>
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt || product.title}
                  width={360}
                  height={360}
                  sizes="(max-width: 980px) 45vw, 22vw"
                  className="elora-product-img"
                />
              </a>
              <h3 className="elora-card-title">{product.title}</h3>
              <div className="elora-price">
                {formatMoney(product.priceAmount, product.priceCurrency)}
              </div>
              <button
                type="button"
                className="elora-add"
                onClick={() => handleAdd(product)}
                disabled={!product.availableForSale}
              >
                {!product.availableForSale
                  ? "Agotado"
                  : addedId === product.id
                  ? "Agregado ✓"
                  : "Agregar"}
              </button>
            </RevealOnScroll>
          ))}
        </div>
      )}
    </section>
  );
}
