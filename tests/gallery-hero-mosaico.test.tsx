/**
 * #4606 — Gallery `style=hero_mosaico`: 3–5 imágenes en mosaico, 6+ se cortan a 5,
 * 1–2 caen a la grilla. El resto de estilos no cambia.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Gallery from "../registry/gallery/gallery";
import { resolveGalleryStyle } from "../registry/block-zone/types";
import type { GalleryImage } from "../registry/block-zone/types";

const img = (n: number): GalleryImage => ({ url: `https://example.com/${n}.jpg`, alt: `Foto ${n}` });
const imagesN = (count: number): GalleryImage[] => Array.from({ length: count }, (_, i) => img(i + 1));

const mosaic = (container: HTMLElement) => container.querySelector('[data-layout="hero-mosaico"]');
const figures = (container: HTMLElement) => Array.from(container.querySelectorAll("figure"));
const openButtons = () =>
  screen.queryAllByRole("button").filter((b) => b.getAttribute("aria-haspopup") === "dialog");

afterEach(cleanup);

describe("resolveGalleryStyle (#4606)", () => {
  it("acepta hero_mosaico", () => {
    expect(resolveGalleryStyle("hero_mosaico")).toBe("hero_mosaico");
  });

  it("un valor fuera de set (mosaico) cae a grilla", () => {
    expect(resolveGalleryStyle("mosaico")).toBe("grilla");
  });
});

describe("Gallery hero_mosaico (#4606)", () => {
  it("3 imágenes: mosaico y la primera celda ocupa 2 filas en md", () => {
    const { container } = render(<Gallery data={{ images: imagesN(3), style: "hero_mosaico" }} />);
    expect(mosaic(container)).not.toBeNull();
    const cells = figures(container);
    expect(cells).toHaveLength(3);
    expect(cells[0].className).toContain("md:row-span-2");
    expect(cells[0].className).toContain("col-span-2");
  });

  it("4 imágenes: la segunda celda ocupa 2 filas (sin huecos)", () => {
    const { container } = render(<Gallery data={{ images: imagesN(4), style: "hero_mosaico" }} />);
    expect(mosaic(container)).not.toBeNull();
    const cells = figures(container);
    expect(cells).toHaveLength(4);
    expect(cells[1].className).toContain("row-span-2");
    expect(cells[2].className).not.toContain("row-span-2");
  });

  it("5 imágenes: 5 figuras y solo la primera celda tiene span de fila", () => {
    const { container } = render(<Gallery data={{ images: imagesN(5), style: "hero_mosaico" }} />);
    expect(mosaic(container)).not.toBeNull();
    const cells = figures(container);
    expect(cells).toHaveLength(5);
    expect(cells[0].className).toContain("md:row-span-2");
    for (const cell of cells.slice(1)) {
      expect(cell.className).not.toContain("row-span-2");
    }
  });

  it("2 imágenes: cae a la grilla (sin data-layout, columnas sm:grid-cols-2)", () => {
    const { container } = render(<Gallery data={{ images: imagesN(2), style: "hero_mosaico" }} />);
    expect(mosaic(container)).toBeNull();
    expect(container.querySelector(".sm\\:grid-cols-2")).not.toBeNull();
    expect(figures(container)).toHaveLength(2);
  });

  it("1 imagen: cae a la grilla", () => {
    const { container } = render(<Gallery data={{ images: imagesN(1), style: "hero_mosaico" }} />);
    expect(mosaic(container)).toBeNull();
    expect(container.querySelector(".sm\\:grid-cols-2")).not.toBeNull();
    expect(figures(container)).toHaveLength(1);
  });

  it("6 imágenes: muestra 5, la sexta no aparece y el lightbox cuenta 1 de 5", () => {
    const { container } = render(<Gallery data={{ images: imagesN(6), style: "hero_mosaico" }} />);
    expect(mosaic(container)).not.toBeNull();
    expect(figures(container)).toHaveLength(5);
    expect(screen.queryByAltText("Foto 6")).toBeNull();

    fireEvent.click(openButtons()[0]);
    expect(within(screen.getByRole("dialog")).getByText("1 de 5")).toBeTruthy();
  });

  it("regresión: style grilla con 6 imágenes sigue mostrando 6", () => {
    const { container } = render(<Gallery data={{ images: imagesN(6), style: "grilla" }} />);
    expect(mosaic(container)).toBeNull();
    expect(figures(container)).toHaveLength(6);
  });

  it("data.columns no cambia la grilla del mosaico", () => {
    const { container: c2 } = render(
      <Gallery data={{ images: imagesN(3), style: "hero_mosaico", columns: "2" }} />,
    );
    const cls2 = mosaic(c2)?.getAttribute("class");
    const { container: c4 } = render(
      <Gallery data={{ images: imagesN(3), style: "hero_mosaico", columns: "4" }} />,
    );
    const cls4 = mosaic(c4)?.getAttribute("class");
    expect(cls2).toBeTruthy();
    expect(cls4).toBe(cls2);
  });

  it("las URLs vacías se filtran antes del cap: 6 válidas + 2 vacías muestran 5 válidas", () => {
    const images: GalleryImage[] = [
      { url: "", alt: "vacía 1" },
      { url: "   ", alt: "vacía 2" },
      ...imagesN(6),
    ];
    const { container } = render(<Gallery data={{ images, style: "hero_mosaico" }} />);
    expect(mosaic(container)).not.toBeNull();
    expect(figures(container)).toHaveLength(5);
    expect(screen.getByAltText("Foto 1")).toBeTruthy();
    expect(screen.queryByAltText("Foto 6")).toBeNull();
  });
});
