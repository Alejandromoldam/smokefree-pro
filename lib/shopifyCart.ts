import { NextResponse } from "next/server";

const DEFAULT_API_VERSION = "2025-04";
export const CART_COOKIE_NAME = "sf_cart_id";

type ShopifyError = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

type ShopifyResponse<TData> = {
  data?: TData;
  errors?: ShopifyError[];
};

type StorefrontCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost?: {
    subtotalAmount?: {
      amount?: string;
      currencyCode?: string;
    };
    totalAmount?: {
      amount?: string;
      currencyCode?: string;
    };
  };
  lines?: {
    nodes?: Array<{
      id: string;
      quantity: number;
      cost?: {
        totalAmount?: {
          amount?: string;
          currencyCode?: string;
        };
      };
      merchandise?: {
        id?: string;
        title?: string;
        availableForSale?: boolean;
        image?: {
          url?: string;
          altText?: string | null;
        };
        price?: {
          amount?: string;
          currencyCode?: string;
        };
        product?: {
          title?: string;
          handle?: string;
        };
      } | null;
    }>;
  };
};

export type CartLinePayload = {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string;
  imageUrl: string;
  imageAlt: string;
  unitPriceAmount: string;
  unitPriceCurrency: string;
  lineTotalAmount: string;
  lineTotalCurrency: string;
  availableForSale: boolean;
  productUrl: string;
};

export type CartPayload = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotalAmount: string;
  subtotalCurrency: string;
  totalAmount: string;
  totalCurrency: string;
  lines: CartLinePayload[];
};

type StorefrontCallResult<TData> = {
  ok: boolean;
  data?: TData;
  error?: string;
  domain?: string;
};

type CartMutationResult = {
  ok: boolean;
  cart?: CartPayload;
  error?: string;
};

const CART_FIELDS_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image {
              url
              altText
            }
            price {
              amount
              currencyCode
            }
            product {
              title
              handle
            }
          }
        }
      }
    }
  }
`;

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

function mapShopifyErrorMessage(rawMessage: string | null) {
  if (!rawMessage) return null;
  if (rawMessage.includes("Online Store channel is locked")) {
    return "La tienda tiene el canal Online Store bloqueado por contrasena. Desbloqueala para procesar compras.";
  }
  if (rawMessage.toLowerCase().includes("unauthorized")) {
    return "Token Storefront no autorizado. Revisa token y scopes Storefront.";
  }
  if (rawMessage.includes("ACCESS_DENIED")) {
    return "Acceso denegado por Shopify. Revisa scopes de Storefront API en Headless.";
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

function extractFirstError(payload?: ShopifyResponse<unknown>) {
  if (!payload?.errors?.length) return null;
  const err = payload.errors[0];
  return err?.message?.trim() || (err?.extensions?.code ? `Error Shopify: ${err.extensions.code}` : null);
}

function hasAuthError(payload?: ShopifyResponse<unknown>) {
  if (!payload?.errors?.length) return false;
  return payload.errors.some((error) => {
    const code = (error.extensions?.code || "").toUpperCase();
    const message = (error.message || "").toLowerCase();
    return (
      code.includes("UNAUTHORIZED") ||
      code.includes("ACCESS_DENIED") ||
      message.includes("unauthorized") ||
      message.includes("access denied")
    );
  });
}

async function callStorefront<TData>(
  query: string,
  variables?: Record<string, unknown>
): Promise<StorefrontCallResult<TData>> {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    "";
  const token = getStorefrontToken();
  const version =
    process.env.SHOPIFY_API_VERSION ||
    process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION ||
    DEFAULT_API_VERSION;

  if (!domain || !token) {
    return {
      ok: false,
      error:
        "Faltan SHOPIFY_STORE_DOMAIN y token Storefront (SHOPIFY_STOREFRONT_PRIVATE_TOKEN o SHOPIFY_STOREFRONT_ACCESS_TOKEN).",
    };
  }

  if (isAutomationToken(token)) {
    return {
      ok: false,
      error:
        "El token configurado parece ser de automatizacion (atkn_) y no sirve para Storefront API.",
    };
  }

  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  const authHeaderOptions: Array<Record<string, string>> = [
    {
      "X-Shopify-Storefront-Access-Token": token,
    },
    {
      "Shopify-Storefront-Private-Token": token,
      "Shopify-Storefront-Buyer-IP": "127.0.0.1",
    },
  ];

  let lastError: string | null = null;

  for (const authHeaders of authHeaderOptions) {
    let payload: ShopifyResponse<TData> | undefined;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ query, variables: variables || {} }),
        cache: "no-store",
      });

      try {
        payload = (await response.json()) as ShopifyResponse<TData>;
      } catch {
        payload = undefined;
      }

      if (!response.ok) {
        const message = mapShopifyErrorMessage(extractFirstError(payload)) || response.statusText;
        lastError = message;
        continue;
      }

      if (hasAuthError(payload)) {
        lastError = mapShopifyErrorMessage(extractFirstError(payload)) || lastError;
        continue;
      }

      if (payload?.errors?.length) {
        return {
          ok: false,
          error:
            mapShopifyErrorMessage(extractFirstError(payload)) ||
            "Shopify devolvio un error al procesar carrito.",
          domain,
        };
      }

      return { ok: true, data: payload?.data, domain };
    } catch {
      lastError = "No fue posible conectar con Shopify Storefront API.";
    }
  }

  return {
    ok: false,
    error: lastError || "Shopify Storefront API respondio con error.",
    domain,
  };
}

function mapCart(domain: string, cart: StorefrontCart): CartPayload {
  const lines = cart.lines?.nodes || [];

  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity || 0,
    subtotalAmount: cart.cost?.subtotalAmount?.amount || "0.00",
    subtotalCurrency: cart.cost?.subtotalAmount?.currencyCode || "MXN",
    totalAmount: cart.cost?.totalAmount?.amount || cart.cost?.subtotalAmount?.amount || "0.00",
    totalCurrency:
      cart.cost?.totalAmount?.currencyCode ||
      cart.cost?.subtotalAmount?.currencyCode ||
      "MXN",
    lines: lines.map((line) => {
      const merchandise = line.merchandise;
      const productTitle = merchandise?.product?.title?.trim() || "Producto";
      const handle = merchandise?.product?.handle || "";
      const variantTitle = merchandise?.title?.trim() || "";
      const imageUrl = normalizeShopifyImageUrl(domain, merchandise?.image?.url);
      const imageAlt = merchandise?.image?.altText || productTitle;

      return {
        id: line.id,
        quantity: line.quantity || 1,
        title: productTitle,
        variantTitle,
        imageUrl,
        imageAlt,
        unitPriceAmount: merchandise?.price?.amount || "0.00",
        unitPriceCurrency: merchandise?.price?.currencyCode || "MXN",
        lineTotalAmount: line.cost?.totalAmount?.amount || "0.00",
        lineTotalCurrency: line.cost?.totalAmount?.currencyCode || "MXN",
        availableForSale: Boolean(merchandise?.availableForSale),
        productUrl: handle
          ? `https://${domain}/products/${handle}`
          : `https://${domain}/collections/all`,
      };
    }),
  };
}

function extractCartUserError(userErrors?: Array<{ message?: string }>) {
  const msg = userErrors?.[0]?.message?.trim();
  return msg || null;
}

export function buildCartErrorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message, cart: null }, { status });
}

export function buildCartSuccessResponse(cart: CartPayload) {
  return NextResponse.json({ ok: true, error: null, cart }, { status: 200 });
}

export function attachCartCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCartCookie(response: NextResponse) {
  response.cookies.set(CART_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCartById(cartId: string): Promise<CartMutationResult> {
  const query = `
    ${CART_FIELDS_FRAGMENT}
    query CartById($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFields
      }
    }
  `;

  const result = await callStorefront<{ cart: StorefrontCart | null }>(query, {
    cartId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error || "No se pudo consultar el carrito." };
  }

  if (!result.data?.cart) {
    return { ok: false, error: "Carrito no encontrado o expirado." };
  }

  return {
    ok: true,
    cart: mapCart(result.domain || "", result.data.cart),
  };
}

export async function createCart(options?: {
  merchandiseId?: string;
  quantity?: number;
  lines?: Array<{
    merchandiseId: string;
    quantity?: number;
  }>;
}): Promise<CartMutationResult> {
  const safeLinesFromPayload =
    options?.lines
      ?.filter((line) => Boolean(line?.merchandiseId))
      .map((line) => ({
        merchandiseId: line.merchandiseId,
        quantity: Math.max(1, Number(line.quantity || 1)),
      })) || [];

  const lines =
    safeLinesFromPayload.length > 0
      ? safeLinesFromPayload
      : options?.merchandiseId
      ? [
          {
            merchandiseId: options.merchandiseId,
            quantity: Math.max(1, options.quantity || 1),
          },
        ]
      : [];

  const query = `
    ${CART_FIELDS_FRAGMENT}
    mutation CartCreate($input: CartInput) {
      cartCreate(input: $input) {
        cart {
          ...CartFields
        }
        userErrors {
          message
        }
      }
    }
  `;

  const result = await callStorefront<{
    cartCreate?: {
      cart?: StorefrontCart | null;
      userErrors?: Array<{ message?: string }>;
    };
  }>(query, {
    input: { lines },
  });

  if (!result.ok) {
    return { ok: false, error: result.error || "No se pudo crear el carrito." };
  }

  const payload = result.data?.cartCreate;
  const userError = extractCartUserError(payload?.userErrors);
  if (userError) {
    return { ok: false, error: userError };
  }

  if (!payload?.cart) {
    return { ok: false, error: "Shopify no devolvio carrito al crear." };
  }

  return {
    ok: true,
    cart: mapCart(result.domain || "", payload.cart),
  };
}

export async function addCartLine(options: {
  cartId: string;
  merchandiseId: string;
  quantity?: number;
}): Promise<CartMutationResult> {
  const query = `
    ${CART_FIELDS_FRAGMENT}
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          message
        }
      }
    }
  `;

  const result = await callStorefront<{
    cartLinesAdd?: {
      cart?: StorefrontCart | null;
      userErrors?: Array<{ message?: string }>;
    };
  }>(query, {
    cartId: options.cartId,
    lines: [
      {
        merchandiseId: options.merchandiseId,
        quantity: Math.max(1, options.quantity || 1),
      },
    ],
  });

  if (!result.ok) {
    return { ok: false, error: result.error || "No se pudo agregar al carrito." };
  }

  const payload = result.data?.cartLinesAdd;
  const userError = extractCartUserError(payload?.userErrors);
  if (userError) {
    return { ok: false, error: userError };
  }

  if (!payload?.cart) {
    return { ok: false, error: "Shopify no devolvio carrito actualizado." };
  }

  return {
    ok: true,
    cart: mapCart(result.domain || "", payload.cart),
  };
}

export async function updateCartLine(options: {
  cartId: string;
  lineId: string;
  quantity: number;
}): Promise<CartMutationResult> {
  const query = `
    ${CART_FIELDS_FRAGMENT}
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          message
        }
      }
    }
  `;

  const result = await callStorefront<{
    cartLinesUpdate?: {
      cart?: StorefrontCart | null;
      userErrors?: Array<{ message?: string }>;
    };
  }>(query, {
    cartId: options.cartId,
    lines: [
      {
        id: options.lineId,
        quantity: Math.max(1, options.quantity),
      },
    ],
  });

  if (!result.ok) {
    return { ok: false, error: result.error || "No se pudo actualizar el carrito." };
  }

  const payload = result.data?.cartLinesUpdate;
  const userError = extractCartUserError(payload?.userErrors);
  if (userError) {
    return { ok: false, error: userError };
  }

  if (!payload?.cart) {
    return { ok: false, error: "Shopify no devolvio carrito actualizado." };
  }

  return {
    ok: true,
    cart: mapCart(result.domain || "", payload.cart),
  };
}

export async function removeCartLine(options: {
  cartId: string;
  lineId: string;
}): Promise<CartMutationResult> {
  const query = `
    ${CART_FIELDS_FRAGMENT}
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFields
        }
        userErrors {
          message
        }
      }
    }
  `;

  const result = await callStorefront<{
    cartLinesRemove?: {
      cart?: StorefrontCart | null;
      userErrors?: Array<{ message?: string }>;
    };
  }>(query, {
    cartId: options.cartId,
    lineIds: [options.lineId],
  });

  if (!result.ok) {
    return { ok: false, error: result.error || "No se pudo eliminar la linea del carrito." };
  }

  const payload = result.data?.cartLinesRemove;
  const userError = extractCartUserError(payload?.userErrors);
  if (userError) {
    return { ok: false, error: userError };
  }

  if (!payload?.cart) {
    return { ok: false, error: "Shopify no devolvio carrito actualizado." };
  }

  return {
    ok: true,
    cart: mapCart(result.domain || "", payload.cart),
  };
}
