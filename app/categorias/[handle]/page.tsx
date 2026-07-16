import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCollectionHandles,
  getCollectionByHandle,
  getSiteUrl,
} from "@/lib/shopifySeo";
import {
  buildBreadcrumbSchema,
  getStructuredDataSiteUrl,
  toJsonLd,
} from "@/lib/structuredData";

export const revalidate = 1800;

const FALLBACK_DESCRIPTION =
  "Categoria de productos premium en Elora Skin.";

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

function compactText(text: string, maxLength = 160) {
  const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return FALLBACK_DESCRIPTION;
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

export async function generateStaticParams() {
  const categories = await getAllCollectionHandles(250);
  return categories.map((category) => ({
    handle: category.handle,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const category = await getCollectionByHandle(params.handle);
  const canonicalUrl = `${siteUrl}/categorias/${params.handle}`;
  const title = category?.title || "Categoria";
  const description = compactText(category?.description || "");
  const imageUrl = category?.products?.[0]?.imageUrl || `${siteUrl}/producto-real.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Elora Skin`,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Elora Skin`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  const siteUrl = getStructuredDataSiteUrl();
  const category = await getCollectionByHandle(params.handle);

  if (!category) {
    notFound();
  }

  const breadcrumbJsonLd = toJsonLd(
    buildBreadcrumbSchema([
      { name: "Inicio", url: `${siteUrl}/` },
      { name: "Categorias", url: `${siteUrl}/categorias` },
      {
        name: category.title || "Categoria",
        url: `${siteUrl}/categorias/${category.handle || params.handle}`,
      },
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
          <Link href="/categorias" className="elora-pill is-outline">
            Volver a categorias
          </Link>
          <p className="elora-shop-eyebrow mt-5">Categoria</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{category.title}</h1>
          <p className="elora-shop-muted mt-3 max-w-3xl text-sm leading-relaxed sm:text-base">
            {category.description?.trim() ||
              "Productos seleccionados con enfoque premium, compra segura y checkout rapido."}
          </p>
        </div>

        {category.products.length === 0 ? (
          <div className="elora-shop-panel p-5">
            <p className="elora-shop-muted text-sm">
              No hay productos visibles en esta categoria por ahora.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {category.products.map((product) => (
              <article
                key={product.id}
                className="elora-shop-panel p-4 transition duration-300 hover:-translate-y-1"
              >
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    width={700}
                    height={700}
                    className="h-44 w-full object-cover"
                  />
                </div>
                <h2 className="mt-4 line-clamp-2 text-base font-semibold">
                  {product.title}
                </h2>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="elora-shop-price text-lg">
                    {formatMoney(product.priceAmount, product.priceCurrency)}
                  </p>
                  <span
                    className={
                      product.availableForSale
                        ? "rounded-full border border-emerald-600/30 bg-emerald-50 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-emerald-700"
                        : "elora-shop-muted rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em]"
                    }
                  >
                    {product.availableForSale ? "Disponible" : "Agotado"}
                  </span>
                </div>
                <Link
                  href={`/products/${product.handle}`}
                  className="elora-pill mt-4"
                >
                  Ver producto
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
