import type { CardsData } from "../block-zone/types";
import {
  resolveCardsColumns,
  resolveCardsStyle,
  safeHref,
} from "../block-zone/types";

type CardsProps = {
  data: CardsData;
  isOwner?: boolean;
};

function CardsPlaceholder() {
  return (
    <section
      aria-label="Tarjetas de contenido"
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
        <p className="font-heading text-sm text-muted-foreground">
          Tarjetas de contenido — agregá los ítems por chat
        </p>
      </div>
    </section>
  );
}

function CardsHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  if (!title && !subtitle) return null;
  return (
    <div className="mb-10 flex flex-col gap-3">
      {title ? (
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground break-words">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

const COLUMNS_CLASS = {
  "2": "grid gap-6 sm:grid-cols-2",
  "3": "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
} as const;

export default function Cards({ data, isOwner = false }: CardsProps) {
  const cards = Array.isArray(data.cards) ? data.cards : [];

  if (cards.length === 0) {
    return isOwner ? <CardsPlaceholder /> : null;
  }

  // Kit-once (#3882): fuera del closed-set → default, nunca explota.
  const columns = resolveCardsColumns(data.columns);
  const style = resolveCardsStyle(data.style);

  // Estilo minimal: lista sin cromo de card, separada por divisores.
  if (style === "minimal") {
    return (
      <section
        aria-label={data.title ?? "Tarjetas de contenido"}
        className="mx-auto max-w-6xl px-6 py-16 md:py-20"
      >
        <CardsHeader title={data.title} subtitle={data.subtitle} />

        <div className="divide-y divide-border">
          {cards.map((card, i) => {
            const linkHref = safeHref(card.link_url);

            return (
              <article key={i} className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0">
                {card.heading ? (
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground text-balance">
                    {card.heading}
                  </h3>
                ) : null}

                {card.text ? (
                  <p className="text-sm leading-relaxed text-muted-foreground break-words">
                    {card.text}
                  </p>
                ) : null}

                {linkHref && card.link_label ? (
                  <a
                    href={linkHref}
                    className="mt-1 inline-flex items-center text-sm font-medium text-primary transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                  >
                    {card.link_label}
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={data.title ?? "Tarjetas de contenido"}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      <CardsHeader title={data.title} subtitle={data.subtitle} />

      <div className={COLUMNS_CLASS[columns]}>
        {cards.map((card, i) => {
          const linkHref = safeHref(card.link_url);
          // Estilo feature: la primera tarjeta destaca (ocupa 2 columnas).
          const featured = style === "feature" && i === 0;

          return (
            <article
              key={i}
              className={
                featured
                  ? "flex flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:col-span-2 sm:p-8"
                  : "flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
              }
            >
              {card.heading ? (
                <h3
                  className={
                    featured
                      ? "font-heading text-2xl font-semibold tracking-tight text-foreground text-balance"
                      : "font-heading text-xl font-semibold tracking-tight text-foreground text-balance"
                  }
                >
                  {card.heading}
                </h3>
              ) : null}

              {card.text ? (
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground break-words">
                  {card.text}
                </p>
              ) : null}

              {linkHref && card.link_label ? (
                <a
                  href={linkHref}
                  className="mt-auto inline-flex items-center text-sm font-medium text-primary transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                >
                  {card.link_label}
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
