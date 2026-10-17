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

/** Minúsculas y sin tildes, para comparar búsquedas ("Óxido" ≡ "oxido"). #4268 */
function normalizeSearchText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Filtra por substring sobre `name` y cada `tags[]` (sin tildes ni mayúsculas).
 * Query vacío o solo espacios → mismo array. Sin tokenización: "remera azul"
 * solo matchea si esas palabras aparecen contiguas. #4268
 */
export function filterProducts(products: Product[], query: string | undefined): Product[] {
  const q = normalizeSearchText((query ?? "").trim());
  if (!q) return products;
  return products.filter(
    (product) =>
      normalizeSearchText(product.name).includes(q) ||
      product.tags.some((tag) => normalizeSearchText(tag).includes(q)),
  );
}

/** Filtros del listado (#4269). El host los parsea de `searchParams` con `parseCatalogFilters`. */
export type CatalogFilters = {
  query?: string; // ?q=  (trim; vacío = sin filtro)
  category?: string; // ?categoria=  (match exacto, sin tildes ni mayúsculas)
  minPrice?: number; // ?precio_min=  (>= 0, inclusivo)
  maxPrice?: number; // ?precio_max=  (>= 0, inclusivo)
  onlyAvailable?: boolean; // ?disponible=1  (product.inStock === true)
};

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw : undefined;
}

/** Número ≥ 0; vacío, no numérico o negativo → undefined (sin filtro). */
function parsePriceParam(value: string | undefined): number | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Igualdad de categoría: sin tildes ni mayúsculas, sin espacios sobrantes. #4269 */
export function isSameCategory(a: string, b: string): boolean {
  return normalizeSearchText(a.trim()) === normalizeSearchText(b.trim());
}

/** Parsea la URL del listado. Parámetros repetidos → primer valor. #4269 */
export function parseCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const query = (firstParam(params.q) ?? "").trim();
  const category = (firstParam(params.categoria) ?? "").trim();
  return {
    ...(query ? { query } : {}),
    ...(category ? { category } : {}),
    minPrice: parsePriceParam(firstParam(params.precio_min)),
    maxPrice: parsePriceParam(firstParam(params.precio_max)),
    onlyAvailable: firstParam(params.disponible) === "1",
  };
}

/** Aplica todos los filtros activos (AND). `precio_min > precio_max` → []. #4269 */
export function applyCatalogFilters(products: Product[], filters: CatalogFilters): Product[] {
  const category = filters.category?.trim() ? filters.category : undefined;
  return filterProducts(products, filters.query).filter(
    (product) =>
      (category === undefined || isSameCategory(product.category, category)) &&
      (filters.minPrice === undefined || product.price >= filters.minPrice) &&
      (filters.maxPrice === undefined || product.price <= filters.maxPrice) &&
      (!filters.onlyAvailable || product.inStock === true),
  );
}

/** Categorías únicas (sin tildes/mayúsculas), no vacías, orden es-AR. #4269 */
export function categoriesOf(products: Product[]): string[] {
  const byKey = new Map<string, string>();
  for (const product of products) {
    const name = product.category.trim();
    if (!name) continue;
    const key = normalizeSearchText(name);
    if (!byKey.has(key)) byKey.set(key, name);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "es-AR"));
}

/**
 * Href del listado con los filtros activos (orden fijo q, categoria, precio_min,
 * precio_max, disponible). `overrides` reemplaza campos; `undefined` los quita. #4269
 */
export function catalogFilterHref(
  filters: CatalogFilters,
  overrides: Partial<CatalogFilters> = {},
): string {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.query?.trim()) params.set("q", next.query.trim());
  if (next.category?.trim()) params.set("categoria", next.category.trim());
  if (next.minPrice !== undefined) params.set("precio_min", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("precio_max", String(next.maxPrice));
  if (next.onlyAvailable) params.set("disponible", "1");
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}
