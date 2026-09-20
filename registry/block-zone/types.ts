// UI structural types for BlockZone + skins. Backend validates lengths.
// Block + safeHref stay local. Zone-only install must typecheck without
// the content npm package (#3579).

export type Block = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type RichSectionData = {
  title?: string;
  body?: string;
  cta_label?: string;
  cta_url?: string;
  align?: "left" | "center";
  image_url?: string;
  image_side?: RichImageSide | string;
  mode?: RichMode | string;
};

export type CTAData = {
  headline?: string;
  subtext?: string;
  button_label?: string;
  button_url?: string;
  style?: CtaStyle | string;
  align?: CtaAlign | string;
  image_url?: string;
};

export type GalleryImage = {
  url: string; // runtime/upload; not in repeatable schema (alt/caption only) — same as templates
  alt?: string;
  caption?: string;
};

export type GalleryData = {
  title?: string;
  images?: GalleryImage[];
  columns?: GalleryColumns | string;
  style?: GalleryStyle | string;
};

export type CardItem = {
  heading?: string;
  text?: string;
  link_label?: string;
  link_url?: string;
};

export type CardsData = {
  title?: string;
  subtitle?: string;
  cards?: CardItem[];
  columns?: CardsColumns | string;
  style?: CardsStyle | string;
};

export type TestimonialItem = {
  author?: string;
  role?: string;
  quote?: string;
  rating?: string;
  avatar?: string; // máx 500; URL https pintada, si no placeholder/inicial
};

export type TestimonialsData = {
  title?: string;
  items?: TestimonialItem[];
  layout?: TestimonialsLayout | string;
};

// ─── Variantes de bloque kit-once (#3882 WS1, #3883 WS2, #3884 WS3) ───────────
// Closed-sets declarados UNA vez acá. El backend los espeja en
// `_CANONICAL_BLOCKS` + `_validate_block_variant` (default + logger.warning);
// las skins solo resuelven a defaults (divergencia estética, nunca
// comportamiento). Avatar: `TestimonialItem.avatar` (#3950, array_image_fields).
export type CardsColumns = "2" | "3" | "4";
export type CardsStyle = "grid" | "feature" | "minimal";
export type TestimonialsLayout = "grilla" | "destacado" | "carrusel" | "minimal";
export type GalleryColumns = "2" | "3" | "4";
export type GalleryStyle = "grilla" | "masonry" | "carrusel";
export type RichImageSide = "left" | "right";
export type RichMode = "split" | "centrado" | "checklist";
export type CtaStyle = "banda" | "foto" | "split";
export type CtaAlign = "left" | "center" | "right";

export const DEFAULT_CARDS_COLUMNS: CardsColumns = "3";
export const DEFAULT_CARDS_STYLE: CardsStyle = "grid";
export const DEFAULT_TESTIMONIALS_LAYOUT: TestimonialsLayout = "grilla";
export const DEFAULT_GALLERY_COLUMNS: GalleryColumns = "3";
export const DEFAULT_GALLERY_STYLE: GalleryStyle = "grilla";
export const DEFAULT_RICH_IMAGE_SIDE: RichImageSide = "right";
export const DEFAULT_RICH_MODE: RichMode = "split";
export const DEFAULT_CTA_STYLE: CtaStyle = "banda";
export const DEFAULT_CTA_ALIGN: CtaAlign = "center";

export function resolveCardsColumns(value: unknown): CardsColumns {
  return value === "2" || value === "3" || value === "4"
    ? value
    : DEFAULT_CARDS_COLUMNS;
}

export function resolveCardsStyle(value: unknown): CardsStyle {
  return value === "grid" || value === "feature" || value === "minimal"
    ? value
    : DEFAULT_CARDS_STYLE;
}

export function resolveTestimonialsLayout(value: unknown): TestimonialsLayout {
  return value === "grilla" ||
    value === "destacado" ||
    value === "carrusel" ||
    value === "minimal"
    ? value
    : DEFAULT_TESTIMONIALS_LAYOUT;
}

export function resolveGalleryColumns(value: unknown): GalleryColumns {
  return value === "2" || value === "3" || value === "4"
    ? value
    : DEFAULT_GALLERY_COLUMNS;
}

export function resolveGalleryStyle(value: unknown): GalleryStyle {
  return value === "grilla" || value === "masonry" || value === "carrusel"
    ? value
    : DEFAULT_GALLERY_STYLE;
}

export function resolveRichImageSide(value: unknown): RichImageSide {
  return value === "left" || value === "right" ? value : DEFAULT_RICH_IMAGE_SIDE;
}

export function resolveRichMode(value: unknown): RichMode {
  return value === "split" || value === "centrado" || value === "checklist"
    ? value
    : DEFAULT_RICH_MODE;
}

export function resolveCtaStyle(value: unknown): CtaStyle {
  return value === "banda" || value === "foto" || value === "split"
    ? value
    : DEFAULT_CTA_STYLE;
}

export function resolveCtaAlign(value: unknown): CtaAlign {
  return value === "left" || value === "center" || value === "right"
    ? value
    : DEFAULT_CTA_ALIGN;
}

/**
 * Rating por ítem: dígito "1"–"5" (string, como el repeatable del schema).
 * Ausente o fuera de rango → undefined (sin estrellas, sin default inventado).
 */
export function resolveTestimonialRating(
  value: unknown,
): 1 | 2 | 3 | 4 | 5 | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return undefined;
  return n as 1 | 2 | 3 | 4 | 5;
}

/**
 * Safe href for block CTAs / links.
 * Allows http(s)/mailto/tel and relative paths starting with `/`.
 * Rejects javascript:, data:, protocol-relative, and empty.
 */
export function safeHref(url?: string): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\")
  ) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return trimmed;
  }

  return undefined;
}
