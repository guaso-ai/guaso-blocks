import type { ReactNode } from "react";
import Link from "next/link";
import { firstImageSrc, type Product } from "./types";

type ProductDetailProps = {
  product: Product;
  currencySymbol: string;
  storeNav?: string;
  children?: ReactNode;
};

function priceLabel(price: number, symbol: string): string {
  const hasCents = !Number.isInteger(price);
  const formatted = price.toLocaleString("es-AR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function ProductDetail({
  product,
  currencySymbol,
  storeNav,
  children,
}: ProductDetailProps) {
  const cover = firstImageSrc(product.images);
  const gallery = (product.images ?? []).slice(1).filter(function (img): img is string {
    return typeof img === "string" && img.trim().length !== 0;
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {storeNav ? (
          <Link href="/store" className="text-muted-foreground">
            {storeNav}
          </Link>
        ) : null}
        {product.category ? (
          <span className="text-foreground/70">{product.category}</span>
        ) : null}
      </nav>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
            {cover ? (
              <img
                src={cover}
                alt={product.name}
                width={1200}
                height={1200}
                className="size-full object-cover"
              />
            ) : null}
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((img, i) => (
                <div
                  key={`${img}-${i}`}
                  className="relative aspect-square overflow-hidden rounded-xl bg-card"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 2}`}
                    width={240}
                    height={240}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center">
          {product.category ? (
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {product.category}
            </p>
          ) : null}
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-5 text-3xl font-semibold text-primary">
            {priceLabel(product.price, currencySymbol)}
          </p>
          {product.description ? (
            <p className="mt-6 max-w-prose leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}
          {product.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
