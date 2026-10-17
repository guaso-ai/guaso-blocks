import type { TestimonialItem, TestimonialsData } from "../block-zone/types";
import { Carousel, CarouselItem } from "../carousel/carousel";
import {
  sectionHeadingClass,
  resolveTestimonialRating,
  resolveTestimonialsLayout,
  BLOCK_RADIUS_CLASS,
  SECTION_ROOT_CLASS,
} from "../block-zone/types";

type TestimonialsProps = {
  data: TestimonialsData;
  isOwner?: boolean;
};

function TestimonialsPlaceholder() {
  return (
    <section
      aria-label="Testimonios"
      className={SECTION_ROOT_CLASS}
    >
      <div className={`${BLOCK_RADIUS_CLASS} border border-border bg-card px-8 py-12 text-center`}>
        <p className="font-heading text-sm text-muted-foreground">
          Testimonios — agregá las reseñas por chat
        </p>
      </div>
    </section>
  );
}

function isUsefulItem(item: TestimonialItem): boolean {
  const quote = typeof item.quote === "string" && item.quote.trim();
  const author = typeof item.author === "string" && item.author.trim();
  return Boolean(quote || author);
}

// Estrellas data-driven (#3882): solo con rating válido 1–5.
// Sin lucide a propósito — el kit no declara esa dependencia.
function RatingStars({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span
      role="img"
      aria-label={`${rating} de 5 estrellas`}
      className="inline-flex items-center gap-0.5 text-sm"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          className={i <= rating ? "text-primary" : "text-muted-foreground/40"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function TestimonialQuote({ item }: { item: TestimonialItem }) {
  const rating = resolveTestimonialRating(item.rating);

  return (
    <>
      {item.quote ? (
        <p className="flex-1 text-base leading-relaxed text-foreground break-words">
          {item.quote}
        </p>
      ) : null}

      {rating ? (
        <div className="mt-1">
          <RatingStars rating={rating} />
        </div>
      ) : null}

      {(item.author || item.role) && (
        <footer className="mt-auto flex flex-col gap-0.5">
          {item.author ? (
            <cite className="not-italic font-heading text-sm font-semibold text-foreground">
              {item.author}
            </cite>
          ) : null}
          {item.role ? (
            <p className="text-sm text-muted-foreground">{item.role}</p>
          ) : null}
        </footer>
      )}
    </>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <blockquote className={`flex flex-col gap-4 ${BLOCK_RADIUS_CLASS} border border-border bg-card p-6`}>
      <TestimonialQuote item={item} />
    </blockquote>
  );
}

export default function Testimonials({
  data,
  isOwner = false,
}: TestimonialsProps) {
  const raw = Array.isArray(data.items) ? data.items : [];
  const items = raw.filter(isUsefulItem);

  if (items.length === 0) {
    return isOwner ? <TestimonialsPlaceholder /> : null;
  }

  // Kit-once (#3882): fuera del closed-set → "grilla", nunca explota.
  const layout = resolveTestimonialsLayout(data.layout);
  const label = data.title ?? "Testimonios";

  // Layout destacado: el primer testimonio abre grande, el resto en grilla.
  if (layout === "destacado") {
    const [first, ...rest] = items;
    const firstRating = resolveTestimonialRating(first.rating);
    return (
      <section aria-label={label} className={SECTION_ROOT_CLASS}>
        {data.title ? (
          <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
            {data.title}
          </h2>
        ) : null}

        <div className="flex flex-col gap-6">
          <blockquote className={`flex flex-col gap-4 ${BLOCK_RADIUS_CLASS} border border-border bg-card p-6 sm:p-10`}>
            {first.quote ? (
              <p className="font-heading text-xl font-medium leading-relaxed text-foreground text-balance break-words md:text-2xl">
                {first.quote}
              </p>
            ) : null}
            {firstRating ? (
              <div className="mt-1">
                <RatingStars rating={firstRating} />
              </div>
            ) : null}
            {(first.author || first.role) && (
              <footer className="mt-2 flex flex-col gap-0.5">
                {first.author ? (
                  <cite className="not-italic font-heading text-sm font-semibold text-foreground">
                    {first.author}
                  </cite>
                ) : null}
                {first.role ? (
                  <p className="text-sm text-muted-foreground">{first.role}</p>
                ) : null}
              </footer>
            )}
          </blockquote>

          {rest.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((item, i) => (
                <TestimonialCard key={i} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  // Layout carrusel: primitivo del kit (embla, #4288) — flechas, teclado ←/→ y arrastre.
  if (layout === "carrusel") {
    return (
      <section aria-label={label} className={SECTION_ROOT_CLASS}>
        {data.title ? (
          <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
            {data.title}
          </h2>
        ) : null}

        <Carousel label={label}>
          {items.map((item, i) => (
            <CarouselItem
              key={i}
              className="basis-[85%] sm:basis-[60%] lg:basis-[31%]"
            >
              <blockquote
                className={`flex h-full flex-col gap-4 ${BLOCK_RADIUS_CLASS} border border-border bg-card p-6`}
              >
                <TestimonialQuote item={item} />
              </blockquote>
            </CarouselItem>
          ))}
        </Carousel>
      </section>
    );
  }

  // Layout minimal: lista sin cromo de card, separada por divisores.
  if (layout === "minimal") {
    return (
      <section aria-label={label} className={SECTION_ROOT_CLASS}>
        {data.title ? (
          <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
            {data.title}
          </h2>
        ) : null}

        <div className="divide-y divide-border">
          {items.map((item, i) => (
            <blockquote key={i} className="flex flex-col gap-3 py-8 first:pt-0 last:pb-0">
              <TestimonialQuote item={item} />
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={label}
      className={SECTION_ROOT_CLASS}
    >
      {data.title ? (
        <h2 className={`mb-10 ${sectionHeadingClass(data)}`}>
          {data.title}
        </h2>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <TestimonialCard key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
