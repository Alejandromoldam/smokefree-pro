import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  updatedAt?: string;
  children: ReactNode;
};

export default function LegalPageShell({
  title,
  subtitle,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <main className="elora-shop min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link href="/" className="elora-pill is-outline">
            Volver al inicio
          </Link>
          <Link href="/categorias" className="elora-pill is-outline">
            Ir al catalogo
          </Link>
        </div>

        <article className="elora-shop-panel p-6 sm:p-8">
          <p className="elora-shop-eyebrow">Informacion legal</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
          <p className="elora-shop-muted mt-4 text-sm leading-relaxed sm:text-base">{subtitle}</p>
          {updatedAt ? (
            <p className="elora-shop-muted mt-3 text-xs uppercase tracking-[0.12em]">Actualizado: {updatedAt}</p>
          ) : null}

          <div className="legal-content mt-8 space-y-6 text-sm leading-relaxed sm:text-base">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
