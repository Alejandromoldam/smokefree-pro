import { NextRequest } from "next/server";
import {
  CART_COOKIE_NAME,
  attachCartCookie,
  buildCartErrorResponse,
  buildCartSuccessResponse,
  removeCartLine,
} from "@/lib/shopifyCart";

export async function POST(request: NextRequest) {
  let body: { lineId?: string } = {};
  try {
    body = (await request.json()) as { lineId?: string };
  } catch {
    body = {};
  }

  const lineId = body.lineId || "";
  if (!lineId) {
    return buildCartErrorResponse("Falta lineId para eliminar del carrito.", 400);
  }

  const cartId = request.cookies.get(CART_COOKIE_NAME)?.value || "";
  if (!cartId) {
    return buildCartErrorResponse("No hay carrito activo para eliminar productos.", 400);
  }

  const result = await removeCartLine({ cartId, lineId });
  if (!result.ok || !result.cart) {
    return buildCartErrorResponse(result.error || "No se pudo eliminar del carrito.", 400);
  }

  const response = buildCartSuccessResponse(result.cart);
  attachCartCookie(response, result.cart.id);
  return response;
}
