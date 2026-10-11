import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import RichSection from "../registry/rich-section/rich-section";
import CTA from "../registry/cta/cta";
import Gallery from "../registry/gallery/gallery";
import Cards from "../registry/cards/cards";
import Steps from "../registry/steps/steps";

// Presentación (#4266 corte B): tipografía en los 8 canónicos, imagen en RichSection/CTA/Gallery.
// Defaults = render actual; valores fuera de closed-set caen al default sin error.

const IMG = "https://example.com/a.jpg";

function h2(container: HTMLElement): string {
  return container.querySelector("h2")?.className ?? "";
}

function imgClass(container: HTMLElement): string {
  return container.querySelector("img")?.className ?? "";
}

function imgBox(container: HTMLElement): string {
  return container.querySelector("img")?.parentElement?.className ?? "";
}

function rich(extra: Record<string, unknown> = {}) {
  return render(
    <RichSection data={{ title: "Hola", body: "Cuerpo", image_url: IMG, ...extra }} />,
  ).container;
}

describe("RichSection: defaults = render actual", () => {
  it("sin props, h2 y caja de imagen conservan las clases fijas", () => {
    const c = rich();
    expect(h2(c)).toContain("text-3xl");
    expect(h2(c)).toContain("md:text-4xl");
    expect(h2(c)).toContain("font-semibold");
    expect(imgBox(c)).toContain("aspect-[4/5]");
    expect(imgBox(c)).toContain("border-border");
    expect(imgClass(c)).toContain("object-cover");
    expect(imgClass(c)).not.toMatch(/object-(top|bottom|left|right|contain)/);
  });

  it("valores fuera de closed-set caen al default", () => {
    const c = rich({
      scale: "xl",
      emphasis: "x",
      aspect: "9:16",
      frame: "raro",
      fit: "fill",
      focal: "diagonal",
    });
    expect(h2(c)).toContain("text-3xl");
    expect(h2(c)).toContain("font-semibold");
    expect(imgBox(c)).toContain("aspect-[4/5]");
    expect(imgBox(c)).toContain("border-border");
    expect(imgClass(c)).toContain("object-cover");
  });
});

describe("tipografía", () => {
  it("scale chico y grande cambian el tamaño del h2", () => {
    expect(h2(rich({ scale: "chico" }))).toContain("text-2xl");
    expect(h2(rich({ scale: "chico" }))).toContain("md:text-3xl");
    expect(h2(rich({ scale: "grande" }))).toContain("text-4xl");
    expect(h2(rich({ scale: "grande" }))).toContain("md:text-5xl");
  });

  it("emphasis fuerte pasa a font-bold", () => {
    const c = rich({ emphasis: "fuerte" });
    expect(h2(c)).toContain("font-bold");
    expect(h2(c)).not.toContain("font-semibold");
  });

  it("Steps respeta scale", () => {
    const c = render(
      <Steps data={{ title: "Pasos", steps: [{ heading: "Uno", text: "x" }], scale: "grande" }} />,
    ).container;
    expect(h2(c)).toContain("text-4xl");
  });

  it("Cards respeta scale chico", () => {
    const c = render(
      <Cards data={{ title: "Servicios", cards: [{ heading: "A", text: "x" }], scale: "chico" }} />,
    ).container;
    expect(h2(c)).toContain("text-2xl");
    expect(h2(c)).toContain("md:text-3xl");
  });
});

describe("imagen en RichSection", () => {
  it("aspect 16:9 y 1:1 cambian la proporción de la caja", () => {
    expect(imgBox(rich({ aspect: "16:9" }))).toContain("aspect-video");
    expect(imgBox(rich({ aspect: "1:1" }))).toContain("aspect-square");
  });

  it("frame sin_borde quita el borde y sombra lo reemplaza", () => {
    const sinBorde = imgBox(rich({ frame: "sin_borde" }));
    expect(sinBorde).not.toContain("border-border");
    const sombra = imgBox(rich({ frame: "sombra" }));
    expect(sombra).toContain("shadow-md");
    expect(sombra).not.toContain("border-border");
  });

  it("fit contain y focal arriba/izquierda llegan al <img>", () => {
    expect(imgClass(rich({ fit: "contain" }))).toContain("object-contain");
    expect(imgClass(rich({ focal: "arriba" }))).toContain("object-top");
    expect(imgClass(rich({ focal: "izquierda" }))).toContain("object-left");
  });
});

describe("CTA", () => {
  it("h2 con escala propia (un paso menor que la sección) y default text-2xl", () => {
    const base = render(<CTA data={{ headline: "Llamado", button_label: "Ir", button_url: "/x" }} />).container;
    expect(h2(base)).toContain("text-2xl");
    expect(h2(base)).toContain("md:text-3xl");
    const grande = render(
      <CTA data={{ headline: "Llamado", button_label: "Ir", button_url: "/x", scale: "grande" }} />,
    ).container;
    expect(h2(grande)).toContain("text-3xl");
    expect(h2(grande)).toContain("md:text-4xl");
  });

  it("style split: default 4:3 y aspect 1:1 en el <img>", () => {
    const base = render(
      <CTA data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x" }} />,
    ).container;
    expect(imgClass(base)).toContain("aspect-[4/3]");
    const cuadrado = render(
      <CTA
        data={{ headline: "H", style: "split", image_url: IMG, button_label: "Ir", button_url: "/x", aspect: "1:1" }}
      />,
    ).container;
    expect(imgClass(cuadrado)).toContain("aspect-square");
  });
});

describe("Gallery", () => {
  it("default 4:3 en la caja de cada imagen; aspect 16:9 la cambia; emphasis fuerte en h2", () => {
    const base = render(
      <Gallery data={{ title: "Galería", images: [{ url: IMG }, { url: IMG }] }} />,
    ).container;
    expect(imgBox(base)).toContain("aspect-[4/3]");
    const wide = render(
      <Gallery data={{ title: "Galería", images: [{ url: IMG }], aspect: "16:9", emphasis: "fuerte" }} />,
    ).container;
    expect(imgBox(wide)).toContain("aspect-video");
    expect(h2(wide)).toContain("font-bold");
  });
});
