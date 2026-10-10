import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import RichSection from "../registry/rich-section/rich-section";
import BlockZone from "../registry/block-zone/block-zone";
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
  type Block,
  type CTAData,
  type CardsData,
  type FAQData,
  type GalleryData,
  type LayoutProps,
  type RichSectionData,
  type StatsData,
  type StepsData,
  type TestimonialsData,
} from "../registry/block-zone/types";

const TEXT = { title: "Hola", body: "Cuerpo" };

function zoneWith(data: Record<string, unknown>) {
  const blocks: Block[] = [
    { id: "blk_1", type: "RichSection", enabled: true, data: { ...TEXT, ...data } },
  ];
  return render(<BlockZone blocks={blocks} />).container;
}

function bareSection() {
  return render(<RichSection data={TEXT} isOwner={false} />).container.innerHTML;
}

describe("resolvers de layout (#4264)", () => {
  it("valor válido → se devuelve tal cual", () => {
    expect(resolveLayoutSurface("oscuro")).toBe("oscuro");
    expect(resolveLayoutWidth("angosto")).toBe("angosto");
    expect(resolveLayoutSpacing("grande")).toBe("grande");
    expect(resolveLayoutVisibility("solo_mobile")).toBe("solo_mobile");
  });

  it("valor inválido o ausente → default (nunca lanza)", () => {
    expect(resolveLayoutSurface("rojo")).toBe(DEFAULT_LAYOUT_SURFACE);
    expect(resolveLayoutSurface(undefined)).toBe("neutro");
    expect(resolveLayoutWidth(42)).toBe(DEFAULT_LAYOUT_WIDTH);
    expect(resolveLayoutWidth("completo ")).toBe("normal");
    expect(resolveLayoutSpacing(null)).toBe(DEFAULT_LAYOUT_SPACING);
    expect(resolveLayoutVisibility("oculto")).toBe(DEFAULT_LAYOUT_VISIBILITY);
    expect(resolveLayoutVisibility({})).toBe("todos");
  });

  it("defaults = neutro / normal / medio / todos", () => {
    expect(DEFAULT_LAYOUT_SURFACE).toBe("neutro");
    expect(DEFAULT_LAYOUT_WIDTH).toBe("normal");
    expect(DEFAULT_LAYOUT_SPACING).toBe("medio");
    expect(DEFAULT_LAYOUT_VISIBILITY).toBe("todos");
  });
});

describe("resolveLayoutAnchor (#4264, D4)", () => {
  it.each(["hero", "hero-1", "a", "seccion-precios-2026", "a".repeat(40)])(
    "slug válido %s → se conserva",
    (v) => {
      expect(resolveLayoutAnchor(v)).toBe(v);
    },
  );

  it.each([
    "Hero", // mayúscula
    "1hero", // empieza con dígito
    "-hero", // empieza con guion
    "hero_1", // guion bajo
    "hero precios", // espacio
    "hero\n", // salto de línea final
    "a".repeat(41), // > 40
    "",
  ])("fuera de formato %j → \"\"", (v) => {
    expect(resolveLayoutAnchor(v)).toBe("");
  });

  it("no string → \"\"", () => {
    expect(resolveLayoutAnchor(undefined)).toBe("");
    expect(resolveLayoutAnchor(null)).toBe("");
    expect(resolveLayoutAnchor(12)).toBe("");
  });
});

describe("BlockZone wrapper de layout (#4264)", () => {
  it("sin props → mismo HTML que el bloque suelto, sin <div> extra", () => {
    const container = zoneWith({});
    expect(container.innerHTML).toBe(bareSection());
    expect(container.firstElementChild?.tagName).toBe("SECTION");
  });

  it("las 5 props en default explícito → mismo HTML que sin props", () => {
    const container = zoneWith({
      surface: "neutro",
      width: "normal",
      spacing: "medio",
      visibility: "todos",
      anchor: "",
    });
    expect(container.innerHTML).toBe(bareSection());
    expect(container.firstElementChild?.tagName).toBe("SECTION");
  });

  it("valores inválidos caen a default → mismo HTML, sin <div> extra", () => {
    const container = zoneWith({
      surface: "rojo",
      width: "XL",
      spacing: 3,
      visibility: "oculto",
      anchor: "Hero Uno",
    });
    expect(container.innerHTML).toBe(bareSection());
    expect(container.firstElementChild?.tagName).toBe("SECTION");
  });

  it("surface no default → envoltorio con token semántico, sin hex", () => {
    const wrap = zoneWith({ surface: "suave" }).firstElementChild as HTMLElement;
    expect(wrap.tagName).toBe("DIV");
    expect(wrap.className).toContain("bg-muted");
    expect(wrap.className).toContain("text-foreground");
    expect(wrap.className).not.toMatch(/#|bg-gray-/);
    expect(wrap.querySelector("section")).not.toBeNull();
  });

  it("surface oscuro y acento mapean a tokens distintos", () => {
    const oscuro = zoneWith({ surface: "oscuro" }).firstElementChild as HTMLElement;
    const acento = zoneWith({ surface: "acento" }).firstElementChild as HTMLElement;
    expect(oscuro.className).toContain("bg-foreground");
    expect(oscuro.className).toContain("text-background");
    expect(acento.className).toContain("bg-primary");
    expect(acento.className).toContain("text-primary-foreground");
  });

  it("anchor válido → id en el envoltorio (aun con el resto en default)", () => {
    const wrap = zoneWith({ anchor: "precios" }).firstElementChild as HTMLElement;
    expect(wrap.tagName).toBe("DIV");
    expect(wrap.id).toBe("precios");
    expect(wrap.className).not.toContain("bg-");
  });

  it("anchor inválido con otra prop no default → sin id", () => {
    const wrap = zoneWith({ anchor: "Precios!", surface: "suave" })
      .firstElementChild as HTMLElement;
    expect(wrap.hasAttribute("id")).toBe(false);
    expect(wrap.className).toContain("bg-muted");
  });

  it("width angosto → max-width acotado; completo → sin tope en el hijo", () => {
    const angosto = zoneWith({ width: "angosto" }).firstElementChild as HTMLElement;
    expect(angosto.className).toContain("max-w-3xl");
    const completo = zoneWith({ width: "completo" }).firstElementChild as HTMLElement;
    expect(completo.className).toContain("w-full");
    expect(completo.className).toContain("[&>*]:max-w-none");
  });

  it("width normal explícito con otra prop → no agrega max-width (ya lo trae el bloque)", () => {
    const wrap = zoneWith({ width: "normal", surface: "suave" })
      .firstElementChild as HTMLElement;
    expect(wrap.className).not.toContain("max-w-");
  });

  it("spacing no default → padding vertical del envoltorio", () => {
    const grande = zoneWith({ spacing: "grande" }).firstElementChild as HTMLElement;
    expect(grande.className).toContain("py-16");
    const chico = zoneWith({ spacing: "chico" }).firstElementChild as HTMLElement;
    expect(chico.className).toContain("py-4");
  });

  it("spacing medio (default) no agrega padding aunque el envoltorio se active por otra prop (#4346 FIX-1)", () => {
    const anchorOnly = zoneWith({ anchor: "precios" }).firstElementChild as HTMLElement;
    expect(anchorOnly.className).toBe("empty:hidden");
    expect(anchorOnly.className).not.toMatch(/\bpy-/);
    expect(anchorOnly.innerHTML).toBe(bareSection());

    const surfaceOnly = zoneWith({ surface: "suave", spacing: "medio" })
      .firstElementChild as HTMLElement;
    expect(surfaceOnly.className).not.toMatch(/\bpy-/);
    expect(surfaceOnly.className).toContain("bg-muted");
  });

  it("visibility solo_mobile → oculto desde md; solo_desktop → oculto bajo md", () => {
    const mobile = zoneWith({ visibility: "solo_mobile" })
      .firstElementChild as HTMLElement;
    expect(mobile.className).toContain("md:hidden");
    expect(mobile.className).not.toContain("hidden md:block");

    const desktop = zoneWith({ visibility: "solo_desktop" })
      .firstElementChild as HTMLElement;
    expect(desktop.className).toContain("hidden md:block");
  });

  it("visibility todos (default) no agrega clases de ocultado", () => {
    const wrap = zoneWith({ visibility: "todos", surface: "suave" })
      .firstElementChild as HTMLElement;
    expect(wrap.classList.contains("hidden")).toBe(false);
    expect(wrap.classList.contains("md:hidden")).toBe(false);
    expect(wrap.classList.contains("md:block")).toBe(false);
  });

  it("envoltorio lleva empty:hidden: un bloque que renderiza null no pinta caja vacía", () => {
    const blocks: Block[] = [
      { id: "blk_e", type: "RichSection", enabled: true, data: { surface: "suave" } },
    ];
    const container = render(<BlockZone blocks={blocks} />).container;
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.childElementCount).toBe(0);
    expect(wrap.className).toContain("empty:hidden");
  });
});

// ─── Gate de tipo: los 8 *Data canónicos extienden LayoutProps (#4346 FIX-2) ──
// vitest no typechecka: este gate lo hace tsc (tests/** está en tsconfig include).
// Si se saca una de las 5 claves de LayoutProps de un *Data canónico, tsc falla
// acá con "Type 'false' does not satisfy the constraint 'true'".
// Correr: `npx tsc --noEmit` en el kit (errores preexistentes de entorno aparte).
type Expect<T extends true> = T;
type HasAllLayoutKeys<T> = [Exclude<keyof LayoutProps, keyof T>] extends [never]
  ? true
  : false;

export type CanonicalLayoutGate = [
  Expect<HasAllLayoutKeys<RichSectionData>>,
  Expect<HasAllLayoutKeys<CTAData>>,
  Expect<HasAllLayoutKeys<GalleryData>>,
  Expect<HasAllLayoutKeys<CardsData>>,
  Expect<HasAllLayoutKeys<TestimonialsData>>,
  Expect<HasAllLayoutKeys<FAQData>>,
  Expect<HasAllLayoutKeys<StatsData>>,
  Expect<HasAllLayoutKeys<StepsData>>,
];
