import type {
  Block,
  LayoutSpacing,
  LayoutSurface,
  LayoutVisibility,
  LayoutWidth,
} from "./types";
import {
  DEFAULT_LAYOUT_SPACING,
  DEFAULT_LAYOUT_SURFACE,
  DEFAULT_LAYOUT_VISIBILITY,
  DEFAULT_LAYOUT_WIDTH,
  resolveLayoutAnchor,
  resolveLayoutSpacing,
  resolveLayoutSurface,
  resolveLayoutVisibility,
  resolveLayoutWidth,
} from "./types";
import { getBlockComponent } from "./registry";

// Clases literales (Tailwind las escanea en el template). Tokens semánticos only.
// `empty:hidden`: un bloque que renderiza null no deja un envoltorio vacío pintado.
const LAYOUT_WRAPPER_BASE = "empty:hidden";

const LAYOUT_SURFACE_CLASS: Record<LayoutSurface, string> = {
  neutro: "",
  suave: "bg-muted text-foreground",
  oscuro: "bg-foreground text-background",
  acento: "bg-primary text-primary-foreground",
};

// normal = ancho que ya trae cada bloque (max-w-6xl): no agrega clase.
const LAYOUT_WIDTH_CLASS: Record<LayoutWidth, string> = {
  angosto: "mx-auto w-full max-w-3xl",
  normal: "",
  completo: "w-full [&>*]:max-w-none",
};

// medio = default: no agrega padding (cada bloque ya trae el suyo). Solo chico/grande emiten clase.
const LAYOUT_SPACING_CLASS: Record<LayoutSpacing, string> = {
  chico: "py-4 md:py-6",
  medio: "",
  grande: "py-16 md:py-24",
};

const LAYOUT_VISIBILITY_CLASS: Record<LayoutVisibility, string> = {
  todos: "",
  solo_desktop: "hidden md:block",
  solo_mobile: "md:hidden",
};

type ResolvedLayout = {
  surface: LayoutSurface;
  width: LayoutWidth;
  spacing: LayoutSpacing;
  visibility: LayoutVisibility;
  anchor: string;
};

function readLayout(data: Record<string, unknown> | null | undefined): ResolvedLayout {
  const d = data ?? {};
  return {
    surface: resolveLayoutSurface(d.surface),
    width: resolveLayoutWidth(d.width),
    spacing: resolveLayoutSpacing(d.spacing),
    visibility: resolveLayoutVisibility(d.visibility),
    anchor: resolveLayoutAnchor(d.anchor),
  };
}

function isLayoutDefault(l: ResolvedLayout): boolean {
  return (
    l.surface === DEFAULT_LAYOUT_SURFACE &&
    l.width === DEFAULT_LAYOUT_WIDTH &&
    l.spacing === DEFAULT_LAYOUT_SPACING &&
    l.visibility === DEFAULT_LAYOUT_VISIBILITY &&
    l.anchor === ""
  );
}

function layoutWrapperClass(l: ResolvedLayout): string {
  return [
    LAYOUT_WRAPPER_BASE,
    LAYOUT_SURFACE_CLASS[l.surface],
    LAYOUT_WIDTH_CLASS[l.width],
    LAYOUT_SPACING_CLASS[l.spacing],
    LAYOUT_VISIBILITY_CLASS[l.visibility],
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Renders enabled schema-bound blocks. Unknown types → ignored.
 * Pass `isOwner` from the host (⛔ no draftMode inside the kit).
 * Props de layout (#4264) por bloque: con todas en default, sin envoltorio extra.
 */
export default function BlockZone({
  blocks,
  isOwner = false,
}: {
  blocks?: Block[] | null;
  isOwner?: boolean;
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  const rendered = blocks
    .filter((b) => b.enabled)
    .map((b, i) => {
      const Component = getBlockComponent(b.type);
      if (!Component) return null;
      const key = b.id ? b.id : `blk-${i}`;
      const layout = readLayout(b.data);
      if (isLayoutDefault(layout)) {
        return <Component key={key} data={b.data} isOwner={isOwner} />;
      }
      return (
        <div
          key={key}
          id={layout.anchor || undefined}
          className={layoutWrapperClass(layout)}
        >
          <Component data={b.data} isOwner={isOwner} />
        </div>
      );
    });
  if (!rendered.some((r) => r !== null)) return null;
  return <>{rendered}</>;
}
