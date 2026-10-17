import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StoreCatalog } from "../registry/gondola/store-catalog";
import {
  applyCatalogFilters,
  catalogFilterHref,
  categoriesOf,
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
};

const oxido: Product = {
  ...base,
  slug: "oxido",
  name: "Óxido",
  price: 100,
  quantity: 2,
  category: "Obra",
  tags: ["Palermo"],
  inStock: true,
};

const mar: Product = {
  ...base,
  slug: "mar",
  name: "Mar en calma",
  price: 200,
  quantity: 0,
  category: "Mar",
  tags: ["Costa"],
  inStock: false,
};

const taza: Product = {
  ...base,
  slug: "taza",
  name: "Taza",
  price: 50,
  quantity: 1,
  category: "Cerámica",
  inStock: true,
};

const remera: Product = {
  ...base,
  slug: "remera",
  name: "Remera azul",
  price: 300,
  quantity: 5,
  category: "Ropa",
  inStock: true,
};

const catalog = [oxido, mar, taza, remera];

const slugs = (products: Product[]) => products.map((p) => p.slug);

afterEach(() => {
  cleanup();
});

describe("parseCatalogFilters (#4269)", () => {
  it("precio negativo, no numérico o vacío se ignora (sin filtro)", () => {
    const parsed = parseCatalogFilters({ precio_min: "-1", precio_max: "abc" });
    expect(parsed.minPrice).toBeUndefined();
    expect(parsed.maxPrice).toBeUndefined();
    expect(parseCatalogFilters({ precio_min: "  " }).minPrice).toBeUndefined();
  });

  it("precio válido (incluido 0) se parsea como número", () => {
    expect(parseCatalogFilters({ precio_min: "0" }).minPrice).toBe(0);
    expect(parseCatalogFilters({ precio_max: "1500.5" }).maxPrice).toBe(1500.5);
  });

  it("disponible distinto de \"1\" = false", () => {
    expect(parseCatalogFilters({ disponible: "1" }).onlyAvailable).toBe(true);
    expect(parseCatalogFilters({ disponible: "0" }).onlyAvailable).toBe(false);
    expect(parseCatalogFilters({ disponible: "true" }).onlyAvailable).toBe(false);
    expect(parseCatalogFilters({}).onlyAvailable).toBe(false);
  });

  it("parámetro repetido (array) toma el primer valor", () => {
    expect(parseCatalogFilters({ categoria: ["Obra", "Mar"] }).category).toBe("Obra");
    expect(parseCatalogFilters({ q: [" x ", "y"] }).query).toBe("x");
  });

  it("q con trim vacío = sin filtro", () => {
    expect(parseCatalogFilters({ q: "   " }).query).toBeUndefined();
    expect(parseCatalogFilters({ q: "" }).query).toBeUndefined();
  });
});

describe("applyCatalogFilters (#4269)", () => {
  it("categoría: match exacto, sin tildes ni mayúsculas", () => {
    expect(slugs(applyCatalogFilters(catalog, { category: "obra" }))).toEqual(["oxido"]);
    expect(slugs(applyCatalogFilters(catalog, { category: "CERAMICA" }))).toEqual(["taza"]);
    // match exacto: un prefijo no alcanza
    expect(applyCatalogFilters(catalog, { category: "Obr" })).toEqual([]);
  });

  it("rango de precio inclusivo sobre price", () => {
    expect(
      slugs(applyCatalogFilters(catalog, { minPrice: 100, maxPrice: 200 })),
    ).toEqual(["oxido", "mar"]);
  });

  it("precio_min > precio_max → lista vacía (no se corrige)", () => {
    expect(applyCatalogFilters(catalog, { minPrice: 200, maxPrice: 100 })).toEqual([]);
  });

  it("disponible filtra por inStock (no por quantity)", () => {
    expect(slugs(applyCatalogFilters(catalog, { onlyAvailable: true }))).toEqual([
      "oxido",
      "taza",
      "remera",
    ]);
    // quantity 0 con inStock true se queda: la decisión es el campo derivado inStock
    const preorder = { ...mar, inStock: true, quantity: 0 };
    expect(slugs(applyCatalogFilters([preorder], { onlyAvailable: true }))).toEqual(["mar"]);
  });

  it("los cinco filtros combinan en AND", () => {
    const filters: CatalogFilters = {
      query: "ox",
      category: "Obra",
      minPrice: 50,
      maxPrice: 150,
      onlyAvailable: true,
    };
    expect(slugs(applyCatalogFilters(catalog, filters))).toEqual(["oxido"]);
    expect(applyCatalogFilters(catalog, { ...filters, maxPrice: 99 })).toEqual([]);
    expect(applyCatalogFilters(catalog, { ...filters, category: "Mar" })).toEqual([]);
  });
});

describe("categoriesOf (#4269)", () => {
  it("únicas, sin vacías, orden es-AR (no codepoint)", () => {
    const products = [
      { ...taza, category: "Zeta" },
      { ...taza, slug: "a", category: "Árbol" },
      { ...taza, slug: "b", category: "Cerámica" },
      { ...taza, slug: "c", category: "   " },
      { ...taza, slug: "d", category: "" },
      { ...taza, slug: "e", category: "Zeta" },
    ];
    expect(categoriesOf(products)).toEqual(["Árbol", "Cerámica", "Zeta"]);
  });

  it("no duplica por tildes o mayúsculas distintas", () => {
    const products = [
      { ...taza, category: "Obra" },
      { ...taza, slug: "b", category: "obra" },
    ];
    expect(categoriesOf(products)).toEqual(["Obra"]);
  });
});

describe("catalogFilterHref (#4269)", () => {
  it("orden fijo: q, categoria, precio_min, precio_max, disponible", () => {
    const href = catalogFilterHref({
      onlyAvailable: true,
      maxPrice: 500,
      category: "Obra",
      minPrice: 10,
      query: "oxido",
    });
    expect(href).toBe("?q=oxido&categoria=Obra&precio_min=10&precio_max=500&disponible=1");
  });

  it("categoría vacía no aparece; sin filtros → \"?\"", () => {
    expect(catalogFilterHref({ category: "" })).toBe("?");
    expect(catalogFilterHref({})).toBe("?");
  });

  it("overrides reemplaza un campo y conserva los demás", () => {
    expect(
      catalogFilterHref({ query: "x", minPrice: 5 }, { category: "Obra" }),
    ).toBe("?q=x&categoria=Obra&precio_min=5");
  });

  it("override con undefined quita el campo", () => {
    expect(
      catalogFilterHref({ query: "x", category: "Obra" }, { category: undefined }),
    ).toBe("?q=x");
  });

  it("el href se parsea de vuelta a los mismos filtros", () => {
    const filters: CatalogFilters = { query: "remera azul", category: "Ropa", maxPrice: 300, onlyAvailable: true };
    const href = catalogFilterHref(filters);
    const params = Object.fromEntries(new URLSearchParams(href.slice(1)));
    expect(parseCatalogFilters(params)).toEqual(filters);
  });
});

describe("StoreCatalog con filtros (#4269)", () => {
  it("link de categoría activo lleva aria-current=\"page\"", () => {
    render(<StoreCatalog products={catalog} currencySymbol="$" filters={{ category: "Obra" }} />);
    const nav = screen.getByRole("navigation", { name: "Categorías" });
    expect(within(nav).getByRole("link", { name: "Obra" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Mar" }).getAttribute("aria-current")).toBeNull();
    expect(within(nav).getByRole("link", { name: "Todas" }).getAttribute("aria-current")).toBeNull();
  });

  it("estado vacío con otros filtros: copy propio y sin \"Ver todo\"", () => {
    render(
      <StoreCatalog products={[oxido, mar]} currencySymbol="$" filters={{ minPrice: 1000 }} />,
    );
    expect(screen.getByText("No hay piezas con esos filtros. Mirá todo el catálogo.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Ver todo" })).toBeNull();
  });

  it("estado vacío con query conserva el copy y \"Ver todo\" de #4268", () => {
    render(
      <StoreCatalog
        products={catalog}
        currencySymbol="$"
        filters={{ query: "zzzz", category: "Obra" }}
      />,
    );
    expect(screen.getByText(/No encontramos piezas para “zzzz”/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver todo" }).getAttribute("href")).toBe("?");
  });

  it("combinación en una render: categoría + disponible + precio + query (sin use client)", () => {
    const filters: CatalogFilters = {
      query: "ox",
      category: "Obra",
      minPrice: 50,
      maxPrice: 150,
      onlyAvailable: true,
    };
    const { container } = render(
      <StoreCatalog products={catalog} currencySymbol="$" filters={filters} />,
    );

    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(screen.getByText("Óxido")).toBeTruthy();

    const hidden = container.querySelector('input[name="categoria"]') as HTMLInputElement | null;
    expect(hidden?.value).toBe("Obra");
    const min = container.querySelector('input[name="precio_min"]') as HTMLInputElement | null;
    expect(min?.defaultValue).toBe("50");
    const available = container.querySelector('input[name="disponible"]') as HTMLInputElement | null;
    expect(available?.checked).toBe(true);

    const nav = screen.getByRole("navigation", { name: "Categorías" });
    expect(within(nav).getByRole("link", { name: "Mar" }).getAttribute("href")).toBe(
      "?q=ox&categoria=Mar&precio_min=50&precio_max=150&disponible=1",
    );
    expect(within(nav).getByRole("link", { name: "Todas" }).getAttribute("href")).toBe(
      "?q=ox&precio_min=50&precio_max=150&disponible=1",
    );

    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../registry/gondola/store-catalog.tsx"),
      "utf8",
    );
    expect(src).not.toContain("use client");
    expect(src).not.toMatch(/useState|useEffect/);
  });
});
