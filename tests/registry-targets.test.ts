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
  dependencies?: string[];
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
  "@components/gondola/types.ts",
  "@components/gondola/store-products.ts",
  "@components/gondola/product-card.tsx",
  "@components/gondola/store-catalog.tsx",
  "@components/gondola/product-detail.tsx",
  "@components/coming-soon/coming-soon.tsx",
] as const;

const BUILT_ITEM_NAMES = [
  "block-zone",
  "blocks-from-entry",
  "rich-section",
  "cta",
  "gallery",
  "cards",
  "testimonials",
  "gondola",
  "coming-soon",
] as const;

const UI_ITEM_NAMES = [
  "block-zone",
  "rich-section",
  "cta",
  "gallery",
  "cards",
  "testimonials",
  "gondola",
  "coming-soon",
] as const;

const CONTENT_DEP = "@guaso-ai/content@^0.3.0";

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

describe("npm content dep lives on the adapter item (#3579)", () => {
  it("blocks-from-entry declares @guaso-ai/content@^0.3.0; zone + skins do not", () => {
    const registry = JSON.parse(
      readFileSync(join(ROOT, "registry.json"), "utf8"),
    ) as Registry;
    const byName = new Map(
      (registry.items ?? []).map((item) => [item.name, item]),
    );

    const adapter = byName.get("blocks-from-entry");
    expect(adapter, "missing item blocks-from-entry").toBeTruthy();
    expect(adapter?.dependencies).toEqual([CONTENT_DEP]);
    expect(
      (byName.get("block-zone")?.files ?? []).map((f) => f.path),
    ).not.toContain("registry/block-zone/blocks-from-entry.ts");
    expect((adapter?.files ?? []).map((f) => f.path)).toContain(
      "registry/block-zone/blocks-from-entry.ts",
    );

    for (const name of UI_ITEM_NAMES) {
      const deps = byName.get(name)?.dependencies ?? [];
      expect(
        deps.some((d) => d.includes("@guaso-ai/content")),
        `${name} must not declare @guaso-ai/content`,
      ).toBe(false);
    }
  });

  it("zone + skins source does not import createClient", () => {
    const registry = JSON.parse(
      readFileSync(join(ROOT, "registry.json"), "utf8"),
    ) as Registry;
    const hits: string[] = [];
    for (const item of registry.items ?? []) {
      if (!UI_ITEM_NAMES.includes(item.name as (typeof UI_ITEM_NAMES)[number])) {
        continue;
      }
      for (const file of item.files ?? []) {
        if (!file.path) continue;
        const src = readFileSync(join(ROOT, file.path), "utf8");
        if (src.includes("createClient")) {
          hits.push(`${item.name}:${file.path}`);
        }
      }
    }
    expect(hits, `createClient in UI items: ${hits.join(", ")}`).toEqual([]);
  });

  it("adapter source does not import the content package", () => {
    const src = readFileSync(
      join(ROOT, "registry/block-zone/blocks-from-entry.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/@guaso-ai\/content/);
    expect(src).not.toMatch(/createClient/);
  });

  it("types.ts does not import @guaso-ai/content", () => {
    const src = readFileSync(
      join(ROOT, "registry/block-zone/types.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/from\s+["']@guaso-ai\/content/);
  });
});
