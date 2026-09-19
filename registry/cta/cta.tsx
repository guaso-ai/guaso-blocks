import type { CTAData, CtaAlign } from "../block-zone/types";
import {
  resolveCtaAlign,
  resolveCtaStyle,
  safeHref,
} from "../block-zone/types";

type CTAProps = {
  data: CTAData;
  isOwner?: boolean;
};

const ALIGN_CLASS: Record<CtaAlign, string> = {
  left: "items-start justify-start text-left",
  center: "items-center justify-center text-center",
  right: "items-end justify-end text-right",
};

const SECTION_BASE = "mx-auto flex max-w-6xl flex-col px-6 py-16 md:py-20";

const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none";

function sectionClass(align: CtaAlign): string {
  return `${SECTION_BASE} ${ALIGN_CLASS[align]}`;
}

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

function CtaCopy({
  headline,
  subtext,
}: {
  headline?: string;
  subtext?: string;
}) {
  if (!headline && !subtext) return null;
  return (
    <div className="flex min-w-0 max-w-xl flex-col gap-3">
      {headline ? (
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
          {headline}
        </h2>
      ) : null}

      {subtext ? (
        <p className="text-base leading-relaxed text-muted-foreground break-words">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

function CtaButton({ href, label }: { href?: string; label?: string }) {
  if (!href || !label) return null;
  return (
    <div className="shrink-0">
      <a href={href} className={BUTTON_CLASS}>
        {label}
      </a>
    </div>
  );
}

function CtaVisual({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div
        className="min-h-48 rounded-lg border border-border bg-card md:min-h-full"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <img
        src={src}
        alt={alt}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
        className="aspect-[4/3] size-full object-cover"
      />
    </div>
  );
}

function CtaBanda({
  data,
  align,
  buttonHref,
}: {
  data: CTAData;
  align: CtaAlign;
  buttonHref?: string;
}) {
  return (
    <section
      aria-label={data.headline ?? "Llamado a la acción"}
      className={sectionClass(align)}
    >
      <div className="w-full rounded-lg border border-border bg-card px-8 py-10 md:px-12 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <CtaCopy headline={data.headline} subtext={data.subtext} />
          <CtaButton href={buttonHref} label={data.button_label} />
        </div>
      </div>
    </section>
  );
}

function CtaFoto({
  data,
  align,
  buttonHref,
  imageHref,
}: {
  data: CTAData;
  align: CtaAlign;
  buttonHref?: string;
  imageHref: string;
}) {
  return (
    <section
      aria-label={data.headline ?? "Llamado a la acción"}
      className={sectionClass(align)}
    >
      <div className="relative w-full overflow-hidden rounded-lg border border-border">
        <img
          src={imageHref}
          alt=""
          width={1600}
          height={900}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="relative flex min-h-64 flex-col justify-center bg-card/80 px-8 py-10 md:min-h-80 md:px-12 md:py-12">
          <div className={`flex flex-col gap-8 ${ALIGN_CLASS[align]}`}>
            <CtaCopy headline={data.headline} subtext={data.subtext} />
            <CtaButton href={buttonHref} label={data.button_label} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSplit({
  data,
  align,
  buttonHref,
  imageHref,
}: {
  data: CTAData;
  align: CtaAlign;
  buttonHref?: string;
  imageHref?: string;
}) {
  return (
    <section
      aria-label={data.headline ?? "Llamado a la acción"}
      className={sectionClass(align)}
    >
      <div className="grid w-full gap-8 md:grid-cols-2 md:items-center md:gap-12">
        <div className={`flex min-w-0 flex-col gap-8 ${ALIGN_CLASS[align]}`}>
          <CtaCopy headline={data.headline} subtext={data.subtext} />
          <CtaButton href={buttonHref} label={data.button_label} />
        </div>
        <CtaVisual
          src={imageHref}
          alt={
            data.headline
              ? `Imagen: ${data.headline}`
              : "Imagen del llamado a la acción"
          }
        />
      </div>
    </section>
  );
}

export default function CTA({ data, isOwner = false }: CTAProps) {
  if (!data.headline && !data.subtext && !data.button_label) {
    return isOwner ? <CTAPlaceholder /> : null;
  }

  const style = resolveCtaStyle(data.style);
  const align = resolveCtaAlign(data.align);
  const buttonHref = safeHref(data.button_url);
  const imageHref = safeHref(data.image_url);

  if (style === "foto" && imageHref) {
    return (
      <CtaFoto
        data={data}
        align={align}
        buttonHref={buttonHref}
        imageHref={imageHref}
      />
    );
  }

  if (style === "split") {
    return (
      <CtaSplit
        data={data}
        align={align}
        buttonHref={buttonHref}
        imageHref={imageHref}
      />
    );
  }

  return <CtaBanda data={data} align={align} buttonHref={buttonHref} />;
}
