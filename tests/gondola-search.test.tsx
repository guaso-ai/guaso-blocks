import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StoreCatalog } from "../registry/gondola/store-catalog";
import { filterProducts, type Product } from "../registry/gondola/types";

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

const oxido: Product = {
  slug: "oxido",
  name: "Óxido",
  description: "Pintura sobre chapa",
  price: 180000,
  quantity: 2,
  images: [],
  category: "Obra",
  tags: ["Palermo"],
  inStock: true,
  featured: false,
};

const mar: Product = {
  slug: "mar",
  name: "Mar en calma",
  description: "Óleo",
  price: 90000,
  quantity: 1,
  images: [],
  category: "Obra",
  tags: ["Costa", "Azul"],
  inStock: true,
  featured: false,
};

const catalog = [oxido, mar];

afterEach(() => {
  cleanup();
});

describe("filterProducts (#4268)", () => {
  it("matchea por nombre, sin tildes y en mayúsculas", () => {
    expect(filterProducts(catalog, "oxido").map((p) => p.slug)).toEqual(["oxido"]);
    expect(filterProducts(catalog, "ÓXIDO").map((p) => p.slug)).toEqual(["oxido"]);
    expect(filterProducts(catalog, "óxido").map((p) => p.slug)).toEqual(["oxido"]);
  });

  it("matchea por tag y no por otros productos", () => {
    expect(filterProducts(catalog, "palermo").map((p) => p.slug)).toEqual(["oxido"]);
    expect(filterProducts(catalog, "AZUL").map((p) => p.slug)).toEqual(["mar"]);
  });

  it("sin coincidencias → []", () => {
    expect(filterProducts(catalog, "zzzz")).toEqual([]);
  });

  it("query vacío o solo espacios → mismo array (misma referencia)", () => {
    expect(filterProducts(catalog, undefined)).toBe(catalog);
    expect(filterProducts(catalog, "")).toBe(catalog);
    expect(filterProducts(catalog, "   ")).toBe(catalog);
  });
});

describe("StoreCatalog con búsqueda (#4268)", () => {
  it("query sin match → mensaje con la query, enlace Ver todo y ninguna card", () => {
    const { container } = render(
      <StoreCatalog products={catalog} currencySymbol="$" filters={{ query: "zzzz" }} />,
    );
    expect(screen.getByText(/No encontramos piezas para “zzzz”/)).toBeTruthy();
    const verTodo = screen.getByRole("link", { name: "Ver todo" });
    expect(verTodo.getAttribute("href")).toBe("?");
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });

  it("query que matchea por tag → solo esa card", () => {
    const { container } = render(
      <StoreCatalog products={catalog} currencySymbol="$" filters={{ query: "costa" }} />,
    );
    const cards = container.querySelectorAll("article");
    expect(cards).toHaveLength(1);
    expect(screen.getByText("Mar en calma")).toBeTruthy();
    expect(screen.queryByText("Óxido")).toBeNull();
  });

  it("products vacío + query → null", () => {
    const { container } = render(
      <StoreCatalog products={[]} currencySymbol="$" filters={{ query: "oxido" }} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renderiza form GET con input name=q y defaultValue = query", () => {
    const { container } = render(
      <StoreCatalog products={catalog} currencySymbol="$" filters={{ query: "oxido" }} />,
    );
    const form = screen.getByRole("search");
    expect(form.tagName).toBe("FORM");
    expect(form.getAttribute("method")).toBe("get");
    const input = container.querySelector('input[name="q"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.defaultValue).toBe("oxido");
  });
});
