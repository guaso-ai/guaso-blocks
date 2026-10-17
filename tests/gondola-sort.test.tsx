import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { StoreCatalog } from "../registry/gondola/store-catalog";
import {
  applyCatalogFilters,
  catalogFilterHref,
  parseCatalogFilters,
  type CatalogFilters,
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

const base = {
  description: "",
  images: [],
  tags: [] as string[],
  featured: false,
  quantity: 1,
  inStock: true,
};

// Orden del array: bote, arbol, zeta, cuenco (cuenco y arbol empatan en precio).
const bote: Product = { ...base, slug: "bote", name: "Bote", price: 300, category: "Obra" };
const arbol: Product = { ...base, slug: "arbol", name: "Árbol", price: 100, category: "Obra" };
const zeta: Product = { ...base, slug: "zeta", name: "Zeta", price: 200, category: "Mar" };
const cuenco: Product = { ...base, slug: "cuenco", name: "Cuenco", price: 100, category: "Mar" };

const catalog = [bote, arbol, zeta, cuenco];

const slugs = (products: Product[]) => products.map((p) => p.slug);

afterEach(() => {
  cleanup();
});

describe("applyCatalogFilters con orden (#4270)", () => {
  it("sin orden o novedades mantiene el orden del array del host", () => {
    expect(slugs(applyCatalogFilters(catalog, {}))).toEqual(["bote", "arbol", "zeta", "cuenco"]);
    expect(slugs(applyCatalogFilters(catalog, { orden: "novedades" }))).toEqual([
      "bote",
      "arbol",
      "zeta",
      "cuenco",
    ]);
  });

  it("precio_asc ordena por precio y conserva el orden del array en empates", () => {
    expect(slugs(applyCatalogFilters(catalog, { orden: "precio_asc" }))).toEqual([
      "arbol",
      "cuenco",
      "zeta",
      "bote",
    ]);
  });

  it("precio_desc ordena por precio descendente y conserva el orden del array en empates", () => {
    expect(slugs(applyCatalogFilters(catalog, { orden: "precio_desc" }))).toEqual([
      "bote",
      "zeta",
      "arbol",
      "cuenco",
    ]);
  });

  it("nombre ordena con locale es-AR: Árbol va antes que Bote y Zeta al final", () => {
    expect(slugs(applyCatalogFilters(catalog, { orden: "nombre" }))).toEqual([
      "arbol",
      "bote",
      "cuenco",
      "zeta",
    ]);
  });

  it("no muta el array de entrada", () => {
    const input = [...catalog];
    const before = slugs(input);
    applyCatalogFilters(input, { orden: "precio_desc" });
    applyCatalogFilters(input, { orden: "nombre" });
    expect(slugs(input)).toEqual(before);
  });

  it("el orden se aplica después de filtrar: combina con categoría, precio y disponible", () => {
    const stock = [
      { ...bote, inStock: true },
      { ...arbol, inStock: false },
      { ...zeta, inStock: true },
      { ...cuenco, inStock: true, price: 150, category: "Obra" },
    ];
    const filters: CatalogFilters = {
      category: "Obra",
      onlyAvailable: true,
      orden: "precio_desc",
    };
    // arbol fuera por disponible; quedan bote (300) y cuenco (150, categoría Obra)
    expect(slugs(applyCatalogFilters(stock, filters))).toEqual(["bote", "cuenco"]);
    expect(slugs(applyCatalogFilters(stock, { minPrice: 150, orden: "nombre" }))).toEqual([
      "bote",
      "cuenco",
      "zeta",
    ]);
  });

  it("combina orden con query: el orden aplica sobre los resultados de la búsqueda", () => {
    // "o" matchea Bote, Árbol y Cuenco; Zeta queda fuera antes de ordenar.
    expect(slugs(applyCatalogFilters(catalog, { query: "o", orden: "precio_asc" }))).toEqual([
      "arbol",
      "cuenco",
      "bote",
    ]);
  });

  it("precio_min > precio_max sigue devolviendo [] aunque haya orden", () => {
    expect(
      applyCatalogFilters(catalog, { minPrice: 500, maxPrice: 100, orden: "nombre" }),
    ).toEqual([]);
  });
});

describe("parseCatalogFilters con orden (#4270)", () => {
  it("acepta los cuatro valores fijos", () => {
    expect(parseCatalogFilters({ orden: "novedades" }).orden).toBe("novedades");
    expect(parseCatalogFilters({ orden: "precio_asc" }).orden).toBe("precio_asc");
    expect(parseCatalogFilters({ orden: "precio_desc" }).orden).toBe("precio_desc");
    expect(parseCatalogFilters({ orden: "nombre" }).orden).toBe("nombre");
  });

  it("valor desconocido, mayúsculas o vacío → sin orden explícito (undefined)", () => {
    expect(parseCatalogFilters({ orden: "foo" }).orden).toBeUndefined();
    expect(parseCatalogFilters({ orden: "NOMBRE" }).orden).toBeUndefined();
    expect(parseCatalogFilters({ orden: "" }).orden).toBeUndefined();
    expect(parseCatalogFilters({}).orden).toBeUndefined();
  });

  it("hace trim antes de comparar", () => {
    expect(parseCatalogFilters({ orden: "  nombre  " }).orden).toBe("nombre");
  });

  it("parámetro repetido toma el primer valor", () => {
    expect(parseCatalogFilters({ orden: ["nombre", "precio_asc"] }).orden).toBe("nombre");
  });
});

describe("catalogFilterHref con orden (#4270)", () => {
  it("escribe orden al final, después de los filtros previos", () => {
    expect(catalogFilterHref({ orden: "precio_asc", query: "x" })).toBe("?q=x&orden=precio_asc");
    expect(
      catalogFilterHref({ orden: "nombre", onlyAvailable: true, category: "Obra", query: "x" }),
    ).toBe("?q=x&categoria=Obra&disponible=1&orden=nombre");
  });

  it("sin orden no escribe la clave", () => {
    expect(catalogFilterHref({ query: "x" })).toBe("?q=x");
    expect(catalogFilterHref({})).toBe("?");
  });

  it("override con undefined quita el orden", () => {
    expect(catalogFilterHref({ orden: "nombre" }, { orden: undefined })).toBe("?");
  });

  it("roundtrip href → parse conserva el orden junto a los demás filtros", () => {
    const filters: CatalogFilters = {
      query: "remera azul",
      category: "Ropa",
      maxPrice: 300,
      onlyAvailable: true,
      orden: "precio_desc",
    };
    const href = catalogFilterHref(filters);
    const params = Object.fromEntries(new URLSearchParams(href.slice(1)));
    expect(parseCatalogFilters(params)).toEqual(filters);
  });
});

describe("StoreCatalog con orden (#4270)", () => {
  const selectOf = (container: HTMLElement) =>
    container.querySelector('select[name="orden"]') as HTMLSelectElement | null;

  it("renderiza el select con las cuatro opciones fijas y el texto visible en español", () => {
    const { container } = render(<StoreCatalog products={catalog} currencySymbol="$" />);
    const select = selectOf(container);
    expect(select).not.toBeNull();
    expect(Array.from(select!.options).map((o) => o.value)).toEqual([
      "novedades",
      "precio_asc",
      "precio_desc",
      "nombre",
    ]);
    expect(Array.from(select!.options).map((o) => o.textContent)).toEqual([
      "Novedades",
      "Precio: menor a mayor",
      "Precio: mayor a menor",
      "Nombre (A-Z)",
    ]);
    expect(select!.closest("label")?.textContent).toContain("Ordenar por");
  });

  it("sin orden en la URL, el select arranca en novedades", () => {
    const { container } = render(<StoreCatalog products={catalog} currencySymbol="$" />);
    expect(selectOf(container)!.value).toBe("novedades");
  });

  it("refleja el orden de la URL en el select", () => {
    const { container } = render(
      <StoreCatalog products={catalog} currencySymbol="$" filters={{ orden: "precio_desc" }} />,
    );
    expect(selectOf(container)!.value).toBe("precio_desc");
  });

  it("la grilla sale en el orden elegido", () => {
    const { container } = render(
      <StoreCatalog products={catalog} currencySymbol="$" filters={{ orden: "precio_asc" }} />,
    );
    const names = Array.from(container.querySelectorAll("article h3")).map((h) => h.textContent);
    expect(names).toEqual(["Árbol", "Cuenco", "Zeta", "Bote"]);
  });

  it("los links de 'Todas' y de categoría conservan el orden", () => {
    const { container } = render(
      <StoreCatalog
        products={catalog}
        currencySymbol="$"
        filters={{ query: "x", orden: "nombre" }}
      />,
    );
    const links = Array.from(container.querySelectorAll("nav a")) as HTMLAnchorElement[];
    const todas = links.find((a) => a.textContent === "Todas");
    const obra = links.find((a) => a.textContent === "Obra");
    expect(todas?.getAttribute("href")).toBe("?q=x&orden=nombre");
    expect(obra?.getAttribute("href")).toBe("?q=x&categoria=Obra&orden=nombre");
  });
});
