"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PillButton from "@/components/elora/PillButton";
import RevealOnScroll from "@/components/elora/RevealOnScroll";
import EloraCartLink from "@/components/elora/EloraCartLink";
import { LightningIcon } from "@/components/elora/Icons";
import { trackAddToCart, trackBeginCheckout, trackViewItem } from "@/lib/ga";

type ProductImage = {
  url: string;
  altText: string;
};

type ProductVideoSource = {
  url: string;
  mimeType: string;
};

type ProductVideo = {
  sources: ProductVideoSource[];
  previewImageUrl: string | null;
  alt: string;
};

type ProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  quantityAvailable: number | null;
  availableForSale: boolean;
  priceAmount: string;
  priceCurrency: string;
};

type ProductPayload = {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  availableForSale: boolean;
  vendor: string;
  productType: string;
  priceAmount: string;
  priceCurrency: string;
  selectedVariantId: string | null;
  selectedVariantSku: string | null;
  selectedVariantInventory: number | null;
  variants: ProductVariant[];
  images: ProductImage[];
  videos: ProductVideo[];
  productUrl: string;
  buyNowUrl: string;
};

type ProductApiResponse = {
  ok: boolean;
  error: string | null;
  product?: ProductPayload;
};

type RelatedCatalogProduct = {
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
};

type CatalogApiResponse = {
  ok: boolean;
  error: string | null;
  products: RelatedCatalogProduct[];
};

type CartApiResponse = {
  ok: boolean;
  error: string | null;
  cart: {
    id: string;
    checkoutUrl: string;
    totalQuantity: number;
  } | null;
};

type LocalCartLine = {
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

type LocalCartPayload = {
  lines: LocalCartLine[];
};

const LOCAL_CART_STORAGE_KEY = "sf_local_cart_v1";
const LOCAL_CART_EVENT = "sf-local-cart-updated";
const CART_DRAWER_EVENT = "sf-cart-drawer-visibility";
const LOCAL_CART_EVENT_SOURCE = "product-detail";

type TrustSignalIconType =
  | "shield"
  | "truck"
  | "spark"
  | "support"
  | "lock"
  | "badge";

const productTrustSignals: Array<{
  title: string;
  icon: TrustSignalIconType;
}> = [
  { title: "Pago seguro con Shopify", icon: "shield" },
  { title: "Envios internacionales", icon: "truck" },
  { title: "Garantia de satisfaccion", icon: "spark" },
  { title: "Soporte especializado", icon: "support" },
  { title: "Checkout cifrado", icon: "lock" },
  { title: "Productos verificados", icon: "badge" },
];

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

function extractVariantNumericId(variantGid: string | undefined) {
  if (!variantGid) return null;
  const match = variantGid.match(/\/(\d+)(?:\?.*)?$/);
  return match?.[1] ?? null;
}

function getPriceNumber(amount: string) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
}

function getLineTotalAmount(unitPriceAmount: string, quantity: number) {
  return (getPriceNumber(unitPriceAmount) * Math.max(1, quantity)).toFixed(2);
}

function shuffleProducts<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortenTitle(title: string, maxLength = 38) {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function TrustSignalIcon({
  icon,
  className = "",
}: {
  icon: TrustSignalIconType;
  className?: string;
}) {
  if (icon === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M12 3 4.8 6.1V11c0 4.9 3 8.4 7.2 10 4.2-1.6 7.2-5.1 7.2-10V6.1L12 3Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="m8.7 12.1 2.1 2 4.5-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "truck") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M3 7.5h11v7.3H3V7.5Zm11 2.2h3l3 3v2.1h-6V9.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="7.4" cy="16.9" r="1.4" fill="currentColor" />
        <circle cx="17.5" cy="16.9" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (icon === "spark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M12 3.8 14.3 9l5.2 2.3-5.2 2.3L12 18.8l-2.3-5.2-5.2-2.3L9.7 9 12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "support") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M4 11a8 8 0 0 1 16 0v4.5a2 2 0 0 1-2 2h-2.3v-5.7H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 11h4.3v5.7H6a2 2 0 0 1-2-2V11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "lock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <rect x="5.4" y="10.3" width="13.2" height="10.2" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.8 10.3V8.5A3.2 3.2 0 0 1 12 5.3a3.2 3.2 0 0 1 3.2 3.2v1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.9 12 1.9 1.9 4.3-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProductPage() {
  const params = useParams<{ handle: string }>();
  const handle = params?.handle || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedCatalogProduct[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [addingRelatedId, setAddingRelatedId] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const trackedViewProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      if (!handle) return;
      setLoading(true);
      setError(null);
      setCartMessage(null);
      try {
        const response = await fetch(`/api/product/${handle}`, { cache: "no-store" });
        const payload = (await response.json()) as ProductApiResponse;
        if (!active) return;
        if (!response.ok || !payload.ok || !payload.product) {
          setError(payload.error || "No se pudo cargar el producto.");
          setProduct(null);
          return;
        }
        setProduct(payload.product);
        setSelectedVariantId(payload.product.selectedVariantId || payload.product.variants[0]?.id || "");
        setQuantity(1);
        setActiveImage(0);
      } catch {
        if (!active) return;
        setError("Error de conexion al cargar el producto.");
        setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProduct();
    return () => { active = false; };
  }, [handle]);

  const currentImage = useMemo(() => {
    if (!product?.images?.length) {
      return { url: "/producto-real.png", altText: "Producto Elora Skin" };
    }
    return product.images[Math.min(activeImage, product.images.length - 1)];
  }, [activeImage, product]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  }, [product, selectedVariantId]);

  const descriptionHtml = useMemo(() => {
    const rich = product?.descriptionHtml?.trim() || "";
    if (rich) return rich;
    const plain = product?.description?.trim() || "";
    if (!plain) return "<p>Este producto no tiene descripcion publica todavia.</p>";
    return plain.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((b) => `<p>${escapeHtml(b).replace(/\n/g, "<br />")}</p>`).join("");
  }, [product]);

  const buyNowUrl = useMemo(() => {
    if (!product) return "#";
    const numericVariantId = extractVariantNumericId(selectedVariant?.id);
    if (!numericVariantId) return product.productUrl;
    return `https://all-in-one-22092396.myshopify.com/cart/${numericVariantId}:${quantity}`;
  }, [product, selectedVariant, quantity]);

  const maxQuantity = useMemo(() => {
    if (!selectedVariant?.availableForSale) return 1;
    if (selectedVariant.quantityAvailable === null) return 99;
    return Math.max(1, selectedVariant.quantityAvailable);
  }, [selectedVariant]);

  useEffect(() => {
    setQuantity((c) => Math.max(1, Math.min(c, maxQuantity)));
  }, [maxQuantity]);

  const inventoryText = useMemo(() => {
    if (selectedVariant?.availableForSale === true) return "Disponible";
    if (selectedVariant?.availableForSale === false) return "Agotado";
    if (product?.availableForSale === true) return "Disponible";
    if (product?.availableForSale === false) return "Agotado";
    if ((product?.variants?.length || 0) > 0) return "En stock";
    return "Agotado";
  }, [product, selectedVariant]);

  useEffect(() => {
    if (!product?.id || trackedViewProductIdRef.current === product.id) return;
    trackViewItem({
      currency: selectedVariant?.priceCurrency || product.priceCurrency,
      value: getPriceNumber(selectedVariant?.priceAmount || product.priceAmount),
      items: [{ item_id: selectedVariant?.id || product.id, item_name: product.title, item_variant: selectedVariant?.title || undefined, currency: selectedVariant?.priceCurrency || product.priceCurrency, price: getPriceNumber(selectedVariant?.priceAmount || product.priceAmount), quantity: 1 }],
    });
    trackedViewProductIdRef.current = product.id;
  }, [product?.id, product?.title, product?.priceAmount, product?.priceCurrency, selectedVariant?.id, selectedVariant?.title, selectedVariant?.priceAmount, selectedVariant?.priceCurrency]);

  function trackBuyNowIntent() {
    if (!product) return;
    const safeQty = Math.max(1, Math.min(quantity, maxQuantity));
    const baseAmount = getPriceNumber(selectedVariant?.priceAmount || product.priceAmount);
    const currency = selectedVariant?.priceCurrency || product.priceCurrency;
    trackBeginCheckout({ currency, value: baseAmount * safeQty, items: [{ item_id: selectedVariant?.id || product.id, item_name: product.title, item_variant: selectedVariant?.title || undefined, currency, price: baseAmount, quantity: safeQty }] });
  }

  useEffect(() => {
    const sync = () => setCartDrawerOpen(window.location.hash === "#carrito");
    const onDrawer = (e: Event) => {
      const ce = e as CustomEvent<{ open?: boolean }>;
      if (typeof ce.detail?.open === "boolean") setCartDrawerOpen(ce.detail.open);
      else sync();
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener(CART_DRAWER_EVENT, onDrawer as EventListener);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener(CART_DRAWER_EVENT, onDrawer as EventListener); };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRelated() {
      if (!product?.id) { setRelatedProducts([]); setRelatedError(null); return; }
      setLoadingRelated(true); setRelatedError(null);
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        const payload = (await res.json()) as CatalogApiResponse;
        if (!active) return;
        if (!res.ok || !payload.ok) { setRelatedProducts([]); setRelatedError(payload.error || "Error al cargar relacionados."); return; }
        const candidates = (payload.products || []).filter((i) => i.id !== product.id && i.handle !== product.handle);
        const randomized = shuffleProducts(candidates);
        setRelatedProducts(randomized.slice(0, randomized.length >= 4 ? (Math.random() < 0.5 ? 3 : 4) : randomized.length));
      } catch { if (!active) return; setRelatedProducts([]); setRelatedError("Error de conexion."); }
      finally { if (active) setLoadingRelated(false); }
    }
    void loadRelated();
    return () => { active = false; };
  }, [product?.handle, product?.id]);

  function syncLocalCartLine(options: { lineId: string; merchandiseId?: string; quantityToAdd: number; title: string; variantTitle: string; imageUrl: string; imageAlt: string; unitPriceAmount: string; unitPriceCurrency: string; availableForSale: boolean; productUrl: string; }) {
    const raw = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalCartPayload) : { lines: [] };
    const currentLines = Array.isArray(parsed?.lines) ? parsed.lines : [];
    const existing = currentLines.find((l) => l.id === options.lineId);
    const nextLines = existing
      ? currentLines.map((l) => l.id !== options.lineId ? l : { ...l, quantity: l.quantity + options.quantityToAdd, lineTotalAmount: getLineTotalAmount(l.unitPriceAmount, l.quantity + options.quantityToAdd) })
      : [...currentLines, { id: options.lineId, merchandiseId: options.merchandiseId, quantity: options.quantityToAdd, title: options.title, variantTitle: options.variantTitle, imageUrl: options.imageUrl, imageAlt: options.imageAlt, unitPriceAmount: options.unitPriceAmount, unitPriceCurrency: options.unitPriceCurrency, lineTotalAmount: getLineTotalAmount(options.unitPriceAmount, options.quantityToAdd), lineTotalCurrency: options.unitPriceCurrency, availableForSale: options.availableForSale, productUrl: options.productUrl }];
    window.localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify({ lines: nextLines }));
    window.dispatchEvent(new CustomEvent(LOCAL_CART_EVENT, { detail: { quantity: nextLines.reduce((a, l) => a + l.quantity, 0), source: LOCAL_CART_EVENT_SOURCE, openDrawer: true } }));
  }

  async function addToCart() {
    if (!product || !selectedVariant?.id) { setCartMessage("No hay variante valida."); return; }
    if (!selectedVariant.availableForSale) { setCartMessage("Esta variante esta agotada."); return; }
    setAddingToCart(true); setCartMessage(null);
    const safeQty = Math.max(1, Math.min(quantity, maxQuantity));
    try {
      const res = await fetch("/api/cart/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchandiseId: selectedVariant.id, quantity: safeQty }) });
      const payload = (await res.json()) as CartApiResponse;
      if (!res.ok || !payload.ok || !payload.cart?.id) { setCartMessage(payload.error || "No se pudo agregar al carrito."); return; }
      syncLocalCartLine({ lineId: selectedVariant.id, merchandiseId: selectedVariant.id, quantityToAdd: safeQty, title: product.title, variantTitle: selectedVariant.title || "Variante", imageUrl: currentImage.url, imageAlt: currentImage.altText, unitPriceAmount: selectedVariant.priceAmount, unitPriceCurrency: selectedVariant.priceCurrency, availableForSale: selectedVariant.availableForSale, productUrl: product.productUrl });
      trackAddToCart({ currency: selectedVariant.priceCurrency, value: getPriceNumber(selectedVariant.priceAmount) * safeQty, items: [{ item_id: selectedVariant.id, item_name: product.title, item_variant: selectedVariant.title || undefined, currency: selectedVariant.priceCurrency, price: getPriceNumber(selectedVariant.priceAmount), quantity: safeQty }] });
      setCartMessage(safeQty > 1 ? `Se agregaron ${safeQty} unidades al carrito.` : "Producto agregado al carrito correctamente.");
    } catch { setCartMessage("No se pudo conectar con Shopify."); }
    finally { setAddingToCart(false); }
  }

  async function addRelatedToCart(related: RelatedCatalogProduct) {
    if (!related.availableForSale) { setCartMessage("Este producto esta agotado."); return; }
    if (!related.variantId) { setCartMessage("No se encontro variante valida."); return; }
    setAddingRelatedId(related.id); setCartMessage(null);
    try {
      const res = await fetch("/api/cart/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchandiseId: related.variantId, quantity: 1 }) });
      const payload = (await res.json()) as CartApiResponse;
      if (!res.ok || !payload.ok || !payload.cart?.id) { setCartMessage(payload.error || "No se pudo agregar al carrito."); return; }
      syncLocalCartLine({ lineId: related.variantId, merchandiseId: related.variantId, quantityToAdd: 1, title: related.title, variantTitle: "Variante seleccionada", imageUrl: related.imageUrl, imageAlt: related.imageAlt, unitPriceAmount: related.priceAmount, unitPriceCurrency: related.priceCurrency, availableForSale: related.availableForSale, productUrl: related.productUrl });
      trackAddToCart({ currency: related.priceCurrency, value: getPriceNumber(related.priceAmount), items: [{ item_id: related.variantId, item_name: related.title, item_variant: "Variante seleccionada", currency: related.priceCurrency, price: getPriceNumber(related.priceAmount), quantity: 1 }] });
      setCartMessage(`"${related.title}" fue agregado al carrito correctamente.`);
    } catch { setCartMessage("No se pudo conectar con Shopify."); }
    finally { setAddingRelatedId(null); }
  }

  return (
    <main className="elora-shop relative min-h-[100svh]">
      <div className="elora-bg" aria-hidden="true" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-[calc(6.8rem+env(safe-area-inset-bottom))] pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="elora-pill is-outline elora-shop-cta-sm">
            <span className="elora-pill-label">Volver al catálogo</span>
          </Link>
          <EloraCartLink />
        </div>

        {loading ? (
          <div className="elora-shop-panel p-8">
            <div className="elora-shop-skeleton h-6 w-56" />
            <div className="elora-shop-skeleton mt-4 h-4 w-72" />
            <div className="elora-shop-skeleton mt-8 h-[22rem]" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="elora-shop-panel p-8 text-center">
            <p className="text-[#b3244f]">{error}</p>
            <Link href="/" className="elora-pill elora-shop-cta-sm mt-4">
              <span className="elora-pill-label">Ir al inicio</span>
            </Link>
          </div>
        ) : null}

        {!loading && !error && product ? (
          <>
            <RevealOnScroll as="section" className="elora-shop-panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="elora-shop-media overflow-hidden p-3">
                  <Image src={currentImage.url} alt={currentImage.altText} width={1200} height={1200} priority className="h-auto w-full rounded-2xl object-cover" />
                </div>

                {product.images.length > 1 ? (
                  <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {product.images.map((image, index) => (
                      <button key={`${image.url}-${index}`} type="button" onClick={() => setActiveImage(index)} className={index === activeImage ? "elora-shop-thumb is-active" : "elora-shop-thumb"}>
                        <Image src={image.url} alt={image.altText} width={280} height={280} className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {product.videos && product.videos.length > 0 ? (
                  <div className="mt-6">
                    <p className="elora-shop-eyebrow mb-3">Videos del producto</p>
                    <div className="grid gap-4">
                      {product.videos.map((video, index) => {
                        const src = video.sources.find((s) => s.mimeType.includes("mp4")) || video.sources[0];
                        if (!src?.url) return null;
                        return (
                          <video key={`video-${index}`} controls playsInline poster={video.previewImageUrl || undefined} className="elora-shop-media w-full" aria-label={video.alt}>
                            {video.sources.map((s) => <source key={s.url} src={s.url} type={s.mimeType} />)}
                          </video>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="elora-shop-eyebrow">Producto</p>
                <h1 className="mt-3 break-words text-2xl font-semibold leading-tight sm:text-4xl">{product.title}</h1>
                <p className="elora-shop-price mt-4 text-2xl">{formatMoney(selectedVariant?.priceAmount || product.priceAmount, selectedVariant?.priceCurrency || product.priceCurrency)}</p>

                {typeof selectedVariant?.quantityAvailable === "number" && selectedVariant.quantityAvailable > 0 && selectedVariant.quantityAvailable <= 10 ? (
                  <p className="elora-shop-lowstock mt-3">
                    <LightningIcon className="h-3.5 w-3.5" />
                    {selectedVariant.quantityAvailable === 1 ? "¡Última unidad disponible!" : `¡Últimas ${selectedVariant.quantityAvailable} unidades disponibles!`}
                  </p>
                ) : null}

                <div className="elora-shop-soft mt-4 p-4">
                  <div className="grid gap-2">
                    <p className="inline-flex items-center gap-2 text-sm font-medium"><span className="elora-shop-check">✓</span>{inventoryText}</p>
                    <p className="inline-flex items-center gap-2 text-sm font-medium"><span className="elora-shop-check">✓</span>Envío rápido</p>
                    <p className="inline-flex items-center gap-2 text-sm font-medium"><span className="elora-shop-check">✓</span>Pago seguro</p>
                  </div>
                </div>

                {product.variants.length > 1 ? (
                  <div className="mt-4">
                    <label className="elora-shop-eyebrow">Variante</label>
                    <select value={selectedVariant?.id || ""} onChange={(e) => setSelectedVariantId(e.target.value)} className="elora-shop-select mt-2">
                      {product.variants.map((v) => <option key={v.id} value={v.id}>{v.title} - {formatMoney(v.priceAmount, v.priceCurrency)}</option>)}
                    </select>
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="elora-shop-eyebrow">Cantidad</p>
                  <div className="elora-shop-qty mt-2">
                    <button type="button" onClick={() => setQuantity((c) => Math.max(1, c - 1))} className="elora-shop-qty-btn" aria-label="Disminuir cantidad">-</button>
                    <span className="elora-shop-qty-value">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((c) => Math.min(maxQuantity, c + 1))} className="elora-shop-qty-btn" aria-label="Aumentar cantidad">+</button>
                  </div>
                </div>

                {cartMessage ? <div className="elora-shop-msg mt-4">{cartMessage}</div> : null}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <PillButton onClick={() => void addToCart()} disabled={addingToCart || !selectedVariant?.availableForSale} className="elora-shop-cta">
                    {addingToCart ? "Agregando..." : "Agregar al carrito"}
                  </PillButton>
                  <PillButton href={buyNowUrl} target="_blank" rel="noreferrer" onClick={trackBuyNowIntent} variant="outline" className="elora-shop-cta">
                    Comprar ahora
                  </PillButton>
                </div>

                <div className="product-description-rich mt-6 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                <p className="elora-shop-eyebrow mt-4">{product.vendor || "Elora Skin"} - {product.productType || "Skincare premium"}</p>

                <div className="elora-shop-soft mt-6 p-4">
                  <p className="elora-shop-eyebrow">Confianza Elora</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {productTrustSignals.map((signal) => (
                      <article key={signal.title} className="elora-shop-trust-item">
                        <span className="elora-shop-trust-ico"><TrustSignalIcon icon={signal.icon} className="h-4 w-4" /></span>
                        <span>{signal.title}</span>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll as="section" className="mt-14">
              <div className="mb-6 text-center">
                <p className="elora-shop-eyebrow">Recomendados</p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">También te puede interesar</h2>
              </div>
              {loadingRelated ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <article key={`sk-${i}`} className="elora-shop-card p-4">
                      <div className="elora-shop-skeleton h-44" />
                      <div className="elora-shop-skeleton mt-4 h-4 w-4/5" />
                      <div className="elora-shop-skeleton mt-3 h-4 w-1/3" />
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="elora-shop-skeleton h-9 rounded-full" />
                        <div className="elora-shop-skeleton h-9 rounded-full" />
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
              {!loadingRelated && relatedError ? <div className="elora-shop-soft p-4"><p className="elora-shop-muted text-sm">{relatedError}</p></div> : null}
              {!loadingRelated && !relatedError && relatedProducts.length === 0 ? <div className="elora-empty-card p-4"><p className="elora-empty-card-text">Muy pronto ✦ nueva colección</p></div> : null}
              {!loadingRelated && relatedProducts.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {relatedProducts.map((related) => (
                    <article key={related.id} className="elora-shop-card flex flex-col p-4">
                      <div className="elora-shop-media overflow-hidden">
                        <Image src={related.imageUrl} alt={related.imageAlt} width={700} height={700} className="h-44 w-full object-cover" />
                      </div>
                      <h3 className="elora-shop-card-title mt-4 line-clamp-2 text-base font-semibold">{related.title}</h3>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="elora-shop-price text-lg">{formatMoney(related.priceAmount, related.priceCurrency)}</p>
                        <span className={related.availableForSale ? "elora-shop-badge-ok" : "elora-shop-badge-off"}>
                          {related.availableForSale ? "Disponible" : "Agotado"}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <PillButton onClick={() => void addRelatedToCart(related)} disabled={addingRelatedId === related.id || !related.availableForSale || !related.variantId} className="elora-shop-cta elora-shop-cta-sm">
                          {addingRelatedId === related.id ? "Agregando..." : "Agregar"}
                        </PillButton>
                        <Link href={related.handle ? `/products/${related.handle}` : related.productUrl} className="elora-pill is-outline elora-shop-cta elora-shop-cta-sm">
                          <span className="elora-pill-label">Ver detalles</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </RevealOnScroll>
          </>
        ) : null}
      </div>

      {!loading && !error && product ? (
        <div className="elora-shop-stickybar fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="elora-shop-muted truncate text-xs font-medium">{shortenTitle(product.title, 34)}</p>
              <p className="elora-shop-price text-base">{formatMoney(selectedVariant?.priceAmount || product.priceAmount, selectedVariant?.priceCurrency || product.priceCurrency)}</p>
            </div>
            <PillButton onClick={() => void addToCart()} disabled={addingToCart || !selectedVariant?.availableForSale} variant="outline" className="elora-shop-cta-sm shrink-0">
              {addingToCart ? "..." : "Agregar"}
            </PillButton>
            <PillButton href={buyNowUrl} target="_blank" rel="noreferrer" onClick={trackBuyNowIntent} className="elora-shop-cta-sm shrink-0">
              Comprar
            </PillButton>
          </div>
        </div>
      ) : null}
    </main>
  );
}
