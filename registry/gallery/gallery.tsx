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

type GalleryProps = {
  data: GalleryData;
  isOwner?: boolean;
};

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
}: {
  image: GalleryImage;
  presentation: ImageProps;
  index: number;
  className?: string;
  onOpen?: () => void;
}) {
  const frame = (
    <div
      className={[
        "relative",
        imageAspectClass(presentation, DEFAULT_GALLERY_ASPECT),
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

  return (
    <figure className={className ?? "min-w-0"}>
      {onOpen ? (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => {
            // Foco explícito en la miniatura: Safari no lo da al click y el lightbox lo devuelve acá al cerrar.
            event.currentTarget.focus();
            onOpen();
          }}
          className={`block w-full cursor-zoom-in ${BLOCK_RADIUS_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
        >
          {frame}
        </button>
      ) : (
        frame
      )}
      {image.caption ? (
        <figcaption className="mt-2 text-sm text-muted-foreground break-words">
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

export default function Gallery({ data, isOwner = false }: GalleryProps) {
  const raw = Array.isArray(data.images) ? data.images : [];
  const images = raw.filter(hasImageUrl);
  // Índice (sobre `images` ya filtradas) de la imagen abierta en el lightbox; null = cerrado (#4287).
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return isOwner ? <GalleryPlaceholder /> : null;
  }

  // Kit-once (#3883): fuera del closed-set → default, nunca explota.
  const columns = resolveGalleryColumns(data.columns);
  const style = resolveGalleryStyle(data.style);
  const label = data.title ?? "Galería de imágenes";

  const lightbox = (
    <GalleryLightbox
      images={images}
      index={openIndex}
      onIndexChange={setOpenIndex}
      onClose={() => setOpenIndex(null)}
    />
  );

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
            {images.map((image, i) => (
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

  // Carrusel: fila con scroll-snap nativo (CSS only, sin JS).
  // Región enfocable para que el scroll sea operable por teclado.
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

          <div
            role="region"
            aria-roledescription="carrusel"
            aria-label={label}
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {images.map((image, i) => (
              <GalleryFigure
                presentation={data}
                key={`${image.url}-${i}`}
                image={image}
                index={i}
                className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]"
                onOpen={() => setOpenIndex(i)}
              />
            ))}
          </div>
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
          {images.map((image, i) => (
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
