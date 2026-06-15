const DEFAULT_API_VERSION = "2025-04";

export type CatalogProduct = {
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

export type CatalogSnapshot = {
  products: CatalogProduct[];
  hasMore: boolean;
  nextCursor: string | null;
};

type ShopifyProductsResponse = {
  data?: {
    products?: {
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
      edges?: Array<{
        node: {
          id: string;
          title?: string | null;
          handle?: string | null;
          description?: string | null;
          descriptionHtml?: string | null;
          availableForSale?: boolean | null;
          images: {
            edges: Array<{
              node: {
                url: string;
                altText: string | null;
              };
            }>;
          };
          priceRange: {
            minVariantPrice: {
              amount?: string | null;
              currencyCode?: string | null;
            };
          };
          variants: {
            edges: Array<{
              node: {
                id: string;
              };
            }>;
          };
        };
      }>;
    };
  };
};

function compactText(value: string, maxLength = 140) {
  const clean = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Descripcion disponible en la ficha del producto.";
  }
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength).trim()}...`;
}

function extractVariantNumericId(variantGid: string | undefined) {
  if (!variantGid) return null;
  const match = variantGid.match(/\/(\d+)(?:\?.*)?$/);
  return match?.[1] ?? null;
}

function normalizeShopifyImageUrl(
  domain: string,
  rawUrl: string | null | undefined
) {
  if (!rawUrl) {
    return "/producto-real.png";
  }

  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname === "cdn.shopify.com" &&
      parsed.pathname.includes("/files/")
    ) {
      const filePath = parsed.pathname.split("/files/").pop();
      if (filePath) {
        return `https://${domain}/cdn/shop/files/${filePath}${parsed.search}`;
      }
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export async function fetchHomeCatalogSnapshot(
  first = 24
): Promise<CatalogSnapshot> {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    "";
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;

  if (!domain || !token || token.startsWith("atkn_")) {
    return { products: [], hasMore: false, nextCursor: null };
  }

  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  const query = `
    query HomeCatalogProducts($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
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
            descriptionHtml
            availableForSale
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query,
        variables: { first },
      }),
      next: { revalidate: 180 },
    });

    if (!response.ok) {
      return { products: [], hasMore: false, nextCursor: null };
    }

    const payload = (await response.json()) as ShopifyProductsResponse;
    const edges = payload.data?.products?.edges ?? [];
    const hasMore = payload.data?.products?.pageInfo?.hasNextPage ?? false;
    const nextCursor = payload.data?.products?.pageInfo?.endCursor ?? null;

    const products = edges.map(({ node }) => {
      const image = node.images.edges[0]?.node;
      const variantGid = node.variants.edges[0]?.node.id;
      const variantNumericId = extractVariantNumericId(variantGid);
      const handle = node.handle || "";
      const productUrl = handle ? `/products/${handle}` : "/#catalogo";
      const buyNowUrl = variantNumericId
        ? `https://${domain}/cart/${variantNumericId}:1`
        : productUrl;
      const title = node.title || "Producto";
      const description = node.description || node.descriptionHtml || "";

      return {
        id: node.id,
        title,
        handle,
        variantId: variantGid || null,
        descriptionShort: compactText(description),
        imageUrl: normalizeShopifyImageUrl(domain, image?.url),
        imageAlt: image?.altText || title,
        priceAmount: node.priceRange?.minVariantPrice?.amount || "0.00",
        priceCurrency:
          node.priceRange?.minVariantPrice?.currencyCode || "USD",
        availableForSale: Boolean(node.availableForSale),
        productUrl,
        buyNowUrl,
      } satisfies CatalogProduct;
    });

    return { products, hasMore, nextCursor };
  } catch {
    return { products: [], hasMore: false, nextCursor: null };
  }
}
