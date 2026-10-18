/**
 * #4621 — La foto principal de la ficha de producto abre el lightbox del kit (GalleryLightbox).
 * Estado único `selected`: la navegación del diálogo mueve la principal y la miniatura marcada.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ProductDetail } from "../registry/gondola/product-detail";
import type { Product } from "../registry/gondola/types";

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: unknown;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children as never}
      </a>
    );
  },
}));

const URLS = [
  "https://example.com/1.jpg",
  "https://example.com/2.jpg",
  "https://example.com/3.jpg",
];

const mk = (images: string[]): Product => ({
  slug: "pieza-p",
  name: "Pieza p",
  description: "",
  price: 1000,
  quantity: 1,
  images,
  category: "Obra",
  tags: [],
  inStock: true,
  featured: false,
});

const main = () =>
  screen.getByRole("button", { name: "Ampliar foto de Pieza p", hidden: true });
const mainSrc = () =>
  main().querySelector("img")?.getAttribute("src");
const thumb = (n: number) =>
  screen.getByRole("button", { name: `Ver foto ${n} de Pieza p`, hidden: true });
const dialog = () => screen.getByRole("dialog");

const renderDetail = (images: string[] = URLS) =>
  render(<ProductDetail product={mk(images)} currencySymbol="$" />);

afterEach(() => {
  cleanup();
});

describe("gondola ProductDetail lightbox (#4621)", () => {
  it("la foto principal es un botón ampliable; en reposo no hay role=dialog", () => {
    renderDetail();
    expect(main().getAttribute("aria-haspopup")).toBe("dialog");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sin imágenes no hay botón de ampliar", () => {
    renderDetail([]);
    expect(
      screen.queryByRole("button", { name: /^Ampliar foto/, hidden: true }),
    ).toBeNull();
  });

  it("una sola foto: la principal sigue siendo ampliable y no hay botones Ver foto", () => {
    renderDetail([URLS[0]]);
    expect(main()).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Ver foto/, hidden: true })).toBeNull();
  });

  it("click en la principal abre el diálogo con la imagen 1 y el contador 1 de 3", () => {
    renderDetail();
    fireEvent.click(main());
    const d = dialog();
    expect(within(d).getByAltText("Pieza p 1")).toBeTruthy();
    expect(within(d).getByText("1 de 3")).toBeTruthy();
  });

  it("miniatura 2 y luego click en la principal abre en 2 de 3 con alt Pieza p 2", () => {
    renderDetail();
    fireEvent.click(thumb(2));
    fireEvent.click(main());
    expect(within(dialog()).getByAltText("Pieza p 2")).toBeTruthy();
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();
  });

  it("ArrowRight en el diálogo: 2 de 3, la principal pasa a la 2 y la miniatura 2 queda marcada", () => {
    renderDetail();
    fireEvent.click(main());
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();
    expect(mainSrc()).toBe(URLS[1]);
    expect(thumb(2).getAttribute("aria-current")).toBe("true");
  });

  it("ArrowLeft desde la 1 va a la 3 (vuelta cíclica) y la principal sincroniza", () => {
    renderDetail();
    fireEvent.click(main());
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(within(dialog()).getByText("3 de 3")).toBeTruthy();
    expect(mainSrc()).toBe(URLS[2]);
  });

  it("botones Imagen siguiente / anterior sincronizan la principal igual que las flechas", () => {
    renderDetail();
    fireEvent.click(main());
    fireEvent.click(within(dialog()).getByRole("button", { name: "Imagen siguiente" }));
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();
    expect(mainSrc()).toBe(URLS[1]);
    fireEvent.click(within(dialog()).getByRole("button", { name: "Imagen anterior" }));
    expect(within(dialog()).getByText("1 de 3")).toBeTruthy();
    expect(mainSrc()).toBe(URLS[0]);
  });

  it("Escape cierra y el foco vuelve a la foto principal", async () => {
    renderDetail();
    fireEvent.click(main());
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(main()));
  });

  it("el botón Cerrar también cierra el diálogo", () => {
    renderDetail();
    fireEvent.click(main());
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("regresión #3888: click en miniatura cambia la principal y no abre diálogo", () => {
    renderDetail();
    fireEvent.click(thumb(2));
    expect(mainSrc()).toBe(URLS[1]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reabrir después de navegar abre en la última vista (no en la inicial)", () => {
    renderDetail();
    fireEvent.click(main());
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(main());
    expect(within(dialog()).getByText("2 de 3")).toBeTruthy();
    expect(within(dialog()).getByAltText("Pieza p 2")).toBeTruthy();
  });

  it("clamp: con la 3 seleccionada y 2 imágenes, la principal abre en 2 de 2", () => {
    const { rerender } = renderDetail();
    fireEvent.click(thumb(3));
    rerender(<ProductDetail product={mk(URLS.slice(0, 2))} currencySymbol="$" />);
    fireEvent.click(main());
    expect(within(dialog()).getByText("2 de 2")).toBeTruthy();
    expect(within(dialog()).getByAltText("Pieza p 2")).toBeTruthy();
  });
});
