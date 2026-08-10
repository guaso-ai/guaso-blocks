// Types from `@guaso-ai/content/schemas/blocks` (Python SoT mirrored in content SDK).
// Backend validates lengths; Block + safeHref stay local (UI helpers).

import type {
  RichSectionData,
  GalleryData,
  GalleryImage,
  CardsData,
  CardItem,
  TestimonialsData,
  TestimonialItem,
  CTAData,
} from "@guaso-ai/content/schemas/blocks";

export type {
  RichSectionData,
  GalleryData,
  GalleryImage,
  CardsData,
  CardItem,
  TestimonialsData,
  TestimonialItem,
  CTAData,
};

export type Block = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
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
