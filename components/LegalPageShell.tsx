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
    <main className="premium-shell min-h-screen bg-transparent text-white">
      <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link href="/" className="btn-ghost inline-flex px-4 py-2 text-xs font-semibold sm:text-sm">
            Volver al inicio
          </Link>
          <Link
            href="/#catalogo"
            className="btn-ghost inline-flex px-4 py-2 text-xs font-semibold sm:text-sm"
          >
            Ir al catalogo
          </Link>
        </div>

        <article className="glass-card rounded-3xl border border-white/12 bg-[rgba(4,10,20,0.72)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/85">Informacion legal</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">{subtitle}</p>
          {updatedAt ? (
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-gray-400">Actualizado: {updatedAt}</p>
          ) : null}

          <div className="legal-content mt-8 space-y-6 text-sm leading-relaxed text-gray-200 sm:text-base">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
