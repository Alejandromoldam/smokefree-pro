"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type CatalogProduct = {
  id: string;
  title: string;
  handle: string;
  variantId?: string | null;
  descriptionShort: string;
  imageUrl: string;
  imageAlt: string;
  priceAmount: string;
  priceCurrency: string;
  availableForSale: boolean;
  productUrl: string;
  buyNowUrl: string;
};

type CatalogApiResponse = {
  ok: boolean;
  error: string | null;
  products: CatalogProduct[];
  hasMore?: boolean;
  nextCursor?: string | null;
};

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

const CATALOG_FALLBACK_LINK = "/#catalogo";
const LOCAL_CART_STORAGE_KEY = "sf_local_cart_v1";
const LOCAL_CART_EVENT = "sf-local-cart-updated";
const LOCAL_CART_EVENT_SOURCE = "catalog-section";
const INITIAL_VISIBLE_PRODUCTS = 10;
const LOAD_MORE_STEP = 8;

const SORT_OPTIONS = [
  { value: "featured", label: "Destacados" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "name-asc", label: "Nombre: A-Z" },
  { value: "name-desc", label: "Nombre: Z-A" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];
type AvailabilityFilter = "all" | "in-stock";

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

export default function CatalogSection() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [hasMoreFromShopify, setHasMoreFromShopify] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");

  const [cartOpen, setCartOpen] = useState(false);
  const [cartActionError, setCartActionError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cart, setCart] = useState<CartPayload>({ lines: [] });
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const loadCatalog = useCallback(
    async (options?: { append?: boolean; cursor?: string | null }) => {
      const append = options?.append ?? false;
      const cursor = options?.cursor ?? null;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
        setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
      }

      try {
        const endpoint = cursor
          ? `/api/catalog?cursor=${encodeURIComponent(cursor)}`
          : "/api/catalog";
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = (await response.json()) as CatalogApiResponse;

        if (!response.ok || !payload.ok) {
          setError(payload.error || "No se pudo cargar el catalogo.");
          if (!append) {
            setProducts([]);
          }
          setHasMoreFromShopify(false);
          setNextCursor(null);
          return;
        }

        const incoming = payload.products || [];
        setProducts((current) => {
          if (!append) {
            return incoming;
          }
          const existingIds = new Set(current.map((item) => item.id));
          const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
          return [...current, ...uniqueIncoming];
        });
        setHasMoreFromShopify(Boolean(payload.hasMore));
        setNextCursor(payload.nextCursor ?? null);
        if (append) {
          setVisibleCount((current) => current + LOAD_MORE_STEP);
        } else {
          setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
        }
      } catch {
        setError("Error de conexion al cargar productos.");
        if (!append) {
          setProducts([]);
        }
        setHasMoreFromShopify(false);
        setNextCursor(null);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setCart(readLocalCartFromStorage());
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    function syncCartFromHash() {
      if (window.location.hash === "#carrito") {
        setCartOpen(true);
      }
    }

    syncCartFromHash();
    window.addEventListener("hashchange", syncCartFromHash);
    return () => window.removeEventListener("hashchange", syncCartFromHash);
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      setCart(readLocalCartFromStorage());
    };

    const syncFromEvent = (event: Event) => {
      const custom = event as CustomEvent<{ source?: string; openDrawer?: boolean }>;
      if (custom.detail?.source === LOCAL_CART_EVENT_SOURCE) {
        return;
      }
      syncFromStorage();
      if (custom.detail?.openDrawer) {
        setCartOpen(true);
      }
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(LOCAL_CART_EVENT, syncFromEvent as EventListener);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(LOCAL_CART_EVENT, syncFromEvent as EventListener);
    };
  }, []);

  const hasLiveCatalog = !loading && products.length > 0;
  const hasFatalError = !loading && Boolean(error) && products.length === 0;
  const displayProducts = useMemo(
    () => (hasLiveCatalog ? products : []),
    [hasLiveCatalog, products]
  );

  const availableProductsCount = useMemo(
    () => displayProducts.filter((product) => product.availableForSale).length,
    [displayProducts]
  );

  const filteredProducts = useMemo(() => {
    let nextProducts = [...displayProducts];
    const query = searchTerm.trim().toLowerCase();

    if (availabilityFilter === "in-stock") {
      nextProducts = nextProducts.filter((product) => product.availableForSale);
    }

    if (query) {
      nextProducts = nextProducts.filter((product) => {
        const title = product.title.toLowerCase();
        const description = product.descriptionShort.toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    }

    switch (sortBy) {
      case "price-asc":
        nextProducts.sort(
          (a, b) => getPriceNumber(a.priceAmount) - getPriceNumber(b.priceAmount)
        );
        break;
      case "price-desc":
        nextProducts.sort(
          (a, b) => getPriceNumber(b.priceAmount) - getPriceNumber(a.priceAmount)
        );
        break;
      case "name-asc":
        nextProducts.sort((a, b) => a.title.localeCompare(b.title, "es"));
        break;
      case "name-desc":
        nextProducts.sort((a, b) => b.title.localeCompare(a.title, "es"));
        break;
      default:
        break;
    }

    return nextProducts;
  }, [availabilityFilter, displayProducts, searchTerm, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const canLoadMoreCards = filteredProducts.length > visibleCount;
  const showShopifyPagination =
    hasLiveCatalog && hasMoreFromShopify && Boolean(nextCursor);
  const hasActiveFilters = Boolean(searchTerm.trim()) || availabilityFilter !== "all";

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
  const cartTotalAmount = cartSubtotalAmount;

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

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [searchTerm, sortBy, availabilityFilter]);

  async function addToCart(product: CatalogProduct) {
    if (!product.availableForSale) {
      setCartActionError("Este producto esta agotado y no se puede agregar.");
      setCartOpen(true);
      return;
    }

    setAddingProductId(product.id);
    setCartActionError(null);

    const lineId = product.variantId || product.id;
    setCart((current) => {
      const existing = current.lines.find((line) => line.id === lineId);
      if (existing) {
        const nextQuantity = existing.quantity + 1;
        return {
          lines: current.lines.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  quantity: nextQuantity,
                  lineTotalAmount: getLineTotalAmount(line.unitPriceAmount, nextQuantity),
                }
              : line
          ),
        };
      }

      const variantTitle = product.variantId ? "Variante seleccionada" : "Variante unica";
      return {
        lines: [
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
            lineTotalAmount: getLineTotalAmount(product.priceAmount, 1),
            lineTotalCurrency: product.priceCurrency,
            availableForSale: product.availableForSale,
            productUrl: product.productUrl,
          },
        ],
      };
    });
    setCartOpen(true);
    setAddingProductId(null);
  }

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

      window.location.href = payload.cart.checkoutUrl;
    } catch {
      setCartActionError("Error de conexion al crear checkout Shopify.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <section
      id="catalogo"
      className="catalog-section section-reveal mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-24 lg:px-8"
    >
      <div id="carrito" className="sr-only" aria-hidden="true">
        carrito
      </div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">
            Catalogo
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Catálogo All In One
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            {hasLiveCatalog
              ? "Productos en tiempo real desde Shopify."
              : "Conectando con catalogo real de Shopify."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="btn-premium px-5 py-2 text-sm font-semibold"
          >
            Carrito ({cartTotalQuantity})
          </button>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            className="btn-ghost px-5 py-2 text-sm font-semibold"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="glass-card mb-6 rounded-2xl border border-white/12 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.65fr_0.8fr]">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-gray-300">
              Buscar producto
            </span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ej: impresora, cenicero, ventilador..."
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-gray-300">
              Stock
            </span>
            <select
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(event.target.value as AvailabilityFilter)
              }
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"
            >
              <option value="all">Todos</option>
              <option value="in-stock">Solo disponibles</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-gray-300">
              Ordenar
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.11em] text-cyan-100">
            Cargados: {displayProducts.length}
          </span>
          <span className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.11em] text-emerald-100">
            Disponibles: {availableProductsCount}
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.11em] text-gray-200">
            Mostrando: {filteredProducts.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={`skeleton-${index}`}
              className="glass-card rounded-3xl border border-white/12 p-4"
            >
              <div className="h-52 animate-pulse rounded-2xl bg-white/10" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-9 animate-pulse rounded-full bg-white/10" />
                <div className="h-9 animate-pulse rounded-full bg-white/10" />
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && error && products.length === 0 ? (
        <div className="glass-card mb-5 rounded-2xl border border-amber-300/35 p-4">
          <p className="text-sm text-amber-100">{error}</p>
        </div>
      ) : null}

      {!loading && error && products.length > 0 ? (
        <div className="glass-card mb-5 rounded-2xl border border-amber-300/35 p-4">
          <p className="text-sm text-amber-100">
            {error} Se mantienen visibles los productos reales ya cargados.
          </p>
        </div>
      ) : null}

      {!loading && !hasFatalError && products.length === 0 ? (
        <div className="glass-card mb-5 rounded-2xl border border-white/12 p-4">
          <p className="text-sm text-gray-300">
            No hay productos publicados o disponibles en Shopify para este token.
          </p>
        </div>
      ) : null}

      {!loading && displayProducts.length > 0 && filteredProducts.length === 0 ? (
        <div className="glass-card mb-5 rounded-2xl border border-white/12 p-4">
          <p className="text-sm text-gray-300">
            No hay resultados con los filtros actuales. Ajusta busqueda, stock u orden.
          </p>
        </div>
      ) : null}

      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {visibleProducts.map((product) => {
            const detailHref = product.handle
              ? `/products/${product.handle}`
              : product.productUrl;
            return (
              <article
                key={product.id}
                className="glass-card catalog-card group rounded-3xl border border-white/12 p-3.5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45 sm:p-4"
              >
                <div className="catalog-image-shell overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    width={700}
                    height={700}
                    loading="lazy"
                    unoptimized
                    className="catalog-product-image h-40 w-full object-contain transition duration-500 group-hover:scale-[1.03] sm:h-52 sm:object-cover"
                  />
                </div>

                <div className="mt-4">
                  <h3 className="catalog-title-clamp text-base font-semibold text-white sm:text-lg">
                    {product.title}
                  </h3>
                  <p className="catalog-description-clamp mt-2 text-sm leading-relaxed text-gray-300">
                    {product.descriptionShort || "Descripcion disponible en ver detalles."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(product)}
                    className="mt-2 text-xs uppercase tracking-[0.1em] text-cyan-200/90 transition hover:text-cyan-100"
                  >
                    Ver detalles rapido
                  </button>
                  <div className="catalog-meta-row mt-3 flex items-center justify-between gap-2">
                    <p className="catalog-price text-xl font-semibold text-cyan-100 sm:text-lg">
                      {formatMoney(product.priceAmount, product.priceCurrency)}
                    </p>
                    <span
                      className={
                        product.availableForSale
                          ? "rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-emerald-100"
                          : "rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-gray-300"
                      }
                    >
                      {product.availableForSale ? "Disponible" : "Agotado"}
                    </span>
                  </div>
                </div>

                <div className="catalog-actions mt-4 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => void addToCart(product)}
                    disabled={addingProductId === product.id}
                    className="btn-premium px-3 py-2 text-center text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
                  >
                    {addingProductId === product.id ? "Agregando..." : "Agregar al carrito"}
                  </button>
                  <a
                    href={detailHref}
                    className="btn-ghost px-3 py-2 text-center text-xs font-semibold sm:text-sm"
                  >
                    Ver detalles
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {filteredProducts.length > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {canLoadMoreCards || showShopifyPagination ? (
            <button
              type="button"
              onClick={() => {
                if (canLoadMoreCards) {
                  setVisibleCount((current) =>
                    Math.min(current + LOAD_MORE_STEP, filteredProducts.length)
                  );
                  return;
                }
                if (showShopifyPagination && nextCursor && !loadingMore) {
                  void loadCatalog({ append: true, cursor: nextCursor });
                }
              }}
              disabled={loadingMore}
              className="btn-ghost px-6 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore
                ? "Cargando..."
                : canLoadMoreCards
                ? "Ver mas productos"
                : "Cargar mas desde Shopify"}
            </button>
          ) : null}
          {showShopifyPagination && !hasActiveFilters ? (
            <a
              href={CATALOG_FALLBACK_LINK}
              className="btn-premium px-6 py-2 text-sm font-semibold"
            >
              Abrir catalogo completo
            </a>
          ) : null}
        </div>
      ) : null}

      {quickViewProduct ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card w-full max-w-2xl rounded-3xl border border-white/15 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                {quickViewProduct.title}
              </h3>
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="btn-ghost px-3 py-1 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_1.05fr]">
              <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/30">
                <Image
                  src={quickViewProduct.imageUrl}
                  alt={quickViewProduct.imageAlt}
                  width={760}
                  height={760}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-sm leading-relaxed text-gray-300">
                  {quickViewProduct.descriptionShort ||
                    "Descripcion disponible en la ficha del producto."}
                </p>
                <p className="mt-4 text-xl font-semibold text-white">
                  {formatMoney(
                    quickViewProduct.priceAmount,
                    quickViewProduct.priceCurrency
                  )}
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void addToCart(quickViewProduct)}
                    disabled={addingProductId === quickViewProduct.id}
                    className="btn-premium px-4 py-2 text-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {addingProductId === quickViewProduct.id ? "Agregando..." : "Comprar / Ordenar"}
                  </button>
                  <a
                    href={
                      quickViewProduct.handle
                        ? `/products/${quickViewProduct.handle}`
                        : quickViewProduct.productUrl
                    }
                    className="btn-ghost px-4 py-2 text-center text-sm font-semibold"
                  >
                    Ver detalles
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar carrito"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/12 bg-[rgba(4,10,20,0.78)] p-5 shadow-[0_0_40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Carrito</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Tu orden Shopify</h3>
              </div>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs font-semibold"
                onClick={() => setCartOpen(false)}
              >
                Cerrar
              </button>
            </div>

            {cartActionError ? (
              <div className="mb-4 rounded-xl border border-amber-300/35 bg-amber-300/10 p-3 text-sm text-amber-100">
                {cartActionError}
              </div>
            ) : null}

            {cart.lines.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/12 p-5">
                <p className="text-sm text-gray-300">Tu carrito esta vacio. Agrega productos del catalogo para continuar.</p>
              </div>
            ) : null}

            {cart.lines.length > 0 ? (
              <>
                <div className="space-y-3">
                  {cart.lines.map((line) => (
                    <article
                      key={line.id}
                      className="glass-card rounded-2xl border border-white/12 p-3"
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
                          <h4 className="line-clamp-2 text-sm font-semibold text-white">
                            {line.title}
                          </h4>
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
                        <span>Subtotal linea</span>
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
                      {formatMoney(cartTotalAmount, cartCurrency)}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-gray-400">
                    Carrito local activo con checkout real de Shopify.
                  </p>

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
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
}


