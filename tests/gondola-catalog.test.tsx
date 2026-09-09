import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "../registry/gondola/product-card";
import { StoreCatalog } from "../registry/gondola/store-catalog";
import { ProductDetail } from "../registry/gondola/product-detail";
import { firstImageSrc, type Product } from "../registry/gondola/types";

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
  images: ["https://example.com/cover.jpg", "https://example.com/g2.jpg"],
  category: "Obra",
  tags: ["Palermo"],
  inStock: true,
  featured: false,
};

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
    render(
      <ProductDetail product={sample} currencySymbol="$" storeNav="Tienda">
        <span>slot-host</span>
      </ProductDetail>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Óxido" })).toBeTruthy();
    expect(screen.getByText("slot-host")).toBeTruthy();
    expect(screen.getByText("Tienda")).toBeTruthy();
    expect(screen.getByAltText("Óxido 2")).toBeTruthy();
  });
});
