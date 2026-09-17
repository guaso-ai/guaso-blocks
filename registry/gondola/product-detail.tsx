"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { firstImageSrc, priceLabel, quantityLabel, type Product } from "./types";

type ProductDetailProps = {
  product: Product;
  currencySymbol: string;
  storeNav?: string;
  children?: ReactNode;
};

export function ProductDetail({
  product,
  currencySymbol,
  storeNav,
  children,
}: ProductDetailProps) {
  const cover = firstImageSrc(product.images);
  const images = (product.images ?? []).filter(function (img): img is string {
    return typeof img === "string" && img.trim().length !== 0;
  });
  // Destacada = images[0] (#3888). Tap en una miniatura cambia la grande.
  const [selected, setSelected] = useState(0);
  const current = images[Math.min(selected, images.length - 1)] ?? cover;

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
            {current ? (
              <img
                src={current}
                alt={product.name}
                width={1200}
                height={1200}
                className="size-full object-cover"
              />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-label={`Ver foto ${i + 1} de ${product.name}`}
                  aria-current={i === selected}
                  className={`relative aspect-square overflow-hidden rounded-xl bg-card ${
                    i === selected ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    width={240}
                    height={240}
                    className="size-full object-cover"
                  />
                </button>
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
          <p className="mt-2 text-sm text-muted-foreground">
            {quantityLabel(product.quantity)}
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
