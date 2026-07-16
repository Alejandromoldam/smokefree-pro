import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

const PAGE_TITLE = "Politica de privacidad";
const PAGE_DESCRIPTION =
  "Conoce como Elora Skin recopila, usa y protege tu informacion personal durante la navegacion y compra.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "https://allinonestore.lat/politica-de-privacidad",
  },
  openGraph: {
    title: `${PAGE_TITLE} | Elora Skin`,
    description: PAGE_DESCRIPTION,
    url: "https://allinonestore.lat/politica-de-privacidad",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | Elora Skin`,
    description: PAGE_DESCRIPTION,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title={PAGE_TITLE}
      subtitle="En Elora Skin tratamos tu informacion con responsabilidad y con enfoque en seguridad, transparencia y experiencia de compra."
      updatedAt="31/05/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Informacion que recopilamos</h2>
        <p>
          Recopilamos informacion que nos compartes al comprar, solicitar soporte o
          contactarnos, como nombre, correo, telefono, direccion de envio y datos de
          pedido.
        </p>
        <p>
          Tambien recopilamos datos tecnicos basicos de navegacion para mejorar el
          rendimiento, la seguridad y la experiencia del sitio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Uso de la informacion</h2>
        <p>Usamos tu informacion para:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Procesar pedidos y pagos.</li>
          <li>Coordinar envios y seguimiento.</li>
          <li>Responder consultas de soporte.</li>
          <li>Prevenir fraude y proteger la plataforma.</li>
          <li>Mejorar productos, catalogo y experiencia de compra.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Proteccion de datos</h2>
        <p>
          Aplicamos medidas tecnicas y organizativas razonables para proteger tu
          informacion contra acceso no autorizado, uso indebido o alteracion.
        </p>
        <p>
          Los pagos se gestionan en infraestructura segura de Shopify y proveedores
          de pago autorizados.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Comparticion de informacion</h2>
        <p>
          Solo compartimos informacion cuando es necesario para operar la tienda,
          por ejemplo con pasarelas de pago, servicios logisticos y herramientas
          tecnologicas para el funcionamiento del ecommerce.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Tus derechos</h2>
        <p>
          Puedes solicitar acceso, correccion o actualizacion de tus datos, asi como
          ejercer derechos aplicables segun tu jurisdiccion.
        </p>
      </section>
    </LegalPageShell>
  );
}
