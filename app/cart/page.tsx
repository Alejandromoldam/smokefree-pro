import type { Metadata } from "next";
import CartPageClient from "@/components/CartPageClient";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tus productos y finaliza tu compra segura en All In One.",
  alternates: {
    canonical: "https://allinonestore.lat/cart",
  },
};

export default function CartPage() {
  return <CartPageClient />;
}
