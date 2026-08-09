import type { GalleryData, GalleryImage } from "../block-zone/types";

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

export default function Gallery({ data, isOwner = false }: GalleryProps) {
  const raw = Array.isArray(data.images) ? data.images : [];
  const images = raw.filter(hasImageUrl);

  if (images.length === 0) {
    return isOwner ? <GalleryPlaceholder /> : null;
  }

  return (
    <section
      aria-label={data.title ?? "Galería de imágenes"}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      {data.title ? (
        <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          {data.title}
        </h2>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, i) => (
          <figure key={`${image.url}-${i}`} className="min-w-0">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={image.url.trim()}
                alt={image.alt ?? `Imagen ${i + 1}`}
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
        ))}
      </div>
    </section>
  );
}
