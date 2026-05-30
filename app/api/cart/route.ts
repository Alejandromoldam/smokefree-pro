import { NextRequest, NextResponse } from "next/server";
import {
  CART_COOKIE_NAME,
  attachCartCookie,
  buildCartErrorResponse,
  clearCartCookie,
  getCartById,
} from "@/lib/shopifyCart";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const cookieCartId = request.cookies.get(CART_COOKIE_NAME)?.value || "";
  const queryCartId = url.searchParams.get("cartId") || "";
  const cartId = cookieCartId || queryCartId;

  if (!cartId) {
    return NextResponse.json({ ok: true, error: null, cart: null }, { status: 200 });
  }

  const result = await getCartById(cartId);
  if (!result.ok || !result.cart) {
    const isNotFound = (result.error || "").toLowerCase().includes("carrito no encontrado");
    if (isNotFound) {
      const response = NextResponse.json(
        { ok: true, error: null, cart: null },
        { status: 200 }
      );
      clearCartCookie(response);
      return response;
    }

    return buildCartErrorResponse(result.error || "No se pudo cargar el carrito.", 502);
  }

  const response = NextResponse.json(
    { ok: true, error: null, cart: result.cart },
    { status: 200 }
  );
  attachCartCookie(response, result.cart.id);
  return response;
}
