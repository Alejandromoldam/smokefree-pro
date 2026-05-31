const WHATSAPP_PREFILLED_MESSAGE =
  "Hola, estoy viendo la tienda All In One y necesito ayuda con un producto.";

function buildWhatsAppLink(rawNumber: string) {
  const digits = rawNumber.replace(/[^\d]/g, "");
  if (!digits) return null;
  const encodedText = encodeURIComponent(WHATSAPP_PREFILLED_MESSAGE);
  return `https://wa.me/${digits}?text=${encodedText}`;
}

export default function FloatingWhatsAppButton() {
  const rawNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").trim();
  const whatsappUrl = buildWhatsAppLink(rawNumber);

  if (!whatsappUrl) {
    return null;
  }

  return (
    <div className="whatsapp-float-root">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float-btn"
        aria-label="Hablar con asesor por WhatsApp"
      >
        <span className="whatsapp-float-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M20.2 12a8.2 8.2 0 0 1-12 7.3L4 20l.9-4a8.2 8.2 0 1 1 15.3-4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 8.8c.2-.4.4-.4.7-.4h.4c.1 0 .4 0 .5.3l.7 1.8c.1.3 0 .5-.1.7l-.4.5c-.1.1-.2.3-.1.5.2.5.7 1.1 1.3 1.7.7.6 1.4 1.1 2 1.3.2.1.4 0 .5-.1l.5-.4c.2-.2.5-.2.7-.1l1.7.8c.3.1.3.4.3.5v.4c0 .3 0 .5-.3.7-.4.2-1 .4-1.8.2-1.1-.3-2.4-.9-3.8-2.3-1.4-1.3-2-2.6-2.3-3.7-.2-.8 0-1.4.2-1.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="whatsapp-float-copy">
          <span className="whatsapp-float-title">¿Necesitas ayuda?</span>
          <span className="whatsapp-float-subtitle">Hablar con asesor</span>
        </span>
      </a>
    </div>
  );
}
