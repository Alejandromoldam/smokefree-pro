import { NextResponse } from "next/server";

const MAX_USER_MESSAGE_LENGTH = 700;
const MAX_HISTORY_MESSAGES = 8;
const MAX_SUGGESTIONS = 4;
const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

type AssistantLanguage = "es" | "en" | "pt";

type LanguagePack = {
  languageForPrompt: string;
  fallbackBaseMessage: string;
  suggestionsHeader: string;
  availableLabel: string;
  soldOutLabel: string;
  variantSummaryPrefix: string;
  variantDetailsHeader: string;
  unitsSuffix: string;
  whatsappLinePrefix: string;
  humanHelpFallback: string;
  catalogContextHeader: string;
  historyUserLabel: string;
  historyAssistantLabel: string;
  askForWhatsappIfUnknown: string;
  emptyMessageError: string;
  invalidPayloadError: string;
  catalogUnavailableError: string;
};

const LANGUAGE_PACKS: Record<AssistantLanguage, LanguagePack> = {
  es: {
    languageForPrompt: "Spanish",
    fallbackBaseMessage:
      "Puedo ayudarte con productos, precios y disponibilidad. Escribenos por WhatsApp para atencion personalizada.",
    suggestionsHeader: "Sugerencias actuales:",
    availableLabel: "Disponible",
    soldOutLabel: "Agotado",
    variantSummaryPrefix: "Variantes actuales de",
    variantDetailsHeader: "Detalle de variantes:",
    unitsSuffix: "u.",
    whatsappLinePrefix: "Atencion humana por WhatsApp:",
    humanHelpFallback: "Si no tienes seguridad total, ofrece atencion humana por WhatsApp.",
    catalogContextHeader: "Catalogo real Shopify (fuente de verdad):",
    historyUserLabel: "Cliente",
    historyAssistantLabel: "Asistente",
    askForWhatsappIfUnknown:
      "Si no sabes algo con certeza, dilo y ofrece WhatsApp para atencion humana.",
    emptyMessageError: "Escribe una pregunta para continuar.",
    invalidPayloadError: "Solicitud invalida. Envia un mensaje en formato JSON.",
    catalogUnavailableError: "No hay productos disponibles para responder en este momento.",
  },
  en: {
    languageForPrompt: "English",
    fallbackBaseMessage:
      "I can help you with products, prices, and availability. Message us on WhatsApp for personalized support.",
    suggestionsHeader: "Current suggestions:",
    availableLabel: "Available",
    soldOutLabel: "Sold out",
    variantSummaryPrefix: "Current variants for",
    variantDetailsHeader: "Variant details:",
    unitsSuffix: "units",
    whatsappLinePrefix: "Human support on WhatsApp:",
    humanHelpFallback: "If anything is uncertain, say it clearly and offer WhatsApp human support.",
    catalogContextHeader: "Live Shopify catalog (source of truth):",
    historyUserLabel: "Customer",
    historyAssistantLabel: "Assistant",
    askForWhatsappIfUnknown:
      "If you are not certain about something, say so and offer WhatsApp human support.",
    emptyMessageError: "Please type a question to continue.",
    invalidPayloadError: "Invalid request. Send a message in JSON format.",
    catalogUnavailableError: "No products are available to answer right now.",
  },
  pt: {
    languageForPrompt: "Portuguese",
    fallbackBaseMessage:
      "Posso ajudar com produtos, precos e disponibilidade. Fale conosco no WhatsApp para atendimento personalizado.",
    suggestionsHeader: "Sugestoes atuais:",
    availableLabel: "Disponivel",
    soldOutLabel: "Esgotado",
    variantSummaryPrefix: "Variantes atuais de",
    variantDetailsHeader: "Detalhes das variantes:",
    unitsSuffix: "un.",
    whatsappLinePrefix: "Atendimento humano no WhatsApp:",
    humanHelpFallback:
      "Se algo nao estiver claro, diga com transparencia e ofereca atendimento humano no WhatsApp.",
    catalogContextHeader: "Catalogo real do Shopify (fonte de verdade):",
    historyUserLabel: "Cliente",
    historyAssistantLabel: "Assistente",
    askForWhatsappIfUnknown:
      "Se nao tiver certeza de algo, diga isso e ofereca atendimento humano via WhatsApp.",
    emptyMessageError: "Escreva uma pergunta para continuar.",
    invalidPayloadError: "Solicitacao invalida. Envie uma mensagem em JSON.",
    catalogUnavailableError: "Nao ha produtos disponiveis para responder agora.",
  },
};

const EN_HINTS = new Set([
  "the",
  "and",
  "with",
  "for",
  "you",
  "your",
  "price",
  "stock",
  "available",
  "shipping",
  "ship",
  "internationally",
  "warranty",
  "product",
  "products",
  "checkout",
  "cart",
  "buy",
  "recommend",
  "difference",
  "variant",
  "variants",
  "does",
  "do",
  "is",
  "are",
]);

const ES_HINTS = new Set([
  "que",
  "como",
  "cuanto",
  "precio",
  "precios",
  "envio",
  "envios",
  "disponible",
  "disponibles",
  "garantia",
  "producto",
  "productos",
  "carrito",
  "comprar",
  "recomiendas",
  "recomendacion",
  "variante",
  "variantes",
  "diferencia",
  "tarda",
  "envian",
  "internacional",
]);

const PT_HINTS = new Set([
  "que",
  "como",
  "quanto",
  "preco",
  "precos",
  "frete",
  "envio",
  "disponivel",
  "disponiveis",
  "garantia",
  "produto",
  "produtos",
  "carrinho",
  "comprar",
  "recomenda",
  "recomendacao",
  "variante",
  "variantes",
  "diferenca",
  "entrega",
  "internacional",
  "esse",
  "esta",
  "tem",
  "voce",
]);

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

function toAsciiLower(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function getLanguageScore(text: string) {
  const rawLower = text.toLowerCase();
  const normalized = toAsciiLower(text);
  const tokens = normalized.split(/[^a-z0-9]+/g).filter(Boolean);

  const scores: Record<AssistantLanguage, number> = {
    es: 0,
    en: 0,
    pt: 0,
  };

  for (const token of tokens) {
    if (EN_HINTS.has(token)) scores.en += 2;
    if (ES_HINTS.has(token)) scores.es += 2;
    if (PT_HINTS.has(token)) scores.pt += 2;
  }

  if (/[¿¡]/.test(text)) scores.es += 3;
  if (/[ñ]/i.test(text)) scores.es += 3;
  if (/[ãõçêôâáà]/i.test(rawLower)) scores.pt += 3;
  if (/\b(do you|can you|how much|what is|what are|does it|is it|are there)\b/i.test(rawLower)) {
    scores.en += 4;
  }
  if (/\b(quanto custa|tem garantia|frete internacional|voce|vocês|voces)\b/i.test(rawLower)) {
    scores.pt += 4;
  }
  if (/\b(cuanto cuesta|tiene garantia|envio internacional|ustedes|cuanto tarda)\b/i.test(rawLower)) {
    scores.es += 4;
  }

  return scores;
}

function chooseLanguageByScore(scores: Record<AssistantLanguage, number>) {
  const entries: Array<[AssistantLanguage, number]> = [
    ["es", scores.es],
    ["en", scores.en],
    ["pt", scores.pt],
  ];

  entries.sort((a, b) => b[1] - a[1]);
  const [topLanguage, topScore] = entries[0];
  const secondScore = entries[1][1];

  if (topScore === 0) return null;
  if (topScore === secondScore) return null;
  return topLanguage;
}

function detectPreferredLanguage(message: string, history: AssistantHistoryItem[]): AssistantLanguage {
  const direct = chooseLanguageByScore(getLanguageScore(message));
  if (direct) return direct;

  const userHistoryText = history
    .filter((item) => item.role === "user")
    .map((item) => item.content)
    .join(" ");

  if (userHistoryText) {
    const combined = `${message} ${userHistoryText}`.trim();
    const combinedLanguage = chooseLanguageByScore(getLanguageScore(combined));
    if (combinedLanguage) return combinedLanguage;
  }

  return "es";
}

function extractKeywords(input: string, language: AssistantLanguage) {
  const lowered = toAsciiLower(input);

  const commonStopwords = new Set([
    "for",
    "with",
    "from",
    "this",
    "that",
    "have",
    "has",
    "and",
    "are",
    "the",
    "to",
    "you",
    "your",
    "por",
    "para",
    "con",
    "sin",
    "que",
    "como",
    "una",
    "uno",
    "um",
    "uma",
  ]);

  const languageStopwords: Record<AssistantLanguage, Set<string>> = {
    es: new Set([
      "de",
      "la",
      "el",
      "los",
      "las",
      "del",
      "me",
      "quiero",
      "busco",
      "necesito",
      "sobre",
      "cual",
      "cuanto",
    ]),
    en: new Set([
      "do",
      "does",
      "is",
      "are",
      "can",
      "please",
      "show",
      "need",
      "want",
      "about",
      "which",
      "what",
      "much",
    ]),
    pt: new Set([
      "de",
      "da",
      "do",
      "dos",
      "das",
      "com",
      "sem",
      "quero",
      "preciso",
      "sobre",
      "qual",
      "quanto",
    ]),
  };

  return lowered
    .split(/[^a-z0-9]+/g)
    .filter((token) => {
      if (token.length <= 2) return false;
      if (commonStopwords.has(token)) return false;
      if (languageStopwords[language].has(token)) return false;
      return true;
    });
}

function toPriceNumber(amount: string) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function rankProducts(
  products: CatalogProduct[],
  userMessage: string,
  language: AssistantLanguage
) {
  const keywords = extractKeywords(userMessage, language);
  const normalizedMessage = toAsciiLower(userMessage);

  const ranked = products
    .map((product) => {
      const title = toAsciiLower(product.title);
      const description = toAsciiLower(product.descriptionShort);

      let score = 0;
      for (const keyword of keywords) {
        if (title.includes(keyword)) score += 7;
        if (description.includes(keyword)) score += 4;
      }

      if (product.availableForSale) score += 2;

      const wantsAffordable =
        /barat|econom|cheap|afford|budget|preco baixo|em conta/.test(normalizedMessage);
      if (wantsAffordable) {
        score += Math.max(0, 30 - toPriceNumber(product.priceAmount));
      }

      const wantsPremium = /premium|pro|top|advanced|avancad/.test(normalizedMessage);
      if (wantsPremium) {
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
        error: payload.error || "Could not query live Shopify catalog.",
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
      error: "Could not connect to Shopify catalog.",
      products: [] as CatalogProduct[],
    };
  }
}

function needsVariantDetails(userMessage: string) {
  return /(variant|variants|variante|variantes|color|modelo|model|version|diferencia|diferenca|difference|size|tamano|tamanho)/i.test(
    userMessage
  );
}

async function fetchVariantSummary(
  origin: string,
  handle: string,
  language: AssistantLanguage
) {
  const pack = LANGUAGE_PACKS[language];

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
          ? ` (${variant.quantityAvailable} ${pack.unitsSuffix})`
          : "";
      const availability = variant.availableForSale
        ? pack.availableLabel
        : pack.soldOutLabel;
      return `${variant.title}: ${formatMoney(
        variant.priceAmount,
        variant.priceCurrency
      )} - ${availability}${quantity}`;
    });

    return `${pack.variantSummaryPrefix} ${payload.product.title}: ${lines.join(" | ")}`;
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
  language: AssistantLanguage;
}) {
  const pack = LANGUAGE_PACKS[options.language];

  const contextParts = [
    pack.catalogContextHeader,
    options.catalogContext,
    options.variantContext ? `\n${pack.variantDetailsHeader}\n${options.variantContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const recentHistory = options.history
    .map((item) =>
      `${
        item.role === "user" ? pack.historyUserLabel : pack.historyAssistantLabel
      }: ${item.content}`
    )
    .join("\n");

  const systemPrompt = [
    "You are the Elora Skin ecommerce assistant.",
    `Always respond in ${pack.languageForPrompt}.`,
    "If the customer mixes languages, use the predominant language of the latest customer message.",
    "Use a professional, clear, objective, polite, and commercial tone.",
    "Default response length: 2 to 4 sentences.",
    "Provide a long detailed response only when the customer explicitly asks for full details.",
    "Never invent prices, inventory, product specs, or availability.",
    "Do not mention Shopify, APIs, backend, tokens, or internal systems to the customer.",
    "Use only the provided live Shopify catalog context as source of truth.",
    "Summarize product info and do not copy full product descriptions verbatim.",
    "If a product is out of stock, say it clearly and suggest available alternatives.",
    "When recommending products, include product URLs from the context.",
    pack.askForWhatsappIfUnknown,
    options.whatsappUrl
      ? `Human support WhatsApp URL: ${options.whatsappUrl}`
      : "If needed, suggest WhatsApp human support.",
  ].join(" ");

  const userPrompt = [
    contextParts,
    recentHistory ? `\nRecent history:\n${recentHistory}` : "",
    `\nCustomer message:\n${options.message}`,
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
    const errorMessage = payload.error?.message || "OpenAI error";
    throw new Error(errorMessage);
  }

  return extractOpenAIText(payload);
}

function buildFallbackAnswer(options: {
  suggestions: AssistantSuggestion[];
  variantSummary: string | null;
  whatsappUrl: string | null;
  language: AssistantLanguage;
}) {
  const pack = LANGUAGE_PACKS[options.language];

  const lines = options.suggestions.slice(0, 2).map((product) => {
    const stockLabel = product.availableForSale
      ? pack.availableLabel
      : pack.soldOutLabel;
    return `${product.title} (${formatMoney(
      product.priceAmount,
      product.priceCurrency
    )}, ${stockLabel})`;
  });

  const sections = [pack.fallbackBaseMessage];
  if (lines.length > 0) {
    sections.push(`${pack.suggestionsHeader} ${lines.join(" | ")}`);
  }
  if (options.variantSummary) {
    sections.push(options.variantSummary);
  }
  if (options.whatsappUrl) {
    sections.push(`${pack.whatsappLinePrefix} ${options.whatsappUrl}`);
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
        error: LANGUAGE_PACKS.es.invalidPayloadError,
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
  const language = detectPreferredLanguage(message, history);
  const pack = LANGUAGE_PACKS[language];

  if (!message) {
    return NextResponse.json(
      {
        ok: false,
        error: pack.emptyMessageError,
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
  const whatsappUrl = buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);

  if (!catalogResult.ok || catalogResult.products.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: catalogResult.error || pack.catalogUnavailableError,
        answer: buildFallbackAnswer({
          suggestions: [],
          variantSummary: null,
          whatsappUrl,
          language,
        }),
        fallback: true,
        suggestions: [],
        whatsappUrl,
      },
      { status: 200 }
    );
  }

  const suggestions = rankProducts(catalogResult.products, message, language).map(toSuggestion);
  const catalogContext = catalogResult.products
    .slice(0, 24)
    .map((product) => {
      const stock = product.availableForSale ? pack.availableLabel : pack.soldOutLabel;
      return `- ${product.title} | ${formatMoney(
        product.priceAmount,
        product.priceCurrency
      )} | ${stock} | ${product.productUrl}`;
    })
    .join("\n");

  let variantSummary: string | null = null;
  if (needsVariantDetails(message) && suggestions[0]?.handle) {
    variantSummary = await fetchVariantSummary(origin, suggestions[0].handle, language);
  }

  const openaiApiKey = (process.env.OPENAI_API_KEY || "").trim();
  const openaiModel = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  if (!openaiApiKey) {
    return NextResponse.json(
      {
        ok: true,
        error: null,
        answer: buildFallbackAnswer({ suggestions, variantSummary, whatsappUrl, language }),
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
      language,
    });

    if (!aiText) {
      return NextResponse.json(
        {
          ok: true,
          error: null,
          answer: buildFallbackAnswer({ suggestions, variantSummary, whatsappUrl, language }),
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
        answer: buildFallbackAnswer({ suggestions, variantSummary, whatsappUrl, language }),
        fallback: true,
        suggestions,
        whatsappUrl,
      },
      { status: 200 }
    );
  }
}
