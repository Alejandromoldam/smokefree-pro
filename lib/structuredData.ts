const DEFAULT_SITE_URL = "https://allinonestore.lat";

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type ProductSchemaInput = {
  name: string;
  description: string;
  url: string;
  images: string[];
  sku?: string | null;
  category?: string | null;
  price: string;
  priceCurrency: string;
  availableForSale: boolean;
};

function normalizeSiteUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getStructuredDataSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return normalizeSiteUrl(rawUrl);
}

export function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "All In One",
    url: siteUrl,
    logo: `${siteUrl}/producto-real.png`,
  };
}

export function buildWebsiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "All In One",
    url: siteUrl,
    inLanguage: "es",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}#catalogo`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildProductSchema(input: ProductSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images.length > 0 ? input.images : [`${DEFAULT_SITE_URL}/producto-real.png`],
    url: input.url,
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.category ? { category: input.category } : {}),
    brand: {
      "@type": "Brand",
      name: "All In One",
    },
    offers: {
      "@type": "Offer",
      url: input.url,
      price: input.price,
      priceCurrency: input.priceCurrency,
      availability: input.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "All In One",
      },
    },
  };
}
