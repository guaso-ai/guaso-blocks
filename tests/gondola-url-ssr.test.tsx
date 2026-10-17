import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

const dir = dirname(fileURLToPath(import.meta.url));

/** Igual que Next: parámetro repetido → string[]; único → string. */
function paramsFrom(search: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    const prev = out[key];
    out[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

/** HTML de servidor del listado (sin render ni efectos). */
const ssr = (products: Product[], filters?: CatalogFilters) =>
  renderToStaticMarkup(<StoreCatalog products={products} currencySymbol="$" filters={filters} />);

const articleNames = (html: string) =>
  Array.from(html.matchAll(/<article[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g), (m) => m[1]);

const inputOf = (html: string, name: string) =>
  html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] ?? "";

const linkOf = (html: string, text: string) =>
  html.match(new RegExp(`<a [^>]*>${text}</a>`))?.[0] ?? "";

describe("StoreCatalog SSR desde URL (#4271)", () => {
  it("la URL parseada llega al HTML de servidor: grilla, campos y links activos", () => {
    const filters = parseCatalogFilters(
      paramsFrom("q=a&categoria=Obra&precio_max=150&disponible=1&orden=precio_desc"),
    );
    const html = ssr(catalog, filters);

    expect(html.match(/<article/g)).toHaveLength(1);
    expect(articleNames(html)).toEqual(["Óxido"]);
    expect(inputOf(html, "q")).toContain('value="a"');
    expect(inputOf(html, "categoria")).toContain('value="Obra"');
    expect(inputOf(html, "precio_max")).toContain('value="150"');
    expect(inputOf(html, "disponible")).toContain('checked=""');
    expect(html).toMatch(/<option value="precio_desc"[^>]*selected=""/);
    expect(html.match(/selected=""/g)).toHaveLength(1);
    expect(linkOf(html, "Obra")).toContain('aria-current="page"');
    expect(linkOf(html, "Todas")).toContain("href=");
    expect(linkOf(html, "Todas")).not.toContain("aria-current");
  });

  it("el orden de la URL reordena las tarjetas en el HTML de servidor", () => {
    const filters = parseCatalogFilters(paramsFrom("orden=precio_desc"));
    const html = ssr(catalog, filters);

    expect(articleNames(html)).toEqual(["Remera azul", "Mar en calma", "Óxido", "Taza"]);
    expect(articleNames(html)).toEqual(applyCatalogFilters(catalog, filters).map((p) => p.name));
  });
});

describe("URL compartida produce la misma vista (#4271)", () => {
  const estados: Array<[string, CatalogFilters]> = [
    ["vacío", { onlyAvailable: false }],
    ["solo q", { query: "taza", onlyAvailable: false }],
    ["solo categoría", { category: "Ropa", onlyAvailable: false }],
    ["precio mínimo en 0", { minPrice: 0, onlyAvailable: false }],
    ["solo precio máximo", { maxPrice: 250, onlyAvailable: false }],
    ["solo disponibles", { onlyAvailable: true }],
    ["solo orden", { orden: "nombre", onlyAvailable: false }],
    [
      "combinación completa",
      {
        query: "a",
        category: "Ropa",
        minPrice: 50,
        maxPrice: 500,
        onlyAvailable: true,
        orden: "precio_asc",
      },
    ],
  ];

  it.each(estados)("estado %s: href → URL → parse → mismo HTML que el original", (_, filters) => {
    const href = catalogFilterHref(filters);
    const parsed = parseCatalogFilters(paramsFrom(href.slice(1)));

    expect(parsed).toEqual(filters);
    const html = ssr(catalog, parsed);
    expect(html).toBe(ssr(catalog, filters));
    expect(articleNames(html)).toEqual(applyCatalogFilters(catalog, filters).map((p) => p.name));
  });
});

describe("URL con valores inválidos = vista por defecto (#4271)", () => {
  it("parámetros inválidos renderizan igual que StoreCatalog sin filters", () => {
    const parsed = parseCatalogFilters(
      paramsFrom("q=%20%20&precio_min=-5&precio_max=abc&orden=zzz&disponible=0"),
    );
    const html = ssr(catalog, parsed);

    expect(articleNames(html)).toHaveLength(catalog.length);
    expect(html).toBe(ssr(catalog));
  });

  it("parámetro repetido en la URL toma el primer valor en el HTML de servidor", () => {
    const parsed = parseCatalogFilters(paramsFrom("q=a&q=b"));
    expect(ssr(catalog, parsed)).toBe(ssr(catalog, { query: "a" }));
  });
});

describe("el árbol del listado no tiene estado de cliente (#4271)", () => {
  // store-catalog.tsx ya tiene esta guarda en tests/gondola-filters.test.tsx; acá cubrimos el resto del árbol.
  it.each(["product-card.tsx", "types.ts"])("registry/gondola/%s no usa client ni hooks de estado o URL", (file) => {
    const src = readFileSync(join(dir, "../registry/gondola", file), "utf8");
    expect(src).not.toContain("use client");
    expect(src).not.toMatch(/\buse(State|Effect|Reducer|Router|SearchParams|Pathname)\b|window\.location/);
  });
});
