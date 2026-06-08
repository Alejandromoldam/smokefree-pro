import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import CatalogSection from "@/components/CatalogSection";
import HeroProductCarousel from "@/components/HeroProductCarousel";
import NavbarCartButton from "@/components/NavbarCartButton";
import TopBenefitsBar from "@/components/TopBenefitsBar";
import BestSellersSection from "@/components/BestSellersSection";
import CustomerExperiencesSection from "@/components/CustomerExperiencesSection";

const PRODUCT_LINK =
  "/products/2-in-1-multifunctional-indoor-smokeless-ashtray-360-surround-suction-intelligent-air-purifier-ashtray-indoor-household-car-intelligent-ashtray-grey";
const CATALOG_LINK = "#catalogo";
const CART_LINK = "https://all-in-one-22092396.myshopify.com/cart";

type BenefitIconType = "air" | "chip" | "shield";

const benefits: Array<{
  title: string;
  description: string;
  icon: BenefitIconType;
}> = [
  {
    title: "Aire mas limpio en minutos",
    description:
      "Succion 360 inteligente para disminuir humo visible y olores molestos en espacios cerrados.",
    icon: "air",
  },
  {
    title: "Ingenieria compacta premium",
    description:
      "Construccion minimalista y robusta para hogar, oficina o auto sin sacrificar potencia.",
    icon: "chip",
  },
  {
    title: "Uso diario con confianza",
    description:
      "Operacion estable, bajo ruido y materiales faciles de limpiar para una experiencia superior.",
    icon: "shield",
  },
];

const productSpecs = [
  "Flujo envolvente de alto rendimiento",
  "Sistema de filtrado optimizado",
  "Formato portatil con carga USB",
  "Acabado premium resistente",
];

const comparisonRows = [
  {
    feature: "Control de humo",
    smokeFree: "Avanzado 360",
    conventional: "Parcial",
    basic: "Limitado",
  },
  {
    feature: "Reduccion de olores",
    smokeFree: "Alta",
    conventional: "Media",
    basic: "Baja",
  },
  {
    feature: "Nivel de ruido",
    smokeFree: "Silencioso",
    conventional: "Medio",
    basic: "Variable",
  },
  {
    feature: "Diseno premium",
    smokeFree: "Si",
    conventional: "No",
    basic: "No",
  },
  {
    feature: "Portabilidad",
    smokeFree: "Alta",
    conventional: "Media",
    basic: "Media",
  },
];

const testimonials = [
  {
    name: "Camila R.",
    role: "Compradora verificada",
    avatar: "https://i.pravatar.cc/160?img=32",
    quote:
      "Se nota la diferencia desde el primer dia. La calidad del producto y el acabado son top.",
  },
  {
    name: "Javier M.",
    role: "Cliente recurrente",
    avatar: "https://i.pravatar.cc/160?img=12",
    quote:
      "Potente, silencioso y con estetica premium. Encajo perfecto en mi estudio.",
  },
  {
    name: "Daniela P.",
    role: "Emprendedora",
    avatar: "https://i.pravatar.cc/160?img=47",
    quote:
      "Compra rapida, buen soporte y producto excelente. Recomendado para espacios modernos.",
  },
];

const customerReviewCards: Array<{
  name: string;
  location: string;
  comment: string;
  avatar: string;
  rating: number;
}> = [
  {
    name: "Sofia L.",
    location: "Monterrey, MX",
    comment:
      "La experiencia de compra fue impecable y el producto llego tal como esperaba. Calidad premium real.",
    avatar: "https://i.pravatar.cc/160?img=44",
    rating: 5,
  },
  {
    name: "Andres V.",
    location: "Bogota, CO",
    comment:
      "Checkout rapido y seguro. Se nota un ecommerce serio y bien pensado para conversion.",
    avatar: "https://i.pravatar.cc/160?img=15",
    rating: 5,
  },
  {
    name: "Mariana C.",
    location: "Santiago, CL",
    comment:
      "Buen soporte antes de comprar. Todo fue claro y recibi seguimiento del envio sin complicaciones.",
    avatar: "https://i.pravatar.cc/160?img=5",
    rating: 5,
  },
  {
    name: "Daniel R.",
    location: "Lima, PE",
    comment:
      "Diseno elegante y producto funcional. Recomiendo la tienda por confianza y tiempos de entrega.",
    avatar: "https://i.pravatar.cc/160?img=28",
    rating: 5,
  },
  {
    name: "Valentina P.",
    location: "CDMX, MX",
    comment:
      "Se siente una marca tecnologica premium. Facil comprar desde movil y pagar con tranquilidad.",
    avatar: "https://i.pravatar.cc/160?img=31",
    rating: 5,
  },
  {
    name: "Jorge M.",
    location: "Quito, EC",
    comment:
      "Proceso muy pulido. Producto verificado, excelente presentacion y servicio postventa atento.",
    avatar: "https://i.pravatar.cc/160?img=67",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Cuanto tarda el envio?",
    answer:
      "Depende de tu ubicacion. Shopify muestra costo y fecha estimada antes de confirmar el pago.",
  },
  {
    question: "Puedo comprar desde celular?",
    answer:
      "Si. La landing esta optimizada para movil y el checkout abre seguro en Shopify.",
  },
  {
    question: "Incluye garantia?",
    answer:
      "Tu compra queda respaldada por el sistema de pago y politicas activas de la tienda.",
  },
  {
    question: "Donde veo todos los productos?",
    answer:
      "En el boton Ver catalogo accedes a la coleccion completa de la tienda.",
  },
];

const metrics = [
  {
    label: "Diseno",
    value: "Premium",
  },
  {
    label: "Eficiencia",
    value: "Alta",
  },
  {
    label: "Uso",
    value: "Hogar / Auto",
  },
];

const heroTrustBadges = [
  "Pago Seguro",
  "Envío Rápido",
  "Garantía de Satisfacción",
  "Atención Personalizada",
];

const trustItems = [
  {
    title: "Envio rapido",
    text: "Seguimiento activo desde despacho hasta entrega.",
    icon: "truck",
  },
  {
    title: "Pago seguro",
    text: "Checkout protegido con infraestructura de Shopify.",
    icon: "shield",
  },
  {
    title: "Garantia",
    text: "Soporte y acompanamiento postventa para tu compra.",
    icon: "spark",
  },
  {
    title: "Atencion personalizada",
    text: "Ayuda rapida antes y despues de comprar.",
    icon: "support",
  },
] as const;

type TrustSignalIconType =
  | "shield"
  | "truck"
  | "spark"
  | "support"
  | "lock"
  | "badge";

const premiumTrustSignals: Array<{
  title: string;
  icon: TrustSignalIconType;
}> = [
  { title: "Pago seguro con Shopify", icon: "shield" },
  { title: "Envios internacionales", icon: "truck" },
  { title: "Garantia de satisfaccion", icon: "spark" },
  { title: "Soporte especializado", icon: "support" },
  { title: "Checkout cifrado", icon: "lock" },
  { title: "Productos verificados", icon: "badge" },
];

export const metadata: Metadata = {
  title: "All In One | Catálogo de tecnología premium",
  description:
    "Descubre el catálogo de All In One con productos tecnológicos premium, precios actualizados y compra segura en línea.",
  alternates: {
    canonical: "https://allinonestore.lat",
  },
  openGraph: {
    title: "All In One | Catálogo de tecnología premium",
    description:
      "Descubre el catálogo de All In One con productos tecnológicos premium, precios actualizados y compra segura en línea.",
    url: "https://allinonestore.lat",
    siteName: "All In One Store",
    type: "website",
    images: [
      {
        url: "/producto-real.png",
        alt: "All In One Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All In One | Catálogo de tecnología premium",
    description:
      "Descubre el catálogo de All In One con productos tecnológicos premium, precios actualizados y compra segura en línea.",
    images: ["/producto-real.png"],
  },
};

function BenefitIcon({ type }: { type: BenefitIconType }) {
  if (type === "air") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path
          d="M3 8h10c2.2 0 4-1.8 4-4M3 12h14c2.2 0 4 1.8 4 4M3 16h8c2.2 0 4 1.8 4 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "chip") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3 4.5 6v5c0 5 3.2 8 7.5 10 4.3-2 7.5-5 7.5-10V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m6.2 10.2 2.2 2.2 5.3-5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.4" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m10 2.4 2.2 4.4 4.9.7-3.5 3.4.8 4.9-4.4-2.3-4.4 2.3.8-4.9-3.5-3.4 4.9-.7L10 2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TrustSignalIcon({
  icon,
  className = "",
}: {
  icon: TrustSignalIconType;
  className?: string;
}) {
  if (icon === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path
          d="M12 3 4.8 6.1V11c0 4.9 3 8.4 7.2 10 4.2-1.6 7.2-5.1 7.2-10V6.1L12 3Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m8.7 12.1 2.1 2 4.5-4.3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "truck") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path
          d="M3 7.5h11v7.3H3V7.5Zm11 2.2h3l3 3v2.1h-6V9.7Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="7.4" cy="16.9" r="1.4" fill="currentColor" />
        <circle cx="17.5" cy="16.9" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "spark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path
          d="M12 3.8 14.3 9l5.2 2.3-5.2 2.3L12 18.8l-2.3-5.2-5.2-2.3L9.7 9 12 3.8Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "support") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path
          d="M4 11a8 8 0 0 1 16 0v4.5a2 2 0 0 1-2 2h-2.3v-5.7H20"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 11h4.3v5.7H6a2 2 0 0 1-2-2V11Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "lock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <rect
          x="5.4"
          y="10.3"
          width="13.2"
          height="10.2"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8.8 10.3V8.5A3.2 3.2 0 0 1 12 5.3a3.2 3.2 0 0 1 3.2 3.2v1.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m8.9 12 1.9 1.9 4.3-4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="premium-shell relative z-10 overflow-hidden bg-transparent pb-12 text-white sm:pb-16 md:pb-0">
      <nav className="glass-nav sticky inset-x-0 top-0 z-50 border-b border-white/10">
        <TopBenefitsBar />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="tracking-brand text-sm font-semibold uppercase text-white">
            ALL IN ONE
          </Link>

          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#inicio" className="nav-link">
              Inicio
            </a>
            <a href="#catalogo" className="nav-link">
              Catalogo
            </a>
            <a href="#beneficios" className="nav-link">
              Beneficios
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
            <a href="#contacto" className="nav-link">
              Contacto
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#catalogo"
              className="btn-ghost px-3 py-2 text-xs font-semibold sm:text-sm"
            >
              Catalogo
            </a>
            <NavbarCartButton />
          </div>
        </div>
      </nav>

      <section
        id="inicio"
        className="hero-section hero-cinematic relative mx-auto flex min-h-[auto] w-full max-w-7xl flex-col justify-start gap-6 overflow-hidden px-4 pb-6 pt-8 sm:min-h-screen sm:justify-center sm:gap-14 sm:px-6 sm:pb-16 sm:pt-24 lg:flex-row lg:items-center lg:gap-20 lg:px-8 lg:pb-20 lg:pt-28"
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <div className="light-orb light-orb-a" />
          <div className="light-orb light-orb-b" />
          <div className="light-orb light-orb-c" />
          <div className="hero-local-haze" />
        </div>

        <div className="parallax-layer depth-soft relative z-10 w-full lg:w-[44%]">
          <p className="reveal-1 mb-5 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-100">
            Startup technology grade
          </p>

          <h1 className="reveal-2 max-w-[14ch] text-[clamp(2.2rem,5.8vw,4.75rem)] font-semibold leading-[1.14] text-white">
            Tecnología premium para la vida moderna
          </h1>

          <p className="reveal-3 mt-6 max-w-[34rem] text-[0.99rem] leading-8 text-gray-300 sm:text-lg sm:leading-8">
            All In One reúne productos tecnológicos y soluciones innovadoras
            seleccionadas para mejorar tu experiencia diaria.
          </p>

          <div className="reveal-4 mt-8 flex flex-wrap items-center gap-3">
            <a
              href={PRODUCT_LINK}
              className="btn-premium px-7 py-3 text-sm font-semibold sm:px-8 sm:py-4 sm:text-base"
            >
              Comprar ahora
            </a>
            <a
              href={CATALOG_LINK}
              className="btn-ghost px-7 py-3 text-sm font-semibold sm:px-8 sm:py-4 sm:text-base"
            >
              Ver catalogo
            </a>
          </div>

          <div className="hero-trust-badges reveal-5 mt-5 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
            {heroTrustBadges.map((badge) => (
              <div
                key={badge}
                className="hero-trust-badge inline-flex items-center gap-2 rounded-xl border border-white/14 bg-white/[0.04] px-3 py-2 text-xs font-medium text-gray-100 sm:text-sm"
              >
                <span className="text-emerald-300">✓</span>
                <span>{badge}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 grid w-full max-w-xl grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="glass-card rounded-2xl border border-white/12 px-3 py-4 text-center"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-gray-400">
                  {metric.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white sm:text-base">
                  {metric.value}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-media-wrap relative z-10 w-full lg:w-[56%]">
          <div className="hero-frame hero-dominant parallax-layer depth-strong relative mx-auto max-w-2xl rounded-[2.2rem] border border-white/15 p-3 sm:p-5">
            <div className="hero-glow absolute -inset-10 -z-10" />
            <div className="fx-hero-electric" />
            <div className="fx-product-smoke" />
            <HeroProductCarousel />
          </div>
        </div>
      </section>

      <BestSellersSection />
      <CustomerExperiencesSection />

      <CatalogSection />

      <section className="trust-section section-reveal mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">
            Confianza premium
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Compra con confianza en All In One
          </h2>
        </div>

        <div className="glass-card rounded-3xl border border-white/12 bg-[rgba(4,10,20,0.72)] p-5 backdrop-blur-xl sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {trustItems.map((item) => (
              <article key={item.title} className="trust-card rounded-2xl p-4 sm:p-5">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-cyan-100">
                  <TrustSignalIcon icon={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">
            Opiniones de clientes
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Clientes reales, resultados reales
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {customerReviewCards.map((review) => (
            <article
              key={`${review.name}-${review.location}`}
              className="glass-card rounded-3xl border border-white/12 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="avatar-ring inline-flex h-11 w-11 items-center justify-center rounded-full p-[1px]">
                  <Image
                    src={review.avatar}
                    alt={`Foto de ${review.name}`}
                    width={88}
                    height={88}
                    className="avatar-core h-full w-full rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{review.name}</p>
                  <p className="text-xs text-gray-400">{review.location}</p>
                </div>
              </div>

              <div className="mb-3 inline-flex items-center gap-1 text-amber-300">
                {Array.from({ length: review.rating }).map((_, idx) => (
                  <StarIcon key={`${review.name}-rating-${idx}`} />
                ))}
              </div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.13em] text-emerald-100">
                <CheckIcon />
                Compra verificada
              </div>

              <p className="text-sm leading-relaxed text-gray-200 sm:text-base">
                &ldquo;{review.comment}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="beneficios" className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">Beneficios</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Rendimiento premium pensado para tu ritmo diario
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map((benefit, idx) => (
            <article
              key={benefit.title}
              className={`benefit-card reveal-${Math.min(idx + 2, 5)} rounded-3xl p-6`}
            >
              <div className="benefit-icon-shell mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/35 bg-cyan-300/10 text-cyan-100">
                <BenefitIcon type={benefit.icon} />
              </div>
              <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-300 sm:text-base">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="producto" className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="glass-card grid gap-8 rounded-3xl border border-white/12 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/90 sm:text-sm">
              Producto estrella
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              SmokeFree Pro 360 Edition (Producto destacado)
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
              Tecnologia avanzada, estetica minimalista y construccion premium para
              transformar espacios con una experiencia limpia y moderna.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {productSpecs.map((spec) => (
                <li
                  key={spec}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
                >
                  {spec}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={PRODUCT_LINK}
                className="btn-premium px-7 py-3 text-sm font-semibold sm:px-8 sm:py-4 sm:text-base"
              >
                Comprar ahora
              </a>
              <a
                href={CATALOG_LINK}
                className="btn-ghost px-7 py-3 text-sm font-semibold sm:px-8 sm:py-4 sm:text-base"
              >
                Ver catalogo
              </a>
            </div>
          </div>

          <div className="parallax-layer depth-mid relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-cyan-500/25 to-emerald-500/20 blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-black/40 p-3">
              <Image
                src="/producto-real.png"
                alt="Producto destacado All In One"
                width={1000}
                height={1000}
                className="h-auto w-full rounded-[1.4rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="comparativa" className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">Comparativa</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Superioridad de SmokeFree Pro frente a opciones comunes
          </h2>
        </div>

        <div className="glass-card overflow-hidden rounded-3xl border border-white/12">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse">
              <thead>
                <tr className="border-b border-white/12 bg-white/8 text-left text-xs uppercase tracking-[0.12em] text-gray-300 sm:text-sm">
                  <th className="px-5 py-4 font-medium">Caracteristica</th>
                  <th className="px-5 py-4 font-medium text-cyan-100">SmokeFree Pro</th>
                  <th className="px-5 py-4 font-medium">Convencional</th>
                  <th className="px-5 py-4 font-medium">Basico</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-white/10 last:border-b-0">
                    <td className="px-5 py-4 text-sm font-medium text-white sm:text-base">{row.feature}</td>
                    <td className="px-5 py-4">
                      <span className="compare-pill compare-pill-good">
                        <CheckIcon />
                        {row.smokeFree}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="compare-pill compare-pill-neutral">
                        <DotIcon />
                        {row.conventional}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="compare-pill compare-pill-neutral">
                        <DotIcon />
                        {row.basic}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">Testimonios</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Experiencias reales con resultados visibles
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="glass-card rounded-3xl border border-white/12 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="avatar-ring inline-flex h-11 w-11 items-center justify-center rounded-full p-[1px]">
                  <Image
                    src={item.avatar}
                    alt={`Foto de ${item.name}`}
                    width={88}
                    height={88}
                    className="avatar-core h-full w-full rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.role}</p>
                </div>
              </div>
              <div className="mb-3 inline-flex items-center gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <StarIcon key={`${item.name}-star-${idx}`} />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-gray-200 sm:text-base">
                &ldquo;{item.quote}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="glass-card faq-item rounded-2xl border border-white/12 p-5"
            >
              <summary className="cursor-pointer list-none pr-8 text-sm font-medium text-white sm:text-base">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        id="contacto"
        className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"
      >
        <div className="glass-card rounded-3xl border border-white/12 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85 sm:text-sm">
            Contacto
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Equipo de soporte y ventas
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Si necesitas ayuda para elegir productos, seguimiento de pedido o
            soporte postventa, nuestro equipo esta disponible para ayudarte.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="trust-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200/90">
                Email
              </p>
              <p className="mt-2 text-sm text-white">support@allinonestore.lat</p>
            </article>
            <article className="trust-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200/90">
                Horario
              </p>
              <p className="mt-2 text-sm text-white">Atencion 24/7</p>
            </article>
            <article className="trust-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200/90">
                Carrito
              </p>
              <a
                href={CART_LINK}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm text-cyan-200 transition hover:text-cyan-100"
              >
                Abrir carrito Shopify
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-cyan-300/25 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90 sm:text-sm">
            Confianza premium
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Compra segura en cada pedido
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Infraestructura profesional para comprar con tranquilidad en cualquier
            dispositivo.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {premiumTrustSignals.map((signal) => (
              <article
                key={signal.title}
                className="rounded-2xl border border-white/12 bg-black/35 px-4 py-4 shadow-[0_0_0_1px_rgba(34,211,238,0.10)_inset,0_14px_28px_rgba(0,0,0,0.36)]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/35 bg-cyan-300/10 text-cyan-100">
                    <TrustSignalIcon icon={signal.icon} className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-gray-100 sm:text-base">
                    {signal.title}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-reveal mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="cta-panel parallax-layer depth-soft rounded-3xl border border-cyan-300/25 px-6 py-10 text-center sm:px-10">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/90 sm:text-sm">
            Call to action
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-[1.18] text-white sm:text-4xl lg:text-5xl">
            Respira mejor hoy y transforma tu espacio con tecnologia premium
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-200 sm:text-base">
            Compra en Shopify en segundos y eleva la calidad visual y funcional de
            tu entorno diario.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs uppercase tracking-[0.16em] text-emerald-200/90 sm:text-sm">
            Envio rapido · Pago seguro - Garantia - Soporte 24/7
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href={PRODUCT_LINK}
              className="btn-premium px-9 py-4 text-sm font-semibold sm:text-base"
            >
              Comprar ahora
            </a>
            <a
              href={CATALOG_LINK}
              className="btn-ghost px-9 py-4 text-sm font-semibold sm:text-base"
            >
              Ver catalogo
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}





