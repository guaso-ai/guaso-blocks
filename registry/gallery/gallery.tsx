import type { GalleryData, GalleryImage } from "../block-zone/types";
import {
  resolveGalleryColumns,
  resolveGalleryStyle,
} from "../block-zone/types";

type GalleryProps = {
  data: GalleryData;
  isOwner?: boolean;
};

function GalleryPlaceholder() {
  return (
    <section
      aria-label="Galería de imágenes"
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
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
}: {
  image: GalleryImage;
  index: number;
  className?: string;
}) {
  return (
    <figure className={className ?? "min-w-0"}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card">
        <img
          src={image.url.trim()}
          alt={image.alt ?? `Imagen ${index + 1}`}
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
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

  if (images.length === 0) {
    return isOwner ? <GalleryPlaceholder /> : null;
  }

  // Kit-once (#3883): fuera del closed-set → default, nunca explota.
  const columns = resolveGalleryColumns(data.columns);
  const style = resolveGalleryStyle(data.style);
  const label = data.title ?? "Galería de imágenes";

  if (style === "masonry") {
    return (
      <section
        aria-label={label}
        className="mx-auto max-w-6xl px-6 py-16 md:py-20"
      >
        {data.title ? (
          <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            {data.title}
          </h2>
        ) : null}

        <div className={MASONRY_CLASS[columns]}>
          {images.map((image, i) => (
            <GalleryFigure
              key={`${image.url}-${i}`}
              image={image}
              index={i}
              className="mb-6 break-inside-avoid"
            />
          ))}
        </div>
      </section>
    );
  }

  // Carrusel: fila con scroll-snap nativo (CSS only, sin JS).
  // Región enfocable para que el scroll sea operable por teclado.
  if (style === "carrusel") {
    return (
      <section
        aria-label={label}
        className="mx-auto max-w-6xl px-6 py-16 md:py-20"
      >
        {data.title ? (
          <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
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
              key={`${image.url}-${i}`}
              image={image}
              index={i}
              className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={label}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      {data.title ? (
        <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          {data.title}
        </h2>
      ) : null}

      <div className={COLUMNS_CLASS[columns]}>
        {images.map((image, i) => (
          <GalleryFigure key={`${image.url}-${i}`} image={image} index={i} />
        ))}
      </div>
    </section>
  );
}
