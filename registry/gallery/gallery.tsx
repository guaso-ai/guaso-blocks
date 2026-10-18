"use client";

import { useState } from "react";
import type {
  GalleryData,
  GalleryImage,
  ImageProps,
} from "../block-zone/types";
import {
  DEFAULT_GALLERY_ASPECT,
  imageAspectClass,
  imageFitClass,
  imageFrameClass,
  resolveGalleryColumns,
  resolveGalleryStyle,
  sectionHeadingClass,
  BLOCK_RADIUS_CLASS,
  SECTION_ROOT_CLASS,
} from "../block-zone/types";
import GalleryLightbox from "../gallery-lightbox/gallery-lightbox";
import { Carousel, CarouselItem } from "../carousel/carousel";

type GalleryProps = {
  data: GalleryData;
  isOwner?: boolean;
};

// `hero_mosaico` (#4606): rango de imágenes del mosaico; por encima de MAX se corta.
const MOSAIC_MIN = 3;
const MOSAIC_MAX = 5;

function GalleryPlaceholder() {
  return (
    <section
      aria-label="Galería de imágenes"
      className={SECTION_ROOT_CLASS}
    >
      <div className={`${BLOCK_RADIUS_CLASS} border border-border bg-card px-8 py-12 text-center`}>
        <p className="font-heading text-sm text-muted-foreground">
          Galería de imágenes — agregá las fotos por chat
        </p>
      </div>
    </section>
  );
}

function hasImageUrl(image: GalleryImage): boolean {
  return typeof image.url === "string" && Boolean(image.url.trim());
}

function GalleryFigure({
  image,
  index,
  className,
  presentation,
  onOpen,
  fill = false,
}: {
  image: GalleryImage;
  presentation: ImageProps;
  index: number;
  className?: string;
  onOpen?: () => void;
  // Mosaico (#4606): la figura llena la celda de la grilla; la altura la fija la fila, no el aspect.
  fill?: boolean;
}) {
  const frame = (
    <div
      className={[
        "relative",
        fill ? "h-full" : imageAspectClass(presentation, DEFAULT_GALLERY_ASPECT),
        "w-full overflow-hidden",
        BLOCK_RADIUS_CLASS,
        imageFrameClass(presentation),
        "bg-card",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={image.url.trim()}
        alt={image.alt ?? `Imagen ${index + 1}`}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
        className={["size-full", imageFitClass(presentation)].join(" ")}
      />
    </div>
  );

  const figureClass = [
    fill ? "flex h-full min-w-0 flex-col" : "",
    className ?? "min-w-0",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={figureClass}>
      {onOpen ? (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => {
            // Foco explícito en la miniatura: Safari no lo da al click y el lightbox lo devuelve acá al cerrar.
            event.currentTarget.focus();
            onOpen();
          }}
          className={`block w-full ${fill ? "min-h-0 flex-1 " : ""}cursor-zoom-in ${BLOCK_RADIUS_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
        >
          {frame}
        </button>
      ) : (
        frame
      )}
      {image.caption ? (
        <figcaption
          className={`mt-2 text-sm text-muted-foreground break-words${fill ? " shrink-0" : ""}`}
        >
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const COLUMNS_CLASS = {
  "2": "grid gap-6 sm:grid-cols-2",
  "3": "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
} as const;

const MASONRY_CLASS = {
  "2": "columns-1 sm:columns-2 gap-6",
  "3": "columns-1 sm:columns-2 lg:columns-3 gap-6",
  "4": "columns-1 sm:columns-2 lg:columns-4 gap-6",
} as const;

// Mosaico (#4606): filas fijas + spans por índice. Clases literales (Tailwind las detecta).
// `data.columns` no aplica en mosaico: la grilla es de 2 columnas (mobile) o 4 (md+).
const MOSAIC_GRID_CLASS =
  "grid grid-cols-2 md:grid-cols-4 auto-rows-[11rem] md:auto-rows-[15rem] gap-3 md:gap-4";

// Spans sin huecos para 3, 4 y 5 celdas (ver plan #4606, D5).
function mosaicSpanClass(index: number, count: number): string {
  if (index === 0) return "col-span-2 md:row-span-2";
  if (count === 4 && index === 1) return "row-span-2";
  if (count === 3) return "col-span-2";
  return "";
}

export default function Gallery({ data, isOwner = false }: GalleryProps) {
  const raw = Array.isArray(data.images) ? data.images : [];
  const images = raw.filter(hasImageUrl);
  // Índice (sobre las imágenes visibles) de la imagen abierta en el lightbox; null = cerrado (#4287).
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return isOwner ? <GalleryPlaceholder /> : null;
  }

  // Kit-once (#3883): fuera del closed-set → default, nunca explota.
  const columns = resolveGalleryColumns(data.columns);
  const style = resolveGalleryStyle(data.style);
  const label = data.title ?? "Galería de imágenes";
  // Cap del mosaico (#4606): 6+ → 5 antes del render y del lightbox, así el contador dice "x de 5".
  const shown = style === "hero_mosaico" ? images.slice(0, MOSAIC_MAX) : images;

  const lightbox = (
    <GalleryLightbox
      images={shown}
      index={openIndex}
      onIndexChange={setOpenIndex}
      onClose={() => setOpenIndex(null)}
    />
  );

  if (style === "hero_mosaico" && shown.length >= MOSAIC_MIN) {
    return (
      <>
        <section
          aria-label={label}
          className={SECTION_ROOT_CLASS}
        >
          {data.title ? (
            <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
              {data.title}
            </h2>
          ) : null}

          <div data-layout="hero-mosaico" className={MOSAIC_GRID_CLASS}>
            {shown.map((image, i) => (
              <GalleryFigure
                presentation={data}
                key={`${image.url}-${i}`}
                image={image}
                index={i}
                className={`min-w-0 ${mosaicSpanClass(i, shown.length)}`.trim()}
                fill
                onOpen={() => setOpenIndex(i)}
              />
            ))}
          </div>
        </section>
        {lightbox}
      </>
    );
  }

  if (style === "masonry") {
    return (
      <>
        <section
          aria-label={label}
          className={SECTION_ROOT_CLASS}
        >
          {data.title ? (
            <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
              {data.title}
            </h2>
          ) : null}

          <div className={MASONRY_CLASS[columns]}>
            {shown.map((image, i) => (
              <GalleryFigure
                presentation={data}
                key={`${image.url}-${i}`}
                image={image}
                index={i}
                className="mb-6 break-inside-avoid"
                onOpen={() => setOpenIndex(i)}
              />
            ))}
          </div>
        </section>
        {lightbox}
      </>
    );
  }

  // Carrusel: primitivo del kit (embla, #4288) — flechas, teclado ←/→ y arrastre.
  if (style === "carrusel") {
    return (
      <>
        <section
          aria-label={label}
          className={SECTION_ROOT_CLASS}
        >
          {data.title ? (
            <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
              {data.title}
            </h2>
          ) : null}

          <Carousel label={label}>
            {shown.map((image, i) => (
              <CarouselItem
                key={`${image.url}-${i}`}
                className="basis-[85%] sm:basis-[45%] lg:basis-[31%]"
              >
                <GalleryFigure
                  presentation={data}
                  image={image}
                  index={i}
                  onOpen={() => setOpenIndex(i)}
                />
              </CarouselItem>
            ))}
          </Carousel>
        </section>
        {lightbox}
      </>
    );
  }

  return (
    <>
      <section
        aria-label={label}
        className={SECTION_ROOT_CLASS}
      >
        {data.title ? (
          <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
            {data.title}
          </h2>
        ) : null}

        <div className={COLUMNS_CLASS[columns]}>
          {shown.map((image, i) => (
            <GalleryFigure
              presentation={data}
              key={`${image.url}-${i}`}
              image={image}
              index={i}
              onOpen={() => setOpenIndex(i)}
            />
          ))}
        </div>
      </section>
      {lightbox}
    </>
  );
}
