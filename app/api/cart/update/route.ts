import { NextRequest } from "next/server";
import {
  CART_COOKIE_NAME,
  attachCartCookie,
  buildCartErrorResponse,
  buildCartSuccessResponse,
  removeCartLine,
  updateCartLine,
} from "@/lib/shopifyCart";

export async function POST(request: NextRequest) {
  let body: { lineId?: string; quantity?: number } = {};
  try {
    body = (await request.json()) as { lineId?: string; quantity?: number };
  } catch {
    body = {};
  }

  const lineId = body.lineId || "";
  const quantity = Number(body.quantity || 1);

  if (!lineId) {
    return buildCartErrorResponse("Falta lineId para actualizar carrito.", 400);
  }

  const cartId = request.cookies.get(CART_COOKIE_NAME)?.value || "";
  if (!cartId) {
    return buildCartErrorResponse("No hay carrito activo para actualizar.", 400);
  }

  const result =
    quantity <= 0
      ? await removeCartLine({ cartId, lineId })
      : await updateCartLine({ cartId, lineId, quantity });

  if (!result.ok || !result.cart) {
    return buildCartErrorResponse(result.error || "No se pudo actualizar el carrito.", 400);
  }

  const response = buildCartSuccessResponse(result.cart);
  attachCartCookie(response, result.cart.id);
  return response;
}
