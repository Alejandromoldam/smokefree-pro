import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

const PAGE_TITLE = "Politica de devoluciones";
const PAGE_DESCRIPTION =
  "Condiciones y proceso para solicitar devoluciones, cambios o reembolsos en All In One Store.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | All In One Store`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "https://allinonestore.lat/politica-de-devoluciones",
  },
  openGraph: {
    title: `${PAGE_TITLE} | All In One Store`,
    description: PAGE_DESCRIPTION,
    url: "https://allinonestore.lat/politica-de-devoluciones",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | All In One Store`,
    description: PAGE_DESCRIPTION,
  },
};

export default function ReturnsPolicyPage() {
  return (
    <LegalPageShell
      title={PAGE_TITLE}
      subtitle="Queremos que compres con tranquilidad. Si surge una incidencia, te ayudamos con una solucion clara y justa."
      updatedAt="31/05/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">1. Solicitudes de devolucion</h2>
        <p>
          Puedes solicitar devolucion o revision de tu pedido dentro del periodo
          indicado en la confirmacion de compra, siempre que el producto cumpla las
          condiciones aplicables.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. Condiciones generales</h2>
        <ul className="list-disc space-y-2 pl-5 text-gray-200">
          <li>Producto en estado adecuado y con accesorios principales.</li>
          <li>Evidencia de compra o numero de pedido valido.</li>
          <li>No presentar uso indebido o dano por manipulacion incorrecta.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Reembolsos</h2>
        <p>
          Si la solicitud procede, el reembolso se procesa por el mismo metodo de pago,
          segun los tiempos del banco o proveedor financiero.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Cambios de producto</h2>
        <p>
          En casos elegibles, podemos gestionar cambio por una unidad equivalente o
          alternativa disponible en inventario.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">5. Soporte</h2>
        <p>
          Para iniciar una solicitud, contactanos desde la pagina de contacto con tu
          numero de pedido y detalle del caso.
        </p>
      </section>
    </LegalPageShell>
  );
}
