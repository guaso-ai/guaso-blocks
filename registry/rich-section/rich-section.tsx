import ReactMarkdown from "react-markdown";
import type { RichSectionData } from "../block-zone/types";
import {
  DEFAULT_RICH_ASPECT,
  OFFER_CTA_DEFAULT,
  imageAspectClass,
  imageFitClass,
  imageFrameClass,
  resolveRichFondo,
  resolveRichImageSide,
  resolveRichMode,
  resolveRichVideoUrl,
  richSectionHeadingClass,
  safeHref,
  BLOCK_RADIUS_BUTTON_CLASS,
  BLOCK_RADIUS_CLASS,
  BLOCK_RADIUS_THUMB_CLASS,
  SECTION_ROOT_CLASS,
} from "../block-zone/types";
import HeroFondoVideo from "./hero-fondo-video";

type RichSectionProps = {
  data: RichSectionData;
  isOwner?: boolean;
};

// Botón de acción compartido por el CTA propio (`cta_url`) y el de la oferta (#4599).
const CTA_LINK_CLASS = `inline-flex items-center justify-center ${BLOCK_RADIUS_BUTTON_CLASS} border border-primary bg-transparent px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none`;

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
  // Fondo completo (#4567): solo con media de fondo (imagen o video). Sin media → render normal.
  const videoUrl = resolveRichVideoUrl(data.video_url);
  // #4580: `completo` no admite botón (el dato se conserva, solo no se renderiza).
  const isCompleto = resolveRichFondo(data.fondo) === "completo";
  const isHero = isCompleto && (hasImage || Boolean(videoUrl));
  const splitLayout = hasImage && !isCenteredMode;
  // En hero el texto va sobre el overlay: centrado por `align`, aunque haya imagen.
  const textCentered = isCenter && (!hasImage || isHero);

  // Oferta viva (#4599): el kit solo pinta lo que el host resolvió; sin datos útiles, no renderiza nada.
  const offer = data.offer ?? null;
  const offerName = typeof offer?.name === "string" ? offer.name.trim() : "";
  const offerPrice = typeof offer?.priceLabel === "string" ? offer.priceLabel.trim() : "";
  const offerImageUrl =
    typeof offer?.imageUrl === "string" && offer.imageUrl.trim()
      ? offer.imageUrl.trim()
      : undefined;
  const offerHref = offer ? safeHref(offer.href) : undefined;
  const offerCtaLabel = offer
    ? (offer.ctaLabel ?? OFFER_CTA_DEFAULT).trim()
    : "";
  const offerNameClass = isHero ? "text-background" : "text-foreground";
  const offerPriceClass = isHero ? "text-background" : "text-muted-foreground";
  // #4580: `completo` no admite botón; la oferta tampoco lo renderiza ahí.
  const showOfferCta = Boolean(offerHref && offerCtaLabel && !isCompleto);
  const showOffer = Boolean(
    offerImageUrl || offerName || offerPrice || showOfferCta,
  );

  // Tokens del cuerpo: default byte-idénticos a hoy; hero = tono inverso sobre el overlay.
  const bodyToneClass = isHero
    ? "max-w-none text-base leading-relaxed text-background break-words [&_a]:text-background [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:opacity-80 [&_strong]:font-semibold [&_strong]:text-background [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-background"
    : "max-w-none text-base leading-relaxed text-muted-foreground break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:opacity-80 [&_strong]:font-semibold [&_strong]:text-foreground [&_h3]:font-heading [&_h3]:font-semibold [&_h3]:text-foreground";

  const text = (
    <div
      className={[
        "flex min-w-0 flex-col gap-6",
        textCentered ? "items-center text-center" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {data.title ? (
        <h2 className={richSectionHeadingClass(data, isHero ? "inverse" : "default")}>
          {data.title}
        </h2>
      ) : null}

      {data.body ? (
        <div
          className={[
            bodyToneClass,
            isChecklist
              ? [
                  "[&_ul]:list-none [&_ul]:space-y-3 [&_ul]:pl-0",
                  "[&_ol]:list-decimal [&_ol]:pl-5",
                  "[&_li]:relative [&_li]:pl-7",
                  "[&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-1.5",
                  "[&_li]:before:size-4 [&_li]:before:rounded-[var(--block-radius-suave,0.125rem)]",
                  "[&_li]:before:border [&_li]:before:border-primary",
                  "[&_li]:before:bg-primary [&_li]:before:content-['']",
                ].join(" ")
              : isHero
                ? "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-background"
                : "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-primary",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic",
            textCentered ? "mx-auto" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ReactMarkdown>{data.body}</ReactMarkdown>
        </div>
      ) : null}

      {showOffer ? (
        <div className="flex flex-col gap-4">
          {offerImageUrl ? (
            <div
              className={[
                "relative aspect-square w-40 overflow-hidden sm:w-48",
                BLOCK_RADIUS_THUMB_CLASS,
                "bg-card",
              ].join(" ")}
            >
              <img
                src={offerImageUrl}
                alt={offerName}
                width={800}
                height={800}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          ) : null}

          {offerName ? (
            <h3 className={`font-heading text-lg font-semibold ${offerNameClass}`}>
              {offerName}
            </h3>
          ) : null}

          {offerPrice ? (
            <p className={`text-base font-medium ${offerPriceClass}`}>
              {offerPrice}
            </p>
          ) : null}

          {showOfferCta ? (
            <div className={textCentered ? "flex justify-center" : undefined}>
              <a href={offerHref} className={CTA_LINK_CLASS}>
                {offerCtaLabel}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {ctaHref && data.cta_label && !isCompleto ? (
        <div
          className={textCentered ? "flex justify-center" : undefined}
        >
          <a
            href={ctaHref}
            className={CTA_LINK_CLASS}
          >
            {data.cta_label}
          </a>
        </div>
      ) : null}
    </div>
  );

  if (isHero) {
    return (
      <HeroFondoVideo
        label={data.title ?? "Sección de contenido"}
        imageUrl={imageUrl}
        videoUrl={videoUrl}
      >
        {text}
      </HeroFondoVideo>
    );
  }

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
