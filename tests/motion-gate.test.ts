/**
 * #4284 — Gate estático de movimiento: cualquier animación en `registry/` tiene que traer
 * su gate de `prefers-reduced-motion` en el MISMO archivo. Sin gate en el archivo = falla.
 * Una animación nueva del kit pasa por acá sin tocar templates (el kit no depende de que
 * cada template gatee sus animaciones).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_DIR = join(ROOT, "registry");

// Animación: keyframes CSS, propiedad `animation`/`animation-name`, o clase Tailwind `animate-*`.
const ANIMATION_RE = /@keyframes\b|\banimation(?:-name)?\s*:|\banimate-[a-z]/;
// Gate: media query de reduced-motion o variante Tailwind `motion-reduce:`.
const GATE_RE = /prefers-reduced-motion|motion-reduce:/;

const SOURCE_RE = /\.(tsx?|css)$/;

function listSources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...listSources(full));
    } else if (SOURCE_RE.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Archivos con animación sin gate reduced-motion en el mismo archivo (paths relativos a ROOT). */
function findUngatedAnimations(files: { path: string; src: string }[]): string[] {
  return files
    .filter((f) => ANIMATION_RE.test(f.src) && !GATE_RE.test(f.src))
    .map((f) => f.path);
}

describe("motion gate (#4284)", () => {
  const files = listSources(REGISTRY_DIR).map((full) => ({
    path: relative(ROOT, full),
    src: readFileSync(full, "utf8"),
  }));

  it("escanea los fuentes del registry (incluye la banda marquee)", () => {
    const paths = files.map((f) => f.path);
    expect(paths).toContain("registry/rich-section/marquee.tsx");
    expect(paths.length).toBeGreaterThan(10);
  });

  it("toda animación de registry/ trae gate reduced-motion en el mismo archivo", () => {
    const ungated = findUngatedAnimations(files);
    expect(ungated, `animación sin gate reduced-motion: ${ungated.join(", ")}`).toEqual([]);
  });

  it("la banda marquee usa animación y la gatea en su propio archivo", () => {
    const marquee = files.find((f) => f.path === "registry/rich-section/marquee.tsx");
    expect(marquee).toBeDefined();
    expect(ANIMATION_RE.test(marquee!.src)).toBe(true);
    expect(GATE_RE.test(marquee!.src)).toBe(true);
  });

  it("el detector marca una animación sin gate y acepta la gateada (self-test)", () => {
    const sinGate = "@keyframes spin { to { transform: rotate(360deg); } } .x { animation: spin 1s infinite; }";
    const conGate = `${sinGate} @media (prefers-reduced-motion: reduce) { .x { animation: none; } }`;
    const tailwindSinGate = '<div className="animate-spin" />';
    const tailwindConGate = '<div className="animate-spin motion-reduce:animate-none" />';
    const quieto = '<div className="transition-colors" />';

    const scan = (src: string) => findUngatedAnimations([{ path: "x.tsx", src }]);
    expect(scan(sinGate)).toEqual(["x.tsx"]);
    expect(scan(conGate)).toEqual([]);
    expect(scan(tailwindSinGate)).toEqual(["x.tsx"]);
    expect(scan(tailwindConGate)).toEqual([]);
    expect(scan(quieto)).toEqual([]);
  });
});
