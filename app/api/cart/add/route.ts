import { NextRequest } from "next/server";
import {
  CART_COOKIE_NAME,
  addCartLine,
  attachCartCookie,
  buildCartErrorResponse,
  buildCartSuccessResponse,
  createCart,
} from "@/lib/shopifyCart";

export async function POST(request: NextRequest) {
  let body: { merchandiseId?: string; quantity?: number } = {};
  try {
    body = (await request.json()) as { merchandiseId?: string; quantity?: number };
  } catch {
    body = {};
  }

  const merchandiseId = body.merchandiseId || "";
  const quantity = body.quantity || 1;

  if (!merchandiseId) {
    return buildCartErrorResponse("Falta merchandiseId para agregar al carrito.", 400);
  }

  const cookieCartId = request.cookies.get(CART_COOKIE_NAME)?.value || "";

  if (!cookieCartId) {
    const created = await createCart({ merchandiseId, quantity });
    if (!created.ok || !created.cart) {
      return buildCartErrorResponse(
        created.error || "No se pudo crear carrito con el producto.",
        400
      );
    }

    const response = buildCartSuccessResponse(created.cart);
    attachCartCookie(response, created.cart.id);
    return response;
  }

  const updated = await addCartLine({
    cartId: cookieCartId,
    merchandiseId,
    quantity,
  });

  if (!updated.ok || !updated.cart) {
    const fallbackCreate = await createCart({ merchandiseId, quantity });
    if (!fallbackCreate.ok || !fallbackCreate.cart) {
      return buildCartErrorResponse(
        updated.error || fallbackCreate.error || "No se pudo agregar al carrito.",
        400
      );
    }

    const fallbackResponse = buildCartSuccessResponse(fallbackCreate.cart);
    attachCartCookie(fallbackResponse, fallbackCreate.cart.id);
    return fallbackResponse;
  }

  const response = buildCartSuccessResponse(updated.cart);
  attachCartCookie(response, updated.cart.id);
  return response;
}
