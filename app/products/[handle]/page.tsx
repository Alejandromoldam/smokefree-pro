import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";
import { getAllProductHandles, getSiteUrl } from "@/lib/shopifySeo";
import {
  buildBreadcrumbSchema,
  buildProductSchema,
  getStructuredDataSiteUrl,
  toJsonLd,
} from "@/lib/structuredData";

const DEFAULT_API_VERSION = "2025-04";
const DEFAULT_STORE_DOMAIN = "all-in-one-22092396.myshopify.com";
const FALLBACK_TITLE = "Producto premium";
const FALLBACK_DESCRIPTION =
  "Compra skincare premium en Elora Skin con disponibilidad real, pago seguro y envio confiable.";

export const revalidate = 1800;

type ShopifySeoResponse = {
  data?: {
    product?: {
      title?: string | null;
      handle?: string | null;
      description?: string | null;
      availableForSale?: boolean | null;
      vendor?: string | null;
      productType?: string | null;
      images?: {
        edges?: Array<{
          node?: {
            url?: string | null;
            altText?: string | null;
          };
        }>;
      };
      selectedOrFirstAvailableVariant?: {
        id?: string | null;
        sku?: string | null;
        availableForSale?: boolean | null;
        price?: {
          amount?: string | null;
          currencyCode?: string | null;
        } | null;
      } | null;
      variants?: {
        edges?: Array<{
          node?: {
            id?: string | null;
            sku?: string | null;
            availableForSale?: boolean | null;
            price?: {
              amount?: string | null;
              currencyCode?: string | null;
            } | null;
          };
        }>;
      } | null;
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
  images: string[];
  availableForSale: boolean;
  category: string | null;
  priceAmount: string;
  priceCurrency: string;
  sku: string | null;
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

  return `${cleanText.slice(0, maxLength - 3).trimEnd()}...`;
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
        availableForSale
        vendor
        productType
        images(first: 8) {
          edges {
            node {
              url
              altText
            }
          }
        }
        selectedOrFirstAvailableVariant {
          id
          sku
          availableForSale
          price {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          edges {
            node {
              id
              sku
              availableForSale
              price {
                amount
                currencyCode
              }
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

      const productTitle = (product.title || "").trim() || FALLBACK_TITLE;
      const productHandle = (product.handle || handle).trim() || handle;
      const description = (product.description || "").trim();
      const selectedVariant =
        product.selectedOrFirstAvailableVariant || product.variants?.edges?.[0]?.node;
      const images =
        product.images?.edges
          ?.map((edge) => edge.node?.url || "")
          .filter((url) => Boolean(url)) || [];
      const firstImage = product.images?.edges?.[0]?.node;
      const availability = selectedVariant?.availableForSale ?? product.availableForSale;

      return {
        title: productTitle,
        handle: productHandle,
        description,
        imageUrl: firstImage?.url || null,
        imageAlt: firstImage?.altText || productTitle,
        images,
        availableForSale: availability === true,
        category: (product.productType || "").trim() || null,
        priceAmount: selectedVariant?.price?.amount || "0.00",
        priceCurrency: selectedVariant?.price?.currencyCode || "MXN",
        sku: selectedVariant?.sku || null,
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
  const productName = seoProduct?.title || FALLBACK_TITLE;
  const socialTitle = `Comprar ${productName} | Elora Skin`;
  const description = compactDescription(seoProduct?.description || "");
  const productPathHandle = seoProduct?.handle || params.handle;
  const productPageUrl = `${siteUrl}/products/${productPathHandle}`;
  const imageUrl = seoProduct?.imageUrl || fallbackImage;

  return {
    title: `Comprar ${productName}`,
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
          alt: seoProduct?.imageAlt || "Producto Elora Skin",
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

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const siteUrl = getStructuredDataSiteUrl();
  const fallbackImage = `${siteUrl}/producto-real.png`;
  const seoProduct = await fetchSeoProduct(params.handle);
  const productHandle = seoProduct?.handle || params.handle;
  const productUrl = `${siteUrl}/products/${productHandle}`;

  const breadcrumbJsonLd = toJsonLd(
    buildBreadcrumbSchema([
      { name: "Inicio", url: `${siteUrl}/` },
      { name: "Catalogo", url: `${siteUrl}/#catalogo` },
      { name: seoProduct?.title || "Producto", url: productUrl },
    ])
  );

  const productJsonLd = seoProduct
    ? toJsonLd(
        buildProductSchema({
          name: seoProduct.title,
          description: compactDescription(seoProduct.description || "", 500),
          url: productUrl,
          images: seoProduct.images.length > 0 ? seoProduct.images : [fallbackImage],
          sku: seoProduct.sku,
          category: seoProduct.category,
          price: seoProduct.priceAmount,
          priceCurrency: seoProduct.priceCurrency,
          availableForSale: seoProduct.availableForSale,
        })
      )
    : null;

  return (
    <>
      {productJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: productJsonLd }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <ProductPageClient />
    </>
  );
}
