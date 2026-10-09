# Cross-template diff — registry baseline vs fleet skins

Source of truth for what this kit unifies vs what stays in `guaso-template-*` (#3065).

| Área | Unificado en registry | Queda skin (#3065 / templates) |
|------|----------------------|--------------------------------|
| `registry.ts` | byte-idéntico lookup + unknown→undefined (8 tipos) | — |
| `types.ts` / fields | = `_CANONICAL_BLOCKS` + `safeHref` | comentarios locales |
| `BlockZone` | filter enabled + ignore unknown; `isOwner` prop (no `draftMode`) | import `Block` desde `@/lib/products` (store) vs content; draftMode wrapper |
| RichSection | title/body/cta/align/image + `image_side` left\|right (default right) + `mode` split\|centrado\|checklist (default split) + empty guard | TitleWithAccent, hairline, eyebrow, radii/sombras por vertical. ⛔ layout split/order hardcoded |
| Gallery | title/images (url/alt/caption) + `columns` 2\|3\|4 (default 3) + `style` grilla\|masonry\|carrusel (default grilla) + empty/filter sin url | marcos dobles, next/image, eyebrows “Galería”. ⛔ masonry CSS `columns-*` hardcoded |
| Cards | title/subtitle/cards + `columns`/`style` WS1 + safeHref links + empty | hairline “Servicios”, índices 01/02, next/link, grid px |
| Testimonials | title/items (quote/author/role) + `layout`/`rating` WS1 + empty/filter útiles | hairline “Lo que dicen”, comillas decorativas, divide-y |
| CTA | headline/subtext/button + `style` banda\|foto\|split (default banda) + `align` left\|center\|right (default center) + safeHref `button_url`/`image_url` + empty (unión clinic/store). `foto` sin URL pinta `banda`; `split` sin URL deja panel `bg-card` | mesh-hero, grain, orbs, Smile/lucide, bg treatments. ⛔ reimplementar banda/foto/split × template |
| FAQ (#3867) | title + questions[{question, answer}] + acordeón (`details`, un ítem abierto) + empty (público null, dueño placeholder) | ritmo, cromo, tipografía. ⛔ otro mecanismo de abrir/cerrar |
| Stats (#3867) | title + intro + metrics[{value, label}] + `value` vacío omite la cifra + empty | escala tipográfica, columnas. ⛔ pintar un cero inventado |
| Steps (#3867) | title + intro + steps[{heading, text}] + lista ordenada + empty | timeline, índices, conectores. ⛔ lista sin orden |
| Grilla (#4304) | contenedor de un nivel: `columnas` 1–4 + `espacio` chico\|medio\|grande + `envolver` si\|no + `alineacion_horizontal`/`alineacion_vertical` + `altura_igual` + `orden_mobile` normal\|invertido + `proporcion` por hijo (presets resueltos por backend); hijos = BlockZone sin CTA ni anidadas; mobile apila (sin breakpoints extra) | gap/padding de sección, ancho máximo, tokens. ⛔ recalcular presets en la skin; ⛔ breakpoints por prop |
| Gondola (#3812) | `Product` + getter `products/products` (Drizzle/`unstable_cache`) + `ProductCard` / `StoreCatalog` / `ProductDetail` | chrome home (`catalogTitle`/`emptyState`/headings), `getBranding`, cart/checkout/`AddToCartButton`, `formatPrice`/`discountPercent` del host, `TitleWithAccent`/grain |

## Aesthetic tokens (intersección)

Allowed utility tokens only: `text-foreground`, `text-primary`, `bg-primary`, `font-heading`, `border-border`, `bg-card`, `text-muted-foreground`, `text-primary-foreground`.

⛔ `TitleWithAccent`, `grain-overlay`, `mesh-hero`, `hairline`, orbs, hex literals, hardcoded eyebrow (“Sobre nosotros” / “Galería” / “Servicios”), lucide, store/clinic-only looks.
