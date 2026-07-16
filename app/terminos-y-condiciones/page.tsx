import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

const PAGE_TITLE = "Terminos y condiciones";
const PAGE_DESCRIPTION =
  "Terminos de uso, compra y responsabilidad aplicables a todas las operaciones de Elora Skin.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | Elora Skin`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "https://allinonestore.lat/terminos-y-condiciones",
  },
  openGraph: {
    title: `${PAGE_TITLE} | Elora Skin`,
    description: PAGE_DESCRIPTION,
    url: "https://allinonestore.lat/terminos-y-condiciones",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | Elora Skin`,
    description: PAGE_DESCRIPTION,
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title={PAGE_TITLE}
      subtitle="Al navegar y comprar en Elora Skin aceptas los siguientes terminos de servicio."
      updatedAt="31/05/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">1. Uso del sitio</h2>
        <p>
          El sitio debe usarse de forma licita y conforme a estos terminos. Nos
          reservamos el derecho de limitar acceso ante actividades sospechosas,
          fraudulentas o abusivas.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. Informacion de productos y precios</h2>
        <p>
          Mostramos informacion comercial actualizada de productos, disponibilidad y
          precios. Sin embargo, pueden existir cambios por actualizaciones de catalogo
          o ajustes operativos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Pedidos y pagos</h2>
        <p>
          Los pedidos se confirman al completarse correctamente el pago en el checkout
          seguro. En caso de validaciones pendientes o incidencias operativas, el
          pedido puede ser revisado antes del despacho.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Propiedad intelectual</h2>
        <p>
          La marca, diseno del sitio, contenido visual y textos comerciales son
          propiedad de Elora Skin o de sus respectivos titulares y no pueden
          reproducirse sin autorizacion.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">5. Modificaciones</h2>
        <p>
          Podemos actualizar estos terminos cuando sea necesario para reflejar cambios
          operativos, legales o de servicio. La version publicada en esta pagina es la
          vigente.
        </p>
      </section>
    </LegalPageShell>
  );
}
