import { getCanonicalSiteUrl } from "@/lib/canonical-domain";

const DEFAULT_API_VERSION = "2025-04";
const DEFAULT_PUBLIC_DOMAIN = getCanonicalSiteUrl();
const MAX_PRODUCTS_PER_PAGE = 100;
const MAX_TOTAL_PRODUCTS = 500;

type ShopifyFeedProductNode = {
  id: string;
  title?: string | null;
  handle?: string | null;
  description?: string | null;
  availableForSale?: boolean | null;
  productType?: string | null;
  googleCategoryCustom?: {
    value?: string | null;
  } | null;
  googleCategoryGoogle?: {
    value?: string | null;
  } | null;
  googleCategoryGlobal?: {
    value?: string | null;
  } | null;
  images?: {
    edges?: Array<{
      node?: {
        url?: string | null;
      };
    }>;
  } | null;
  priceRange?: {
    minVariantPrice?: {
      amount?: string | null;
      currencyCode?: string | null;
    } | null;
  } | null;
};

type ShopifyFeedResponse = {
  data?: {
    products?: {
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
      edges?: Array<{
        node?: ShopifyFeedProductNode;
      }>;
    };
  };
  errors?: Array<{
    message?: string;
  }>;
};

type FeedProduct = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  availability: "in stock" | "out of stock";
  price: string;
  brand: string;
  condition: "new";
  productType: string;
  googleProductCategory: string;
};

function normalizeStoreDomain(rawDomain: string) {
  return rawDomain
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .trim();
}

function getStorefrontToken() {
  return (
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ""
  ).trim();
}

function isAutomationToken(token: string) {
  return token.startsWith("atkn_");
}

function cleanText(value: string, maxLength = 5000) {
  const normalized = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Consulta la ficha de producto para mas detalles en All In One.";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function toFeedId(productId: string, fallbackHandle: string) {
  const numericIdMatch = productId.match(/\/(\d+)(?:\?.*)?$/);
  const baseId = numericIdMatch?.[1] || fallbackHandle || productId;
  const compactId = baseId.replace(/\s+/g, "-");
  if (compactId.length <= 50) return compactId;
  return compactId.slice(0, 50);
}

function parsePositivePrice(amount: string | null | undefined) {
  if (!amount) return null;
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value.toFixed(2);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFeedXml(products: FeedProduct[], publicDomain: string) {
  const itemXml = products
    .map((product) =>
      [
        "<item>",
        `<g:id>${escapeXml(product.id)}</g:id>`,
        `<title>${escapeXml(product.title)}</title>`,
        `<description>${escapeXml(product.description)}</description>`,
        `<link>${escapeXml(product.link)}</link>`,
        `<g:image_link>${escapeXml(product.imageLink)}</g:image_link>`,
        `<g:availability>${product.availability}</g:availability>`,
        `<g:price>${escapeXml(product.price)}</g:price>`,
        `<g:brand>${escapeXml(product.brand)}</g:brand>`,
        `<g:condition>${product.condition}</g:condition>`,
        product.productType
          ? `<g:product_type>${escapeXml(product.productType)}</g:product_type>`
          : "",
        product.googleProductCategory
          ? `<g:google_product_category>${escapeXml(
              product.googleProductCategory
            )}</g:google_product_category>`
          : "",
        "</item>",
      ]
        .filter(Boolean)
        .join("")
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>All In One Product Feed</title>
    <link>${escapeXml(publicDomain)}</link>
    <description>Feed de productos dinamico para Google Merchant Center de All In One.</description>
    ${itemXml}
  </channel>
</rss>`;
}

async function fetchProductsFromShopify(options: {
  endpoint: string;
  token: string;
  cursor: string | null;
}) {
  const query = `
    query GoogleMerchantFeedProducts($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            description
            availableForSale
            productType
            googleCategoryCustom: metafield(namespace: "custom", key: "google_product_category") {
              value
            }
            googleCategoryGoogle: metafield(namespace: "google", key: "google_product_category") {
              value
            }
            googleCategoryGlobal: metafield(namespace: "global", key: "google_product_category") {
              value
            }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const body = JSON.stringify({
    query,
    variables: {
      first: MAX_PRODUCTS_PER_PAGE,
      after: options.cursor,
    },
  });

  const authHeadersList: Array<Record<string, string>> = [
    {
      "X-Shopify-Storefront-Access-Token": options.token,
    },
    {
      "Shopify-Storefront-Private-Token": options.token,
      "Shopify-Storefront-Buyer-IP": "127.0.0.1",
    },
  ];

  for (const authHeaders of authHeadersList) {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as ShopifyFeedResponse;
    return payload;
  }

  return null;
}

export async function GET() {
  const storeDomain = normalizeStoreDomain(
    process.env.SHOPIFY_STORE_DOMAIN ||
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
      ""
  );
  const publicDomain = DEFAULT_PUBLIC_DOMAIN;
  const token = getStorefrontToken();
  const apiVersion =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;

  if (!storeDomain || !token || isAutomationToken(token)) {
    return new Response("Google feed unavailable: invalid Shopify Storefront configuration.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;
  const rawProducts: ShopifyFeedProductNode[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage && rawProducts.length < MAX_TOTAL_PRODUCTS) {
    const payload = await fetchProductsFromShopify({
      endpoint,
      token,
      cursor,
    });

    if (!payload || payload.errors?.length) {
      break;
    }

    const connection = payload.data?.products;
    const edges = connection?.edges || [];
    rawProducts.push(
      ...edges
        .map((edge) => edge.node)
        .filter((node): node is ShopifyFeedProductNode => Boolean(node?.id))
    );

    hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    cursor = connection?.pageInfo?.endCursor || null;
  }

  const feedProducts: FeedProduct[] = rawProducts
    .map((product) => {
      const title = (product.title || "").trim();
      const handle = (product.handle || "").trim();
      const imageLink = (product.images?.edges?.[0]?.node?.url || "").trim();
      const priceAmount = parsePositivePrice(
        product.priceRange?.minVariantPrice?.amount
      );
      const priceCurrency = (
        product.priceRange?.minVariantPrice?.currencyCode || ""
      ).trim();

      if (!title || !handle || !imageLink || !priceAmount || !priceCurrency) {
        return null;
      }

      const productType = (product.productType || "").trim();
      const googleProductCategory = (
        product.googleCategoryCustom?.value ||
        product.googleCategoryGoogle?.value ||
        product.googleCategoryGlobal?.value ||
        ""
      ).trim();

      return {
        id: toFeedId(product.id, handle),
        title: cleanText(title, 150),
        description: cleanText(product.description || ""),
        link: `${publicDomain}/products/${encodeURIComponent(handle)}`,
        imageLink,
        availability: product.availableForSale ? "in stock" : "out of stock",
        price: `${priceAmount} ${priceCurrency}`,
        brand: "All In One",
        condition: "new",
        productType,
        googleProductCategory,
      } satisfies FeedProduct;
    })
    .filter((product): product is FeedProduct => Boolean(product));

  const xml = buildFeedXml(feedProducts, publicDomain);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
