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

export type RichSectionData = LayoutProps & TypoProps & ImageProps & {
  title?: string;
  body?: string;
  cta_label?: string;
  cta_url?: string;
  align?: "left" | "center";
  image_url?: string;
  image_side?: RichImageSide | string;
  mode?: RichMode | string;
  /** Fondo (#4567, espejo de #4566): `completo` = full-bleed con media de fondo. */
  fondo?: RichFondo | string;
  /** Video de fondo (#4567): solo se usa con `fondo: completo`; ver `resolveRichVideoUrl`. */
  video_url?: string;
};

export type CTAData = LayoutProps & TypoProps & ImageProps & {
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

export type GalleryData = LayoutProps & TypoProps & ImageProps & {
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

export type CardsData = LayoutProps & TypoProps & {
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

export type TestimonialsData = LayoutProps & TypoProps & {
  title?: string;
  items?: TestimonialItem[];
  layout?: TestimonialsLayout | string;
};

export type FaqItem = {
  question?: string;
  answer?: string;
};

export type FAQData = LayoutProps & TypoProps & {
  title?: string;
  questions?: FaqItem[];
};

export type StatMetric = {
  value?: string;
  label?: string;
};

export type StatsData = LayoutProps & TypoProps & {
  title?: string;
  intro?: string;
  metrics?: StatMetric[];
};

export type StepItem = {
  heading?: string;
  text?: string;
};

export type StepsData = LayoutProps & TypoProps & {
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
export type RichFondo = "normal" | "completo";
export type CtaStyle = "banda" | "foto" | "split";
export type CtaAlign = "left" | "center" | "right";

export const DEFAULT_CARDS_COLUMNS: CardsColumns = "3";
export const DEFAULT_CARDS_STYLE: CardsStyle = "grid";
export const DEFAULT_TESTIMONIALS_LAYOUT: TestimonialsLayout = "grilla";
export const DEFAULT_GALLERY_COLUMNS: GalleryColumns = "3";
export const DEFAULT_GALLERY_STYLE: GalleryStyle = "grilla";
export const DEFAULT_RICH_IMAGE_SIDE: RichImageSide = "right";
export const DEFAULT_RICH_MODE: RichMode = "split";
export const DEFAULT_RICH_FONDO: RichFondo = "normal";
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

export function resolveRichFondo(value: unknown): RichFondo {
  return value === "normal" || value === "completo" ? value : DEFAULT_RICH_FONDO;
}

/**
 * `video_url` de fondo válido o undefined. Espejo local de `isValidVideoUrl` del SDK (#4566):
 * https literal, sin userinfo, sin espacios/controles/comillas/<>\, path .mp4 o .webm.
 * Defensa en el render: la URL llega a `<video src>`. Nunca lanza.
 */
export function resolveRichVideoUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!/^https:\/\//i.test(value)) return undefined;
  if (/[\s"'<>\\\x00-\x1f\x7f]/.test(value)) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    return undefined;
  }
  return /\.(mp4|webm)$/i.test(url.pathname) ? value : undefined;
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

// --- Presentación (#4266, corte B). Defaults = render actual: sin props, el DOM no cambia.
// Tipografía (scale, emphasis) en los 8 bloques canónicos; imagen (aspect, frame, fit, focal)
// en RichSection, CTA y Gallery. Fuera de closed-set → default, nunca explota.
// Escala de los 8 canónicos (SoT PY `PRESENTATION_TYPO_CLOSESETS`, 3 valores).
export type TypoScale = "chico" | "medio" | "grande";
// RichSection suma `display` = hero tipográfico (#4282). ⚠️ pendiente de verificar: el espejo PY del closed-set de hero aún no existe en guaso-app origin/main (lo introduce #4282).
// Solo RichSection: en los otros bloques `display` cae a medio (ver resolveTypoScale).
export type RichSectionScale = TypoScale | "display";
export type TypoEmphasis = "normal" | "fuerte";
export type ImageAspect = "4:5" | "4:3" | "1:1" | "16:9";
export type ImageFrame = "borde" | "sin_borde" | "sombra";
export type ImageFit = "cover" | "contain";
export type ImageFocal = "centro" | "arriba" | "abajo" | "izquierda" | "derecha";

export type TypoProps = {
  scale?: TypoScale | string;
  emphasis?: TypoEmphasis | string;
};

export type ImageProps = {
  aspect?: ImageAspect | string;
  frame?: ImageFrame | string;
  fit?: ImageFit | string;
  focal?: ImageFocal | string;
};

export const DEFAULT_TYPO_SCALE: TypoScale = "medio";
export const DEFAULT_TYPO_EMPHASIS: TypoEmphasis = "normal";
export const DEFAULT_IMAGE_FRAME: ImageFrame = "borde";
export const DEFAULT_IMAGE_FIT: ImageFit = "cover";
export const DEFAULT_IMAGE_FOCAL: ImageFocal = "centro";
export const DEFAULT_RICH_ASPECT: ImageAspect = "4:5";
export const DEFAULT_CTA_ASPECT: ImageAspect = "4:3";
export const DEFAULT_GALLERY_ASPECT: ImageAspect = "4:3";

export function resolveTypoScale(value: unknown): TypoScale {
  return value === "chico" || value === "medio" || value === "grande"
    ? value
    : DEFAULT_TYPO_SCALE;
}

// Solo RichSection admite `display`; el resto de bloques lo recibe como `medio` (fuera de closed-set).
export function resolveRichSectionScale(value: unknown): RichSectionScale {
  return value === "display" ? "display" : resolveTypoScale(value);
}

export function resolveTypoEmphasis(value: unknown): TypoEmphasis {
  return value === "normal" || value === "fuerte" ? value : DEFAULT_TYPO_EMPHASIS;
}

export function resolveImageAspect(value: unknown, fallback: ImageAspect): ImageAspect {
  return value === "4:5" || value === "4:3" || value === "1:1" || value === "16:9"
    ? value
    : fallback;
}

export function resolveImageFrame(value: unknown): ImageFrame {
  return value === "borde" || value === "sin_borde" || value === "sombra"
    ? value
    : DEFAULT_IMAGE_FRAME;
}

export function resolveImageFit(value: unknown): ImageFit {
  return value === "cover" || value === "contain" ? value : DEFAULT_IMAGE_FIT;
}

export function resolveImageFocal(value: unknown): ImageFocal {
  return value === "centro" ||
    value === "arriba" ||
    value === "abajo" ||
    value === "izquierda" ||
    value === "derecha"
    ? value
    : DEFAULT_IMAGE_FOCAL;
}

// Tokens de forma de bloque (#4416, #4404). Strings completas: Tailwind JIT no interpola.
// Todo radio sale de un tier del canónico block-form-tokens (#4422): `--block-radius-redondeado`
// (= var(--radius) del template) y `--block-radius-suave` (= la mitad). Cada rol conserva como fallback
// el valor literal de hoy, así que un consumidor sin el canónico en su :root renderiza igual que antes.
// ⛔ No se consume el `--block-radius` global: el canónico lo define en :root y pisaría los defaults por bloque.
export const BLOCK_RADIUS_CLASS = "rounded-[var(--block-radius-redondeado,0.5rem)]";
export const BLOCK_RADIUS_BUTTON_CLASS = "rounded-[var(--block-radius-suave,0.375rem)]";
export const BLOCK_RADIUS_PRODUCT_CLASS = "rounded-[var(--block-radius-redondeado,1rem)]";
export const BLOCK_RADIUS_THUMB_CLASS = "rounded-[var(--block-radius-redondeado,0.75rem)]";
export const SECTION_PY_CLASS = "py-[var(--block-space-y,4rem)] md:py-[var(--block-space-y-md,5rem)]";
export const SECTION_PX_CLASS = "px-[var(--block-space-x,1.5rem)]";
export const SECTION_CONTAINER_CLASS = "max-w-[var(--block-container,72rem)]";
export const NARROW_CONTAINER_CLASS = "max-w-[var(--block-narrow,48rem)]";
/** Raíz de sección centrada: `mx-auto` + contenedor + padding de sitio (tier medio). */
export const SECTION_ROOT_CLASS = `mx-auto ${SECTION_CONTAINER_CLASS} ${SECTION_PX_CLASS} ${SECTION_PY_CLASS}`;
/** Raíz de sección angosta (faq, steps). */
export const NARROW_SECTION_ROOT_CLASS = `mx-auto ${NARROW_CONTAINER_CLASS} ${SECTION_PX_CLASS} ${SECTION_PY_CLASS}`;

// Clases por valor, partidas en base + md para componer en el mismo orden que el kit previo
// (el default reproduce la cadena fija de cada h2: mismos tokens, mismo orden).
type HeadingSize = { base: string; md: string };
// Tamaño de heading desde tokens --block-text-* (block-form-tokens). Fallback = valor Tailwind de hoy
// (escala sección 1.5/1.875/2.25rem y CTA 1.25/1.5/1.875rem; md = +0.375rem). Ver tests/block-tokens-source.test.ts.
const SECTION_HEADING_SIZE: Record<TypoScale, HeadingSize> = {
  chico: {
    base: "text-[length:var(--block-text-chico,1.5rem)]",
    md: "md:text-[length:var(--block-text-chico-md,1.875rem)]",
  },
  medio: {
    base: "text-[length:var(--block-text-medio,1.875rem)]",
    md: "md:text-[length:var(--block-text-medio-md,2.25rem)]",
  },
  grande: {
    base: "text-[length:var(--block-text-grande,2.25rem)]",
    md: "md:text-[length:var(--block-text-grande-md,3rem)]",
  },
};
// Hero tipográfico (#4282): escalón por encima de `grande` (3rem md). Solo RichSection.
// Fallback = 3.75rem base / 6rem md; los tokens --block-text-display* los fija el consumidor.
const RICH_SECTION_HEADING_SIZE: Record<RichSectionScale, HeadingSize> = {
  ...SECTION_HEADING_SIZE,
  display: {
    base: "text-[length:var(--block-text-display,3.75rem)]",
    md: "md:text-[length:var(--block-text-display-md,6rem)]",
  },
};
const CTA_HEADING_SIZE: Record<TypoScale, HeadingSize> = {
  chico: {
    base: "text-[length:var(--block-text-cta-chico,1.25rem)]",
    md: "md:text-[length:var(--block-text-cta-chico-md,1.5rem)]",
  },
  medio: {
    base: "text-[length:var(--block-text-cta-medio,1.5rem)]",
    md: "md:text-[length:var(--block-text-cta-medio-md,1.875rem)]",
  },
  grande: {
    base: "text-[length:var(--block-text-cta-grande,1.875rem)]",
    md: "md:text-[length:var(--block-text-cta-grande-md,2.25rem)]",
  },
};
const ASPECT_CLASS: Record<ImageAspect, string> = {
  "4:5": "aspect-[4/5]",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};
const FOCAL_CLASS: Record<ImageFocal, string> = {
  centro: "",
  arriba: "object-top",
  abajo: "object-bottom",
  izquierda: "object-left",
  derecha: "object-right",
};

/** Tono de texto: `inverse` para superficies oscuras (overlay de fondo completo, #4567). */
export type TextTone = "default" | "inverse";

function sectionHeadingWith(size: HeadingSize, props: TypoProps, tone: TextTone): string {
  const weight = resolveTypoEmphasis(props.emphasis) === "fuerte" ? "font-bold" : "font-semibold";
  const color = tone === "inverse" ? "text-background" : "text-foreground";
  return `font-heading ${size.base} ${weight} tracking-tight ${color} text-balance ${size.md}`;
}

/** Clase del h2 de sección (Gallery, Cards, Testimonials, FAQ, Stats, Steps; RichSection usa richSectionHeadingClass). */
export function sectionHeadingClass(props: TypoProps, tone: TextTone = "default"): string {
  return sectionHeadingWith(SECTION_HEADING_SIZE[resolveTypoScale(props.scale)], props, tone);
}

/** Clase del h2 de RichSection (#4282): suma `display` (hero). Resto de escalas = sectionHeadingClass. */
export function richSectionHeadingClass(props: TypoProps, tone: TextTone = "default"): string {
  return sectionHeadingWith(RICH_SECTION_HEADING_SIZE[resolveRichSectionScale(props.scale)], props, tone);
}

/** Clase del h2 del CTA (escala propia: un paso menor que la sección). */
export function ctaHeadingClass(props: TypoProps): string {
  const size = CTA_HEADING_SIZE[resolveTypoScale(props.scale)];
  const weight = resolveTypoEmphasis(props.emphasis) === "fuerte" ? "font-bold" : "font-semibold";
  return `font-heading ${size.base} ${weight} tracking-tight text-foreground text-balance ${size.md}`;
}

/** Clase de proporción de la imagen. `fallback` = default del bloque (4:5 RichSection, 4:3 CTA/Gallery). */
export function imageAspectClass(props: ImageProps, fallback: ImageAspect): string {
  return ASPECT_CLASS[resolveImageAspect(props.aspect, fallback)];
}

/** Clases del marco: borde (default), sin borde o sombra. */
export function imageFrameClass(props: ImageProps): string {
  const frame = resolveImageFrame(props.frame);
  if (frame === "borde") return "border border-border";
  if (frame === "sombra") return "shadow-md";
  return "";
}

/** Clases de ajuste y punto focal del <img>. Defaults = `object-cover` sin posición extra. */
export function imageFitClass(props: ImageProps): string {
  const fit = resolveImageFit(props.fit) === "contain" ? "object-contain" : "object-cover";
  const focal = FOCAL_CLASS[resolveImageFocal(props.focal)];
  return focal ? `${fit} ${focal}` : fit;
}

