import type { Metadata } from "next";
import Link from "next/link";
import { getAllCollectionHandles, getSiteUrl } from "@/lib/shopifySeo";
import {
  buildBreadcrumbSchema,
  getStructuredDataSiteUrl,
  toJsonLd,
} from "@/lib/structuredData";

export const revalidate = 1800;

const FALLBACK_DESCRIPTION =
  "Explora el catalogo por categorias en Elora Skin y encuentra skincare premium con informacion actualizada para comprar con confianza.";

function compactText(text: string, maxLength = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return FALLBACK_DESCRIPTION;
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

export const metadata: Metadata = {
  title: "Catálogo por categorías",
  description: FALLBACK_DESCRIPTION,
  alternates: {
    canonical: "https://allinonestore.lat/categorias",
  },
  openGraph: {
    title: "Catálogo por categorías | Elora Skin",
    description: FALLBACK_DESCRIPTION,
    url: "https://allinonestore.lat/categorias",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo por categorías | Elora Skin",
    description: FALLBACK_DESCRIPTION,
  },
};

export default async function CategoriesIndexPage() {
  const siteUrl = getSiteUrl();
  const schemaSiteUrl = getStructuredDataSiteUrl();
  const categories = await getAllCollectionHandles(250);
  const breadcrumbJsonLd = toJsonLd(
    buildBreadcrumbSchema([
      { name: "Inicio", url: `${schemaSiteUrl}/` },
      { name: "Categorias", url: `${schemaSiteUrl}/categorias` },
    ])
  );

  return (
    <main className="elora-shop min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="elora-shop-eyebrow">Categorias</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Explora por categoria
          </h1>
          <p className="elora-shop-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            Selecciona una categoria para ver productos reales sincronizados desde
            Shopify en Elora Skin.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="elora-empty-card p-5">
            <p className="elora-empty-card-text">Muy pronto ✦ nueva colección</p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.handle}
                className="elora-shop-panel p-5 transition duration-300 hover:-translate-y-1"
              >
                <p className="elora-shop-eyebrow">Categoria</p>
                <h2 className="mt-2 text-xl font-semibold">
                  {category.title}
                </h2>
                <p className="elora-shop-muted mt-3 text-sm leading-relaxed">
                  {compactText(category.description, 140)}
                </p>
                <Link
                  href={`/categorias/${category.handle}`}
                  className="elora-pill is-outline mt-5"
                >
                  Ver categoria
                </Link>
              </article>
            ))}
          </section>
        )}

        <p className="elora-shop-muted mt-10 text-xs">
          Canonical: {siteUrl}/categorias
        </p>
      </div>
    </main>
  );
}
