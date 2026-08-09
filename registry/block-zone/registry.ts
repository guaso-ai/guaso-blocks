import type { ComponentType } from "react";
import type { CTAData, RichSectionData } from "./types";

// v1 smoke contract: install trio together (`@guaso/block-zone` + `rich-section` + `cta`).
// Zone-alone without the two renderers is unsupported — paths assume sibling files
// after `npx shadcn add @guaso/block-zone @guaso/rich-section @guaso/cta`.
import RichSection from "../rich-section/rich-section";
import CTABlock from "../cta/cta";

export type BlockRenderer = ComponentType<{ data: unknown; isOwner?: boolean }>;

type RegistryEntry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<{ data: any; isOwner?: boolean }>;
};

const REGISTRY_RAW: Record<string, RegistryEntry> = {
  RichSection: {
    Component: RichSection as ComponentType<{ data: RichSectionData }>,
  },
  CTA: {
    Component: CTABlock as ComponentType<{ data: CTAData }>,
  },
};

/** Lookup by block `type` (PascalCase). Unknown → undefined (forward-compat). */
export function getBlockComponent(type: string): BlockRenderer | undefined {
  const entry = REGISTRY_RAW[type];
  if (!entry) return undefined;
  return entry.Component as ComponentType<{ data: unknown; isOwner?: boolean }>;
}

export const SUPPORTED_BLOCK_TYPES = Object.keys(REGISTRY_RAW) as Array<
  "RichSection" | "CTA"
>;
