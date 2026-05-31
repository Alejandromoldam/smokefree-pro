import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";
import { getAllProductHandles, getSiteUrl } from "@/lib/shopifySeo";

const DEFAULT_API_VERSION = "2025-04";
const DEFAULT_STORE_DOMAIN = "all-in-one-22092396.myshopify.com";
const FALLBACK_TITLE = "Producto premium";
const FALLBACK_DESCRIPTION =
  "All In One Store reune productos tecnologicos y soluciones innovadoras seleccionadas para mejorar tu experiencia diaria.";

export const revalidate = 1800;

type ShopifySeoResponse = {
  data?: {
    product?: {
      title?: string | null;
      handle?: string | null;
      description?: string | null;
      images?: {
        edges?: Array<{
          node?: {
            url?: string | null;
            altText?: string | null;
          };
        }>;
      };
    } | null;
  };
  errors?: Array<{
    message?: string;
  }>;
};

type SeoProduct = {
  title: string;
  handle: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
};

function getStorefrontToken() {
  return (
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ""
  ).trim();
}

function normalizeStoreDomain(rawDomain: string) {
  return rawDomain
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .trim();
}

function compactDescription(rawText: string, maxLength = 160) {
  const cleanText = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return FALLBACK_DESCRIPTION;
  }

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return `${cleanText.slice(0, maxLength - 1).trimEnd()}…`;
}

async function fetchSeoProduct(handle: string): Promise<SeoProduct | null> {
  const domain = normalizeStoreDomain(
    process.env.SHOPIFY_STORE_DOMAIN ||
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
      DEFAULT_STORE_DOMAIN
  );
  const token = getStorefrontToken();
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;

  if (!domain || !token || token.startsWith("atkn_")) {
    return null;
  }

  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  const query = `
    query ProductSeoByHandle($handle: String!) {
      product(handle: $handle) {
        title
        handle
        description
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
      }
    }
  `;

  const authHeaderOptions: Array<Record<string, string>> = [
    {
      "X-Shopify-Storefront-Access-Token": token,
    },
    {
      "Shopify-Storefront-Private-Token": token,
      "Shopify-Storefront-Buyer-IP": "127.0.0.1",
    },
  ];

  for (const authHeaders of authHeaderOptions) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          query,
          variables: { handle },
        }),
        next: { revalidate },
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as ShopifySeoResponse;
      if (payload.errors?.length) {
        continue;
      }

      const product = payload.data?.product;
      if (!product) {
        return null;
      }

      const firstImage = product.images?.edges?.[0]?.node;
      const productTitle = (product.title || "").trim() || "Producto premium";
      const productHandle = (product.handle || handle).trim() || handle;
      const description = product.description || "";

      return {
        title: productTitle,
        handle: productHandle,
        description,
        imageUrl: firstImage?.url || null,
        imageAlt: firstImage?.altText || productTitle,
      };
    } catch {
      // Try next auth header format.
    }
  }

  return null;
}

export async function generateStaticParams() {
  const products = await getAllProductHandles(500);
  return products.map((product) => ({
    handle: product.handle,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const fallbackImage = `${siteUrl}/producto-real.png`;

  const seoProduct = await fetchSeoProduct(params.handle);
  const title = seoProduct?.title || FALLBACK_TITLE;
  const socialTitle = `${title} | All In One Store`;
  const description = compactDescription(seoProduct?.description || "");
  const productPathHandle = seoProduct?.handle || params.handle;
  const productPageUrl = `${siteUrl}/products/${productPathHandle}`;
  const imageUrl = seoProduct?.imageUrl || fallbackImage;

  return {
    title,
    description,
    alternates: {
      canonical: productPageUrl,
    },
    openGraph: {
      title: socialTitle,
      description,
      type: "website",
      url: productPageUrl,
      images: [
        {
          url: imageUrl,
          alt: seoProduct?.imageAlt || "Producto All In One Store",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductPage() {
  return <ProductPageClient />;
}
