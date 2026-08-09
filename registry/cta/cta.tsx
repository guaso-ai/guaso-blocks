import type { CTAData } from "../block-zone/types";
import { safeHref } from "../block-zone/types";

type CTAProps = {
  data: CTAData;
  isOwner?: boolean;
};

function CTAPlaceholder() {
  return (
    <section
      aria-label="Llamado a la acción"
      className="mx-auto max-w-6xl px-6 py-16"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
        <p className="font-heading text-sm text-muted-foreground">
          Sección de llamado a la acción — completá el texto desde el chat
        </p>
      </div>
    </section>
  );
}

export default function CTA({ data, isOwner = false }: CTAProps) {
  if (!data.headline && !data.subtext && !data.button_label) {
    return isOwner ? <CTAPlaceholder /> : null;
  }

  const buttonHref = safeHref(data.button_url);

  return (
    <section
      aria-label={data.headline ?? "Llamado a la acción"}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-10 md:px-12 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex min-w-0 max-w-xl flex-col gap-3">
            {data.headline ? (
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
                {data.headline}
              </h2>
            ) : null}

            {data.subtext ? (
              <p className="text-base leading-relaxed text-muted-foreground break-words">
                {data.subtext}
              </p>
            ) : null}
          </div>

          {buttonHref && data.button_label ? (
            <div className="shrink-0">
              <a
                href={buttonHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
              >
                {data.button_label}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
