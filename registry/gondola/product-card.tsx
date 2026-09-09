import Link from "next/link";
import { firstImageSrc, priceLabel, quantityLabel, type Product } from "./types";

type ProductCardProps = {
  product: Product;
  currencySymbol: string;
};

export function ProductCard({ product, currencySymbol }: ProductCardProps) {
  const image = firstImageSrc(product.images);
  const compare =
    typeof product.compareAtPrice === "number" && product.price < product.compareAtPrice
      ? product.compareAtPrice
      : undefined;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Link href={`/store/${product.slug}`} className="relative block aspect-square overflow-hidden bg-card">
        {image ? (
          <img
            src={image}
            alt={product.name}
            width={800}
            height={800}
            className="size-full object-cover"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.category ? (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
        ) : null}
        <Link href={`/store/${product.slug}`}>
          <h3 className="mt-1 font-heading text-lg font-medium leading-snug text-foreground">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-primary">
            {priceLabel(product.price, currencySymbol)}
          </span>
          {compare ? (
            <span className="text-sm text-muted-foreground line-through">
              {priceLabel(compare, currencySymbol)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {quantityLabel(product.quantity)}
        </p>
      </div>
    </article>
  );
}
