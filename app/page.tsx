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

// Reviews are only shown when real, connected reviews exist. No system is
// wired yet, so the section stays hidden behind this flag instead of inventing
// testimonials.
const SHOW_REVIEWS = false;

const BRAND_VALUES = ["SKIN FIRST", "FÓRMULAS LIMPIAS", "RESULTADOS REALES", "HECHO PARA TI"];

const TRUST_ITEMS = [
  "🚚 Envíos a todo el mundo",
  "🔒 Pago 100% seguro",
  "🌿 Ingredientes reales, sin relleno",
  "💬 Atención personalizada",
];

const PHILOSOPHY = [
  "Ingredientes reales, sin relleno",
  "Fórmulas limpias y conscientes",
  "Pensado para pieles reales",
  "Cruelty-free",
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

function formatMoney(amount: string, currencyCode: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return `${amount} ${currencyCode}`;
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function Home() {
  const catalogSnapshot = await fetchHomeCatalogSnapshot();
  const featured = catalogSnapshot.products[0] ?? null;
  const shopHref = featured?.productUrl || "#bestsellers";

  return (
    <main className="elora-home">
      <div className="elora-bg" aria-hidden="true" />

      {/* 1 — Nav ---------------------------------------------------------- */}
      <header className="elora-header">
        <nav className="elora-nav">
          <Link href="/" className="elora-logo">
            Elora <span>Skin</span>
          </Link>
          <ul className="elora-nav-links">
            <li>
              <a href="#bestsellers">Novedades</a>
            </li>
            <li>
              <a href="/categorias">Skincare</a>
            </li>
            <li>
              <a href="#bestsellers">Rituales</a>
            </li>
            <li>
              <a href="#filosofia">Nuestra historia</a>
            </li>
          </ul>
          <div className="elora-nav-icons">
            <a href="/categorias" className="elora-icon-btn" aria-label="Explorar catálogo">
              <span aria-hidden="true">🔍</span>
            </a>
            <EloraCartLink />
          </div>
        </nav>
      </header>

      {/* 2 — Hero -------------------------------------------------------- */}
      <section className="elora-hero" id="inicio">
        <span className="elora-petal" style={{ width: 26, height: 26, top: 120, left: "6%" }} />
        <span
          className="elora-petal"
          style={{ width: 18, height: 18, top: 320, left: "20%", animationDelay: "2s" }}
        />
        <span
          className="elora-petal"
          style={{ width: 22, height: 22, bottom: 60, left: "12%", animationDelay: "4s" }}
        />
        <span className="elora-sparkle" style={{ top: 90, right: "30%" }} />
        <span className="elora-sparkle" style={{ top: 260, right: "8%", animationDelay: "1.2s" }} />
        <span className="elora-sparkle" style={{ bottom: 120, right: "40%", animationDelay: "2.4s" }} />

        <div className="elora-hero-grid">
          <div className="elora-hero-copy">
            <span className="elora-eyebrow">Nueva colección facial · 2026</span>
            <h1 className="elora-hero-title">
              Descubre la belleza <em>que</em> llevas dentro
            </h1>
            <p className="elora-hero-lead">
              Rituales de skincare formulados con ingredientes reales, fórmulas
              limpias y un cuidado que se siente como un abrazo.
            </p>
            <div className="elora-hero-cta">
              <PillButton href={shopHref}>Comprar ahora ✨</PillButton>
              <PillButton href="#filosofia" variant="outline">
                Ver rituales
              </PillButton>
            </div>
          </div>

          <div className="elora-hero-media">
            {featured ? (
              <>
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
                {/* Only real data on badges: featured product price + a brand
                    value. No invented ratings or percentages. */}
                <div className="elora-hero-badge b1">
                  <span>
                    Desde {formatMoney(featured.priceAmount, featured.priceCurrency)}
                    <small>Bestseller de la comunidad</small>
                  </span>
                </div>
                <div className="elora-hero-badge b2">🌿 Ingredientes reales</div>
              </>
            ) : (
              <div className="elora-hero-frame" aria-hidden="true" style={{ minHeight: 360 }} />
            )}
          </div>
        </div>
      </section>

      {/* 3 — Brand values marquee --------------------------------------- */}
      <div className="elora-strip">
        <Marquee
          items={BRAND_VALUES}
          durationSeconds={26}
          ariaLabel="Valores de marca Elora Skin"
        />
      </div>

      {/* 4 — Trust bar -------------------------------------------------- */}
      <div className="elora-trust">
        <div className="elora-trust-row">
          {TRUST_ITEMS.map((item) => (
            <div key={item} className="elora-trust-item">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* 5 — Bestsellers (real /api/catalog data) ----------------------- */}
      <EloraBestsellers initialProducts={catalogSnapshot.products} />

      {/* 6 — Philosophy with cascading checklist ------------------------ */}
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
              Nuestra filosofía
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
              {PHILOSOPHY.map((item, index) => (
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

      {/* 7 — Reviews (only when real reviews are connected) -------------- */}
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
            <span style={{ top: 20, left: "10%" }}>✦</span>
            <span style={{ top: 60, right: "14%", animationDelay: "1s" }}>✦</span>
            <span style={{ bottom: 24, left: "22%", animationDelay: "2s" }}>✦</span>
          </div>
          <h2>Tu ritual de belleza comienza hoy</h2>
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
                <a href="#bestsellers">Novedades</a>
              </li>
              <li>
                <a href="#bestsellers">Bestsellers</a>
              </li>
              <li>
                <a href="/categorias">Skincare</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ayuda</h4>
            <ul>
              <li>
                <a href="/politica-de-envios">Envíos</a>
              </li>
              <li>
                <a href="/politica-de-devoluciones">Devoluciones</a>
              </li>
              <li>
                <a href="/contacto">Contacto</a>
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
