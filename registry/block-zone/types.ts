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
};

export type CTAData = {
  headline?: string;
  subtext?: string;
  button_label?: string;
  button_url?: string;
};

export type GalleryImage = {
  url: string; // runtime/upload; not in repeatable schema (alt/caption only) — same as templates
  alt?: string;
  caption?: string;
};

export type GalleryData = {
  title?: string;
  images?: GalleryImage[];
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
};

export type TestimonialsData = {
  title?: string;
  items?: TestimonialItem[];
  layout?: TestimonialsLayout | string;
};

// ─── Variantes de bloque WS1 (#3882, kit-once) ──────────────────────────────
// Closed-sets declarados UNA vez acá. El backend los espeja en
// `_CANONICAL_BLOCKS` + `_validate_block_variant` (default + logger.warning);
// las skins solo resuelven a defaults (divergencia estética, nunca
// comportamiento). Sin avatar: DIFERIDO al diseño `array_image_fields`.
export type CardsColumns = "2" | "3" | "4";
export type CardsStyle = "grid" | "feature" | "minimal";
export type TestimonialsLayout = "grilla" | "destacado" | "carrusel" | "minimal";

export const DEFAULT_CARDS_COLUMNS: CardsColumns = "3";
export const DEFAULT_CARDS_STYLE: CardsStyle = "grid";
export const DEFAULT_TESTIMONIALS_LAYOUT: TestimonialsLayout = "grilla";

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
