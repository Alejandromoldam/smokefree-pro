"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CatalogProduct = {
  id: string;
  title: string;
  handle: string;
  imageUrl: string;
  imageAlt: string;
  priceAmount: string;
  priceCurrency: string;
  productUrl: string;
};

type CatalogApiResponse = {
  ok: boolean;
  error: string | null;
  products: CatalogProduct[];
};

type HighlightProduct = {
  label: string;
  keywords: string[];
};

const HIGHLIGHTS: HighlightProduct[] = [
  {
    label: "SmokeFree Pro",
    keywords: ["smokefree", "ashtray", "cenicero", "smoke free"],
  },
  {
    label: "Consola Retro R36S",
    keywords: ["r36s", "retro game console", "consola retro"],
  },
  {
    label: "Ventilador Holográfico 3D",
    keywords: ["holografico", "holográfico", "ventilador"],
  },
  {
    label: "Taza Inteligente Autoagitadora",
    keywords: ["taza", "autoagitadora", "mezcladora", "self stirring"],
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

function matchByKeywords(product: CatalogProduct, keywords: string[]) {
  const text = `${product.title} ${product.handle}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

export default function BestSellersSection() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const payload = (await response.json()) as CatalogApiResponse;
        if (!active) return;
        if (!response.ok || !payload.ok || !Array.isArray(payload.products)) {
          setProducts([]);
          return;
        }
        setProducts(payload.products);
      } catch {
        if (!active) return;
        setProducts([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const bestSellers = useMemo(() => {
    const selected: CatalogProduct[] = [];
    const usedIds = new Set<string>();

    for (const highlight of HIGHLIGHTS) {
      const found = products.find(
        (product) => !usedIds.has(product.id) && matchByKeywords(product, highlight.keywords)
      );
      if (found) {
        selected.push(found);
        usedIds.add(found.id);
      }
    }

    if (selected.length < 4) {
      const fallback = products.filter((product) => !usedIds.has(product.id)).slice(0, 4 - selected.length);
      for (const item of fallback) {
        selected.push(item);
      }
    }

    return selected.slice(0, 4);
  }, [products]);

  if (!loading && bestSellers.length === 0) {
    return null;
  }

  const renderItems: Array<CatalogProduct | null> = loading
    ? Array.from({ length: 4 }, () => null)
    : bestSellers;

  return (
    <section className="section-reveal mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8">
      <div className="mb-5 sm:mb-7">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">🔥 Más Vendidos</h2>
        <p className="mt-2 text-sm text-gray-300 sm:text-base">
          Los productos favoritos de nuestros clientes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {renderItems.map((product, index) => {
          if (!product) {
            return (
              <article
                key={`best-seller-skeleton-${index}`}
                className="glass-card rounded-3xl border border-white/12 p-3.5 sm:p-4"
              >
                <div className="h-44 animate-pulse rounded-2xl bg-white/10" />
                <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-9 animate-pulse rounded-full bg-white/10" />
              </article>
            );
          }

          const detailHref = product.handle
            ? `/products/${product.handle}`
            : product.productUrl || "/#catalogo";

          return (
            <article
              key={product.id}
              className="glass-card rounded-3xl border border-white/12 p-3.5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45 sm:p-4"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt || product.title}
                  width={700}
                  height={700}
                  unoptimized
                  className="h-40 w-full object-cover transition duration-500 hover:scale-[1.03] sm:h-44"
                />
              </div>

              <h3 className="mt-3 line-clamp-2 text-base font-semibold text-white sm:mt-4">
                {product.title}
              </h3>
              <p className="mt-2 text-lg font-semibold text-cyan-100">
                {formatMoney(product.priceAmount, product.priceCurrency || "MXN")}
              </p>

              <a
                href={detailHref}
                className="btn-ghost mt-4 inline-flex w-full items-center justify-center px-4 py-2 text-sm font-semibold leading-none"
              >
                Ver Detalles
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
