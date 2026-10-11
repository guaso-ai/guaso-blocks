import ReactMarkdown from "react-markdown";
import type { RichSectionData } from "../block-zone/types";
import {
  DEFAULT_RICH_ASPECT,
  imageAspectClass,
  imageFitClass,
  imageFrameClass,
  resolveRichImageSide,
  resolveRichMode,
  safeHref,
  sectionHeadingClass,
  BLOCK_RADIUS_BUTTON_CLASS,
  BLOCK_RADIUS_CLASS,
  SECTION_ROOT_CLASS,
} from "../block-zone/types";

type RichSectionProps = {
  data: RichSectionData;
  isOwner?: boolean;
};

function RichSectionPlaceholder() {
  return (
    <section
      aria-label="Sección de texto"
      className={SECTION_ROOT_CLASS}
    >
      <div className={`${BLOCK_RADIUS_CLASS} border border-border bg-card px-8 py-12 text-center`}>
        <p className="font-heading text-sm text-muted-foreground">
          Sección de texto — agregá el contenido por chat
        </p>
      </div>
    </section>
  );
}

export default function RichSection({
  data,
  isOwner = false,
}: RichSectionProps) {
  if (!data.title && !data.body) {
    return isOwner ? <RichSectionPlaceholder /> : null;
  }

  // Kit-once (#3883): fuera del closed-set → default, nunca explota.
  const imageSide = resolveRichImageSide(data.image_side);
  const mode = resolveRichMode(data.mode);
  const isCenter = data.align === "center";
  const isChecklist = mode === "checklist";
  const isCenteredMode = mode === "centrado";
  const ctaHref = safeHref(data.cta_url);
  const imageUrl =
    typeof data.image_url === "string" && data.image_url.trim()
      ? data.image_url.trim()
      : undefined;
  const hasImage = Boolean(imageUrl);
  const splitLayout = hasImage && !isCenteredMode;

  const text = (
    <div
      className={[
        "flex min-w-0 flex-col gap-6",
        isCenter && !hasImage ? "items-center text-center" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {data.title ? (
        <h2 className={sectionHeadingClass(data)}>
          {data.title}
        </h2>
      ) : null}

      {data.body ? (
        <div
          className={[
            "max-w-none text-base leading-relaxed text-muted-foreground break-words",
            "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:opacity-80",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
            "[&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-foreground",
            isChecklist
              ? [
                  "[&_ul]:list-none [&_ul]:space-y-3 [&_ul]:pl-0",
                  "[&_ol]:list-decimal [&_ol]:pl-5",
                  "[&_li]:relative [&_li]:pl-7",
                  "[&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-1.5",
                  "[&_li]:before:size-4 [&_li]:before:rounded-[0.125rem]",
                  "[&_li]:before:border [&_li]:before:border-primary",
                  "[&_li]:before:bg-primary [&_li]:before:content-['']",
                ].join(" ")
              : "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-primary",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic",
            isCenter && !hasImage ? "mx-auto" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ReactMarkdown>{data.body}</ReactMarkdown>
        </div>
      ) : null}

      {ctaHref && data.cta_label ? (
        <div
          className={isCenter && !hasImage ? "flex justify-center" : undefined}
        >
          <a
            href={ctaHref}
            className={`inline-flex items-center justify-center ${BLOCK_RADIUS_BUTTON_CLASS} border border-primary bg-transparent px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none`}
          >
            {data.cta_label}
          </a>
        </div>
      ) : null}
    </div>
  );

  const image =
    hasImage && imageUrl ? (
      <div
        className={[
          "relative",
          imageAspectClass(data, DEFAULT_RICH_ASPECT),
          "w-full overflow-hidden",
          BLOCK_RADIUS_CLASS,
          imageFrameClass(data),
          "bg-card",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <img
          src={imageUrl}
          alt={data.title ? `Imagen: ${data.title}` : "Imagen de la sección"}
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className={["size-full", imageFitClass(data)].join(" ")}
        />
      </div>
    ) : null;

  return (
    <section
      aria-label={data.title ?? "Sección de contenido"}
      className={SECTION_ROOT_CLASS}
    >
      <div
        className={
          splitLayout
            ? "grid gap-10 md:grid-cols-2 md:items-center md:gap-14"
            : hasImage
              ? "grid gap-10"
              : undefined
        }
      >
        {splitLayout && imageSide === "left" ? (
          <>
            {image}
            {text}
          </>
        ) : (
          <>
            {text}
            {image}
          </>
        )}
      </div>
    </section>
  );
}
