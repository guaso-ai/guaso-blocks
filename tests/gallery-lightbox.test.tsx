/**
 * #4287 — Gallery abre cada imagen en el lightbox (dialog shadcn vendorizado).
 * Teclado: ← / → (vuelta cíclica), Esc cierra y devuelve el foco a la miniatura.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Gallery from "../registry/gallery/gallery";
import type { GalleryImage } from "../registry/block-zone/types";

const IMAGES: GalleryImage[] = [
  { url: "https://example.com/1.jpg", alt: "Foto 1", caption: "Primera" },
  { url: "https://example.com/2.jpg", alt: "Foto 2" },
  { url: "https://example.com/3.jpg", alt: "Foto 3" },
];

const openButtons = () =>
  screen.queryAllByRole("button").filter((b) => b.getAttribute("aria-haspopup") === "dialog");

const dialog = () => screen.getByRole("dialog");

afterEach(cleanup);

describe("Gallery lightbox (#4287)", () => {
  it("cada imagen es un botón que abre el diálogo; en reposo no hay role=dialog", () => {
    render(<Gallery data={{ images: IMAGES }} />);
    expect(openButtons()).toHaveLength(3);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("click en la imagen 1 abre el diálogo con esa imagen y contador 1 de 3", () => {
    render(<Gallery data={{ images: IMAGES }} />);
    fireEvent.click(openButtons()[0]);
    const d = dialog();
    expect(within(d).getByAltText("Foto 1")).toBeTruthy();
    expect(within(d).getByText("1 de 3")).toBeTruthy();
    expect(within(d).getByText("Primera")).toBeTruthy();
  });

  it("ArrowRight pasa a la 2; ArrowLeft desde la 1 va a la última (vuelta cíclica)", () => {
    render(<Gallery data={{ images: IMAGES }} />);
    fireEvent.click(openButtons()[0]);
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(within(dialog()).getByAltText("Foto 2")).toBeTruthy();
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();

    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(within(dialog()).getByAltText("Foto 3")).toBeTruthy();
    expect(within(dialog()).getByText("3 de 3")).toBeTruthy();
  });

  it("ArrowRight desde la última vuelve a la 1", () => {
    render(<Gallery data={{ images: IMAGES }} />);
    fireEvent.click(openButtons()[2]);
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(within(dialog()).getByAltText("Foto 1")).toBeTruthy();
  });

  it("botones Imagen siguiente / anterior navegan igual que las flechas", () => {
    render(<Gallery data={{ images: IMAGES }} />);
    fireEvent.click(openButtons()[0]);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Imagen siguiente" }));
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Imagen anterior" }));
    expect(within(dialog()).getByText("1 de 3")).toBeTruthy();
  });

  it("Escape cierra el diálogo y el foco vuelve a la miniatura 1", async () => {
    render(<Gallery data={{ images: IMAGES }} />);
    const first = openButtons()[0];
    fireEvent.click(first);
    expect(dialog().contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(first));
  });

  it("el botón Cerrar también cierra el diálogo", () => {
    render(<Gallery data={{ images: IMAGES }} />);
    fireEvent.click(openButtons()[1]);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("click fuera del panel (overlay) cierra el diálogo", async () => {
    render(<Gallery data={{ images: IMAGES }} />);
    fireEvent.click(openButtons()[0]);
    const overlay = document.querySelector('div[data-state="open"][class*="inset-0"]');
    expect(overlay).toBeTruthy();
    // Radix registra el listener de pointerdown-outside en el siguiente tick.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.pointerDown(overlay as Element);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it.each(["grilla", "masonry", "carrusel"])(
    "style=%s también abre el lightbox desde cada imagen",
    (style) => {
      render(<Gallery data={{ images: IMAGES, style }} />);
      expect(openButtons()).toHaveLength(3);
      fireEvent.click(openButtons()[2]);
      expect(within(dialog()).getByAltText("Foto 3")).toBeTruthy();
    },
  );

  it("imágenes sin url intercaladas: el botón N abre la N del array filtrado", () => {
    render(
      <Gallery
        data={{
          images: [
            { url: "https://example.com/a.jpg", alt: "A" },
            { url: "", alt: "vacía" },
            { url: "https://example.com/b.jpg", alt: "B" },
          ],
        }}
      />,
    );
    expect(openButtons()).toHaveLength(2);
    fireEvent.click(openButtons()[1]);
    expect(within(dialog()).getByAltText("B")).toBeTruthy();
    expect(within(dialog()).getByText("2 de 2")).toBeTruthy();
  });

  it("sin imágenes no hay botones de apertura", () => {
    const { container } = render(<Gallery data={{ images: [] }} />);
    expect(openButtons()).toHaveLength(0);
    expect(container.innerHTML).toBe("");
  });
});
