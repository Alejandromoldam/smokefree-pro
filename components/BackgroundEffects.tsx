export default function BackgroundEffects() {
  return (
    <div className="background-effects electric-background" aria-hidden="true">
      <div className="bg-localized-glow bg-localized-glow-hero" />
      <div className="bg-localized-glow bg-localized-glow-catalog" />
      <div className="bg-tesla-arc" />
      <div className="bg-hero-lightning" />
      <div className="bg-energy-wave" />

      <div className="electric-fog" />
      <div className="electric-circuit-grid" />

      <div className="electric-lines">
        {Array.from({ length: 6 }).map((_, idx) => (
          <span key={`line-${idx}`} className={`electric-line line-${idx + 1}`} />
        ))}
      </div>

      <div className="electric-particles">
        {Array.from({ length: 24 }).map((_, idx) => (
          <span key={`particle-${idx}`} className={`electric-particle p-${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}
