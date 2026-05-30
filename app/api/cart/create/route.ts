import {
  createCart,
  attachCartCookie,
  buildCartErrorResponse,
  buildCartSuccessResponse,
} from "@/lib/shopifyCart";

export async function POST(request: Request) {
  let body: {
    merchandiseId?: string;
    quantity?: number;
    lines?: Array<{ merchandiseId?: string; quantity?: number }>;
  } = {};

  try {
    body = (await request.json()) as {
      merchandiseId?: string;
      quantity?: number;
      lines?: Array<{ merchandiseId?: string; quantity?: number }>;
    };
  } catch {
    body = {};
  }

  const safeLines =
    body.lines
      ?.filter((line) => Boolean(line?.merchandiseId))
      .map((line) => ({
        merchandiseId: String(line.merchandiseId),
        quantity: Number(line.quantity || 1),
      })) || [];

  const result = await createCart({
    merchandiseId: body.merchandiseId,
    quantity: body.quantity,
    lines: safeLines,
  });

  if (!result.ok || !result.cart) {
    return buildCartErrorResponse(result.error || "No se pudo crear el carrito.", 400);
  }

  const response = buildCartSuccessResponse(result.cart);
  attachCartCookie(response, result.cart.id);
  return response;
}
