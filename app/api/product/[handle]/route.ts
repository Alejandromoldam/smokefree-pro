import { NextResponse } from "next/server";

const DEFAULT_API_VERSION = "2025-04";

type ShopifyVariantNode = {
  id: string;
  title?: string | null;
  sku?: string | null;
  quantityAvailable?: number | null;
  availableForSale?: boolean | null;
  price?: {
    amount?: string | null;
    currencyCode?: string | null;
  } | null;
};

type ShopifyMediaNode = {
  mediaContentType: string;
  alt?: string | null;
  sources?: Array<{
    url: string;
    mimeType: string;
  }> | null;
  previewImage?: {
    url: string;
  } | null;
};

type ShopifyProductResponse = {
  data?: {
    product?: {
      id: string;
      title: string;
      handle: string;
      description: string;
      descriptionHtml?: string;
      availableForSale: boolean;
      vendor: string;
      productType: string;
      priceRange: {
        minVariantPrice: {
          amount: string;
          currencyCode: string;
        };
      };
      images: {
        edges: Array<{
          node: {
            url: string;
            altText: string | null;
          };
        }>;
      };
      media: {
        edges: Array<{
          node: ShopifyMediaNode;
        }>;
      };
      variants: {
        edges: Array<{
          node: ShopifyVariantNode;
        }>;
      };
    } | null;
  };
  errors?: Array<{
    message?: string;
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

function extractVariantNumericId(variantGid: string | undefined) {
  if (!variantGid) return null;
  const match = variantGid.match(/\/(\d+)(?:\?.*)?$/);
  return match?.[1] ?? null;
}

function mapShopifyErrorMessage(rawMessage: string | null) {
  if (!rawMessage) return null;
  if (rawMessage.includes("Online Store channel is locked")) {
    return "La tienda tiene el canal Online Store bloqueado por contrasena.";
  }
  if (rawMessage.toLowerCase().includes("unauthorized")) {
    return "Token Storefront no autorizado.";
  }
  if (rawMessage.includes("ACCESS_DENIED")) {
    return "Acceso denegado por Shopify. Revisa scopes de Storefront API y reinstala la app.";
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

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeLinkUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "#";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  ) {
    return trimmed;
  }
  return "#";
}

function plainTextToHtml(rawText: string) {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "<p>Este producto no tiene descripcion publica todavia.</p>";
  }
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const htmlBlocks = blocks.map((block) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return "";
    const allBulletLines = lines.every((line) => /^[-*•]\s+/.test(line));
    if (allBulletLines) {
      const listItems = lines
        .map((line) => line.replace(/^[-*•]\s+/, ""))
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("");
      return `<ul>${listItems}</ul>`;
    }
    return `<p>${lines.map((line) => escapeHtml(line)).join("<br />")}</p>`;
  });
  return htmlBlocks.filter(Boolean).join("");
}

function sanitizeDescriptionHtml(rawHtml: string | null | undefined) {
  const source = (rawHtml || "").trim();
  if (!source) return "";
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, "");
  const withoutDangerousBlocks = withoutComments
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)[^>]*>[\s\S]*?<\/\1>/gi,
      ""
    )
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)[^>]*\/?>/gi,
      ""
    );
  const allowedTags = new Set([
    "p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "a",
    "h1", "h2", "h3", "h4", "blockquote",
  ]);
  const sanitized = withoutDangerousBlocks.replace(
    /<\/?([a-z0-9-]+)([^>]*)>/gi,
    (fullTag, rawTagName: string, rawAttrs: string) => {
      const tagName = rawTagName.toLowerCase();
      const isClosingTag = fullTag.startsWith("</");
      if (!allowedTags.has(tagName)) return "";
      if (isClosingTag) return `</${tagName}>`;
      if (tagName === "br") return "<br />";
      if (tagName === "a") {
        const hrefMatch = rawAttrs.match(
          /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const hrefCandidate =
          hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || "#";
        const safeHref = sanitizeLinkUrl(hrefCandidate);
        return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer nofollow">`;
      }
      return `<${tagName}>`;
    }
  );
  return sanitized.trim();
}

async function extractShopifyErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ShopifyProductResponse;
    return payload.errors?.[0]?.message?.trim() || null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { handle: string } }
) {
  const handle = params.handle;
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = getStorefrontToken();
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;

  if (!domain || !token) {
    return NextResponse.json(
      { ok: false, error: "Faltan variables SHOPIFY_STORE_DOMAIN y token Storefront." },
      { status: 500 }
    );
  }

  if (isAutomationToken(token)) {
    return NextResponse.json(
      { ok: false, error: "Token de automatizacion no valido para Storefront API." },
      { status: 500 }
    );
  }

  const endpoint = `https://${domain}/api/${version}/graphql.json`;

  const queryWithInventory = `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        availableForSale
        vendor
        productType
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 12) {
          edges {
            node {
              url
              altText
            }
          }
        }
        media(first: 12) {
          edges {
            node {
              mediaContentType
              alt
              ... on Video {
                sources {
                  url
                  mimeType
                }
                previewImage {
                  url
                }
              }
            }
          }
        }
        variants(first: 30) {
          edges {
            node {
              id
              title
              sku
              quantityAvailable
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

  const queryWithoutInventory = `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        availableForSale
        vendor
        productType
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 12) {
          edges {
            node {
              url
              altText
            }
          }
        }
        media(first: 12) {
          edges {
            node {
              mediaContentType
              alt
              ... on Video {
                sources {
                  url
                  mimeType
                }
                previewImage {
                  url
                }
              }
            }
          }
        }
        variants(first: 30) {
          edges {
            node {
              id
              title
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

  try {
    const baseVariables = { handle };
    const requestBodyWithInventory = JSON.stringify({
      query: queryWithInventory,
      variables: baseVariables,
    });
    const authHeaderOptions: Array<Record<string, string>> = [
      { "X-Shopify-Storefront-Access-Token": token },
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
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: requestBodyWithInventory,
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
      return NextResponse.json(
        { ok: false, error: authErrorMessage || "Error al consultar Shopify." },
        { status: 502 }
      );
    }

    let payload = (await response.json()) as ShopifyProductResponse;

    if (payload.errors?.some((err) => (err.message || "").includes("quantityAvailable"))) {
      let fallbackResponse: Response | null = null;
      let fallbackAuthError: string | null = null;
      const requestBodyWithoutInventory = JSON.stringify({
        query: queryWithoutInventory,
        variables: baseVariables,
      });
      for (const authHeaders of authHeaderOptions) {
        const candidate = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: requestBodyWithoutInventory,
          cache: "no-store",
        });
        if (candidate.ok) {
          fallbackResponse = candidate;
          break;
        }
        const candidateError = await extractShopifyErrorMessage(candidate);
        fallbackAuthError = mapShopifyErrorMessage(candidateError) || fallbackAuthError;
      }
      if (!fallbackResponse) {
        return NextResponse.json(
          { ok: false, error: fallbackAuthError || "Error al consultar Shopify." },
          { status: 502 }
        );
      }
      payload = (await fallbackResponse.json()) as ShopifyProductResponse;
    }

    if (payload.errors?.length) {
      return NextResponse.json(
        { ok: false, error: payload.errors[0]?.message || "Error GraphQL." },
        { status: 502 }
      );
    }

    if (!payload.data?.product) {
      return NextResponse.json(
        { ok: false, error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    const product = payload.data.product;
    const sanitizedDescriptionHtml = sanitizeDescriptionHtml(product.descriptionHtml);
    const fallbackDescriptionHtml = plainTextToHtml(product.description || "");
    const variants = product.variants.edges.map((edge) => edge.node);
    const selectedVariant =
      variants.find((variant) => variant.availableForSale) || variants[0] || null;
    const variantGid = selectedVariant?.id;
    const variantNumericId = extractVariantNumericId(variantGid);
    const productUrl = `https://${domain}/products/${product.handle}`;
    const buyNowUrl = variantNumericId
      ? `https://${domain}/cart/${variantNumericId}:1`
      : productUrl;

    const videos = (product.media?.edges || [])
      .filter((edge) => edge.node.mediaContentType === "VIDEO")
      .map((edge) => ({
        sources: edge.node.sources || [],
        previewImageUrl: edge.node.previewImage?.url || null,
        alt: edge.node.alt || product.title,
      }));

    return NextResponse.json(
      {
        ok: true,
        error: null,
        product: {
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description,
          descriptionHtml: sanitizedDescriptionHtml || fallbackDescriptionHtml,
          availableForSale: product.availableForSale,
          vendor: product.vendor,
          productType: product.productType,
          priceAmount:
            selectedVariant?.price?.amount || product.priceRange.minVariantPrice.amount,
          priceCurrency:
            selectedVariant?.price?.currencyCode ||
            product.priceRange.minVariantPrice.currencyCode,
          selectedVariantId: selectedVariant?.id || null,
          selectedVariantSku: selectedVariant?.sku || null,
          selectedVariantInventory: selectedVariant?.quantityAvailable ?? null,
          variants: variants.map((variant) => ({
            id: variant.id,
            title: variant.title || "Variante",
            sku: variant.sku || null,
            quantityAvailable: variant.quantityAvailable ?? null,
            availableForSale: Boolean(variant.availableForSale),
            priceAmount: variant.price?.amount || product.priceRange.minVariantPrice.amount,
            priceCurrency:
              variant.price?.currencyCode ||
              product.priceRange.minVariantPrice.currencyCode,
          })),
          images: product.images.edges.map((edge) => ({
            url: normalizeShopifyImageUrl(domain, edge.node.url),
            altText: edge.node.altText || product.title,
          })),
          videos,
          productUrl,
          buyNowUrl,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "No fue posible conectar con Shopify." },
      { status: 500 }
    );
  }
}
