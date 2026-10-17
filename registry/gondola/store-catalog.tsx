import { BLOCK_RADIUS_BUTTON_CLASS } from "../block-zone/types";
import { ProductCard } from "./product-card";
import {
  applyCatalogFilters,
  catalogFilterHref,
  categoriesOf,
  isSameCategory,
  type CatalogFilters,
  type Product,
} from "./types";

type StoreCatalogProps = {
  products: Product[];
  currencySymbol: string;
  /** Filtros activos (el host pasa `parseCatalogFilters(searchParams)`). Opcional: sin él, lista todo. #4268 #4269 */
  filters?: CatalogFilters;
};

const INPUT_CLASS =
  "rounded-[var(--block-radius-suave,0.375rem)] border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground";

export function StoreCatalog({ products, currencySymbol, filters = {} }: StoreCatalogProps) {
  if (products.length === 0) {
    return null;
  }

  const term = (filters.query ?? "").trim();
  const visible = applyCatalogFilters(products, filters);
  const categories = categoriesOf(products);
  const hasOtherFilters =
    Boolean(filters.category) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    Boolean(filters.onlyAvailable);

  return (
    <div className="flex flex-col gap-6">
      {/* Sin JS: method="get" → ?q=&categoria=&precio_min=&precio_max=&disponible=1. Varios campos → botón Aplicar (el Enter no alcanza). */}
      <form role="search" method="get" className="flex flex-col gap-3">
        <input
          type="search"
          name="q"
          defaultValue={filters.query}
          placeholder="Buscá por nombre o etiqueta"
          aria-label="Buscar en la tienda"
          className={`w-full ${INPUT_CLASS}`}
        />
        {filters.category ? <input type="hidden" name="categoria" value={filters.category} /> : null}
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-foreground">
            Precio mínimo
            <input type="number" name="precio_min" min="0" defaultValue={filters.minPrice} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground">
            Precio máximo
            <input type="number" name="precio_max" min="0" defaultValue={filters.maxPrice} className={INPUT_CLASS} />
          </label>
          <label className="flex items-center gap-2 py-2 text-sm text-foreground">
            <input type="checkbox" name="disponible" value="1" defaultChecked={filters.onlyAvailable} />
            Solo disponibles
          </label>
          <button
            type="submit"
            className={`bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ${BLOCK_RADIUS_BUTTON_CLASS}`}
          >
            Aplicar
          </button>
        </div>
      </form>
      <nav aria-label="Categorías">
        <ul className="flex flex-wrap gap-2">
          <li>
            <a
              href={catalogFilterHref(filters, { category: undefined })}
              aria-current={filters.category ? undefined : "page"}
              className="inline-block rounded-full border border-border px-3 py-1 text-sm text-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
            >
              Todas
            </a>
          </li>
          {categories.map((category) => {
            const active = filters.category ? isSameCategory(category, filters.category) : false;
            return (
              <li key={category}>
                <a
                  href={catalogFilterHref(filters, { category })}
                  aria-current={active ? "page" : undefined}
                  className="inline-block rounded-full border border-border px-3 py-1 text-sm text-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
                >
                  {category}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      {visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[var(--block-radius-redondeado,0.5rem)] border border-border bg-card p-6">
          {term ? (
            <>
              <p className="text-foreground">
                No encontramos piezas para “{term}”. Probá con otra palabra o mirá todo el catálogo.
              </p>
              <a href="?" className="text-sm font-medium text-primary underline underline-offset-4">
                Ver todo
              </a>
            </>
          ) : (
            <p className="text-foreground">
              {hasOtherFilters
                ? "No hay piezas con esos filtros. Mirá todo el catálogo."
                : "No hay piezas para mostrar."}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      )}
    </div>
  );
}
