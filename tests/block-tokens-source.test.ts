/**
 * #4416 — contrato de tokens de forma de bloque en el kit.
 *
 * Guard de fuente (sin render): ningún bloque de `registry/` escribe un valor de radio
 * fijo de Tailwind; todo pasa por el helper único `BLOCK_RADIUS_CLASS` (types.ts), que
 * lee `var(--block-radius, <fallback>)`. Un bloque nuevo que escriba `rounded-lg` rojea acá.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BLOCK_RADIUS_BUTTON_CLASS,
  BLOCK_RADIUS_CLASS,
  BLOCK_RADIUS_PRODUCT_CLASS,
  BLOCK_RADIUS_THUMB_CLASS,
  NARROW_SECTION_ROOT_CLASS,
  SECTION_ROOT_CLASS,
  ctaHeadingClass,
  sectionHeadingClass,
  type TypoProps,
} from "../registry/block-zone/types";

const REGISTRY = join(dirname(fileURLToPath(import.meta.url)), "..", "registry");
const read = (rel: string) => readFileSync(join(REGISTRY, rel), "utf-8");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

// Radio Tailwind fijo: rounded | rounded-{sm,md,lg,xl,2xl,3xl}. `rounded-full` (círculo) y
// `rounded-[var(…)]` quedan fuera del patrón.
const LITERAL_RADIUS = /(?<![\w-])rounded(?:-(?:sm|md|lg|xl|2xl|3xl))?(?=[\s"'`])/;

describe("#4416 A3-a: radio de bloque vía var(--block-radius)", () => {
  it("helper: lee --block-radius con fallback = rounded-lg de hoy (0.5rem)", () => {
    expect(BLOCK_RADIUS_CLASS).toBe("rounded-[var(--block-radius,0.5rem)]");
  });

  // Cada tier conserva el radio Tailwind que el kit renderiza hoy (v3 de los templates:
  // md 0.375rem, lg 0.5rem, xl 0.75rem, 2xl 1rem). Un tier nuevo sin fallback propio rojea acá.
  it.each([
    ["BLOCK_RADIUS_CLASS (cards/secciones, rounded-lg)", BLOCK_RADIUS_CLASS, "0.5rem"],
    ["BLOCK_RADIUS_BUTTON_CLASS (botones, rounded-md)", BLOCK_RADIUS_BUTTON_CLASS, "0.375rem"],
    ["BLOCK_RADIUS_PRODUCT_CLASS (gondola producto, rounded-2xl)", BLOCK_RADIUS_PRODUCT_CLASS, "1rem"],
    ["BLOCK_RADIUS_THUMB_CLASS (gondola miniatura, rounded-xl)", BLOCK_RADIUS_THUMB_CLASS, "0.75rem"],
  ])("%s conserva su fallback de hoy", (_name, cls, fallback) => {
    expect(cls).toBe(`rounded-[var(--block-radius,${fallback})]`);
  });

  it("RichSection bullet: fallback 0.125rem (rounded-sm v3), no el radio de card", () => {
    expect(read("rich-section/rich-section.tsx")).toContain(
      "[&_li]:before:rounded-[var(--block-radius,0.125rem)]",
    );
  });

  it("consumidores: cta/rich-section botón usan el tier de botón; gondola usa tiers de producto", () => {
    expect(read("cta/cta.tsx")).toContain("${BLOCK_RADIUS_BUTTON_CLASS} bg-primary");
    expect(read("rich-section/rich-section.tsx")).toMatch(/\$\{BLOCK_RADIUS_BUTTON_CLASS\} border border-primary/);
    expect(read("gondola/product-card.tsx")).toContain("${BLOCK_RADIUS_PRODUCT_CLASS}");
    const detail = read("gondola/product-detail.tsx");
    expect(detail).toContain("${BLOCK_RADIUS_PRODUCT_CLASS} bg-card");
    expect(detail).toContain("${BLOCK_RADIUS_THUMB_CLASS} bg-card");
  });

  it("ningún archivo de registry/ escribe un radio Tailwind literal sin var()", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(REGISTRY)) {
      const lines = readFileSync(file, "utf-8").split("\n");
      lines.forEach((text: string, i: number) => {
        if (LITERAL_RADIUS.test(text) && !text.includes("var(")) {
          offenders.push(`${file}:${i + 1}: ${text.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("helpers de raíz: contenedor, padding y narrow leen var() con fallback del look actual", () => {
    expect(SECTION_ROOT_CLASS).toBe(
      "mx-auto max-w-[var(--block-container,72rem)] px-[var(--block-space-x,1.5rem)] py-[var(--block-space-y,4rem)] md:py-[var(--block-space-y-md,5rem)]",
    );
    expect(NARROW_SECTION_ROOT_CLASS).toContain("max-w-[var(--block-narrow,48rem)]");
  });

  it("ninguna raíz de sección (mx-auto) lleva max-w/px/py literal sin var()", () => {
    // Excepción explícita y auditable: max-w-7xl de gondola/product-detail no está en el
    // mapeo de #4416 (gap documentado en el PR; follow-up de tokens).
    const EXEMPT = /max-w-7xl/;
    const offenders: string[] = [];
    for (const file of sourceFiles(REGISTRY)) {
      const lines = readFileSync(file, "utf-8").split("\n");
      lines.forEach((text: string, i: number) => {
        if (!text.includes("mx-auto")) return;
        const literal = /(?<![\w-])(?:max-w-\d|px-\d|py-\d)/.test(text.replace(/var\([^)]*\)/g, ""));
        if (literal && !EXEMPT.test(text)) offenders.push(`${file}:${i + 1}: ${text.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe("#4416 A3-c: tamaño de heading vía var(--block-text-*)", () => {
  const SECTION_EXPECT: Record<string, [string, string]> = {
    chico: ["text-[length:var(--block-text-chico,1.5rem)]", "md:text-[length:var(--block-text-chico-md,1.875rem)]"],
    medio: ["text-[length:var(--block-text-medio,1.875rem)]", "md:text-[length:var(--block-text-medio-md,2.25rem)]"],
    grande: ["text-[length:var(--block-text-grande,2.25rem)]", "md:text-[length:var(--block-text-grande-md,3rem)]"],
  };
  const CTA_EXPECT: Record<string, [string, string]> = {
    chico: ["text-[length:var(--block-text-cta-chico,1.25rem)]", "md:text-[length:var(--block-text-cta-chico-md,1.5rem)]"],
    medio: ["text-[length:var(--block-text-cta-medio,1.5rem)]", "md:text-[length:var(--block-text-cta-medio-md,1.875rem)]"],
    grande: ["text-[length:var(--block-text-cta-grande,1.875rem)]", "md:text-[length:var(--block-text-cta-grande-md,2.25rem)]"],
  };

  it.each(Object.entries(SECTION_EXPECT))("sección scale %s → tokens con fallback Tailwind", (scale, [base, md]) => {
    const cls = sectionHeadingClass({ scale } as TypoProps).split(" ");
    expect(cls).toContain(base);
    expect(cls).toContain(md);
  });

  it.each(Object.entries(CTA_EXPECT))("CTA scale %s → tokens con fallback Tailwind", (scale, [base, md]) => {
    const cls = ctaHeadingClass({ scale } as TypoProps).split(" ");
    expect(cls).toContain(base);
    expect(cls).toContain(md);
  });

  it("types.ts no escribe tamaños de heading Tailwind literales", () => {
    const src = readFileSync(join(REGISTRY, "block-zone", "types.ts"), "utf-8");
    expect(src).not.toMatch(/(?<![\w-])text-(?:xl|2xl|3xl|4xl|5xl)(?![\w-])/);
  });
});

