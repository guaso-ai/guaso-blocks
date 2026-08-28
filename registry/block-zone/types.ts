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
};

export type TestimonialItem = {
  author?: string;
  role?: string;
  quote?: string;
};

export type TestimonialsData = {
  title?: string;
  items?: TestimonialItem[];
};

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
