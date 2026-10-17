import { ProductCard } from "./product-card";
import { filterProducts, type Product } from "./types";
import { BLOCK_RADIUS_BUTTON_CLASS, BLOCK_RADIUS_CLASS } from "../block-zone/types";

type StoreCatalogProps = {
  products: Product[];
  currencySymbol: string;
  /** Término de búsqueda (el host pasa `searchParams.q`). Opcional: sin él, lista todo. #4268 */
  query?: string;
};

export function StoreCatalog({ products, currencySymbol, query }: StoreCatalogProps) {
  if (products.length === 0) {
    return null;
  }

  const term = (query ?? "").trim();
  const visible = filterProducts(products, query);

  return (
    <div className="flex flex-col gap-6">
      {/* Sin botón: el Enter del input alcanza (submit implícito con un solo campo). Sin JS: method="get" → ?q= */}
      <form role="search" method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscá por nombre o etiqueta"
          aria-label="Buscar en la tienda"
          className={`w-full ${BLOCK_RADIUS_BUTTON_CLASS} border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground`}
        />
      </form>
      {visible.length === 0 ? (
        <div className={`flex flex-col items-start gap-3 ${BLOCK_RADIUS_CLASS} border border-border bg-card p-6`}>
          <p className="text-foreground">
            No encontramos piezas para “{term}”. Probá con otra palabra o mirá todo el catálogo.
          </p>
          <a href="?" className="text-sm font-medium text-primary underline underline-offset-4">
            Ver todo
          </a>
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
