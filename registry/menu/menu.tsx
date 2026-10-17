import type { MenuCategory, MenuData, MenuItem } from "../block-zone/types";
import { SECTION_ROOT_CLASS, filled, sectionHeadingClass } from "../block-zone/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MenuProps = {
  data: MenuData;
  isOwner?: boolean;
};

type ValidItem = { name: string; price: string };
type ValidCategory = { name: string; items: ValidItem[] };

// Ítem válido = tiene nombre o precio. Categoría válida = tiene nombre y al menos un ítem válido
// (un tab sin rótulo o vacío no se muestra). Entradas que no son objeto se descartan sin romper el render.
function validCategories(data: MenuData): ValidCategory[] {
  const raw: unknown[] = Array.isArray(data.categories) ? data.categories : [];
  return raw.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const category = entry as MenuCategory;
    const rawItems: unknown[] = Array.isArray(category.items) ? category.items : [];
    const items = rawItems.flatMap((candidate) => {
      if (typeof candidate !== "object" || candidate === null) return [];
      const item = candidate as MenuItem;
      const name = filled(item.name);
      const price = filled(item.price);
      return name !== "" || price !== "" ? [{ name, price }] : [];
    });
    const name = filled(category.name);
    return name !== "" && items.length > 0 ? [{ name, items }] : [];
  });
}

function MenuPlaceholder() {
  return (
    <section aria-label="Menú" className={SECTION_ROOT_CLASS}>
      <div className="rounded-[var(--block-radius-redondeado,0.5rem)] border border-border bg-card px-8 py-12 text-center">
        <p className="font-heading text-sm text-muted-foreground">
          Menú — agregá las categorías y los platos por chat
        </p>
      </div>
    </section>
  );
}

export default function Menu({ data, isOwner = false }: MenuProps) {
  const categories = validCategories(data);

  if (categories.length === 0 && !filled(data.title)) {
    return isOwner ? <MenuPlaceholder /> : null;
  }

  return (
    <section aria-label={filled(data.title) || "Menú"} className={SECTION_ROOT_CLASS}>
      {filled(data.title) ? (
        <h2 className={sectionHeadingClass({})}>{data.title}</h2>
      ) : null}
      {categories.length > 0 ? (
        <Tabs defaultValue="cat-0" className="mt-10">
          <TabsList className="h-auto flex-wrap">
            {categories.map((category, i) => (
              <TabsTrigger key={i} value={`cat-${i}`}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category, i) => (
            <TabsContent key={i} value={`cat-${i}`} className="mt-6">
              <ul className="flex flex-col divide-y divide-border">
                {category.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex min-w-0 items-baseline justify-between gap-4 py-4"
                  >
                    {item.name ? (
                      <span className="font-heading text-lg font-semibold text-foreground">
                        {item.name}
                      </span>
                    ) : null}
                    {item.price ? (
                      <span className="shrink-0 font-heading text-lg font-semibold text-foreground tabular-nums">
                        {item.price}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </section>
  );
}
