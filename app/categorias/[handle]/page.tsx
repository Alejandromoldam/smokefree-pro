import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCollectionHandles,
  getCollectionByHandle,
  getSiteUrl,
} from "@/lib/shopifySeo";

export const revalidate = 1800;

const FALLBACK_DESCRIPTION =
  "Categoria de productos premium en All In One Store.";

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
    title: `${title} | All In One Store`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | All In One Store`,
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
      title: `${title} | All In One Store`,
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
  const category = await getCollectionByHandle(params.handle);

  if (!category) {
    notFound();
  }

  return (
    <main className="premium-shell min-h-screen bg-transparent text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/categorias" className="btn-ghost inline-flex px-4 py-2 text-xs font-semibold sm:text-sm">
            Volver a categorias
          </Link>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-cyan-200/85">
            Categoria
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{category.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
            {category.description?.trim() ||
              "Productos seleccionados con enfoque premium, compra segura y checkout rapido."}
          </p>
        </div>

        {category.products.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/12 p-5">
            <p className="text-sm text-gray-300">
              No hay productos visibles en esta categoria por ahora.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {category.products.map((product) => (
              <article
                key={product.id}
                className="glass-card rounded-3xl border border-white/12 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40"
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    width={700}
                    height={700}
                    className="h-44 w-full object-cover"
                    unoptimized
                  />
                </div>
                <h2 className="mt-4 line-clamp-2 text-base font-semibold text-white">
                  {product.title}
                </h2>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-cyan-100">
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
                <Link
                  href={`/products/${product.handle}`}
                  className="btn-premium mt-4 inline-flex px-4 py-2 text-xs font-semibold sm:text-sm"
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
