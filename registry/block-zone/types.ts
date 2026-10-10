// UI structural types for BlockZone + skins. Backend validates lengths.
// Block + safeHref stay local. Zone-only install must typecheck without
// the content npm package (#3579).

export type Block = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

// ─── Props comunes de layout (#4264; SoT backend `LAYOUT_PROP_*`, #4346 C3) ──
// Espejo de `LAYOUT_PROP_CLOSESETS` / `LAYOUT_PROP_DEFAULTS` / `LAYOUT_ANCHOR_RE`.
// Las 5 son opcionales: ausentes o inválidas → default (sin warning en el kit).
// Defaults = render actual (invariante: sin props, el DOM no cambia).
export type LayoutSurface = "neutro" | "suave" | "oscuro" | "acento";
export type LayoutWidth = "angosto" | "normal" | "completo";
export type LayoutSpacing = "chico" | "medio" | "grande";
export type LayoutVisibility = "todos" | "solo_desktop" | "solo_mobile";

export type LayoutProps = {
  surface?: LayoutSurface | string;
  width?: LayoutWidth | string;
  spacing?: LayoutSpacing | string;
  visibility?: LayoutVisibility | string;
  anchor?: string;
};

export const DEFAULT_LAYOUT_SURFACE: LayoutSurface = "neutro";
export const DEFAULT_LAYOUT_WIDTH: LayoutWidth = "normal";
export const DEFAULT_LAYOUT_SPACING: LayoutSpacing = "medio";
export const DEFAULT_LAYOUT_VISIBILITY: LayoutVisibility = "todos";

const LAYOUT_ANCHOR_RE = /^[a-z][a-z0-9-]{0,39}$/;

export function resolveLayoutSurface(value: unknown): LayoutSurface {
  return value === "neutro" ||
    value === "suave" ||
    value === "oscuro" ||
    value === "acento"
    ? value
    : DEFAULT_LAYOUT_SURFACE;
}

export function resolveLayoutWidth(value: unknown): LayoutWidth {
  return value === "angosto" || value === "normal" || value === "completo"
    ? value
    : DEFAULT_LAYOUT_WIDTH;
}

export function resolveLayoutSpacing(value: unknown): LayoutSpacing {
  return value === "chico" || value === "medio" || value === "grande"
    ? value
    : DEFAULT_LAYOUT_SPACING;
}

export function resolveLayoutVisibility(value: unknown): LayoutVisibility {
  return value === "todos" || value === "solo_desktop" || value === "solo_mobile"
    ? value
    : DEFAULT_LAYOUT_VISIBILITY;
}

/** Ancla slug (`^[a-z][a-z0-9-]{0,39}$`) o "" (sin ancla). Nunca lanza. */
export function resolveLayoutAnchor(value: unknown): string {
  return typeof value === "string" && LAYOUT_ANCHOR_RE.test(value) ? value : "";
}

export type RichSectionData = LayoutProps & {
  title?: string;
  body?: string;
  cta_label?: string;
  cta_url?: string;
  align?: "left" | "center";
  image_url?: string;
  image_side?: RichImageSide | string;
  mode?: RichMode | string;
};

export type CTAData = LayoutProps & {
  headline?: string;
  subtext?: string;
  button_label?: string;
  button_url?: string;
  style?: CtaStyle | string;
  align?: CtaAlign | string;
  image_url?: string;
};

export type GalleryImage = {
  url: string; // runtime/upload; not in repeatable schema (alt/caption only) — same as templates
  alt?: string;
  caption?: string;
};

export type GalleryData = LayoutProps & {
  title?: string;
  images?: GalleryImage[];
  columns?: GalleryColumns | string;
  style?: GalleryStyle | string;
};

export type CardItem = {
  heading?: string;
  text?: string;
  link_label?: string;
  link_url?: string;
};

export type CardsData = LayoutProps & {
  title?: string;
  subtitle?: string;
  cards?: CardItem[];
  columns?: CardsColumns | string;
  style?: CardsStyle | string;
};

export type TestimonialItem = {
  author?: string;
  role?: string;
  quote?: string;
  rating?: string;
};

export type TestimonialsData = LayoutProps & {
  title?: string;
  items?: TestimonialItem[];
  layout?: TestimonialsLayout | string;
};

export type FaqItem = {
  question?: string;
  answer?: string;
};

export type FAQData = LayoutProps & {
  title?: string;
  questions?: FaqItem[];
};

export type StatMetric = {
  value?: string;
  label?: string;
};

export type StatsData = LayoutProps & {
  title?: string;
  intro?: string;
  metrics?: StatMetric[];
};

export type StepItem = {
  heading?: string;
  text?: string;
};

export type StepsData = LayoutProps & {
  title?: string;
  intro?: string;
  steps?: StepItem[];
};

// ─── Variantes de bloque kit-once (#3882 WS1, #3883 WS2, #3884 WS3) ───────────
// Closed-sets declarados UNA vez acá. El backend los espeja en
// `_CANONICAL_BLOCKS` + `_validate_block_variant` (default + logger.warning);
// las skins solo resuelven a defaults (divergencia estética, nunca
// comportamiento). Sin avatar: DIFERIDO al diseño `array_image_fields`.
export type CardsColumns = "2" | "3" | "4";
export type CardsStyle = "grid" | "feature" | "minimal";
export type TestimonialsLayout = "grilla" | "destacado" | "carrusel" | "minimal";
export type GalleryColumns = "2" | "3" | "4";
export type GalleryStyle = "grilla" | "masonry" | "carrusel";
export type RichImageSide = "left" | "right";
export type RichMode = "split" | "centrado" | "checklist";
export type CtaStyle = "banda" | "foto" | "split";
export type CtaAlign = "left" | "center" | "right";

export const DEFAULT_CARDS_COLUMNS: CardsColumns = "3";
export const DEFAULT_CARDS_STYLE: CardsStyle = "grid";
export const DEFAULT_TESTIMONIALS_LAYOUT: TestimonialsLayout = "grilla";
export const DEFAULT_GALLERY_COLUMNS: GalleryColumns = "3";
export const DEFAULT_GALLERY_STYLE: GalleryStyle = "grilla";
export const DEFAULT_RICH_IMAGE_SIDE: RichImageSide = "right";
export const DEFAULT_RICH_MODE: RichMode = "split";
export const DEFAULT_CTA_STYLE: CtaStyle = "banda";
export const DEFAULT_CTA_ALIGN: CtaAlign = "center";

export function resolveCardsColumns(value: unknown): CardsColumns {
  return value === "2" || value === "3" || value === "4"
    ? value
    : DEFAULT_CARDS_COLUMNS;
}

export function resolveCardsStyle(value: unknown): CardsStyle {
  return value === "grid" || value === "feature" || value === "minimal"
    ? value
    : DEFAULT_CARDS_STYLE;
}

export function resolveTestimonialsLayout(value: unknown): TestimonialsLayout {
  return value === "grilla" ||
    value === "destacado" ||
    value === "carrusel" ||
    value === "minimal"
    ? value
    : DEFAULT_TESTIMONIALS_LAYOUT;
}

export function resolveGalleryColumns(value: unknown): GalleryColumns {
  return value === "2" || value === "3" || value === "4"
    ? value
    : DEFAULT_GALLERY_COLUMNS;
}

export function resolveGalleryStyle(value: unknown): GalleryStyle {
  return value === "grilla" || value === "masonry" || value === "carrusel"
    ? value
    : DEFAULT_GALLERY_STYLE;
}

export function resolveRichImageSide(value: unknown): RichImageSide {
  return value === "left" || value === "right" ? value : DEFAULT_RICH_IMAGE_SIDE;
}

export function resolveRichMode(value: unknown): RichMode {
  return value === "split" || value === "centrado" || value === "checklist"
    ? value
    : DEFAULT_RICH_MODE;
}

export function resolveCtaStyle(value: unknown): CtaStyle {
  return value === "banda" || value === "foto" || value === "split"
    ? value
    : DEFAULT_CTA_STYLE;
}

export function resolveCtaAlign(value: unknown): CtaAlign {
  return value === "left" || value === "center" || value === "right"
    ? value
    : DEFAULT_CTA_ALIGN;
}

// ─── Grilla de un nivel (#4304; contrato backend #4309) ──────────────────────
// Espejo de `_BLOCK_VARIANT_CLOSESETS["Grilla"]` / `_BLOCK_VARIANT_DEFAULTS`.
// El kit NO copia la tabla de presets: el backend expande cada preset en
// `columnas` del contenedor y en `proporcion` de cada hijo (`resolve_container_*`).
// `GrillaPreset` es solo el set cerrado de ids (paridad), no proporciones.
export type GrillaColumnas = "1" | "2" | "3" | "4";
export type GrillaEspacio = "chico" | "medio" | "grande";
export type GrillaEnvolver = "si" | "no";
export type GrillaAlineacionHorizontal = "inicio" | "centro" | "fin";
export type GrillaAlineacionVertical = "arriba" | "centrado" | "abajo";
export type GrillaAlturaIgual = "si" | "no";
export type GrillaOrdenMobile = "normal" | "invertido";
export type GrillaProporcion = "1/4" | "1/3" | "1/2" | "2/3" | "3/4" | "igual";
export type GrillaPreset =
  | "mitad_y_mitad"
  | "hero_2_3_1_3"
  | "3_tarjetas"
  | "banda_de_4";

export const DEFAULT_GRILLA_COLUMNAS: GrillaColumnas = "2";
export const DEFAULT_GRILLA_ESPACIO: GrillaEspacio = "medio";
export const DEFAULT_GRILLA_ENVOLVER: GrillaEnvolver = "no";
export const DEFAULT_GRILLA_ALINEACION_HORIZONTAL: GrillaAlineacionHorizontal =
  "inicio";
export const DEFAULT_GRILLA_ALINEACION_VERTICAL: GrillaAlineacionVertical =
  "arriba";
export const DEFAULT_GRILLA_ALTURA_IGUAL: GrillaAlturaIgual = "no";
export const DEFAULT_GRILLA_ORDEN_MOBILE: GrillaOrdenMobile = "normal";
export const DEFAULT_GRILLA_PROPORCION: GrillaProporcion = "igual";

/** Hijo de primer nivel tal como lo guarda el plan (`proporcion` ya resuelta por el backend). */
export type GrillaChild = {
  id?: string;
  type: string;
  data?: Record<string, unknown>;
  proporcion?: string;
};

export type GrillaData = {
  columnas?: GrillaColumnas | string;
  espacio?: GrillaEspacio | string;
  envolver?: GrillaEnvolver | string;
  alineacion_horizontal?: GrillaAlineacionHorizontal | string;
  alineacion_vertical?: GrillaAlineacionVertical | string;
  altura_igual?: GrillaAlturaIgual | string;
  orden_mobile?: GrillaOrdenMobile | string;
  preset?: GrillaPreset | string;
  children?: GrillaChild[];
};

export function resolveGrillaColumnas(value: unknown): GrillaColumnas {
  return value === "1" || value === "2" || value === "3" || value === "4"
    ? value
    : DEFAULT_GRILLA_COLUMNAS;
}

export function resolveGrillaEspacio(value: unknown): GrillaEspacio {
  return value === "chico" || value === "medio" || value === "grande"
    ? value
    : DEFAULT_GRILLA_ESPACIO;
}

export function resolveGrillaEnvolver(value: unknown): GrillaEnvolver {
  return value === "si" || value === "no" ? value : DEFAULT_GRILLA_ENVOLVER;
}

export function resolveGrillaAlineacionHorizontal(
  value: unknown,
): GrillaAlineacionHorizontal {
  return value === "inicio" || value === "centro" || value === "fin"
    ? value
    : DEFAULT_GRILLA_ALINEACION_HORIZONTAL;
}

export function resolveGrillaAlineacionVertical(
  value: unknown,
): GrillaAlineacionVertical {
  return value === "arriba" || value === "centrado" || value === "abajo"
    ? value
    : DEFAULT_GRILLA_ALINEACION_VERTICAL;
}

export function resolveGrillaAlturaIgual(value: unknown): GrillaAlturaIgual {
  return value === "si" || value === "no" ? value : DEFAULT_GRILLA_ALTURA_IGUAL;
}

export function resolveGrillaOrdenMobile(value: unknown): GrillaOrdenMobile {
  return value === "normal" || value === "invertido"
    ? value
    : DEFAULT_GRILLA_ORDEN_MOBILE;
}

export function resolveGrillaProporcion(value: unknown): GrillaProporcion {
  return value === "1/4" ||
    value === "1/3" ||
    value === "1/2" ||
    value === "2/3" ||
    value === "3/4" ||
    value === "igual"
    ? value
    : DEFAULT_GRILLA_PROPORCION;
}

/** Id de preset válido o "" (sin preset). Las proporciones ya vienen resueltas en el plan. */
export function resolveGrillaPreset(value: unknown): GrillaPreset | "" {
  return value === "mitad_y_mitad" ||
    value === "hero_2_3_1_3" ||
    value === "3_tarjetas" ||
    value === "banda_de_4"
    ? value
    : "";
}

/**
 * Rating por ítem: dígito "1"–"5" (string, como el repeatable del schema).
 * Ausente o fuera de rango → undefined (sin estrellas, sin default inventado).
 */
export function resolveTestimonialRating(
  value: unknown,
): 1 | 2 | 3 | 4 | 5 | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return undefined;
  return n as 1 | 2 | 3 | 4 | 5;
}

/**
 * Safe href for block CTAs / links.
 * Allows http(s)/mailto/tel and relative paths starting with `/`.
 * Rejects javascript:, data:, protocol-relative, and empty.
 */
export function safeHref(url?: string): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\")
  ) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return trimmed;
  }

  return undefined;
}
