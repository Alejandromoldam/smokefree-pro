import { NextResponse } from "next/server";

const DEFAULT_API_VERSION = "2025-04";
const MAX_PRODUCTS = 50;

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
  errors?: Array<{
    message?: string;
    extensions?: {
      code?: string;
    };
  }>;
};

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

function mapShopifyErrorMessage(rawMessage: string | null) {
  if (!rawMessage) return null;
  if (rawMessage.includes("Online Store channel is locked")) {
    return "La tienda tiene el canal Online Store bloqueado por contraseña. Desbloquea la tienda para cargar el catalogo real.";
  }
  if (rawMessage.toLowerCase().includes("unauthorized")) {
    return "Token Storefront no autorizado. Revisa el token y los scopes de Storefront API.";
  }
  if (rawMessage.includes("ACCESS_DENIED")) {
    return "Acceso denegado por Shopify. Activa los scopes de Storefront API (lectura de productos, colecciones e inventario) y reinstala la app.";
  }
  return rawMessage;
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

async function extractShopifyErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ShopifyProductsResponse;
    const firstError = payload.errors?.[0];
    const message = firstError?.message?.trim() || null;
    const code = firstError?.extensions?.code || null;
    return message || (code ? `Error Shopify: ${code}` : null);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = getStorefrontToken();
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  if (!domain || !token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Faltan variables SHOPIFY_STORE_DOMAIN y token Storefront (SHOPIFY_STOREFRONT_PRIVATE_TOKEN o SHOPIFY_STOREFRONT_ACCESS_TOKEN).",
        products: [],
        hasMore: false,
        nextCursor: null,
      },
      { status: 500 }
    );
  }

  if (isAutomationToken(token)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "El token configurado parece ser de automatizacion (atkn_) y no sirve para Storefront API. Usa un token del canal Headless (private/public) y actualiza .env.local.",
        products: [],
        hasMore: false,
        nextCursor: null,
      },
      { status: 500 }
    );
  }

  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  const query = `
    query CatalogProducts($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: BEST_SELLING) {
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
    const requestBody = JSON.stringify({
      query,
      variables: { first: MAX_PRODUCTS, after: cursor || null },
    });
    const authHeaderOptions: Array<Record<string, string>> = [
      {
        "X-Shopify-Storefront-Access-Token": token,
      },
      {
        "Shopify-Storefront-Private-Token": token,
        "Shopify-Storefront-Buyer-IP": "127.0.0.1",
      },
    ];

    let response: Response | null = null;
    let authErrorMessage: string | null = null;

    for (const authHeaders of authHeaderOptions) {
      const candidate = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: requestBody,
        cache: "no-store",
      });

      if (candidate.ok) {
        response = candidate;
        break;
      }

      const candidateError = await extractShopifyErrorMessage(candidate);
      authErrorMessage = mapShopifyErrorMessage(candidateError) || authErrorMessage;
    }

    if (!response) {
      const normalizedMessage =
        authErrorMessage || "Shopify Storefront API respondio con error.";

      return NextResponse.json(
        {
          ok: false,
          error: normalizedMessage,
          products: [],
          hasMore: false,
          nextCursor: null,
        },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as ShopifyProductsResponse;

    const firstGraphqlError = payload.errors?.[0];
    const graphqlErrorMessage = firstGraphqlError?.message?.trim() || null;
    const graphqlErrorCode = firstGraphqlError?.extensions?.code || null;
    const graphqlError = mapShopifyErrorMessage(
      graphqlErrorMessage ||
        (graphqlErrorCode ? `Error Shopify: ${graphqlErrorCode}` : null)
    );
    const edges = payload.data?.products?.edges ?? [];
    if (graphqlError && edges.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: graphqlError,
          products: [],
          hasMore: false,
          nextCursor: null,
        },
        { status: 502 }
      );
    }
    const hasMore = payload.data?.products?.pageInfo?.hasNextPage ?? false;
    const nextCursor = payload.data?.products?.pageInfo?.endCursor ?? null;
    const products = edges.map(({ node }) => {
      const image = node.images.edges[0]?.node;
      const variantGid = node.variants.edges[0]?.node.id;
      const variantNumericId = extractVariantNumericId(variantGid);
      const handle = node.handle || "";
      const productUrl = handle
        ? `/products/${handle}`
        : "/#catalogo";
      const buyNowUrl = variantNumericId
        ? `https://${domain}/cart/${variantNumericId}:1`
        : productUrl;
      const title = (node.title || "").trim() || "Producto";
      const description = node.description || "";
      const currencyCode = node.priceRange?.minVariantPrice?.currencyCode || "USD";
      const priceAmount = node.priceRange?.minVariantPrice?.amount || "0.00";

      return {
        id: node.id,
        title,
        handle,
        variantId: variantGid || null,
        descriptionShort: compactText(description),
        imageUrl: normalizeShopifyImageUrl(domain, image?.url),
        imageAlt: image?.altText || title,
        priceAmount,
        priceCurrency: currencyCode,
        availableForSale: Boolean(node.availableForSale),
        productUrl,
        buyNowUrl,
      };
    });

    return NextResponse.json(
      { ok: true, error: null, products, hasMore, nextCursor },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No fue posible conectar con Shopify en este momento.",
        products: [],
        hasMore: false,
        nextCursor: null,
      },
      { status: 500 }
    );
  }
}

