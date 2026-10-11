/**
 * #4416 — contrato de tokens de forma de bloque en el kit.
 *
 * Guard de fuente (sin render). Radio: cards/secciones/imágenes leen el tier
 * `--block-radius-redondeado` del canónico block-form-tokens (#4422) con fallback 0.5rem.
 * Botones, gondola y bullet van con su valor literal de hoy (#4422 no tiene token por rol):
 * lista auditable `PENDING_LITERAL_RADIUS`. Ningún bloque escribe un radio literal fuera de
 * esa lista ni consume el `--block-radius` global (lo define :root y pisaría los defaults).
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

// Radio literal: rounded | rounded-{sm,md,lg,xl,2xl,3xl} | rounded-[valor] sin var().
// `rounded-full` (círculo) y `rounded-[var(…)]` quedan fuera del patrón.
const LITERAL_RADIUS = /(?<![\w-])rounded(?:-(?:sm|md|lg|xl|2xl|3xl)|-\[[^\]]*\])?(?=[\s"'`])/;

// Radio literal permitido: solo los tiers SIN token canónico (#4422) y con el valor que el kit
// renderiza hoy. Cada entrada se quita al extender #4422 con su --block-radius-<rol> y migrar.
const PENDING_LITERAL_RADIUS: ReadonlyArray<readonly [string, string]> = [
  ["block-zone/types.ts", 'export const BLOCK_RADIUS_BUTTON_CLASS = "rounded-[0.375rem]";'],
  ["block-zone/types.ts", 'export const BLOCK_RADIUS_PRODUCT_CLASS = "rounded-[1rem]";'],
  ["block-zone/types.ts", 'export const BLOCK_RADIUS_THUMB_CLASS = "rounded-[0.75rem]";'],
  ["rich-section/rich-section.tsx", "[&_li]:before:rounded-[0.125rem]"],
];

function radiusOffenders(): string[] {
  const offenders: string[] = [];
  for (const file of sourceFiles(REGISTRY)) {
    const rel = file.slice(REGISTRY.length + 1);
    readFileSync(file, "utf-8").split("\n").forEach((text: string, i: number) => {
      if (!LITERAL_RADIUS.test(text) || text.includes("var(")) return;
      if (PENDING_LITERAL_RADIUS.some(([f, line]) => rel === f && text.includes(line))) return;
      offenders.push(`${rel}:${i + 1}: ${text.trim()}`);
    });
  }
  return offenders;
}

describe("#4416 A3-a: radio de bloque vía tiers del canónico block-form-tokens (#4422)", () => {
  it("cards/secciones/imágenes: --block-radius-redondeado con fallback 0.5rem (rounded-lg de hoy)", () => {
    expect(BLOCK_RADIUS_CLASS).toBe("rounded-[var(--block-radius-redondeado,0.5rem)]");
  });

  // Sin token por rol en #4422: valor literal de hoy (Tailwind v3 de los templates = v4 en estos tres).
  it.each([
    ["BLOCK_RADIUS_BUTTON_CLASS (botones, 0.375rem)", BLOCK_RADIUS_BUTTON_CLASS, "rounded-[0.375rem]"],
    ["BLOCK_RADIUS_PRODUCT_CLASS (gondola producto, 1rem)", BLOCK_RADIUS_PRODUCT_CLASS, "rounded-[1rem]"],
    ["BLOCK_RADIUS_THUMB_CLASS (gondola miniatura, 0.75rem)", BLOCK_RADIUS_THUMB_CLASS, "rounded-[0.75rem]"],
  ])("%s: literal sin var(), pendiente de extender #4422 por rol", (_name, cls, expected) => {
    expect(cls).toBe(expected);
  });

  it("RichSection bullet: literal 0.125rem sin var(), pendiente de extender #4422 por rol", () => {
    expect(read("rich-section/rich-section.tsx")).toContain("[&_li]:before:rounded-[0.125rem]");
  });

  it("consume solo tiers del canónico: nunca el --block-radius global ni tokens inventados", () => {
    const TIERS = ["-recto", "-suave", "-redondeado"];
    const consumed = new Set<string>();
    for (const file of sourceFiles(REGISTRY)) {
      for (const m of readFileSync(file, "utf-8").matchAll(/var\(--block-radius([-\w]*)/g)) {
        consumed.add(m[1]);
      }
    }
    expect([...consumed].filter((tier) => !TIERS.includes(tier))).toEqual([]);
    expect(consumed.has("-redondeado")).toBe(true);
  });

  it("consumidores: cta/rich-section botón usan el tier de botón; gondola usa tiers de producto", () => {
    expect(read("cta/cta.tsx")).toContain("${BLOCK_RADIUS_BUTTON_CLASS} bg-primary");
    expect(read("rich-section/rich-section.tsx")).toMatch(/\$\{BLOCK_RADIUS_BUTTON_CLASS\} border border-primary/);
    expect(read("gondola/product-card.tsx")).toContain("${BLOCK_RADIUS_PRODUCT_CLASS}");
    const detail = read("gondola/product-detail.tsx");
    expect(detail).toContain("${BLOCK_RADIUS_PRODUCT_CLASS} bg-card");
    expect(detail).toContain("${BLOCK_RADIUS_THUMB_CLASS} bg-card");
  });

  it("ningún radio literal en registry/ fuera de la lista pendiente (PENDING_LITERAL_RADIUS)", () => {
    expect(radiusOffenders()).toEqual([]);
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

