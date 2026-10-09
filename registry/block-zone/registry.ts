import { createElement, type ComponentType, type ReactElement } from "react";
import type {
  CardsData,
  CTAData,
  FAQData,
  GalleryData,
  GrillaChild,
  GrillaData,
  RichSectionData,
  StatsData,
  StepsData,
  TestimonialsData,
} from "./types";

// Full kit smoke: install BlockZone + all canonical renderers together.
// Zone-alone without renderers is unsupported — paths assume sibling tree after
// `npx shadcn add @guaso/block-zone @guaso/rich-section @guaso/cta @guaso/gallery @guaso/cards @guaso/testimonials @guaso/faq @guaso/stats @guaso/steps @guaso/grilla`.
import RichSection from "../rich-section/rich-section";
import Gallery from "../gallery/gallery";
import Cards from "../cards/cards";
import Testimonials from "../testimonials/testimonials";
import CTABlock from "../cta/cta";
import FAQ from "../faq/faq";
import Stats from "../stats/stats";
import Steps from "../steps/steps";
import Grilla from "../grilla/grilla";

export type BlockRenderer = ComponentType<{ data: unknown; isOwner?: boolean }>;

type RegistryEntry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<{ data: any; isOwner?: boolean }>;
};

// Hijos de Grilla que nunca se pintan: CTA (contrato #4309, `GRILLA_CHILD_EXCLUDED_TYPES`)
// y Grilla (profundidad 1). El backend ya los descarta; el kit no confía solo en eso.
const GRILLA_CHILD_EXCLUDED = new Set<string>(["CTA", "Grilla"]);

/** Hijo de primer nivel de Grilla: renderiza como cualquier bloque del catálogo, o null. */
function renderGrillaChild(child: GrillaChild, isOwner: boolean): ReactElement | null {
  if (!child || typeof child !== "object" || GRILLA_CHILD_EXCLUDED.has(child.type)) {
    return null;
  }
  const Component = getBlockComponent(child.type);
  if (!Component) return null;
  // createElement: este archivo es .ts (el guard de paths exige registry.ts), no lleva JSX.
  return createElement(Component, { data: child.data ?? {}, isOwner });
}

function GrillaBlock({ data, isOwner = false }: { data: GrillaData; isOwner?: boolean }) {
  return createElement(Grilla, {
    data,
    renderChild: (child: GrillaChild) => renderGrillaChild(child, isOwner),
  });
}

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
  Grilla: {
    Component: GrillaBlock,
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
  | "Grilla"
>;
