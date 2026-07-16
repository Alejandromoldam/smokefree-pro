"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { NavbarCartButtonWithHref } from "@/components/NavbarCartButton";
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

const productReviewCards: Array<{
  name: string;
  location: string;
  comment: string;
  avatar: string;
  rating: number;
}> = [
  {
    name: "Carla M.",
    location: "Guadalajara, MX",
    comment:
      "Me gusto la calidad del producto y la rapidez para concretar la compra. Todo muy profesional.",
    avatar: "https://i.pravatar.cc/160?img=38",
    rating: 5,
  },
  {
    name: "Ricardo T.",
    location: "Medellin, CO",
    comment:
      "La pagina de producto explica muy bien todo. Agregar al carrito fue instantaneo y seguro.",
    avatar: "https://i.pravatar.cc/160?img=22",
    rating: 5,
  },
  {
    name: "Fernanda V.",
    location: "CDMX, MX",
    comment:
      "Excelente experiencia desde celular. El checkout fue rapido y el soporte respondio al momento.",
    avatar: "https://i.pravatar.cc/160?img=48",
    rating: 5,
  },
  {
    name: "Nicolas A.",
    location: "Buenos Aires, AR",
    comment:
      "Me dio confianza ver toda la info del producto. Llego en tiempo y en perfectas condiciones.",
    avatar: "https://i.pravatar.cc/160?img=14",
    rating: 5,
  },
  {
    name: "Paula G.",
    location: "Lima, PE",
    comment:
      "Diseño premium, proceso claro y producto muy bien presentado. Volveria a comprar sin duda.",
    avatar: "https://i.pravatar.cc/160?img=33",
    rating: 5,
  },
  {
    name: "Esteban R.",
    location: "Santiago, CL",
    comment:
      "Compra verificada y sin fricciones. La integracion de pago se nota robusta y confiable.",
    avatar: "https://i.pravatar.cc/160?img=61",
    rating: 5,
  },
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

function ReviewStarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="m10 2.4 2.2 4.4 4.9.7-3.5 3.4.8 4.9-4.4-2.3-4.4 2.3.8-4.9-3.5-3.4 4.9-.7L10 2.4Z" fill="currentColor" />
    </svg>
  );
}

function VerifiedBadgeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m6.2 10.2 2.2 2.2 5.3-5.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
      return { url: "/producto-real.png", altText: "Producto All In One Store" };
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
    <main className="premium-shell min-h-[100svh] bg-transparent text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pb-[calc(6.8rem+env(safe-area-inset-bottom))] pt-14 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="btn-ghost inline-flex px-4 py-2 text-sm font-semibold">Volver al catalogo</Link>
          <NavbarCartButtonWithHref href="/cart" />
        </div>

        {loading ? (
          <div className="glass-card rounded-3xl border border-white/12 p-8">
            <div className="h-6 w-56 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-4 w-72 animate-pulse rounded bg-white/10" />
            <div className="mt-8 h-[22rem] animate-pulse rounded-2xl bg-white/10" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="glass-card rounded-3xl border border-red-300/35 p-8 text-center">
            <p className="text-red-100">{error}</p>
            <Link href="/" className="btn-premium mt-4 inline-flex px-6 py-2 text-sm font-semibold">Ir al inicio</Link>
          </div>
        ) : null}

        {!loading && !error && product ? (
          <>
            <section className="glass-card grid gap-8 rounded-3xl border border-white/12 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/30 p-3">
                  <Image src={currentImage.url} alt={currentImage.altText} width={1200} height={1200} unoptimized className="h-auto w-full rounded-2xl object-cover" />
                </div>

                {product.images.length > 1 ? (
                  <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                    {product.images.map((image, index) => (
                      <button key={`${image.url}-${index}`} type="button" onClick={() => setActiveImage(index)} className={index === activeImage ? "overflow-hidden rounded-xl border border-cyan-300/50" : "overflow-hidden rounded-xl border border-white/12 opacity-80 transition hover:opacity-100"}>
                        <Image src={image.url} alt={image.altText} width={280} height={280} unoptimized className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}

                {product.videos && product.videos.length > 0 ? (
                  <div className="mt-6">
                    <p className="mb-3 text-xs uppercase tracking-[0.15em] text-cyan-200/85">Videos del producto</p>
                    <div className="grid gap-4">
                      {product.videos.map((video, index) => {
                        const src = video.sources.find((s) => s.mimeType.includes("mp4")) || video.sources[0];
                        if (!src?.url) return null;
                        return (
                          <video key={`video-${index}`} controls playsInline poster={video.previewImageUrl || undefined} className="w-full rounded-2xl border border-white/12 bg-black/30" aria-label={video.alt}>
                            {video.sources.map((s) => <source key={s.url} src={s.url} type={s.mimeType} />)}
                          </video>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85">Producto</p>
                <h1 className="mt-3 break-words text-2xl font-semibold leading-tight text-white sm:text-4xl">{product.title}</h1>
                <p className="mt-4 text-2xl font-semibold text-white">{formatMoney(selectedVariant?.priceAmount || product.priceAmount, selectedVariant?.priceCurrency || product.priceCurrency)}</p>

                <div className="mt-4 rounded-2xl border border-white/12 bg-black/30 p-4">
                  <div className="grid gap-2">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-white"><span className="text-emerald-300">✓</span>{inventoryText}</p>
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-white"><span className="text-emerald-300">✓</span>Envío rápido</p>
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-white"><span className="text-emerald-300">✓</span>Pago seguro</p>
                  </div>
                </div>

                {product.variants.length > 1 ? (
                  <div className="mt-4">
                    <label className="text-xs uppercase tracking-[0.12em] text-gray-400">Variante</label>
                    <select value={selectedVariant?.id || ""} onChange={(e) => setSelectedVariantId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/50">
                      {product.variants.map((v) => <option key={v.id} value={v.id}>{v.title} - {formatMoney(v.priceAmount, v.priceCurrency)}</option>)}
                    </select>
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-400">Cantidad</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/35 p-1">
                    <button type="button" onClick={() => setQuantity((c) => Math.max(1, c - 1))} className="btn-ghost px-3 py-1 text-xs font-semibold">-</button>
                    <span className="min-w-10 text-center text-sm font-semibold text-white">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((c) => Math.min(maxQuantity, c + 1))} className="btn-ghost px-3 py-1 text-xs font-semibold">+</button>
                  </div>
                </div>

                {cartMessage ? <div className="mt-4 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">{cartMessage}</div> : null}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => void addToCart()} disabled={addingToCart || !selectedVariant?.availableForSale} className="btn-premium px-6 py-3.5 text-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70">
                    {addingToCart ? "Agregando..." : "Agregar al carrito"}
                  </button>
                  <a href={buyNowUrl} target="_blank" rel="noreferrer" onClick={trackBuyNowIntent} className="btn-ghost px-6 py-3.5 text-center text-sm font-semibold">Comprar ahora</a>
                </div>

                <div className="product-description-rich mt-6 text-sm text-gray-300 sm:text-base" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-gray-400">{product.vendor || "All In One"} - {product.productType || "Tecnologia premium"}</p>

                <section className="glass-card mt-6 rounded-2xl border border-cyan-300/20 bg-black/35 p-4">
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-cyan-200/85">Confianza premium</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {productTrustSignals.map((signal) => (
                      <article key={signal.title} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 shadow-[0_0_0_1px_rgba(34,211,238,0.08)_inset]">
                        <div className="flex items-center gap-2 text-cyan-100">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-200/30 bg-cyan-300/10"><TrustSignalIcon icon={signal.icon} className="h-4 w-4" /></span>
                          <span className="text-xs font-medium text-gray-100">{signal.title}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85">Recomendados</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">También te puede interesar</h2>
              </div>
              {loadingRelated ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <article key={`sk-${i}`} className="glass-card rounded-3xl border border-white/12 p-4">
                      <div className="h-44 animate-pulse rounded-2xl bg-white/10" />
                      <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-white/10" />
                      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-white/10" />
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="h-9 animate-pulse rounded-full bg-white/10" />
                        <div className="h-9 animate-pulse rounded-full bg-white/10" />
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
              {!loadingRelated && relatedError ? <div className="glass-card rounded-2xl border border-amber-300/35 p-4"><p className="text-sm text-amber-100">{relatedError}</p></div> : null}
              {!loadingRelated && !relatedError && relatedProducts.length === 0 ? <div className="glass-card rounded-2xl border border-white/12 p-4"><p className="text-sm text-gray-300">No hay recomendaciones disponibles.</p></div> : null}
              {!loadingRelated && relatedProducts.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {relatedProducts.map((related) => (
                    <article key={related.id} className="glass-card rounded-3xl border border-white/12 p-4">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <Image src={related.imageUrl} alt={related.imageAlt} width={700} height={700} unoptimized className="h-44 w-full object-cover" />
                      </div>
                      <h3 className="mt-4 line-clamp-2 text-base font-semibold text-white">{related.title}</h3>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-lg font-semibold text-cyan-100">{formatMoney(related.priceAmount, related.priceCurrency)}</p>
                        <span className={related.availableForSale ? "rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-emerald-100" : "rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-gray-300"}>
                          {related.availableForSale ? "Disponible" : "Agotado"}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => void addRelatedToCart(related)} disabled={addingRelatedId === related.id || !related.availableForSale || !related.variantId} className="btn-premium card-action-button disabled:cursor-not-allowed disabled:opacity-70">
                          <span className="card-action-label">{addingRelatedId === related.id ? "Agregando..." : "Agregar al carrito"}</span>
                        </button>
                        <Link href={related.handle ? `/products/${related.handle}` : related.productUrl} className="btn-ghost card-action-button">
                          <span className="card-action-label">Ver detalles</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85">Opiniones de clientes</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Lo que dicen quienes ya compraron</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {productReviewCards.map((review) => (
                  <article key={`${review.name}-${review.location}`} className="glass-card rounded-3xl border border-white/12 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-200/25 bg-gradient-to-br from-cyan-300/20 to-emerald-300/10 p-[1px]">
                        <Image src={review.avatar} alt={`Foto de ${review.name}`} width={88} height={88} className="h-full w-full rounded-full border border-white/15 object-cover" loading="lazy" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{review.name}</p>
                        <p className="text-xs text-gray-400">{review.location}</p>
                      </div>
                    </div>
                    <div className="mb-3 inline-flex items-center gap-1 text-amber-300">
                      {Array.from({ length: review.rating }).map((_, idx) => <ReviewStarIcon key={`${review.name}-${idx}`} />)}
                    </div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.13em] text-emerald-100">
                      <VerifiedBadgeIcon />Compra verificada
                    </div>
                    <p className="text-sm leading-relaxed text-gray-200 sm:text-base">&ldquo;{review.comment}&rdquo;</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>

      {!loading && !error && product ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/12 bg-[#05070c]/97 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-300">{shortenTitle(product.title, 34)}</p>
              <p className="text-base font-semibold text-white">{formatMoney(selectedVariant?.priceAmount || product.priceAmount, selectedVariant?.priceCurrency || product.priceCurrency)}</p>
            </div>
            <button type="button" onClick={() => void addToCart()} disabled={addingToCart || !selectedVariant?.availableForSale} className="btn-ghost shrink-0 px-4 py-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70">
              {addingToCart ? "..." : "Agregar"}
            </button>
            <a href={buyNowUrl} target="_blank" rel="noreferrer" onClick={trackBuyNowIntent} className="btn-premium shrink-0 px-5 py-3 text-center text-xs font-semibold">Comprar ahora</a>
          </div>
        </div>
      ) : null}
    </main>
  );
}
