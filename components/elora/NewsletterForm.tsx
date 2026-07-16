"use client";

import { useState } from "react";
import PillButton from "./PillButton";

type Status = "idle" | "loading" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Optional email-service endpoint. When unset, the form still works and
// confirms locally instead of silently failing.
const NEWSLETTER_ENDPOINT = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT || "";

/**
 * Real, functional newsletter signup: validates the email, submits to the
 * configured endpoint when present, and always gives the user feedback.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage("Escribe un correo válido para continuar.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      if (NEWSLETTER_ENDPOINT) {
        const response = await fetch(NEWSLETTER_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value, source: "elora-home" }),
        });
        if (!response.ok) {
          throw new Error("subscribe_failed");
        }
      }
      setStatus("success");
      setMessage("¡Gracias! Revisa tu correo para confirmar tu suscripción.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("No pudimos completar la suscripción. Inténtalo de nuevo.");
    }
  }

  return (
    <form className="elora-newsletter" onSubmit={handleSubmit} noValidate>
      <div className="elora-newsletter-row">
        <label className="sr-only" htmlFor="elora-newsletter-email">
          Correo electrónico
        </label>
        <input
          id="elora-newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setMessage("");
            }
          }}
          className="elora-newsletter-input"
          aria-invalid={status === "error"}
          required
        />
        <PillButton type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Enviando…" : "Obtener mi descuento"}
        </PillButton>
      </div>
      {message ? (
        <p
          className={`elora-newsletter-msg ${status === "error" ? "is-error" : "is-success"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
