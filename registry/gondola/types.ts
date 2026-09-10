export type ProductAvailability = "in_stock" | "preorder" | "made_to_order";

export type Product = {
  slug: string;
  name: string;
  description: string;
  price: number;
  quantity: number; // entero ≥0; unidades disponibles, no qty de carrito
  compareAtPrice?: number;
  images: string[];
  category: string;
  tags: string[];
  inStock: boolean; // derivado: quantity > 0 (legacy JSON con solo inStock: fallback)
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

export function priceLabel(price: number, symbol: string): string {
  const hasCents = !Number.isInteger(price);
  const formatted = price.toLocaleString("es-AR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/** Siempre el número, incluso 0. ⛔ copy de “hay stock”. */
export function quantityLabel(quantity: number): string {
  return `${quantity} disponibles`;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

const AVAIL: ReadonlySet<string> = new Set([
  "in_stock",
  "preorder",
  "made_to_order",
]);

export function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const slug = asString(row.slug).trim();
  if (!slug) return null;
  const qtyRaw = row.quantity;
  const quantityIsInt =
    typeof qtyRaw === "number" && Number.isInteger(qtyRaw) && qtyRaw >= 0;
  const quantity = quantityIsInt ? qtyRaw : 0;
  const inStock = quantityIsInt ? quantity > 0 : Boolean(row.inStock);
  const availability =
    typeof row.availability === "string" && AVAIL.has(row.availability)
      ? (row.availability as ProductAvailability)
      : undefined;
  const compareAt = asFiniteNumber(row.compareAtPrice);
  return {
    slug,
    name: asString(row.name),
    description: asString(row.description),
    price: asFiniteNumber(row.price) ?? 0,
    quantity,
    ...(compareAt !== undefined ? { compareAtPrice: compareAt } : {}),
    images: asStringArray(row.images),
    category: asString(row.category),
    tags: asStringArray(row.tags),
    inStock,
    ...(availability ? { availability } : {}),
    featured: Boolean(row.featured),
  };
}

export function normalizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  const out: Product[] = [];
  for (const item of raw) {
    const product = normalizeProduct(item);
    if (product) out.push(product);
  }
  return out;
}
