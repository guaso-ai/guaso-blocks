import { ProductCard } from "./product-card";
import type { Product } from "./types";

type StoreCatalogProps = {
  products: Product[];
  currencySymbol: string;
};

export function StoreCatalog({ products, currencySymbol }: StoreCatalogProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          currencySymbol={currencySymbol}
        />
      ))}
    </div>
  );
}
