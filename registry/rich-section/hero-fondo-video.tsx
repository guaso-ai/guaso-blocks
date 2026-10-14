import type { ReactNode } from "react";
import { SECTION_ROOT_CLASS } from "../block-zone/types";

type HeroFondoVideoProps = {
  label: string;
  imageUrl?: string;
  videoUrl?: string;
  children: ReactNode;
};

/**
 * RichSection `fondo: completo` (#4567, hijo C de #4280). Full-bleed con media de fondo:
 * imagen (decorativa, `alt=""` + `aria-hidden`), `<video>` opcional encima (decorativo, sin
 * controles, muted/loop) y overlay fijo `bg-foreground/60`. El texto va en `children` con tono
 * inverso (`text-background`) para mantener AA sobre el overlay.
 * Fallback: sin video, o video que no carga, o reduce-motion → queda la imagen de fondo.
 * Solo video (sin imagen): la raíz lleva `bg-foreground` como base sólida; con reduce-motion o
 * video caído queda el overlay sobre ese color (texto inverso sigue en AA), no sobre el fondo
 * de página. Con imagen, la imagen cubre el 100% y esa base no se ve.
 * El caller solo lo usa si hay al menos imagen o video (sin media → render normal).
 */
export default function HeroFondoVideo({
  label,
  imageUrl,
  videoUrl,
  children,
}: HeroFondoVideoProps) {
  const isWebm = videoUrl
    ? new URL(videoUrl).pathname.toLowerCase().endsWith(".webm")
    : false;

  return (
    <section aria-label={label} className="relative w-full overflow-hidden bg-foreground">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}

      {videoUrl ? (
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={imageUrl}
          className="absolute inset-0 size-full object-cover motion-reduce:hidden"
        >
          <source src={videoUrl} type={isWebm ? "video/webm" : "video/mp4"} />
        </video>
      ) : null}

      <div className="absolute inset-0 bg-foreground/60" />

      <div className={`relative text-background ${SECTION_ROOT_CLASS}`}>
        {children}
      </div>
    </section>
  );
}
