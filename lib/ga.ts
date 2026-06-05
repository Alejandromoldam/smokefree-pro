export const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
).trim();
export const META_PIXEL_ID = (
  process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
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
    __allInOneGaInitialized?: boolean;
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => number;
    };
    _fbq?: Window["fbq"];
  }
}

export function initializeGa() {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }

  if (!document.querySelector(`script[data-allinone-ga="${GA_MEASUREMENT_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      GA_MEASUREMENT_ID
    )}`;
    script.dataset.allinoneGa = GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  if (!window.__allInOneGaInitialized) {
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    window.__allInOneGaInitialized = true;
  }
}

function canTrackGa() {
  return (
    typeof window !== "undefined" &&
    Boolean(GA_MEASUREMENT_ID) &&
    typeof window.gtag === "function"
  );
}

function canTrackMeta() {
  return (
    typeof window !== "undefined" &&
    Boolean(META_PIXEL_ID) &&
    typeof window.fbq === "function"
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

function getPageLocation(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${window.location.origin}${path}`;
}

function normalizeItemQuantity(quantity: number | undefined) {
  return quantity && Number.isFinite(quantity) ? quantity : 1;
}

function buildMetaCommercePayload(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  const items = params.items || [];
  const contentIds = items.map((item) => item.item_id).filter(Boolean);
  const contents = items.map((item) => ({
    id: item.item_id,
    quantity: normalizeItemQuantity(item.quantity),
    item_price: item.price,
  }));
  const numItems = items.reduce(
    (total, item) => total + normalizeItemQuantity(item.quantity),
    0
  );

  return {
    content_ids: contentIds,
    content_type: "product",
    contents,
    currency: params.currency,
    value: params.value,
    num_items: numItems,
  };
}

export function trackPageView(path: string) {
  const parsedPath = parsePath(path);
  const pageLocation = getPageLocation(path);

  if (canTrackGa()) {
    window.gtag?.("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_path: parsedPath,
      page_location: pageLocation,
    });
  }

  if (canTrackMeta()) {
    window.fbq?.("track", "PageView", {
      page_path: parsedPath,
      page_location: pageLocation,
    });
  }
}

export function trackViewItem(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  if (canTrackGa()) {
    window.gtag?.("event", "view_item", {
      send_to: GA_MEASUREMENT_ID,
      ...params,
    });
  }

  if (canTrackMeta()) {
    const payload = buildMetaCommercePayload(params);
    window.fbq?.("track", "ViewContent", {
      ...payload,
      content_name: params.items[0]?.item_name,
    });
  }
}

export function trackAddToCart(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  if (canTrackGa()) {
    window.gtag?.("event", "add_to_cart", {
      send_to: GA_MEASUREMENT_ID,
      ...params,
    });
  }

  if (canTrackMeta()) {
    window.fbq?.("track", "AddToCart", buildMetaCommercePayload(params));
  }
}

export function trackBeginCheckout(params: {
  currency: string;
  value: number;
  items: GaItem[];
}) {
  if (canTrackGa()) {
    window.gtag?.("event", "begin_checkout", {
      send_to: GA_MEASUREMENT_ID,
      ...params,
    });
  }

  if (canTrackMeta()) {
    window.fbq?.("track", "InitiateCheckout", buildMetaCommercePayload(params));
  }
}

export function trackPurchase(params: {
  currency: string;
  value: number;
  items: GaItem[];
  orderId?: string;
}) {
  if (canTrackGa()) {
    const gaPayload = params.orderId
      ? {
          ...params,
          transaction_id: params.orderId,
        }
      : params;
    window.gtag?.("event", "purchase", {
      send_to: GA_MEASUREMENT_ID,
      ...gaPayload,
    });
  }

  if (canTrackMeta()) {
    const payload = buildMetaCommercePayload(params);
    window.fbq?.("track", "Purchase", {
      ...payload,
      ...(params.orderId ? { order_id: params.orderId } : {}),
    });
  }
}

export function trackClickWhatsApp(params: {
  location: string;
  context?: string;
  productName?: string;
}) {
  if (!canTrackGa()) return;

  window.gtag?.("event", "click_whatsapp", {
    send_to: GA_MEASUREMENT_ID,
    location: params.location,
    context: params.context || "general",
    product_name: params.productName || "",
  });
}

export function trackAssistantOpen(params?: { source?: string }) {
  if (!canTrackGa()) return;

  window.gtag?.("event", "assistant_open", {
    send_to: GA_MEASUREMENT_ID,
    source: params?.source || "widget",
  });
}

export function trackAssistantMessage(params: {
  messageLength: number;
  source?: string;
  hasHistory?: boolean;
}) {
  if (!canTrackGa()) return;

  window.gtag?.("event", "assistant_message", {
    send_to: GA_MEASUREMENT_ID,
    message_length: params.messageLength,
    source: params.source || "assistant_widget",
    has_history: Boolean(params.hasHistory),
  });
}
