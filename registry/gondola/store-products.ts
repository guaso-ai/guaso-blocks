import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { contentEntries } from "@/db/schema";
import { normalizeProducts, type Product } from "./types";
import productsJson from "../../../content/products/products.json";

export type { Product } from "./types";
export { firstImageSrc } from "./types";

async function getContentEntry(
  key: string,
  draft: boolean,
): Promise<unknown | null> {
  const db = getDb();
  if (!db) return null;
  if (draft) {
    const rows = await db
      .select({
        payload: sql<unknown>`COALESCE(${contentEntries.draftData}, ${contentEntries.data})`,
      })
      .from(contentEntries)
      .where(eq(contentEntries.contentKey, key))
      .limit(1);
    return rows[0]?.payload ?? null;
  }
  const rows = await db
    .select()
    .from(contentEntries)
    .where(eq(contentEntries.contentKey, key))
    .limit(1);
  return rows[0]?.data ?? null;
}

async function isDraftEnabled(): Promise<boolean> {
  try {
    const { isEnabled } = await draftMode();
    return isEnabled;
  } catch {
    return false;
  }
}

async function loadProducts(draft: boolean): Promise<Product[]> {
  if (!getDb()) return normalizeProducts(productsJson);
  const data = await getContentEntry("products/products", draft);
  if (!data || !Array.isArray(data)) return [];
  return normalizeProducts(data);
}

const getProductsCached = unstable_cache(
  async () => loadProducts(false),
  ["products/products"],
  { tags: ["content"] },
);

export async function getProducts(): Promise<Product[]> {
  if (await isDraftEnabled()) return loadProducts(true);
  return getProductsCached();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.featured);
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  return Array.from(new Set(products.map((p) => p.category)));
}
