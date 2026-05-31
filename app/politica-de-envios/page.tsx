import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

const PAGE_TITLE = "Politica de envios";
const PAGE_DESCRIPTION =
  "Tiempos de entrega, cobertura, costos y seguimiento de pedidos en All In One Store.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | All In One Store`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "https://allinonestore.lat/politica-de-envios",
  },
  openGraph: {
    title: `${PAGE_TITLE} | All In One Store`,
    description: PAGE_DESCRIPTION,
    url: "https://allinonestore.lat/politica-de-envios",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | All In One Store`,
    description: PAGE_DESCRIPTION,
  },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageShell
      title={PAGE_TITLE}
      subtitle="Trabajamos para que cada pedido llegue de forma segura, trazable y dentro de los tiempos estimados."
      updatedAt="31/05/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">1. Cobertura</h2>
        <p>
          Realizamos envios a las zonas habilitadas al momento de la compra. La
          disponibilidad final depende del destino y de la logistica activa.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. Tiempos estimados</h2>
        <p>
          Los tiempos de entrega se muestran en checkout antes de pagar. Pueden variar
          por demanda, temporada, aduanas o condiciones del transportista.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Costos de envio</h2>
        <p>
          El costo de envio se calcula automaticamente segun ubicacion, peso y metodo
          de envio seleccionado. El valor final se confirma antes del pago.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Seguimiento</h2>
        <p>
          Una vez despachado, enviamos un numero de rastreo para que puedas monitorear
          el estado del pedido hasta su entrega.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">5. Incidencias de entrega</h2>
        <p>
          Si detectas retraso, direccion incorrecta o novedad logistica, escribe a
          soporte para revisar el caso y darte asistencia.
        </p>
      </section>
    </LegalPageShell>
  );
}
