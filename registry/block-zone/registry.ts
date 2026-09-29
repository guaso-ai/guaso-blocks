import type { ComponentType } from "react";
import type {
  CardsData,
  CTAData,
  FAQData,
  GalleryData,
  RichSectionData,
  StatsData,
  StepsData,
  TestimonialsData,
} from "./types";

// Full kit smoke: install BlockZone + all 8 canonical renderers together.
// Zone-alone without renderers is unsupported — paths assume sibling tree after
// `npx shadcn add @guaso/block-zone @guaso/rich-section @guaso/cta @guaso/gallery @guaso/cards @guaso/testimonials @guaso/faq @guaso/stats @guaso/steps`.
import RichSection from "../rich-section/rich-section";
import Gallery from "../gallery/gallery";
import Cards from "../cards/cards";
import Testimonials from "../testimonials/testimonials";
import CTABlock from "../cta/cta";
import FAQ from "../faq/faq";
import Stats from "../stats/stats";
import Steps from "../steps/steps";

export type BlockRenderer = ComponentType<{ data: unknown; isOwner?: boolean }>;

type RegistryEntry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<{ data: any; isOwner?: boolean }>;
};

const REGISTRY_RAW: Record<string, RegistryEntry> = {
  RichSection: {
    Component: RichSection as ComponentType<{ data: RichSectionData }>,
  },
  Gallery: {
    Component: Gallery as ComponentType<{ data: GalleryData }>,
  },
  Cards: {
    Component: Cards as ComponentType<{ data: CardsData }>,
  },
  Testimonials: {
    Component: Testimonials as ComponentType<{ data: TestimonialsData }>,
  },
  CTA: {
    Component: CTABlock as ComponentType<{ data: CTAData }>,
  },
  FAQ: {
    Component: FAQ as ComponentType<{ data: FAQData }>,
  },
  Stats: {
    Component: Stats as ComponentType<{ data: StatsData }>,
  },
  Steps: {
    Component: Steps as ComponentType<{ data: StepsData }>,
  },
};

/** Lookup by block `type` (PascalCase). Unknown → undefined (forward-compat). */
export function getBlockComponent(type: string): BlockRenderer | undefined {
  const entry = REGISTRY_RAW[type];
  if (!entry) return undefined;
  return entry.Component as ComponentType<{ data: unknown; isOwner?: boolean }>;
}

export const SUPPORTED_BLOCK_TYPES = Object.keys(REGISTRY_RAW) as Array<
  | "RichSection"
  | "Gallery"
  | "Cards"
  | "Testimonials"
  | "CTA"
  | "FAQ"
  | "Stats"
  | "Steps"
>;
