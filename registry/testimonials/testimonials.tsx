import type { TestimonialItem, TestimonialsData } from "../block-zone/types";

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

export default function Testimonials({
  data,
  isOwner = false,
}: TestimonialsProps) {
  const raw = Array.isArray(data.items) ? data.items : [];
  const items = raw.filter(isUsefulItem);

  if (items.length === 0) {
    return isOwner ? <TestimonialsPlaceholder /> : null;
  }

  return (
    <section
      aria-label={data.title ?? "Testimonios"}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      {data.title ? (
        <h2 className="mb-10 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          {data.title}
        </h2>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <blockquote
            key={i}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
          >
            {item.quote ? (
              <p className="flex-1 text-base leading-relaxed text-foreground break-words">
                {item.quote}
              </p>
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
          </blockquote>
        ))}
      </div>
    </section>
  );
}
