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
import { BLOCK_RADIUS_CLASS } from "../registry/block-zone/types";

const REGISTRY = join(dirname(fileURLToPath(import.meta.url)), "..", "registry");

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
});
