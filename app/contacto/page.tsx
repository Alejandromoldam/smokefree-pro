import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

const PAGE_TITLE = "Contacto";
const PAGE_DESCRIPTION =
  "Canales oficiales de contacto de All In One Store para soporte comercial y postventa.";

function buildWhatsappUrl(number: string) {
  const cleaned = number.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    "Hola, estoy viendo la tienda All In One y necesito ayuda con un producto."
  );
  if (!cleaned) return "#";
  return `https://wa.me/${cleaned}?text=${message}`;
}

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | All In One Store`,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "https://allinonestore.lat/contacto",
  },
  openGraph: {
    title: `${PAGE_TITLE} | All In One Store`,
    description: PAGE_DESCRIPTION,
    url: "https://allinonestore.lat/contacto",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | All In One Store`,
    description: PAGE_DESCRIPTION,
  },
};

export default function ContactPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const whatsappUrl = buildWhatsappUrl(whatsappNumber);

  return (
    <LegalPageShell
      title={PAGE_TITLE}
      subtitle="Nuestro equipo esta disponible para ayudarte antes, durante y despues de tu compra."
      updatedAt="31/05/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Atencion comercial</h2>
        <p>Escribenos para asesoria de producto, estado de pedido y soporte postventa.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/85">Correo</p>
          <a href="mailto:support@allinonestore.lat" className="mt-2 inline-flex text-sm text-cyan-100 hover:text-cyan-50">
            support@allinonestore.lat
          </a>
        </article>

        <article className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/85">WhatsApp</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm text-cyan-100 hover:text-cyan-50"
          >
            Hablar con asesor
          </a>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Horario de atencion</h2>
        <p>Soporte digital con monitoreo continuo para solicitudes de clientes.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Datos recomendados al escribirnos</h2>
        <ul className="list-disc space-y-2 pl-5 text-gray-200">
          <li>Numero de pedido.</li>
          <li>Correo usado en la compra.</li>
          <li>Resumen breve de la solicitud.</li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
