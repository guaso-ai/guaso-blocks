export type ProductAvailability = "in_stock" | "preorder" | "made_to_order";

export type Product = {
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  tags: string[];
  inStock: boolean;
  availability?: ProductAvailability;
  featured: boolean;
};

/** Primer src usable. ⛔ `?? ""` — next/image con src vacío tumba prerender. */
export function firstImageSrc(images?: string[] | null): string | undefined {
  const raw = images?.[0];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}
