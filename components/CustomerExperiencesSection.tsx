const experiences = [
  {
    quote:
      "Excelente experiencia. El proceso de compra fue rapido y el producto llego antes de lo esperado.",
  },
  {
    quote:
      "Muy buena calidad y atencion. Definitivamente volvere a comprar.",
  },
  {
    quote:
      "La tienda tiene productos diferentes y utiles. Todo llego en perfectas condiciones.",
  },
];

export default function CustomerExperiencesSection() {
  return (
    <section className="section-reveal mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8">
      <div className="mb-5 sm:mb-7">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          Lo que opinan nuestros clientes
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
          Miles de personas confian en All In One para descubrir productos innovadores.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {experiences.map((item, index) => (
          <article
            key={`experience-${index}`}
            className="glass-card rounded-3xl border border-white/12 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45 sm:p-6"
          >
            <p className="text-sm font-medium tracking-[0.14em] text-amber-300">★★★★★</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-100 sm:text-base">
              &ldquo;{item.quote}&rdquo;
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.13em] text-emerald-200/90">
              Cliente verificado
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
