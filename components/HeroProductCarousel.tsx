"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/shopifyCatalog";

type CatalogApiResponse = {
  ok: boolean;
  products: CatalogProduct[];
};

type HeroSlide = {
  id: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  productUrl: string;
};

const MAX_HERO_SLIDES = 8;
const ROTATION_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD = 42;
const CATALOG_LINK = "/#catalogo";

const FALLBACK_SLIDE: HeroSlide = {
  id: "fallback-slide",
  title: "All In One Store",
  imageUrl: "/producto-real.png",
  imageAlt: "Producto destacado All In One",
  productUrl: CATALOG_LINK,
};

function dedupeSlides(products: CatalogProduct[]) {
  const seen = new Set<string>();
  const unique: HeroSlide[] = [];

  for (const product of products) {
    if (!product.imageUrl) continue;
    const key = `${product.imageUrl}::${product.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      id: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt || product.title || "Producto All In One",
      productUrl: product.productUrl || CATALOG_LINK,
    });
    if (unique.length >= MAX_HERO_SLIDES) break;
  }

  return unique;
}

export default function HeroProductCarousel({
  initialProducts = [],
}: {
  initialProducts?: CatalogProduct[];
}) {
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    const parsed = dedupeSlides(initialProducts);
    return parsed.length > 0 ? parsed : [FALLBACK_SLIDE];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSlideIds, setFailedSlideIds] = useState<string[]>([]);

  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialProducts.length > 0) {
      return;
    }

    let active = true;

    async function loadSlides() {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const payload = (await response.json()) as CatalogApiResponse;

        if (!active) return;
        if (!response.ok || !payload.ok || !Array.isArray(payload.products)) {
          setSlides([FALLBACK_SLIDE]);
          return;
        }

        const parsed = dedupeSlides(payload.products);
        setSlides(parsed.length > 0 ? parsed : [FALLBACK_SLIDE]);
      } catch {
        if (!active) return;
        setSlides([FALLBACK_SLIDE]);
      }
    }

    void loadSlides();

    return () => {
      active = false;
    };
  }, [initialProducts]);

  const availableSlides = useMemo(() => {
    const filtered = slides.filter((slide) => !failedSlideIds.includes(slide.id));
    if (filtered.length > 0) return filtered;
    return [FALLBACK_SLIDE];
  }, [failedSlideIds, slides]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (availableSlides.length === 0) return 0;
      return Math.min(current, availableSlides.length - 1);
    });
  }, [availableSlides.length]);

  useEffect(() => {
    if (availableSlides.length <= 1 || isPaused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % availableSlides.length);
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [availableSlides.length, isPaused]);

  function goToNext() {
    if (availableSlides.length <= 1) return;
    setActiveIndex((current) => (current + 1) % availableSlides.length);
  }

  function goToPrevious() {
    if (availableSlides.length <= 1) return;
    setActiveIndex((current) =>
      current === 0 ? availableSlides.length - 1 : current - 1
    );
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    if (startX === null || endX === null) {
      touchStartXRef.current = null;
      return;
    }

    const distance = startX - endX;
    if (Math.abs(distance) < SWIPE_THRESHOLD) {
      touchStartXRef.current = null;
      return;
    }

    if (distance > 0) {
      goToNext();
    } else {
      goToPrevious();
    }

    touchStartXRef.current = null;
  }

  function handleImageError(slideId: string) {
    setFailedSlideIds((current) =>
      current.includes(slideId) ? current : [...current, slideId]
    );
  }

  const activeSlide = availableSlides[activeIndex] || FALLBACK_SLIDE;

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-carousel-stage" aria-live="polite">
        {availableSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <a
              key={slide.id}
              href={isActive ? slide.productUrl : undefined}
              target={isActive ? "_blank" : undefined}
              rel={isActive ? "noreferrer" : undefined}
              aria-label={isActive ? `Ver ${slide.title}` : undefined}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className={`hero-carousel-slide ${isActive ? "is-active" : "is-inactive"}`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.imageAlt}
                width={1200}
                height={1200}
                priority={index === 0}
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 42vw"
                className="float-soft hero-product hero-carousel-image h-full w-full rounded-[1.72rem] object-contain object-center"
                onError={() => handleImageError(slide.id)}
              />
            </a>
          );
        })}
      </div>

      <div className="hero-carousel-meta">
        <p className="hero-carousel-title">{activeSlide.title}</p>
        {availableSlides.length > 1 ? (
          <div className="hero-carousel-dots" role="tablist" aria-label="Selector de imagen hero">
            {availableSlides.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${slide.id}-dot`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Mostrar ${slide.title}`}
                  onClick={() => setActiveIndex(index)}
                  className={`hero-carousel-dot ${isActive ? "is-active" : ""}`}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
