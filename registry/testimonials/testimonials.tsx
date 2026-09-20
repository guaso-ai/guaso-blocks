import type { TestimonialItem, TestimonialsData } from "../block-zone/types";
import {
  resolveTestimonialRating,
  resolveTestimonialsLayout,
  safeHref,
} from "../block-zone/types";

type TestimonialsProps = {
  data: TestimonialsData;
  isOwner?: boolean;
};

function TestimonialsPlaceholder() {
  return (
    <section
      aria-label="Testimonios"
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
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

function avatarHref(item: TestimonialItem): string | undefined {
  const href = safeHref(item.avatar);
  return href && href.toLowerCase().startsWith("https://") ? href : undefined;
}

function TestimonialIdentity({
  item,
  className,
}: {
  item: TestimonialItem;
  className?: string;
}) {
  const url = avatarHref(item);
  const author = typeof item.author === "string" ? item.author.trim() : "";
  const initial = author ? author.charAt(0).toUpperCase() : "";
  const showAvatar = Boolean(url || initial);
  if (!showAvatar && !author && !item.role) return null;
  return (
    <footer className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      {url ? (
        <img
          src={url}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : showAvatar ? (
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-sm font-semibold text-muted-foreground"
        >
          {initial}
        </span>
      ) : null}
      {(author || item.role) && (
        <div className="flex min-w-0 flex-col gap-0.5">
          {author ? (
            <cite className="not-italic font-heading text-sm font-semibold text-foreground">
              {author}
            </cite>
          ) : null}
          {item.role ? (
            <p className="text-sm text-muted-foreground">{item.role}</p>
          ) : null}
        </div>
      )}
    </footer>
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

      <TestimonialIdentity item={item} className="mt-auto" />
    </>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <blockquote className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
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
      <section aria-label={label} className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        {data.title ? (
          <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            {data.title}
          </h2>
        ) : null}

        <div className="flex flex-col gap-6">
          <blockquote className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:p-10">
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
            <TestimonialIdentity item={first} className="mt-2" />
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

  // Layout carrusel: fila con scroll-snap nativo (CSS only, sin JS).
  // Región enfocable para que el scroll sea operable por teclado.
  if (layout === "carrusel") {
    return (
      <section aria-label={label} className="mx-auto max-w-6xl px-6 py-16 md:py-20">
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
          {items.map((item, i) => (
            <blockquote
              key={i}
              className="flex w-[85%] shrink-0 snap-start flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:w-[60%] lg:w-[31%]"
            >
              <TestimonialQuote item={item} />
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  // Layout minimal: lista sin cromo de card, separada por divisores.
  if (layout === "minimal") {
    return (
      <section aria-label={label} className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        {data.title ? (
          <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
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
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      {data.title ? (
        <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
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
