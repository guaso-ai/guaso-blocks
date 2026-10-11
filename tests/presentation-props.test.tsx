import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import RichSection from "../registry/rich-section/rich-section";
import CTA from "../registry/cta/cta";
import Gallery from "../registry/gallery/gallery";
import Cards from "../registry/cards/cards";
import Testimonials from "../registry/testimonials/testimonials";
import FAQ from "../registry/faq/faq";
import Stats from "../registry/stats/stats";
import Steps from "../registry/steps/steps";

// Presentación (#4266 corte B): tipografía en los 8 canónicos, imagen en RichSection/CTA/Gallery.
// Asserts por token exacto (no por substring): "text-4xl" no debe matchear "md:text-4xl".

const IMG = "https://example.com/a.jpg";

function tokens(el: Element | null | undefined): string[] {
  return (el?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
}

function h2Tokens(c: HTMLElement): string[] {
  return tokens(c.querySelector("h2"));
}

function imgTokens(c: HTMLElement): string[] {
  return tokens(c.querySelector("img"));
}

function imgBoxTokens(c: HTMLElement): string[] {
  return tokens(c.querySelector("img")?.parentElement);
}

type Renderer = (extra: Record<string, unknown>) => HTMLElement;

const SECTION_BLOCKS: Array<[string, Renderer]> = [
  ["RichSection", (x) => render(<RichSection data={{ title: "T", body: "b", ...x }} />).container],
  ["Gallery", (x) => render(<Gallery data={{ title: "T", images: [{ url: IMG }], ...x }} />).container],
  ["Cards", (x) => render(<Cards data={{ title: "T", cards: [{ heading: "A", text: "x" }], ...x }} />).container],
  ["Testimonials", (x) => render(<Testimonials data={{ title: "T", items: [{ author: "A", quote: "q" }], ...x }} />).container],
  ["FAQ", (x) => render(<FAQ data={{ title: "T", questions: [{ question: "q", answer: "a" }], ...x }} />).container],
  ["Stats", (x) => render(<Stats data={{ title: "T", metrics: [{ value: "1", label: "l" }], ...x }} />).container],
  ["Steps", (x) => render(<Steps data={{ title: "T", steps: [{ heading: "A", text: "x" }], ...x }} />).container],
];

// #4416 A3-c: heading desde tokens --block-text-* (fallback = Tailwind de hoy).
const SEC = {
  chico: ["text-[length:var(--block-text-chico,1.5rem)]", "md:text-[length:var(--block-text-chico-md,1.875rem)]"],
  medio: ["text-[length:var(--block-text-medio,1.875rem)]", "md:text-[length:var(--block-text-medio-md,2.25rem)]"],
  grande: ["text-[length:var(--block-text-grande,2.25rem)]", "md:text-[length:var(--block-text-grande-md,3rem)]"],
} as const;
const CTA_T = {
  chico: ["text-[length:var(--block-text-cta-chico,1.25rem)]", "md:text-[length:var(--block-text-cta-chico-md,1.5rem)]"],
  medio: ["text-[length:var(--block-text-cta-medio,1.5rem)]", "md:text-[length:var(--block-text-cta-medio-md,1.875rem)]"],
  grande: ["text-[length:var(--block-text-cta-grande,1.875rem)]", "md:text-[length:var(--block-text-cta-grande-md,2.25rem)]"],
} as const;

describe("tipografía: scale y emphasis en los 8 canónicos", () => {
  it.each(SECTION_BLOCKS)("%s: default md = escala medio por tokens, font-semibold", (_name, render) => {
    const h = h2Tokens(render({}));
    expect(h).toContain(SEC.medio[0]);
    expect(h).toContain(SEC.medio[1]);
    expect(h).toContain("font-semibold");
  });

  it.each(SECTION_BLOCKS)("%s: scale grande → tokens grande (exactos, sin medio)", (_name, render) => {
    const h = h2Tokens(render({ scale: "grande" }));
    expect(h).toContain(SEC.grande[0]);
    expect(h).toContain(SEC.grande[1]);
    expect(h).not.toContain(SEC.medio[0]);
    expect(h).not.toContain(SEC.medio[1]);
  });

  it.each(SECTION_BLOCKS)("%s: scale chico → tokens chico", (_name, render) => {
    const h = h2Tokens(render({ scale: "chico" }));
    expect(h).toContain(SEC.chico[0]);
    expect(h).toContain(SEC.chico[1]);
  });

  it.each(SECTION_BLOCKS)("%s: emphasis fuerte → font-bold, sin font-semibold", (_name, render) => {
    const h = h2Tokens(render({ emphasis: "fuerte" }));
    expect(h).toContain("font-bold");
    expect(h).not.toContain("font-semibold");
  });

  it.each(SECTION_BLOCKS)("%s: scale y emphasis fuera de set → default", (_name, render) => {
    const h = h2Tokens(render({ scale: "xl", emphasis: "x" }));
    expect(h).toContain(SEC.medio[0]);
    expect(h).toContain(SEC.medio[1]);
    expect(h).toContain("font-semibold");
  });
});

describe("CTA: escala propia (un paso menor que la sección)", () => {
  const cta = (x: Record<string, unknown>) =>
    render(<CTA data={{ headline: "H", button_label: "Ir", button_url: "/x", ...x }} />).container;

  it("default = tokens CTA medio", () => {
    const h = h2Tokens(cta({}));
    expect(h).toContain(CTA_T.medio[0]);
    expect(h).toContain(CTA_T.medio[1]);
  });

  it("grande = tokens CTA grande (exactos)", () => {
    const h = h2Tokens(cta({ scale: "grande" }));
    expect(h).toContain(CTA_T.grande[0]);
    expect(h).toContain(CTA_T.grande[1]);
    expect(h).not.toContain(CTA_T.medio[0]);
  });

  it("chico = tokens CTA chico", () => {
    const h = h2Tokens(cta({ scale: "chico" }));
    expect(h).toContain(CTA_T.chico[0]);
    expect(h).toContain(CTA_T.chico[1]);
  });

  it("emphasis fuerte → font-bold; fuera de set → default", () => {
    expect(h2Tokens(cta({ emphasis: "fuerte" }))).toContain("font-bold");
    const raro = h2Tokens(cta({ scale: "xl", emphasis: "x" }));
    expect(raro).toContain(CTA_T.medio[1]);
    expect(raro).toContain("font-semibold");
  });
});

describe("imagen en RichSection", () => {
  const rich = (x: Record<string, unknown>) =>
    render(<RichSection data={{ title: "Hola", body: "Cuerpo", image_url: IMG, ...x }} />).container;

  it("default: caja con aspect-[4/5], borde y bg-card; img object-cover sin posición", () => {
    const c = rich({});
    expect(imgBoxTokens(c)).toEqual(
      expect.arrayContaining(["relative", "aspect-[4/5]", "w-full", "overflow-hidden", "rounded-[var(--block-radius,0.5rem)]", "border", "border-border", "bg-card"]),
    );
    expect(imgTokens(c)).toEqual(expect.arrayContaining(["size-full", "object-cover"]));
    expect(imgTokens(c)).not.toContain("object-top");
  });

  it("aspect 16:9 y 1:1 reemplazan el aspect por defecto", () => {
    expect(imgBoxTokens(rich({ aspect: "16:9" }))).toContain("aspect-video");
    expect(imgBoxTokens(rich({ aspect: "16:9" }))).not.toContain("aspect-[4/5]");
    expect(imgBoxTokens(rich({ aspect: "1:1" }))).toContain("aspect-square");
  });

  it("frame sin_borde quita el borde; sombra lo reemplaza", () => {
    const sinBorde = imgBoxTokens(rich({ frame: "sin_borde" }));
    expect(sinBorde).not.toContain("border-border");
    expect(sinBorde).not.toContain("border");
    const sombra = imgBoxTokens(rich({ frame: "sombra" }));
    expect(sombra).toContain("shadow-md");
    expect(sombra).not.toContain("border-border");
  });

  it("fit contain y focal arriba/abajo/izquierda/derecha llegan al img", () => {
    expect(imgTokens(rich({ fit: "contain" }))).toContain("object-contain");
    expect(imgTokens(rich({ focal: "arriba" }))).toContain("object-top");
    expect(imgTokens(rich({ focal: "abajo" }))).toContain("object-bottom");
    expect(imgTokens(rich({ focal: "izquierda" }))).toContain("object-left");
    expect(imgTokens(rich({ focal: "derecha" }))).toContain("object-right");
  });

  it("fuera de set → default (aspect, frame, fit, focal)", () => {
    const c = rich({ aspect: "9:16", frame: "raro", fit: "fill", focal: "diagonal" });
    expect(imgBoxTokens(c)).toContain("aspect-[4/5]");
    expect(imgBoxTokens(c)).toContain("border-border");
    expect(imgTokens(c)).toContain("object-cover");
    expect(imgTokens(c)).not.toContain("object-top");
  });
});

describe("imagen en CTA", () => {
  it("split: aspect default 4:3 en el img; aspect 1:1 lo reemplaza; frame sin_borde en el wrapper", () => {
    const base = render(
      <CTA data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x" }} />,
    ).container;
    expect(imgTokens(base)).toContain("aspect-[4/3]");
    expect(imgBoxTokens(base)).toContain("border-border");

    const sq = render(
      <CTA data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x", aspect: "1:1" }} />,
    ).container;
    expect(imgTokens(sq)).toContain("aspect-square");
    expect(imgTokens(sq)).not.toContain("aspect-[4/3]");

    const sinBorde = render(
      <CTA data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x", frame: "sin_borde", fit: "contain" }} />,
    ).container;
    expect(imgBoxTokens(sinBorde)).not.toContain("border-border");
    expect(imgTokens(sinBorde)).toContain("object-contain");
  });

  it("foto (imagen absoluta de fondo): fit y focal aplican; aspect no aplica", () => {
    const c = render(
      <CTA data={{ headline: "H", style: "foto", image_url: IMG, button_label: "Ir", button_url: "/x", fit: "contain", focal: "derecha" }} />,
    ).container;
    expect(imgTokens(c)).toContain("absolute");
    expect(imgTokens(c)).toContain("object-contain");
    expect(imgTokens(c)).toContain("object-right");
  });
});

describe("imagen en Gallery", () => {
  const gal = (x: Record<string, unknown>) =>
    render(<Gallery data={{ title: "Galería", images: [{ url: IMG }], ...x }} />).container;

  it("default 4:3 en la caja; aspect 16:9 la cambia; sombra; fit y focal llegan al img", () => {
    expect(imgBoxTokens(gal({}))).toContain("aspect-[4/3]");
    expect(imgBoxTokens(gal({ aspect: "16:9" }))).toContain("aspect-video");
    expect(imgBoxTokens(gal({ frame: "sombra" }))).toContain("shadow-md");
    expect(imgTokens(gal({ fit: "contain" }))).toContain("object-contain");
    expect(imgTokens(gal({ focal: "abajo" }))).toContain("object-bottom");
  });

  it("fuera de set → default", () => {
    const c = gal({ aspect: "9:16", frame: "raro", fit: "fill", focal: "diagonal" });
    expect(imgBoxTokens(c)).toContain("aspect-[4/3]");
    expect(imgTokens(c)).toContain("object-cover");
  });
});

// Defaults = clases originales del kit (1714bc8): igualdad exacta de tokens y orden.
const H_SECTION = `font-heading ${SEC.medio[0]} font-semibold tracking-tight text-foreground text-balance ${SEC.medio[1]}`.split(" ");
const H_CTA = `font-heading ${CTA_T.medio[0]} font-semibold tracking-tight text-foreground text-balance ${CTA_T.medio[1]}`.split(" ");

describe("defaults = clases originales (igualdad exacta)", () => {
  it.each([
    ["RichSection", (x: Record<string, unknown>) => render(<RichSection data={{ title: "T", body: "b", ...x }} />).container, H_SECTION],
    ["Gallery", (x: Record<string, unknown>) => render(<Gallery data={{ title: "T", images: [{ url: IMG }], ...x }} />).container, ["mb-10", ...H_SECTION]],
    ["Cards", (x: Record<string, unknown>) => render(<Cards data={{ title: "T", cards: [{ heading: "A", text: "x" }], ...x }} />).container, H_SECTION],
    ["Testimonials", (x: Record<string, unknown>) => render(<Testimonials data={{ title: "T", items: [{ author: "A", quote: "q" }], ...x }} />).container, ["mb-10", ...H_SECTION]],
    ["FAQ", (x: Record<string, unknown>) => render(<FAQ data={{ title: "T", questions: [{ question: "q", answer: "a" }], ...x }} />).container, ["mb-8", ...H_SECTION]],
    ["Stats", (x: Record<string, unknown>) => render(<Stats data={{ title: "T", metrics: [{ value: "1", label: "l" }], ...x }} />).container, H_SECTION],
    ["Steps", (x: Record<string, unknown>) => render(<Steps data={{ title: "T", steps: [{ heading: "A", text: "x" }], ...x }} />).container, H_SECTION],
  ])("%s: h2 default exacto", (_name, mk, expected) => {
    expect(h2Tokens(mk({}))).toEqual(expected);
  });

  it("CTA: h2 default exacto", () => {
    const c = render(<CTA data={{ headline: "H", button_label: "Ir", button_url: "/x" }} />).container;
    expect(h2Tokens(c)).toEqual(H_CTA);
  });

  it("RichSection: caja e img default exactas", () => {
    const c = render(<RichSection data={{ title: "Hola", body: "Cuerpo", image_url: IMG }} />).container;
    expect(imgBoxTokens(c)).toEqual("relative aspect-[4/5] w-full overflow-hidden rounded-[var(--block-radius,0.5rem)] border border-border bg-card".split(" "));
    expect(imgTokens(c)).toEqual("size-full object-cover".split(" "));
  });

  it("Gallery: caja e img default exactas", () => {
    const c = render(<Gallery data={{ title: "G", images: [{ url: IMG }] }} />).container;
    expect(imgBoxTokens(c)).toEqual("relative aspect-[4/3] w-full overflow-hidden rounded-[var(--block-radius,0.5rem)] border border-border bg-card".split(" "));
    expect(imgTokens(c)).toEqual("size-full object-cover".split(" "));
  });

  it("CTA split: wrapper e img default exactos", () => {
    const c = render(
      <CTA data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x" }} />,
    ).container;
    expect(imgBoxTokens(c)).toEqual("overflow-hidden rounded-[var(--block-radius,0.5rem)] border border-border bg-card".split(" "));
    expect(imgTokens(c)).toEqual("aspect-[4/3] size-full object-cover".split(" "));
  });
});

describe("CTA imagen fuera de set → default", () => {
  it("aspect, frame, fit y focal inválidos caen al default del bloque", () => {
    const c = render(
      <CTA data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x", aspect: "9:16", frame: "raro", fit: "fill", focal: "diagonal" }} />,
    ).container;
    expect(imgTokens(c)).toContain("aspect-[4/3]");
    expect(imgBoxTokens(c)).toContain("border-border");
    expect(imgTokens(c)).toContain("object-cover");
    expect(imgTokens(c)).not.toContain("object-top");
  });
});
