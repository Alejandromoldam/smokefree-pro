import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchHomeCatalogSnapshot } from "@/lib/shopifyCatalog";
import PillButton from "@/components/elora/PillButton";
import RevealOnScroll from "@/components/elora/RevealOnScroll";
import Marquee from "@/components/elora/Marquee";
import EloraBestsellers from "@/components/elora/EloraBestsellers";
import EloraCartLink from "@/components/elora/EloraCartLink";
import NewsletterForm from "@/components/elora/NewsletterForm";
import MobileNav from "@/components/elora/MobileNav";
import {
  PackageIcon,
  LockIcon,
  LeafIcon,
  HeartIcon,
  DropIcon,
  BubbleIcon,
  BrushIcon,
  SparkleStar,
  PetalShape,
} from "@/components/elora/Icons";

// Reviews are only shown when real, connected reviews exist. No system is
// wired yet, so the section stays hidden behind this flag instead of inventing
// testimonials.
const SHOW_REVIEWS = false;

const ANNOUNCEMENT_ITEMS = [
  "Envío gratis desde USD 40",
  "Ingredientes reales",
  "Cruelty free",
  "Pago seguro · Visa · Mastercard · PSE · Bancolombia",
];

const NAV_ITEMS = [
  { label: "Skincare", href: "/categorias" },
  { label: "Maquillaje", href: "/categorias" },
  { label: "Tu ritual", href: "#ritual" },
  { label: "Contacto", href: "/contacto" },
];

const TRUST_ITEMS = [
  { Icon: PackageIcon, label: "Envíos a todo el mundo" },
  { Icon: LockIcon, label: "Pago 100% seguro" },
  { Icon: LeafIcon, label: "Ingredientes reales" },
  { Icon: HeartIcon, label: "Cruelty free" },
];

const RITUAL_STEPS = [
  {
    number: "01",
    title: "Limpia",
    desc: "Retira impurezas y maquillaje sin resecar la piel.",
    Icon: DropIcon,
  },
  {
    number: "02",
    title: "Trata & hidrata",
    desc: "Nutre en profundidad con ingredientes reales, sin relleno.",
    Icon: BubbleIcon,
  },
  {
    number: "03",
    title: "Realza",
    desc: "Un toque final que ilumina tu piel tal como es.",
    Icon: BrushIcon,
  },
];

const HONEST_BEAUTY = [
  "Sin cifras infladas ni promesas imposibles",
  "Sin reseñas inventadas: solo lo que es real",
  "Cruelty free, siempre",
  "Precios claros en USD, sin sorpresas",
];

const HERO_PETALS = [
  { top: "10%", left: "4%", size: 14, duration: 13, delay: 0, tone: "blush" as const },
  { top: "24%", left: "16%", size: 10, duration: 16, delay: 2.4, tone: "blush-deep" as const },
  { top: "6%", left: "34%", size: 12, duration: 14, delay: 4.8, tone: "blush" as const },
  { top: "18%", left: "46%", size: 16, duration: 18, delay: 1.2, tone: "blush-deep" as const },
  { top: "4%", left: "60%", size: 11, duration: 15, delay: 6, tone: "blush" as const },
];

const HERO_SPARKLES = [
  { top: "8%", right: "26%", delay: 0 },
  { top: "58%", right: "6%", delay: 0.9 },
  { top: "34%", right: "44%", delay: 1.8 },
];

export const metadata: Metadata = {
  title: "Elora Skin | Skincare con ingredientes reales",
  description:
    "Elora Skin — rituales de skincare formulados con ingredientes reales, fórmulas limpias y resultados que se sienten como un abrazo.",
  openGraph: {
    title: "Elora Skin | Skincare con ingredientes reales",
    description:
      "Rituales de skincare formulados con ingredientes reales, fórmulas limpias y resultados que se sienten como un abrazo.",
    siteName: "Elora Skin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elora Skin | Skincare con ingredientes reales",
    description:
      "Rituales de skincare formulados con ingredientes reales, fórmulas limpias y resultados que se sienten como un abrazo.",
  },
};

export default async function Home() {
  const catalogSnapshot = await fetchHomeCatalogSnapshot();
  const featured = catalogSnapshot.products[0] ?? null;

  return (
    <main className="elora-home">
      <div className="elora-bg" aria-hidden="true" />

      {/* 1 — Announcement bar --------------------------------------------- */}
      <div className="elora-strip">
        <Marquee
          items={ANNOUNCEMENT_ITEMS}
          durationSeconds={28}
          ariaLabel="Beneficios de Elora Skin"
        />
      </div>

      {/* 2 — Nav ------------------------------------------------------------ */}
      <header className="elora-header">
        <nav className="elora-nav">
          <Link href="/" className="elora-logo">
            Elora <span>Skin</span>
          </Link>
          <ul className="elora-nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="elora-nav-icons">
            <EloraCartLink />
            <MobileNav items={NAV_ITEMS} />
          </div>
        </nav>
      </header>

      {/* 3 — Hero ------------------------------------------------------------ */}
      <section className="elora-hero" id="inicio">
        {HERO_PETALS.map((petal, index) => (
          <span
            key={`petal-${index}`}
            className="elora-petal"
            aria-hidden="true"
            style={{
              top: petal.top,
              left: petal.left,
              width: petal.size,
              height: petal.size,
              color: `var(--${petal.tone})`,
              animationDuration: `${petal.duration}s`,
              animationDelay: `${petal.delay}s`,
            }}
          >
            <PetalShape />
          </span>
        ))}
        {HERO_SPARKLES.map((sparkle, index) => (
          <span
            key={`sparkle-${index}`}
            className="elora-sparkle"
            aria-hidden="true"
            style={{ top: sparkle.top, right: sparkle.right, animationDelay: `${sparkle.delay}s` }}
          >
            <SparkleStar />
          </span>
        ))}
        <span className="elora-bubble" aria-hidden="true" />

        <div className="elora-hero-grid">
          <div className="elora-hero-copy">
            <span className="elora-eyebrow">Nueva colección facial · 2026</span>
            <h1 className="elora-hero-title">
              Tu piel, pero en su <em>mejor día.</em>
            </h1>
            <p className="elora-hero-lead">
              Rituales de skincare formulados con ingredientes reales, fórmulas
              limpias y un cuidado que se siente como un abrazo.
            </p>
            <div className="elora-hero-cta">
              <PillButton href="#bestsellers">Comprar bestsellers</PillButton>
              <PillButton href="#ritual" variant="outline">
                Descubre tu ritual
              </PillButton>
            </div>
          </div>

          <div className="elora-hero-media">
            {featured ? (
              <div className="elora-hero-frame">
                <Image
                  src={featured.imageUrl}
                  alt={featured.imageAlt || featured.title}
                  width={640}
                  height={800}
                  priority
                  sizes="(max-width: 980px) 80vw, 360px"
                />
              </div>
            ) : (
              <div className="elora-hero-frame is-placeholder" aria-hidden="true">
                <div>
                  <SparkleStar className="elora-hero-frame-placeholder-icon" />
                  <p className="elora-hero-frame-placeholder-text">
                    Muy pronto — nueva colección
                  </p>
                </div>
              </div>
            )}

            {/* Static, non-invented taglines — no price or rating tied to
                real-time catalog data, so they render even while the catalog
                is empty. */}
            <div className="elora-hero-chip c1">
              <SparkleStar className="elora-hero-chip-dot" />
              Glow real
            </div>
            <div className="elora-hero-chip c2">
              <SparkleStar className="elora-hero-chip-dot" />
              Dermo-amigable
            </div>
            <div className="elora-hero-chip c3">
              <SparkleStar className="elora-hero-chip-dot" />
              Pago seguro · Tarjeta · PSE · Bancolombia
            </div>
          </div>
        </div>
      </section>

      {/* 4 — Trust bar -------------------------------------------------- */}
      <div className="elora-trust">
        <div className="elora-trust-row">
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <div key={label} className="elora-trust-item">
              <Icon className="elora-trust-ico" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* 5 — Bestsellers (real /api/catalog data) ----------------------- */}
      <EloraBestsellers initialProducts={catalogSnapshot.products} />

      {/* 6 — Un ritual de 3 minutos -------------------------------------- */}
      <section className="elora-section" id="ritual">
        <RevealOnScroll className="elora-section-head" as="div">
          <span className="elora-eyebrow">Tu ritual</span>
          <h2 className="elora-h2">
            Un ritual de 3 minutos
            <span className="elora-underline" />
          </h2>
          <p className="elora-section-sub">
            Tres pasos simples, pensados para volverse un momento tuyo cada día.
          </p>
        </RevealOnScroll>

        <div className="elora-ritual-grid">
          {RITUAL_STEPS.map((step, index) => (
            <RevealOnScroll
              key={step.number}
              as="article"
              className="elora-ritual-step"
              delay={(Math.min(index + 1, 4) as 1 | 2 | 3 | 4)}
            >
              <span className="elora-ritual-number">{step.number}</span>
              <step.Icon className="elora-ritual-icon" />
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* 7 — Belleza honesta ---------------------------------------------- */}
      <section className="elora-section elora-story" id="filosofia">
        <div className="elora-story-grid">
          <RevealOnScroll className="elora-story-visual" as="div">
            {featured ? (
              <Image
                src={featured.imageUrl}
                alt={featured.imageAlt || featured.title}
                width={720}
                height={720}
                sizes="(max-width: 980px) 90vw, 560px"
              />
            ) : null}
          </RevealOnScroll>
          <div>
            <RevealOnScroll as="span" className="elora-eyebrow">
              Belleza honesta
            </RevealOnScroll>
            <RevealOnScroll as="div" delay={1}>
              <h2>Ingredientes reales, rituales honestos</h2>
            </RevealOnScroll>
            <RevealOnScroll as="div" delay={2}>
              <p>
                Creemos que el cuidado de la piel no debería ser un misterio.
                Elegimos ingredientes reales y fórmulas limpias, pensadas para
                pieles reales y para acompañarte cada día.
              </p>
            </RevealOnScroll>
            <ul className="elora-checklist">
              {HONEST_BEAUTY.map((item, index) => (
                <RevealOnScroll
                  key={item}
                  as="li"
                  delay={(Math.min(index + 1, 4) as 1 | 2 | 3 | 4)}
                >
                  <span className="elora-dot" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </RevealOnScroll>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Reviews (only when real reviews are connected) ------------------ */}
      {SHOW_REVIEWS ? (
        <section className="elora-section" id="resenas">
          <div className="elora-section-head">
            <span className="elora-eyebrow">Reseñas</span>
            <h2 className="elora-h2">
              Lo que dice nuestra comunidad
              <span className="elora-underline" />
            </h2>
          </div>
          {/* Render real, connected reviews here. */}
        </section>
      ) : null}

      {/* 8 — CTA banner + real newsletter form -------------------------- */}
      <section id="newsletter">
        <RevealOnScroll className="elora-cta" as="div">
          <div className="elora-cta-sparkles" aria-hidden="true">
            <span style={{ top: 20, left: "10%" }}>
              <SparkleStar />
            </span>
            <span style={{ top: 60, right: "14%", animationDelay: "1s" }}>
              <SparkleStar />
            </span>
            <span style={{ bottom: 24, left: "22%", animationDelay: "2s" }}>
              <SparkleStar />
            </span>
          </div>
          <h2>Únete al club del glow</h2>
          <p>Suscríbete y recibe novedades y beneficios de Elora Skin en tu correo.</p>
          <NewsletterForm />
        </RevealOnScroll>
      </section>

      {/* 9 — Footer ----------------------------------------------------- */}
      <footer className="elora-footer">
        <div className="elora-footer-grid">
          <div>
            <div className="elora-footer-logo">Elora Skin</div>
            <p className="elora-footer-tag">
              Skincare formulado con ingredientes reales para pieles reales.
            </p>
          </div>
          <div>
            <h4>Tienda</h4>
            <ul>
              <li>
                <a href="/categorias">Skincare</a>
              </li>
              <li>
                <a href="/categorias">Maquillaje</a>
              </li>
              <li>
                <a href="/cart">Mi bolsa</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ayuda</h4>
            <ul>
              <li>
                <a href="/contacto">Contacto</a>
              </li>
              <li>
                <a href="/politica-de-envios">Envíos</a>
              </li>
              <li>
                <a href="/politica-de-devoluciones">Devoluciones</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="/politica-de-privacidad">Privacidad</a>
              </li>
              <li>
                <a href="/terminos-y-condiciones">Términos</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="elora-footer-bottom">
          © 2026 Elora Skin — Todos los derechos reservados
        </div>
      </footer>
    </main>
  );
}
