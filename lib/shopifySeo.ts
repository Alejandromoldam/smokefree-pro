const DEFAULT_SITE_URL = "https://allinonestore.lat";
const DEFAULT_API_VERSION = "2025-04";
const MAX_QUERY_BATCH = 100;

type ShopifyGraphQLError = {
  message?: string;
};

type ShopifyProductsConnectionResponse = {
  data?: {
    products?: {
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
      edges?: Array<{
        node?: {
          handle?: string | null;
          updatedAt?: string | null;
        };
      }>;
    };
  };
  errors?: ShopifyGraphQLError[];
};

type ShopifyCollectionsConnectionResponse = {
  data?: {
    collections?: {
      pageInfo?: {
        hasNextPage?: boolean;
        endCursor?: string | null;
      };
      edges?: Array<{
        node?: {
          handle?: string | null;
          title?: string | null;
          description?: string | null;
          updatedAt?: string | null;
        };
      }>;
    };
  };
  errors?: ShopifyGraphQLError[];
};

type ShopifyCollectionByHandleResponse = {
  data?: {
    collection?: {
      handle?: string | null;
      title?: string | null;
      description?: string | null;
      updatedAt?: string | null;
      products?: {
        edges?: Array<{
          node?: {
            id?: string | null;
            handle?: string | null;
            title?: string | null;
            availableForSale?: boolean | null;
            priceRange?: {
              minVariantPrice?: {
                amount?: string | null;
                currencyCode?: string | null;
              } | null;
            } | null;
            images?: {
              edges?: Array<{
                node?: {
                  url?: string | null;
                  altText?: string | null;
                };
              }>;
            } | null;
          };
        }>;
      } | null;
    } | null;
  };
  errors?: ShopifyGraphQLError[];
};

type StorefrontContext = {
  domain: string;
  token: string;
  version: string;
};

export type SeoProductHandle = {
  handle: string;
  updatedAt: string | null;
};

export type SeoCollectionHandle = {
  handle: string;
  title: string;
  description: string;
  updatedAt: string | null;
};

export type SeoCollectionProduct = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  priceAmount: string;
  priceCurrency: string;
  imageUrl: string;
  imageAlt: string;
};

export type SeoCollectionDetail = {
  handle: string;
  title: string;
  description: string;
  updatedAt: string | null;
  products: SeoCollectionProduct[];
};

export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;

  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function normalizeStoreDomain(rawDomain: string) {
  return rawDomain
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .trim();
}

function getStorefrontContext(): StorefrontContext | null {
  const domain = normalizeStoreDomain(
    process.env.SHOPIFY_STORE_DOMAIN ||
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
      ""
  );
  const token = (
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ""
  ).trim();
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;

  if (!domain || !token || token.startsWith("atkn_")) {
    return null;
  }

  return { domain, token, version };
}

function normalizeImageUrl(domain: string, rawUrl: string | null | undefined) {
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

async function storefrontQuery<T>({
  query,
  variables,
  revalidate = 1800,
}: {
  query: string;
  variables?: Record<string, unknown>;
  revalidate?: number;
}): Promise<T | null> {
  const context = getStorefrontContext();
  if (!context) {
    return null;
  }

  const endpoint = `https://${context.domain}/api/${context.version}/graphql.json`;
  const body = JSON.stringify({
    query,
    variables: variables || {},
  });

  const authHeaderOptions: Array<Record<string, string>> = [
    { "X-Shopify-Storefront-Access-Token": context.token },
    {
      "Shopify-Storefront-Private-Token": context.token,
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
        body,
        next: { revalidate },
      });

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as T;
    } catch {
      // Try next auth format.
    }
  }

  return null;
}

export async function getAllProductHandles(limit = 500) {
  const query = `
    query SeoProducts($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            handle
            updatedAt
          }
        }
      }
    }
  `;

  const handles: SeoProductHandle[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage && handles.length < limit) {
    const payload: ShopifyProductsConnectionResponse | null =
      await storefrontQuery<ShopifyProductsConnectionResponse>({
      query,
      variables: {
        first: Math.min(MAX_QUERY_BATCH, limit - handles.length),
        after: cursor,
      },
    });

    if (!payload || payload.errors?.length) {
      break;
    }

    const connection:
      | {
          pageInfo?: {
            hasNextPage?: boolean;
            endCursor?: string | null;
          };
          edges?: Array<{
            node?: {
              handle?: string | null;
              updatedAt?: string | null;
            };
          }>;
        }
      | undefined = payload.data?.products;
    const edges = connection?.edges || [];

    for (const edge of edges) {
      const handle = edge.node?.handle?.trim();
      if (!handle) continue;
      handles.push({
        handle,
        updatedAt: edge.node?.updatedAt || null,
      });
    }

    hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    cursor = connection?.pageInfo?.endCursor || null;
  }

  return handles;
}

export async function getAllCollectionHandles(limit = 250) {
  const query = `
    query SeoCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            handle
            title
            description
            updatedAt
          }
        }
      }
    }
  `;

  const collections: SeoCollectionHandle[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage && collections.length < limit) {
    const payload: ShopifyCollectionsConnectionResponse | null =
      await storefrontQuery<ShopifyCollectionsConnectionResponse>({
      query,
      variables: {
        first: Math.min(MAX_QUERY_BATCH, limit - collections.length),
        after: cursor,
      },
    });

    if (!payload || payload.errors?.length) {
      break;
    }

    const connection:
      | {
          pageInfo?: {
            hasNextPage?: boolean;
            endCursor?: string | null;
          };
          edges?: Array<{
            node?: {
              handle?: string | null;
              title?: string | null;
              description?: string | null;
              updatedAt?: string | null;
            };
          }>;
        }
      | undefined = payload.data?.collections;
    const edges = connection?.edges || [];

    for (const edge of edges) {
      const handle = edge.node?.handle?.trim();
      if (!handle) continue;
      collections.push({
        handle,
        title: (edge.node?.title || "Categoria").trim(),
        description: (edge.node?.description || "").trim(),
        updatedAt: edge.node?.updatedAt || null,
      });
    }

    hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    cursor = connection?.pageInfo?.endCursor || null;
  }

  return collections;
}

export async function getCollectionByHandle(handle: string) {
  const context = getStorefrontContext();
  if (!context || !handle) {
    return null;
  }

  const query = `
    query CollectionByHandle($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        handle
        title
        description
        updatedAt
        products(first: $first, sortKey: BEST_SELLING) {
          edges {
            node {
              id
              handle
              title
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
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
        }
      }
    }
  `;

  const payload: ShopifyCollectionByHandleResponse | null =
    await storefrontQuery<ShopifyCollectionByHandleResponse>({
    query,
    variables: {
      handle,
      first: 24,
    },
  });

  if (!payload || payload.errors?.length || !payload.data?.collection) {
    return null;
  }

  const collectionNode = payload.data.collection;
  const products =
    collectionNode.products?.edges
      ?.map((edge) => edge.node)
      .filter(Boolean)
      .map((node) => ({
        id: node?.id || "",
        handle: node?.handle || "",
        title: node?.title || "Producto",
        availableForSale: Boolean(node?.availableForSale),
        priceAmount: node?.priceRange?.minVariantPrice?.amount || "0.00",
        priceCurrency:
          node?.priceRange?.minVariantPrice?.currencyCode || "MXN",
        imageUrl: normalizeImageUrl(
          context.domain,
          node?.images?.edges?.[0]?.node?.url
        ),
        imageAlt:
          node?.images?.edges?.[0]?.node?.altText || node?.title || "Producto",
      })) || [];

  return {
    handle: collectionNode.handle || handle,
    title: collectionNode.title || "Categoria",
    description: collectionNode.description || "",
    updatedAt: collectionNode.updatedAt || null,
    products: products.filter((product) => Boolean(product.handle)),
  } satisfies SeoCollectionDetail;
}
