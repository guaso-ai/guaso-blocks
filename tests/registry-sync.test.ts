/**
 * Guard: el registro publicado `r/<name>.json` (lo que consumen los templates
 * vía shadcn) tiene que coincidir con `registry.json` y con el código fuente.
 * Desfase = el template instala un bloque viejo (gondola.json quedó atrás de
 * product-detail.tsx, detectado al regenerar en #21 / #4382).
 *
 * Determinístico y sin red: no corre `shadcn build`. Regenerar con
 * `npx shadcn@latest build registry.json --output r` cuando el test falle.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const R_DIR = join(ROOT, "r");
const INDEX_FILE = "registry.json";

type RegistryFile = { path: string; type?: string; target?: string };
type RegistryItem = {
  name: string;
  type?: string;
  title?: string;
  description?: string;
  files: RegistryFile[];
};
type PublishedFile = { path: string; type?: string; target?: string; content: string };
type PublishedItem = {
  name: string;
  type?: string;
  title?: string;
  description?: string;
  files: PublishedFile[];
};

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, "utf-8")) as T;

const registry = readJson<{ items: RegistryItem[] }>(join(ROOT, "registry.json"));
const publishedNames = readdirSync(R_DIR)
  .filter((f) => f.endsWith(".json") && f !== INDEX_FILE)
  .map((f) => f.replace(/\.json$/, ""));

describe("r/*.json en sincronía con registry.json", () => {
  it("cada item de registry.json tiene su r/<name>.json y viceversa", () => {
    const sourceNames = registry.items.map((i) => i.name).sort();
    expect(publishedNames.sort()).toEqual(sourceNames);
  });

  it.each(registry.items.map((i) => [i.name, i] as const))(
    "%s: metadatos y lista de archivos coinciden",
    (name, item) => {
      const file = join(R_DIR, `${name}.json`);
      expect(existsSync(file), `falta r/${name}.json`).toBe(true);
      const published = readJson<PublishedItem>(file);
      expect(published.title ?? "").toBe(item.title ?? "");
      expect(published.description ?? "").toBe(item.description ?? "");
      expect(published.type ?? "").toBe(item.type ?? "");
      expect(
        published.files.map(({ path, type, target }) => ({ path, type, target })),
      ).toEqual(item.files.map(({ path, type, target }) => ({ path, type, target })));
    },
  );

  it.each(registry.items.map((i) => [i.name, i] as const))(
    "%s: el content publicado es el código fuente actual",
    (name) => {
      const file = join(R_DIR, `${name}.json`);
      if (!existsSync(file)) return; // cubierto por el test de metadatos
      const published = readJson<PublishedItem>(file);
      const stale = published.files
        .filter((f) => {
          const source = join(ROOT, f.path);
          return !existsSync(source) || readFileSync(source, "utf-8") !== f.content;
        })
        .map((f) => f.path);
      expect(
        stale,
        `r/${name}.json desfasado (regenerar con shadcn build): ${stale.join(", ")}`,
      ).toEqual([]);
    },
  );
});
