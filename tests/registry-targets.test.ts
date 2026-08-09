/**
 * Guard: every registry file must declare an explicit `target` so shadcn add
 * preserves the sibling tree (components/block-zone/*, rich-section/*, …).
 * Without targets the CLI flattens by type and relative imports break (review #3063).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type RegistryFile = {
  path?: string;
  type?: string;
  target?: string;
};

type RegistryItem = {
  name?: string;
  files?: RegistryFile[];
};

type Registry = {
  items?: RegistryItem[];
};

const REQUIRED_TARGETS = [
  "@components/block-zone/block-zone.tsx",
  "@components/block-zone/registry.ts",
  "@components/block-zone/types.ts",
  "@components/block-zone/blocks-from-entry.ts",
  "@components/rich-section/rich-section.tsx",
  "@components/cta/cta.tsx",
  "@components/gallery/gallery.tsx",
  "@components/cards/cards.tsx",
  "@components/testimonials/testimonials.tsx",
] as const;

const BUILT_ITEM_NAMES = [
  "block-zone",
  "rich-section",
  "cta",
  "gallery",
  "cards",
  "testimonials",
] as const;

describe("registry install targets (#3063/#3091)", () => {
  it("every files[] entry has an explicit target", () => {
    const registry = JSON.parse(
      readFileSync(join(ROOT, "registry.json"), "utf8"),
    ) as Registry;

    const missing: string[] = [];
    for (const item of registry.items ?? []) {
      for (const file of item.files ?? []) {
        if (!file.target || !String(file.target).trim()) {
          missing.push(`${item.name}:${file.path ?? "?"}`);
        }
      }
    }

    expect(missing, `files missing target: ${missing.join(", ")}`).toEqual([]);
  });

  it("targets preserve sibling tree under @components/", () => {
    const registry = JSON.parse(
      readFileSync(join(ROOT, "registry.json"), "utf8"),
    ) as Registry;

    const targets = new Set<string>();
    for (const item of registry.items ?? []) {
      for (const file of item.files ?? []) {
        if (file.target) targets.add(file.target);
      }
    }

    for (const required of REQUIRED_TARGETS) {
      expect(targets.has(required), `missing target ${required}`).toBe(true);
    }
  });

  it("built r/*.json carries the same targets", () => {
    for (const name of BUILT_ITEM_NAMES) {
      const item = JSON.parse(
        readFileSync(join(ROOT, "r", `${name}.json`), "utf8"),
      ) as RegistryItem;
      for (const file of item.files ?? []) {
        expect(
          file.target && String(file.target).trim(),
          `${name}:${file.path} missing target in r/`,
        ).toBeTruthy();
      }
    }
  });
});
