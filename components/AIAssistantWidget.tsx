"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  trackAssistantMessage,
  trackAssistantOpen,
  trackClickWhatsApp,
} from "@/lib/ga";

type AssistantSuggestion = {
  id: string;
  title: string;
  handle: string;
  priceAmount: string;
  priceCurrency: string;
  availableForSale: boolean;
  productUrl: string;
};

type AssistantApiResponse = {
  ok: boolean;
  error: string | null;
  answer: string;
  fallback: boolean;
  suggestions: AssistantSuggestion[];
  whatsappUrl: string | null;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  suggestions?: AssistantSuggestion[];
  fallback?: boolean;
  whatsappUrl?: string | null;
};

const INITIAL_ASSISTANT_TEXT =
  "\u{1F44B} Hola, soy el Asistente All In One.\n\nPuedo ayudarte con productos, precios, disponibilidad, env\u00EDos y recomendaciones personalizadas.\n\n\u2728 Respuestas r\u00E1pidas y asistencia en tiempo real.";

function formatMoney(amount: string, currencyCode: string) {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return `${amount} ${currencyCode}`;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function normalizeMessageForApi(message: ChatMessage) {
  return {
    role: message.role,
    content: message.text,
  };
}

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-initial",
      role: "assistant",
      text: INITIAL_ASSISTANT_TEXT,
    },
  ]);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = scrollRef.current;
    if (!panel) return;
    panel.scrollTop = panel.scrollHeight;
  }, [messages, open, sending]);

  const quickPrompts = useMemo(
    () => [
      "¿Qué producto recomiendas para oficina?",
      "¿Cuál está disponible y con mejor precio?",
      "Compárame variantes del producto más vendido.",
    ],
    []
  );

  function toggleAssistant() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        trackAssistantOpen({ source: "floating_launcher" });
      }
      return next;
    });
  }

  async function sendMessage(rawText: string) {
    const message = rawText.replace(/\s+/g, " ").trim();
    if (!message || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    };

    const historyForApi = messages
      .filter((item) => item.id !== "assistant-initial")
      .slice(-6)
      .map(normalizeMessageForApi);

    trackAssistantMessage({
      messageLength: message.length,
      source: "assistant_widget",
      hasHistory: historyForApi.length > 0,
    });

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: historyForApi,
        }),
      });

      const payload = (await response.json()) as AssistantApiResponse;
      if (!response.ok || !payload.ok || !payload.answer) {
        throw new Error(payload.error || "No se pudo responder en este momento.");
      }

      setLastWhatsAppUrl(payload.whatsappUrl || null);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: payload.answer,
          suggestions: payload.suggestions || [],
          fallback: payload.fallback,
          whatsappUrl: payload.whatsappUrl,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "No pude responder ahora. Intenta de nuevo en unos segundos.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  return (
    <div className="assistant-root">
      {open ? (
        <div className="assistant-panel">
          <div className="assistant-header">
            <div>
              <p className="assistant-eyebrow">Asistente IA</p>
              <p className="assistant-title">Asistente All In One</p>
            </div>
            <button
              type="button"
              className="assistant-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
            >
              Cerrar
            </button>
          </div>

          <div ref={scrollRef} className="assistant-messages">
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === "assistant" ? "assistant-msg ai" : "assistant-msg user"}
              >
                <p className="assistant-msg-text">{message.text}</p>

                {message.suggestions && message.suggestions.length > 0 ? (
                  <div className="assistant-suggestions">
                    {message.suggestions.map((product) => (
                      <a
                        key={`${message.id}-${product.id}`}
                        href={product.productUrl}
                        className="assistant-suggestion-card"
                      >
                        <p className="assistant-suggestion-title">{product.title}</p>
                        <p className="assistant-suggestion-meta">
                          {formatMoney(product.priceAmount, product.priceCurrency)} ·{" "}
                          {product.availableForSale ? "Disponible" : "Agotado"}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : null}

                {message.whatsappUrl ? (
                  <a
                    href={message.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="assistant-whatsapp-link"
                    onClick={() =>
                      trackClickWhatsApp({
                        location: "assistant_message",
                        context: "assistant_handoff",
                      })
                    }
                  >
                    Atención humana por WhatsApp
                  </a>
                ) : null}
              </article>
            ))}

            {sending ? (
              <article className="assistant-msg ai">
                <p className="assistant-msg-text">Consultando catálogo real de Shopify...</p>
              </article>
            ) : null}
          </div>

          <div className="assistant-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="assistant-prompt-btn"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="assistant-form">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pregúntame por productos, precios o stock..."
              maxLength={700}
              className="assistant-input"
              disabled={sending}
            />
            <button
              type="submit"
              className="assistant-send"
              disabled={sending || !input.trim()}
            >
              Enviar
            </button>
          </form>

          {lastWhatsAppUrl ? (
            <a
              href={lastWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="assistant-footer-link"
              onClick={() =>
                trackClickWhatsApp({
                  location: "assistant_footer",
                  context: "assistant_handoff",
                })
              }
            >
              Hablar por WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="assistant-launcher"
        onClick={toggleAssistant}
        aria-label="Abrir asistente All In One"
      >
        <span className="assistant-launcher-dot" aria-hidden="true" />
        <span className="assistant-launcher-label">Asistente All In One</span>
      </button>
    </div>
  );
}
