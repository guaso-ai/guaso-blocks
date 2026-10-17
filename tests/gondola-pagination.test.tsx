import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreCatalog } from "../registry/gondola/store-catalog";
import {
  applyCatalogFilters,
  CATALOG_PAGE_SIZE,
  catalogFilterHref,
  paginateProducts,
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

/** 30 piezas: "Pieza 01".."Pieza 30", precio i*10 (el orden de precio es inverso al de la lista). */
const catalog: Product[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  return {
    ...base,
    slug: `pieza-${n}`,
    name: `Pieza ${String(n).padStart(2, "0")}`,
    price: n * 10,
    quantity: 1,
    category: "Obra",
    inStock: true,
  };
});

/** Igual que Next: parámetro repetido → string[]; único → string. */
function paramsFrom(search: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    const prev = out[key];
    out[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

const ssr = (products: Product[], filters?: CatalogFilters) =>
  renderToStaticMarkup(<StoreCatalog products={products} currencySymbol="$" filters={filters} />);

const articleNames = (html: string) =>
  Array.from(html.matchAll(/<article[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g), (m) => m[1]);

const linkOf = (html: string, text: string) =>
  html.match(new RegExp(`<a [^>]*>${text}</a>`))?.[0] ?? "";

const paginationNav = (html: string) =>
  html.match(/<nav aria-label="Paginación"[\s\S]*?<\/nav>/)?.[0] ?? "";

const pageRange = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `Pieza ${String(from + i).padStart(2, "0")}`);

describe("parseo de ?pagina (#4272)", () => {
  it("pagina=2 → 2; trim aplicado; repetido toma el primer valor", () => {
    expect(parseCatalogFilters(paramsFrom("pagina=2")).pagina).toBe(2);
    expect(parseCatalogFilters(paramsFrom("pagina=%20%203%20")).pagina).toBe(3);
    expect(parseCatalogFilters(paramsFrom("pagina=4&pagina=2")).pagina).toBe(4);
  });

  it.each(["1", "0", "-1", "2.5", "abc", "", "NaN"])("pagina=%s se omite (página 1)", (value) => {
    expect(parseCatalogFilters({ pagina: value })).not.toHaveProperty("pagina");
  });
});

describe("paginateProducts (#4272)", () => {
  it("30 piezas → 3 páginas de 12/12/6", () => {
    expect(CATALOG_PAGE_SIZE).toBe(12);
    const p1 = paginateProducts(catalog, 1);
    const p2 = paginateProducts(catalog, 2);
    const p3 = paginateProducts(catalog, 3);
    expect(p1.totalPages).toBe(3);
    expect(p1.items.map((p) => p.name)).toEqual(pageRange(1, 12));
    expect(p2.items.map((p) => p.name)).toEqual(pageRange(13, 24));
    expect(p3.items.map((p) => p.name)).toEqual(pageRange(25, 30));
    expect([p1.page, p2.page, p3.page]).toEqual([1, 2, 3]);
  });

  it("undefined → página 1", () => {
    expect(paginateProducts(catalog, undefined).page).toBe(1);
  });

  it("fuera de rango → clamp a la última página", () => {
    const out = paginateProducts(catalog, 99);
    expect(out.page).toBe(3);
    expect(out.items).toHaveLength(6);
  });

  it("0, negativo, decimal y NaN → página 1", () => {
    for (const value of [0, -4, 2.5, Number.NaN]) {
      expect(paginateProducts(catalog, value).page).toBe(1);
    }
  });

  it("lista vacía → una página vacía", () => {
    expect(paginateProducts([], 2)).toEqual({ items: [], page: 1, totalPages: 1 });
  });

  it("12 piezas → 1 página; 13 → 2", () => {
    expect(paginateProducts(catalog.slice(0, 12), undefined).totalPages).toBe(1);
    expect(paginateProducts(catalog.slice(0, 13), undefined).totalPages).toBe(2);
  });

  it("no muta el input", () => {
    const copy = [...catalog];
    paginateProducts(catalog, 2);
    expect(catalog).toEqual(copy);
  });
});

describe("StoreCatalog pagina numerada (#4272)", () => {
  it("página intermedia: muestra 13–24, aria-current solo en «2», «1» sin pagina en el href", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("pagina=2")));
    expect(articleNames(html)).toEqual(pageRange(13, 24));
    expect(html.match(/aria-current="page"/g)).toHaveLength(2); // "Todas" + "2"
    expect(paginationNav(html).match(/aria-current="page"/g)).toHaveLength(1);
    expect(linkOf(paginationNav(html), "2")).toContain('aria-current="page"');
    expect(linkOf(paginationNav(html), "1")).toContain('href="?"');
  });

  it("última página: muestra 6 tarjetas, «3» es la actual, sin páginas siguientes", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("pagina=3")));
    expect(articleNames(html)).toHaveLength(6);
    expect(linkOf(paginationNav(html), "3")).toContain('aria-current="page"');
    expect(paginationNav(html)).not.toContain(">4<");
  });

  it("orden antes de paginar: primera tarjeta de la página 2 = applyCatalogFilters(...)[12]", () => {
    const filters = parseCatalogFilters(paramsFrom("pagina=2&orden=precio_desc"));
    const html = ssr(catalog, filters);
    expect(articleNames(html)[0]).toBe(applyCatalogFilters(catalog, filters)[12]?.name);
  });

  it("pagina fuera de rango renderiza igual que la última página", () => {
    expect(ssr(catalog, parseCatalogFilters(paramsFrom("pagina=99")))).toBe(
      ssr(catalog, parseCatalogFilters(paramsFrom("pagina=3"))),
    );
  });

  it("los links de número conservan los filtros activos", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("q=pieza&pagina=2")));
    expect(linkOf(paginationNav(html), "3")).toContain('href="?q=pieza&amp;pagina=3"');
  });

  it("sin paginación con ≤ 12 piezas (sin <nav> de paginación)", () => {
    const html = ssr(catalog.slice(0, 12), parseCatalogFilters(paramsFrom("pagina=1")));
    expect(paginationNav(html)).toBe("");
    expect(html).not.toContain('aria-label="Paginación"');
  });

  it("filtro sin resultados con pagina=2: sin <nav>, copy de estado vacío con «Ver todo»", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("q=zzz&pagina=2")));
    expect(html).not.toContain('aria-label="Paginación"');
    expect(html).toContain("No encontramos piezas");
    expect(linkOf(html, "Ver todo")).toContain('href="?"');
  });

  it("sin «cargar más» ni «ver más»; la nav solo tiene links", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("pagina=2")));
    expect(html).not.toMatch(/cargar más|ver más/i);
    const nav = paginationNav(html);
    expect(nav).not.toContain("<button");
    expect(nav.match(/<a /g)).toHaveLength(3);
  });

  it("el formulario GET no tiene campo pagina (enviarlo resetea a página 1)", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("pagina=2")));
    expect(html).not.toMatch(/name="pagina"/);
  });

  it("round-trip: filtros con pagina → href → parse → mismo HTML", () => {
    const filters: CatalogFilters = { query: "pieza", onlyAvailable: false, pagina: 2 };
    const parsed = parseCatalogFilters(paramsFrom(catalogFilterHref(filters).slice(1)));
    expect(parsed).toEqual(filters);
    expect(ssr(catalog, parsed)).toBe(ssr(catalog, filters));
  });
});

describe("cambiar filtro, categoría u orden vuelve a página 1 (#4272)", () => {
  it("un override de filtro descarta pagina", () => {
    expect(catalogFilterHref({ pagina: 2, query: "a" }, { category: "Obra" })).toBe(
      "?q=a&categoria=Obra",
    );
  });

  it("pagina explícito en overrides gana", () => {
    expect(catalogFilterHref({ pagina: 2 }, { pagina: 3 })).toBe("?pagina=3");
    expect(catalogFilterHref({ pagina: 2, query: "a" }, { pagina: 3 })).toBe("?q=a&pagina=3");
  });

  it("pagina 1 o inválida no se emite", () => {
    expect(catalogFilterHref({}, { pagina: 1 })).toBe("?");
    expect(catalogFilterHref({}, { pagina: 2.5 })).toBe("?");
  });

  it("links de categoría y «Todas» con página 2 activa no incluyen pagina", () => {
    const html = ssr(catalog, parseCatalogFilters(paramsFrom("pagina=2")));
    expect(linkOf(html, "Todas")).not.toContain("pagina");
    expect(linkOf(html, "Obra")).not.toContain("pagina");
    expect(linkOf(html, "Obra")).toContain('href="?categoria=Obra"');
  });
});
