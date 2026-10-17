import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ProductDetail } from "../registry/gondola/product-detail";
import { relatedProducts, type Product } from "../registry/gondola/types";

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

function mk(slug: string, over: Partial<Product> = {}): Product {
  return {
    slug,
    name: `Pieza ${slug}`,
    description: "",
    price: 1000,
    quantity: 1,
    images: ["https://example.com/x.jpg"],
    category: "Obra",
    tags: [],
    inStock: true,
    featured: false,
    ...over,
  };
}

afterEach(() => {
  cleanup();
});

describe("gondola relatedProducts (#4273)", () => {
  it("misma categoría con tildes, mayúsculas y espacios matchea", () => {
    const product = mk("p", { category: "Cerámica" });
    const catalog = [product, mk("a", { category: "  CERAMICA " })];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a"]);
  });

  it("tag compartido normalizado (mayúsculas y espacios) matchea", () => {
    const product = mk("p", { category: "Otra", tags: ["Palermo"] });
    const catalog = [product, mk("a", { category: "Distinta", tags: [" palermo"] })];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a"]);
  });

  it("tag es igualdad, no substring", () => {
    const product = mk("p", { category: "Otra", tags: ["Palermo"] });
    const catalog = [product, mk("a", { category: "Distinta", tags: ["Palermo Soho"] })];
    expect(relatedProducts(product, catalog)).toEqual([]);
  });

  it("excluye el mismo slug aunque esté en el catálogo", () => {
    const product = mk("p");
    const catalog = [product, mk("a"), mk("p")];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a"]);
  });

  it("sin categoría ni tag en común queda fuera", () => {
    const product = mk("p", { category: "Obra", tags: ["Palermo"] });
    const catalog = [product, mk("a", { category: "Otra", tags: ["Belgrano"] })];
    expect(relatedProducts(product, catalog)).toEqual([]);
  });

  it("categoría vacía en la ficha y en el candidato no matchea", () => {
    const product = mk("p", { category: "" });
    const catalog = [product, mk("a", { category: "" })];
    expect(relatedProducts(product, catalog)).toEqual([]);
  });

  it("categoría vacía en la ficha no cuenta como match; un tag compartido sí entra", () => {
    const product = mk("p", { category: "   ", tags: ["x"] });
    const catalog = [product, mk("a", { category: "", tags: ["x"] })];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a"]);
  });

  it("tags vacíos o solo espacios no matchean", () => {
    const product = mk("p", { category: "Otra", tags: ["", "  "] });
    const catalog = [product, mk("a", { category: "Distinta", tags: ["", "   "] })];
    expect(relatedProducts(product, catalog)).toEqual([]);
  });

  it("producto con tags: [] y misma categoría entra", () => {
    const product = mk("p", { tags: [] });
    const catalog = [product, mk("a", { tags: [] })];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a"]);
  });

  it("orden = orden del catálogo", () => {
    const product = mk("p");
    const catalog = [mk("c"), product, mk("a"), mk("b")];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["c", "a", "b"]);
  });

  it("devuelve las mismas referencias del catálogo", () => {
    const product = mk("p");
    const a = mk("a");
    const out = relatedProducts(product, [product, a]);
    expect(out[0]).toBe(a);
  });

  it("no muta el catálogo ni la ficha", () => {
    const product = mk("p", { tags: ["Palermo"] });
    const catalog = [product, mk("a", { tags: ["palermo"] }), mk("b")];
    const before = JSON.stringify(catalog);
    const productBefore = JSON.stringify(product);
    const refsBefore = [...catalog];
    const out = relatedProducts(product, catalog);
    expect(out).not.toBe(catalog);
    expect(JSON.stringify(catalog)).toBe(before);
    expect(JSON.stringify(product)).toBe(productBefore);
    expect(catalog.every((item, i) => item === refsBefore[i])).toBe(true);
  });

  it("default limit 4 corta el resultado", () => {
    const product = mk("p");
    const catalog = [product, mk("a"), mk("b"), mk("c"), mk("d"), mk("e"), mk("f")];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a", "b", "c", "d"]);
  });

  it("limit=2 → 2, limit=0 → []", () => {
    const product = mk("p");
    const catalog = [product, mk("a"), mk("b"), mk("c")];
    expect(relatedProducts(product, catalog, 2).map((p) => p.slug)).toEqual(["a", "b"]);
    expect(relatedProducts(product, catalog, 0)).toEqual([]);
  });

  it("limit negativo, NaN o infinito → []", () => {
    const product = mk("p");
    const catalog = [product, mk("a"), mk("b")];
    expect(relatedProducts(product, catalog, -1)).toEqual([]);
    expect(relatedProducts(product, catalog, Number.NaN)).toEqual([]);
    expect(relatedProducts(product, catalog, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it("limit fraccionario se trunca (2.7 → 2)", () => {
    const product = mk("p");
    const catalog = [product, mk("a"), mk("b"), mk("c")];
    expect(relatedProducts(product, catalog, 2.7)).toHaveLength(2);
  });

  it("catálogo sin relacionados → []", () => {
    const product = mk("p");
    expect(relatedProducts(product, [product])).toEqual([]);
    expect(relatedProducts(product, [])).toEqual([]);
  });

  it("candidato sin tags (undefined) no rompe y matchea por categoría", () => {
    const product = mk("p");
    const noTags = { ...mk("a"), tags: undefined as unknown as string[] };
    expect(relatedProducts(product, [product, noTags]).map((p) => p.slug)).toEqual(["a"]);
  });

  it("ficha sin tags (undefined) no rompe y matchea por categoría", () => {
    const product = { ...mk("p"), tags: undefined as unknown as string[] };
    const catalog = [product, mk("a")];
    expect(relatedProducts(product, catalog).map((p) => p.slug)).toEqual(["a"]);
  });
});

describe("gondola ProductDetail productos relacionados (#4273)", () => {
  const sample = mk("oxido", { name: "Óxido", category: "Obra", tags: ["Palermo"] });

  it("con catalog que tiene relacionados → heading y una article por relacionado, sin la ficha", () => {
    const catalog = [
      sample,
      mk("a", { name: "Pieza A" }),
      mk("b", { name: "Pieza B", category: "Otra", tags: ["palermo"] }),
    ];
    const { container } = render(
      <ProductDetail product={sample} currencySymbol="$" catalog={catalog} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Productos relacionados" })).toBeTruthy();
    const articles = container.querySelectorAll("article");
    expect(articles).toHaveLength(2);
    expect(within(articles[0] as HTMLElement).getByRole("heading", { level: 3 }).textContent).toBe("Pieza A");
    expect(within(articles[1] as HTMLElement).getByRole("heading", { level: 3 }).textContent).toBe("Pieza B");
    expect(screen.queryByRole("heading", { level: 3, name: "Óxido" })).toBeNull();
  });

  it("los relacionados usan el currencySymbol de la ficha", () => {
    const catalog = [sample, mk("a", { name: "Pieza A", price: 5000 })];
    render(<ProductDetail product={sample} currencySymbol="€" catalog={catalog} />);
    expect(screen.getByText("€5.000")).toBeTruthy();
  });

  it("sin prop catalog → sin heading ni article (regresión)", () => {
    const { container } = render(<ProductDetail product={sample} currencySymbol="$" />);
    expect(screen.queryByRole("heading", { name: "Productos relacionados" })).toBeNull();
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });

  it("catalog sin relacionados → sin heading ni sección", () => {
    const catalog = [sample, mk("a", { category: "Otra", tags: ["Belgrano"] })];
    const { container } = render(
      <ProductDetail product={sample} currencySymbol="$" catalog={catalog} />,
    );
    expect(screen.queryByRole("heading", { name: "Productos relacionados" })).toBeNull();
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });

  it("catalog con solo el mismo producto → sin bloque", () => {
    const { container } = render(
      <ProductDetail product={sample} currencySymbol="$" catalog={[sample]} />,
    );
    expect(screen.queryByRole("heading", { name: "Productos relacionados" })).toBeNull();
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });

  it("rerender con catalog nuevo → el bloque cambia (datos por prop)", () => {
    const first = [sample, mk("a", { name: "Pieza A" })];
    const { rerender, container } = render(
      <ProductDetail product={sample} currencySymbol="$" catalog={first} />,
    );
    expect(screen.getByRole("heading", { name: "Pieza A" })).toBeTruthy();

    const second = [sample, mk("b", { name: "Pieza B" })];
    rerender(<ProductDetail product={sample} currencySymbol="$" catalog={second} />);
    expect(screen.queryByRole("heading", { name: "Pieza A" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Pieza B" })).toBeTruthy();
    expect(container.querySelectorAll("article")).toHaveLength(1);
  });
});
