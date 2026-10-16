"use client";

type RichMarqueeProps = {
  text: string;
  label: string;
};

// Loop CSS puro (#4284): sin JS ni matchMedia en render, así SSR e hidratación coinciden.
// Velocidad fija: 30 s por vuelta (no hay prop de velocidad). Track = dos grupos idénticos;
// el loop mueve 50% = un grupo, así el salto es invisible.
// Reduced-motion vive acá (no en el globals.css del template): sin animación, el segundo grupo
// se oculta y el primero muestra el texto completo con wrap (sin recorte ni duplicado).
const MARQUEE_CSS = `
@keyframes guaso-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.guaso-marquee-track {
  display: flex;
  width: max-content;
  animation: guaso-marquee 30s linear infinite;
}
.guaso-marquee-group {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding-right: 3rem;
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .guaso-marquee-track {
    width: 100%;
    animation: none;
  }
  .guaso-marquee-group {
    flex-shrink: 1;
    min-width: 0;
    padding-right: 0;
    white-space: normal;
  }
  .guaso-marquee-group[aria-hidden="true"] {
    display: none;
  }
}
`;

/**
 * RichSection `movimiento: marquee` (#4284). Banda de una línea con el `title` como texto.
 * Sin botón Pausar (follow-up WCAG 2.2.2). Colores solo por tokens.
 */
export default function RichMarquee({ text, label }: RichMarqueeProps) {
  return (
    <section
      aria-label={label}
      className="w-full overflow-hidden bg-primary py-4 text-primary-foreground"
    >
      <style>{MARQUEE_CSS}</style>
      <div className="guaso-marquee-track">
        <div className="guaso-marquee-group font-heading text-2xl font-semibold tracking-tight">
          {text}
        </div>
        <div
          aria-hidden="true"
          className="guaso-marquee-group font-heading text-2xl font-semibold tracking-tight"
        >
          {text}
        </div>
      </div>
    </section>
  );
}
