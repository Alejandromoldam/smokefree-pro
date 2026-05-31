export const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
).trim();

export type GaItem = {
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
  quantity?: number;
  item_variant?: string;
  item_brand?: string;
  item_category?: string;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function canTrack() {
  return (
    typeof window !== "undefined" &&
    Boolean(GA_MEASUREMENT_ID) &&
    typeof window.gtag === "function"
  );
}

function parsePath(path: string) {
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const parsed = new URL(path);
      return `${parsed.pathname}${parsed.search}`;
    }
    return path;
  } catch {
    return path;
  }
}

export function trackPageView(path: string) {
  if (!canTrack()) return;

  window.gtag?.("event", "page_view", {
    page_path: parsePath(path),
    page_location:
      path.startsWith("http://") || path.startsWith("https://")
        ? path
        : `${window.location.origin}${path}`,
  });
}

export function trackViewItem(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  if (!canTrack()) return;
  window.gtag?.("event", "view_item", params);
}

export function trackAddToCart(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  if (!canTrack()) return;
  window.gtag?.("event", "add_to_cart", params);
}

export function trackBeginCheckout(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  if (!canTrack()) return;
  window.gtag?.("event", "begin_checkout", params);
}
