import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Gallery from "../registry/gallery/gallery";
import Cards from "../registry/cards/cards";
import Testimonials from "../registry/testimonials/testimonials";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";

describe("Gallery empty states (#3091)", () => {
  it("empty + !owner → null", () => {
    const { container } = render(<Gallery data={{ images: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("non-array images + !owner → null", () => {
    const { container } = render(
      <Gallery data={{ images: undefined }} isOwner={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("images without url + !owner → null", () => {
    const { container } = render(
      <Gallery
        data={{ images: [{ url: "", alt: "x" }, { url: "  ", caption: "y" }] }}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("empty + isOwner → placeholder", () => {
    render(<Gallery data={{ images: [] }} isOwner />);
    expect(
      screen.getByText("Galería de imágenes — agregá las fotos por chat"),
    ).toBeTruthy();
  });

  it("renders images with url (happy path)", () => {
    render(
      <Gallery
        data={{
          title: "Trabajos",
          images: [
            { url: "https://example.com/a.jpg", alt: "A", caption: "Cap A" },
            { url: "", alt: "skip" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Trabajos")).toBeTruthy();
    expect(screen.getByAltText("A")).toBeTruthy();
    expect(screen.getByText("Cap A")).toBeTruthy();
    expect(screen.queryByAltText("skip")).toBeNull();
  });
});

describe("Cards empty states (#3091)", () => {
  it("empty + !owner → null", () => {
    const { container } = render(<Cards data={{ cards: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("empty + isOwner → placeholder", () => {
    render(<Cards data={{ cards: [] }} isOwner />);
    expect(
      screen.getByText("Tarjetas de contenido — agregá los ítems por chat"),
    ).toBeTruthy();
  });

  it("renders cards; link only with safeHref + label", () => {
    render(
      <Cards
        data={{
          title: "Servicios",
          cards: [
            {
              heading: "Corte",
              text: "Clásico",
              link_label: "Ver",
              link_url: "https://example.com/corte",
            },
            {
              heading: "Sin link",
              link_label: "No",
              link_url: "javascript:alert(1)",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Servicios")).toBeTruthy();
    expect(screen.getByText("Corte")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Ver" });
    expect(link.getAttribute("href")).toBe("https://example.com/corte");
    expect(screen.queryByRole("link", { name: "No" })).toBeNull();
  });
});

describe("Testimonials empty states (#3091)", () => {
  it("empty + !owner → null", () => {
    const { container } = render(<Testimonials data={{ items: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("items without quote/author + !owner → null", () => {
    const { container } = render(
      <Testimonials data={{ items: [{ role: "solo rol" }, { quote: "  " }] }} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("empty + isOwner → placeholder", () => {
    render(<Testimonials data={{ items: [] }} isOwner />);
    expect(
      screen.getByText("Testimonios — agregá las reseñas por chat"),
    ).toBeTruthy();
  });

  it("renders useful items (happy path)", () => {
    render(
      <Testimonials
        data={{
          title: "Clientes",
          items: [
            { quote: "Excelente", author: "Ana", role: "Dueña" },
            { role: "skip" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Clientes")).toBeTruthy();
    expect(screen.getByText("Excelente")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.queryByText("skip")).toBeNull();
  });
});

describe("BlockZone resolves all 5 canonical types (#3091)", () => {
  it("unknown type still ignored", () => {
    const blocks: Block[] = [
      {
        id: "blk_x",
        type: "NoSuchType",
        enabled: true,
        data: {},
      },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });

  it("Gallery / Cards / Testimonials render via registry", () => {
    const blocks: Block[] = [
      {
        id: "g1",
        type: "Gallery",
        enabled: true,
        data: { images: [{ url: "https://example.com/g.jpg", alt: "G" }] },
      },
      {
        id: "c1",
        type: "Cards",
        enabled: true,
        data: { cards: [{ heading: "Card A" }] },
      },
      {
        id: "t1",
        type: "Testimonials",
        enabled: true,
        data: { items: [{ quote: "Quote T", author: "Bob" }] },
      },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByAltText("G")).toBeTruthy();
    expect(screen.getByText("Card A")).toBeTruthy();
    expect(screen.getByText("Quote T")).toBeTruthy();
  });
});
