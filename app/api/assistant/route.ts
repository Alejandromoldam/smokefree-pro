import { NextResponse } from "next/server";

const MAX_USER_MESSAGE_LENGTH = 700;
const MAX_HISTORY_MESSAGES = 8;
const MAX_SUGGESTIONS = 4;
const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const FALLBACK_BASE_MESSAGE =
  "Puedo ayudarte con productos, precios y disponibilidad. Escríbenos por WhatsApp para atención personalizada.";

type CatalogProduct = {
  id: string;
  title: string;
  handle: string;
  variantId?: string | null;
  descriptionShort: string;
  imageUrl: string;
  imageAlt: string;
  priceAmount: string;
  priceCurrency: string;
  availableForSale: boolean;
  productUrl: string;
  buyNowUrl: string;
};

type CatalogApiResponse = {
  ok: boolean;
  error: string | null;
  products?: CatalogProduct[];
};

type AssistantHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequestBody = {
  message?: unknown;
  history?: unknown;
};

type AssistantSuggestion = {
  id: string;
  title: string;
  handle: string;
  priceAmount: string;
  priceCurrency: string;
  availableForSale: boolean;
  productUrl: string;
};

type ProductVariant = {
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  priceAmount: string;
  priceCurrency: string;
};

type ProductApiResponse = {
  ok: boolean;
  error: string | null;
  product?: {
    title: string;
    variants: ProductVariant[];
  };
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeHistory(rawHistory: unknown): AssistantHistoryItem[] {
  if (!Array.isArray(rawHistory)) return [];

  const normalized = rawHistory
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as { role?: unknown }).role;
      const content = normalizeText(
        (item as { content?: unknown }).content,
        MAX_USER_MESSAGE_LENGTH
      );

      if ((role !== "user" && role !== "assistant") || !content) {
        return null;
      }

      return { role, content } as AssistantHistoryItem;
    })
    .filter((item): item is AssistantHistoryItem => item !== null);

  return normalized.slice(-MAX_HISTORY_MESSAGES);
}

function extractKeywords(input: string) {
  const lowered = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const stopwords = new Set([
    "de",
    "la",
    "el",
    "los",
    "las",
    "que",
    "para",
    "con",
    "sin",
    "del",
    "por",
    "una",
    "un",
    "me",
    "quiero",
    "busco",
    "necesito",
    "sobre",
    "como",
    "cual",
    "cuanto",
  ]);

  return lowered
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function toPriceNumber(amount: string) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function rankProducts(products: CatalogProduct[], userMessage: string) {
  const keywords = extractKeywords(userMessage);
  const normalizedMessage = userMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const ranked = products
    .map((product) => {
      const title = product.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const description = product.descriptionShort
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      let score = 0;
      for (const keyword of keywords) {
        if (title.includes(keyword)) score += 7;
        if (description.includes(keyword)) score += 4;
      }

      if (product.availableForSale) score += 2;
      if (normalizedMessage.includes("barat") || normalizedMessage.includes("econom")) {
        score += Math.max(0, 30 - toPriceNumber(product.priceAmount));
      }
      if (
        normalizedMessage.includes("premium") ||
        normalizedMessage.includes("pro") ||
        normalizedMessage.includes("top")
      ) {
        score += toPriceNumber(product.priceAmount) / 10;
      }

      return { product, score };
    })
    .sort((a, b) => b.score - a.score);

  const hasPositiveScore = ranked.some((item) => item.score > 0);
  if (!hasPositiveScore) {
    return [...products]
      .sort((a, b) => Number(b.availableForSale) - Number(a.availableForSale))
      .slice(0, MAX_SUGGESTIONS);
  }

  return ranked.slice(0, MAX_SUGGESTIONS).map((item) => item.product);
}

function formatMoney(amount: string, currencyCode: string) {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return `${amount} ${currencyCode}`;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function toSuggestion(product: CatalogProduct): AssistantSuggestion {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    priceAmount: product.priceAmount,
    priceCurrency: product.priceCurrency,
    availableForSale: product.availableForSale,
    productUrl: product.productUrl,
  };
}

function buildWhatsAppUrl(rawNumber?: string) {
  const digits = (rawNumber || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

async function fetchCatalog(origin: string) {
  try {
    const response = await fetch(`${origin}/api/catalog`, { cache: "no-store" });
    const payload = (await response.json()) as CatalogApiResponse;
    if (!response.ok || !payload.ok || !Array.isArray(payload.products)) {
      return {
        ok: false,
        error: payload.error || "No se pudo consultar el catálogo real de Shopify.",
        products: [] as CatalogProduct[],
      };
    }

    return {
      ok: true,
      error: null,
      products: payload.products,
    };
  } catch {
    return {
      ok: false,
      error: "No fue posible conectar con el catálogo de Shopify.",
      products: [] as CatalogProduct[],
    };
  }
}

function needsVariantDetails(userMessage: string) {
  return /variante|variantes|color|modelo|version|diferencia|tamano|tamaño/i.test(
    userMessage
  );
}

async function fetchVariantSummary(origin: string, handle: string) {
  try {
    const response = await fetch(
      `${origin}/api/product/${encodeURIComponent(handle)}`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as ProductApiResponse;
    if (!response.ok || !payload.ok || !payload.product) return null;

    const variants = payload.product.variants || [];
    if (variants.length === 0) return null;

    const lines = variants.slice(0, 6).map((variant) => {
      const quantity =
        typeof variant.quantityAvailable === "number"
          ? ` (${variant.quantityAvailable} u.)`
          : "";
      const availability = variant.availableForSale ? "Disponible" : "Agotado";
      return `${variant.title}: ${formatMoney(
        variant.priceAmount,
        variant.priceCurrency
      )} - ${availability}${quantity}`;
    });

    return `Variantes actuales de ${payload.product.title}: ${lines.join(" | ")}`;
  } catch {
    return null;
  }
}

function extractOpenAIText(payload: OpenAIResponse) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = payload.output
    ?.flatMap((entry) => entry.content || [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim() || "")
    .filter(Boolean);

  if (chunks && chunks.length > 0) {
    return chunks.join("\n").trim();
  }

  return null;
}

async function askOpenAI(options: {
  apiKey: string;
  model: string;
  message: string;
  history: AssistantHistoryItem[];
  catalogContext: string;
  variantContext: string | null;
  whatsappUrl: string | null;
}) {
  const contextParts = [
    "Catálogo real Shopify (fuente de verdad):",
    options.catalogContext,
    options.variantContext ? `\nDetalle de variantes:\n${options.variantContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const recentHistory = options.history
    .map((item) => `${item.role === "user" ? "Cliente" : "Asistente"}: ${item.content}`)
    .join("\n");

  const systemPrompt = [
    "Eres el Asistente All In One de ecommerce.",
    "Habla SIEMPRE en español.",
    "Nunca inventes precios, stock, variantes ni productos.",
    "Usa únicamente la información del catálogo real proporcionado.",
    "Si un producto está agotado, dilo y sugiere alternativas disponibles.",
    "Sé breve, claro y comercial (máximo 6 líneas).",
    "Incluye links de producto cuando recomiendes algo usando la URL disponible.",
    options.whatsappUrl
      ? `Si el cliente necesita ayuda humana, invita a WhatsApp: ${options.whatsappUrl}`
      : "Si el cliente necesita ayuda humana, sugiere contacto por WhatsApp.",
  ].join(" ");

  const userPrompt = [
    contextParts,
    recentHistory ? `\nHistorial reciente:\n${recentHistory}` : "",
    `\nPregunta del cliente:\n${options.message}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
      max_output_tokens: 280,
    }),
  });

  const payload = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    const errorMessage = payload.error?.message || "Error de OpenAI.";
    throw new Error(errorMessage);
  }

  return extractOpenAIText(payload);
}

function buildFallbackAnswer(options: {
  suggestions: AssistantSuggestion[];
  variantSummary: string | null;
  whatsappUrl: string | null;
}) {
  const lines = options.suggestions.map((product, index) => {
    const stockLabel = product.availableForSale ? "Disponible" : "Agotado";
    return `${index + 1}. ${product.title} — ${formatMoney(
      product.priceAmount,
      product.priceCurrency
    )} (${stockLabel})`;
  });

  const sections = [FALLBACK_BASE_MESSAGE];
  if (lines.length > 0) {
    sections.push(`Sugerencias actuales:\n${lines.join("\n")}`);
  }
  if (options.variantSummary) {
    sections.push(options.variantSummary);
  }
  if (options.whatsappUrl) {
    sections.push(`Atención humana por WhatsApp: ${options.whatsappUrl}`);
  }

  return sections.join("\n\n");
}

export async function POST(request: Request) {
  let body: AssistantRequestBody;
  try {
    body = (await request.json()) as AssistantRequestBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Solicitud inválida. Envia un mensaje en formato JSON.",
        answer: "",
        fallback: true,
        suggestions: [],
        whatsappUrl: null,
      },
      { status: 400 }
    );
  }

  const message = normalizeText(body.message, MAX_USER_MESSAGE_LENGTH);
  const history = sanitizeHistory(body.history);

  if (!message) {
    return NextResponse.json(
      {
        ok: false,
        error: "Escribe una pregunta para continuar.",
        answer: "",
        fallback: true,
        suggestions: [],
        whatsappUrl: null,
      },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const catalogResult = await fetchCatalog(origin);
  if (!catalogResult.ok || catalogResult.products.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          catalogResult.error ||
          "No hay productos disponibles para responder en este momento.",
        answer: FALLBACK_BASE_MESSAGE,
        fallback: true,
        suggestions: [],
        whatsappUrl: buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
      },
      { status: 200 }
    );
  }

  const suggestions = rankProducts(catalogResult.products, message).map(toSuggestion);
  const catalogContext = catalogResult.products
    .slice(0, 24)
    .map((product) => {
      const stock = product.availableForSale ? "Disponible" : "Agotado";
      return `- ${product.title} | ${formatMoney(
        product.priceAmount,
        product.priceCurrency
      )} | ${stock} | ${product.productUrl}`;
    })
    .join("\n");

  let variantSummary: string | null = null;
  if (needsVariantDetails(message) && suggestions[0]?.handle) {
    variantSummary = await fetchVariantSummary(origin, suggestions[0].handle);
  }

  const whatsappUrl = buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  const openaiApiKey = (process.env.OPENAI_API_KEY || "").trim();
  const openaiModel = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  if (!openaiApiKey) {
    return NextResponse.json(
      {
        ok: true,
        error: null,
        answer: buildFallbackAnswer({ suggestions, variantSummary, whatsappUrl }),
        fallback: true,
        suggestions,
        whatsappUrl,
      },
      { status: 200 }
    );
  }

  try {
    const aiText = await askOpenAI({
      apiKey: openaiApiKey,
      model: openaiModel || "gpt-4o-mini",
      message,
      history,
      catalogContext,
      variantContext: variantSummary,
      whatsappUrl,
    });

    if (!aiText) {
      return NextResponse.json(
        {
          ok: true,
          error: null,
          answer: buildFallbackAnswer({ suggestions, variantSummary, whatsappUrl }),
          fallback: true,
          suggestions,
          whatsappUrl,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        error: null,
        answer: aiText,
        fallback: false,
        suggestions,
        whatsappUrl,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: true,
        error: null,
        answer: buildFallbackAnswer({ suggestions, variantSummary, whatsappUrl }),
        fallback: true,
        suggestions,
        whatsappUrl,
      },
      { status: 200 }
    );
  }
}
