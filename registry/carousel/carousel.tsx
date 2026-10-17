"use client";

/**
 * #4288 — Carrusel del kit: primitivo `Carousel` + `CarouselItem` sobre `embla-carousel-react`
 * (estilo shadcn, vendorizado). Lo consumen `Gallery` (style=carrusel) y `Testimonials` (layout=carrusel).
 * Target: `@components/carousel/carousel.tsx` (hermano de `gallery/` y `testimonials/` al instalar).
 *
 * Navegación: ←/→ con el foco dentro del root; botones Anterior/Siguiente deshabilitados en los
 * extremos (sin loop); arrastre mouse/touch (`watchDrag`; embla v8 escucha mouse/touch, no pointer). Sin autoplay (sin setInterval, a11y).
 * Sin lucide a propósito: los chevrons son SVG inline, así el item solo declara `embla-carousel-react`.
 * ⛔ literales de color: solo tokens semánticos.
 */
import { Children, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";

export type CarouselProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

// Constante de módulo: embla compara opciones por referencia y no debe reinicializarse en cada render.
const EMBLA_OPTIONS = { align: "start" as const, loop: false, watchDrag: true };

const NAV_BUTTON_CLASS =
  "inline-flex size-10 items-center justify-center rounded-[var(--block-radius-suave,0.375rem)] border border-border bg-card text-foreground hover:opacity-80 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

export function Carousel({ label, className, children }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const [index, setIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const slideCount = Children.count(children);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => {
      setIndex(emblaApi.selectedScrollSnap());
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    sync();
    emblaApi.on("select", sync);
    emblaApi.on("reInit", sync);
    return () => {
      emblaApi.off("select", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi]);

  // Embla lee los slides al init: si cambia la cantidad (edición en vivo), re-medimos.
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, slideCount]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!emblaApi) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      emblaApi.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      emblaApi.scrollNext();
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      data-index={index}
      onKeyDown={onKeyDown}
      className={["relative", className].filter(Boolean).join(" ")}
    >
      <div
        ref={emblaRef}
        className={[
          // Sin embla (SSR / antes de hidratar) el track se scrollea nativo; con embla, overflow-hidden.
          emblaApi ? "overflow-hidden" : "overflow-x-auto",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        ].join(" ")}
      >
        <div className="-ml-6 flex">{children}</div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Anterior"
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
          className={NAV_BUTTON_CLASS}
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
          className={NAV_BUTTON_CLASS}
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}

export function CarouselItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={["min-w-0 shrink-0 grow-0 pl-6", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
