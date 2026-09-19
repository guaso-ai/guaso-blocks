import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Gallery from "../registry/gallery/gallery";
import RichSection from "../registry/rich-section/rich-section";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";
import {
  resolveGalleryColumns,
  resolveGalleryStyle,
  resolveRichImageSide,
  resolveRichMode,
} from "../registry/block-zone/types";

const IMAGES = [
  { url: "https://example.com/a.jpg", alt: "Foto A", caption: "A" },
  { url: "https://example.com/b.jpg", alt: "Foto B", caption: "B" },
  { url: "https://example.com/c.jpg", alt: "Foto C", caption: "C" },
];

afterEach(() => cleanup());

describe("resolvers kit-once (#3883)", () => {
  it("columns acepta 2/3/4, resto → 3", () => {
    expect(resolveGalleryColumns("2")).toBe("2");
    expect(resolveGalleryColumns("3")).toBe("3");
    expect(resolveGalleryColumns("4")).toBe("4");
    expect(resolveGalleryColumns("5")).toBe("3");
    expect(resolveGalleryColumns("grilla")).toBe("3");
    expect(resolveGalleryColumns(undefined)).toBe("3");
    expect(resolveGalleryColumns(3)).toBe("3");
  });

  it("style acepta grilla/masonry/carrusel, resto → grilla", () => {
    expect(resolveGalleryStyle("grilla")).toBe("grilla");
    expect(resolveGalleryStyle("masonry")).toBe("masonry");
    expect(resolveGalleryStyle("carrusel")).toBe("carrusel");
    expect(resolveGalleryStyle("mosaico")).toBe("grilla");
    expect(resolveGalleryStyle(undefined)).toBe("grilla");
  });

  it("image_side acepta left/right, resto → right", () => {
    expect(resolveRichImageSide("left")).toBe("left");
    expect(resolveRichImageSide("right")).toBe("right");
    expect(resolveRichImageSide("arriba")).toBe("right");
    expect(resolveRichImageSide(undefined)).toBe("right");
  });

  it("mode acepta split/centrado/checklist, resto → split", () => {
    expect(resolveRichMode("split")).toBe("split");
    expect(resolveRichMode("centrado")).toBe("centrado");
    expect(resolveRichMode("checklist")).toBe("checklist");
    expect(resolveRichMode("banner")).toBe("split");
    expect(resolveRichMode(undefined)).toBe("split");
  });
});

describe("Gallery variants (#3883)", () => {
  it("default (sin params) → grilla de 3 columnas", () => {
    const { container } = render(<Gallery data={{ images: IMAGES }} />);
    const grid = container.querySelector("div.grid");
    expect(grid?.className).toContain("lg:grid-cols-3");
    expect(screen.getByAltText("Foto A")).toBeTruthy();
  });

  it("columns=2 y columns=4 cambian la grilla", () => {
    const { container: c2, unmount: u2 } = render(
      <Gallery data={{ images: IMAGES, columns: "2" }} />,
    );
    expect(c2.querySelector("div.grid")?.className).toContain("sm:grid-cols-2");
    expect(c2.querySelector("div.grid")?.className).not.toContain(
      "lg:grid-cols-3",
    );
    u2();
    const { container: c4 } = render(
      <Gallery data={{ images: IMAGES, columns: "4" }} />,
    );
    expect(c4.querySelector("div.grid")?.className).toContain("lg:grid-cols-4");
  });

  it("columns fuera del closed-set → default 3", () => {
    const { container } = render(
      <Gallery data={{ images: IMAGES, columns: "7" }} />,
    );
    expect(container.querySelector("div.grid")?.className).toContain(
      "lg:grid-cols-3",
    );
  });

  it("style=masonry usa CSS columns-*", () => {
    const { container } = render(
      <Gallery data={{ images: IMAGES, style: "masonry" }} />,
    );
    const masonry = container.querySelector("[class*='columns-']");
    expect(masonry).toBeTruthy();
    expect(container.querySelector("div.grid")).toBeNull();
  });

  it("style=carrusel renderiza región con overflow-x", () => {
    const { container } = render(
      <Gallery data={{ images: IMAGES, style: "carrusel" }} />,
    );
    const region = container.querySelector('[aria-roledescription="carrusel"]');
    expect(region).toBeTruthy();
    expect(region?.className).toContain("overflow-x-auto");
    expect(screen.getByAltText("Foto B")).toBeTruthy();
  });

  it("style fuera del closed-set → grilla", () => {
    const { container } = render(
      <Gallery data={{ images: IMAGES, style: "mosaico" }} />,
    );
    expect(container.querySelector("div.grid")).toBeTruthy();
    expect(
      container.querySelector('[aria-roledescription="carrusel"]'),
    ).toBeNull();
  });
});

describe("RichSection variants (#3883)", () => {
  it("mode=split default pone la imagen como 2º hijo (image_side=right)", () => {
    const { container } = render(
      <RichSection
        data={{
          title: "Título",
          body: "Cuerpo",
          image_url: "https://example.com/x.jpg",
        }}
      />,
    );
    const grid = container.querySelector("div.grid");
    expect(grid).toBeTruthy();
    const kids = grid ? Array.from(grid.children) : [];
    expect(kids).toHaveLength(2);
    expect(kids[1].querySelector("img")).toBeTruthy();
  });

  it("image_side=left pone la imagen primero", () => {
    const { container } = render(
      <RichSection
        data={{
          title: "Título",
          body: "Cuerpo",
          image_url: "https://example.com/x.jpg",
          image_side: "left",
        }}
      />,
    );
    const grid = container.querySelector("div.grid");
    const kids = grid ? Array.from(grid.children) : [];
    expect(kids[0].querySelector("img")).toBeTruthy();
  });

  it("mode=centrado es una columna; image_side no aplica", () => {
    const { container } = render(
      <RichSection
        data={{
          title: "Título",
          body: "Cuerpo",
          image_url: "https://example.com/x.jpg",
          mode: "centrado",
          image_side: "left",
        }}
      />,
    );
    const grid = container.querySelector("div.grid");
    expect(grid?.className ?? "").not.toContain("md:grid-cols-2");
    expect(screen.getByText("Título")).toBeTruthy();
  });

  it("mode=checklist respeta image_side y pinta ul/li del body", () => {
    const { container } = render(
      <RichSection
        data={{
          title: "Título",
          body: "- uno\n- dos",
          image_url: "https://example.com/x.jpg",
          mode: "checklist",
          image_side: "left",
        }}
      />,
    );
    const grid = container.querySelector("div.grid");
    const kids = grid ? Array.from(grid.children) : [];
    expect(kids[0].querySelector("img")).toBeTruthy();
    expect(container.querySelector("ul")).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("mode fuera del closed-set → split", () => {
    const { container } = render(
      <RichSection
        data={{
          title: "Título",
          body: "Cuerpo",
          image_url: "https://example.com/x.jpg",
          mode: "banner",
        }}
      />,
    );
    expect(container.querySelector("div.grid")?.className).toContain(
      "md:grid-cols-2",
    );
  });
});

describe("BlockZone passthrough intacto (#3883)", () => {
  it("variantes viajan en data sin tocar BlockZone", () => {
    const blocks: Block[] = [
      {
        id: "g1",
        type: "Gallery",
        enabled: true,
        data: { images: IMAGES, columns: "4", style: "grilla" },
      },
      {
        id: "r1",
        type: "RichSection",
        enabled: true,
        data: {
          title: "Título",
          body: "Cuerpo",
          image_url: "https://example.com/x.jpg",
          image_side: "left",
          mode: "split",
        },
      },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.querySelector("div.grid")?.className).toContain(
      "lg:grid-cols-4",
    );
    const grids = container.querySelectorAll("div.grid");
    const richGrid = grids[1];
    const kids = richGrid ? Array.from(richGrid.children) : [];
    expect(kids[0]?.querySelector("img")).toBeTruthy();
  });

  it("tipo desconocido se sigue ignorando", () => {
    const blocks: Block[] = [
      { id: "x", type: "Nope", enabled: true, data: {} },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });
});
