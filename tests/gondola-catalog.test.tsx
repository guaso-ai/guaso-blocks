import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProductCard } from "../registry/gondola/product-card";
import { StoreCatalog } from "../registry/gondola/store-catalog";
import { ProductDetail } from "../registry/gondola/product-detail";
import {
  firstImageSrc,
  normalizeProducts,
  quantityLabel,
  type Product,
} from "../registry/gondola/types";

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: unknown;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children as never}
      </a>
    );
  },
}));

const sample: Product = {
  slug: "oxido",
  name: "Óxido",
  description: "Pintura sobre chapa",
  price: 180000,
  quantity: 2,
  images: ["https://example.com/cover.jpg", "https://example.com/g2.jpg"],
  category: "Obra",
  tags: ["Palermo"],
  inStock: true,
  featured: false,
};

afterEach(() => {
  cleanup();
});

describe("gondola firstImageSrc", () => {
  it("skips empty / whitespace", () => {
    expect(firstImageSrc(undefined)).toBeUndefined();
    expect(firstImageSrc([])).toBeUndefined();
    expect(firstImageSrc(["  "])).toBeUndefined();
    expect(firstImageSrc(["https://x"])).toBe("https://x");
  });
});

describe("gondola catalog UI", () => {
  it("empty catalog → null", () => {
    const { container } = render(
      <StoreCatalog products={[]} currencySymbol="$" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders cards with product name and no cart chrome", () => {
    render(<StoreCatalog products={[sample]} currencySymbol="$" />);
    expect(screen.getByText("Óxido")).toBeTruthy();
    expect(screen.getByText("Obra")).toBeTruthy();
    expect(screen.getByText("$180.000")).toBeTruthy();
    expect(screen.getByText("2 disponibles")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ProductCard links to /store/:slug", () => {
    render(<ProductCard product={sample} currencySymbol="$" />);
    const links = screen.getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href") === "/store/oxido")).toBe(
      true,
    );
  });

  it("ProductDetail shows gallery + children slot", () => {
    const { getByRole, getByText, getByAltText } = render(
      <ProductDetail product={sample} currencySymbol="$" storeNav="Tienda">
        <span>slot-host</span>
      </ProductDetail>,
    );
    expect(getByRole("heading", { level: 1, name: "Óxido" })).toBeTruthy();
    expect(getByText("slot-host")).toBeTruthy();
    expect(getByText("Tienda")).toBeTruthy();
    expect(getByAltText("Óxido 2")).toBeTruthy();
    expect(getByText("$180.000")).toBeTruthy();
    expect(getByText("2 disponibles")).toBeTruthy();
  });

  it("quantity 0 se pinta como 0, no como hay stock", () => {
    render(
      <ProductCard
        product={{ ...sample, quantity: 0, inStock: false }}
        currencySymbol="$"
      />,
    );
    expect(screen.getByText("0 disponibles")).toBeTruthy();
    expect(screen.queryByText(/hay stock/i)).toBeNull();
  });
});

describe("gondola normalizeProducts", () => {
  it("quantity entero pisa inStock; legacy inStock si falta quantity", () => {
    const [fromQty] = normalizeProducts([
      {
        slug: "a",
        name: "A",
        description: "",
        price: 10,
        quantity: 0,
        images: [],
        category: "X",
        tags: [],
        inStock: true,
        featured: false,
      },
    ]);
    expect(fromQty?.inStock).toBe(false);
    expect(fromQty?.quantity).toBe(0);
    const [legacy] = normalizeProducts([
      {
        slug: "b",
        name: "B",
        description: "",
        price: 10,
        images: [],
        category: "X",
        tags: [],
        inStock: true,
        featured: false,
      },
    ]);
    expect(legacy?.inStock).toBe(true);
    expect(legacy?.quantity).toBe(0);
  });

  it("quantityLabel always shows the number", () => {
    expect(quantityLabel(0)).toBe("0 disponibles");
    expect(quantityLabel(3)).toBe("3 disponibles");
  });
});

describe("gondola getter fallback JSON", () => {
  it("loadProducts without DB uses JSON import, not return []", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../registry/gondola/store-products.ts"),
      "utf8",
    );
    expect(src).toContain("content/products/products.json");
    expect(src).toContain("normalizeProducts(productsJson)");
    expect(src).not.toMatch(/if\s*\(\s*!getDb\(\)\s*\)\s*return\s*\[\]/);
  });
});
