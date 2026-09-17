import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Cards from "../registry/cards/cards";
import Testimonials from "../registry/testimonials/testimonials";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";
import {
  resolveCardsColumns,
  resolveCardsStyle,
  resolveTestimonialRating,
  resolveTestimonialsLayout,
} from "../registry/block-zone/types";

const CARDS = [
  { heading: "Card A", text: "Texto A" },
  { heading: "Card B", text: "Texto B" },
  { heading: "Card C", text: "Texto C" },
];

const ITEMS = [
  { quote: "Excelente", author: "Ana", rating: "5" },
  { quote: "Muy bueno", author: "Beto", rating: "4" },
  { quote: "Bien", author: "Ceci" },
];

afterEach(() => cleanup());

describe("resolvers kit-once (#3882)", () => {
  it("columns acepta 2/3/4, resto → 3", () => {
    expect(resolveCardsColumns("2")).toBe("2");
    expect(resolveCardsColumns("3")).toBe("3");
    expect(resolveCardsColumns("4")).toBe("4");
    expect(resolveCardsColumns("5")).toBe("3");
    expect(resolveCardsColumns("grid")).toBe("3");
    expect(resolveCardsColumns(undefined)).toBe("3");
    expect(resolveCardsColumns(3)).toBe("3");
  });

  it("style acepta grid/feature/minimal, resto → grid", () => {
    expect(resolveCardsStyle("grid")).toBe("grid");
    expect(resolveCardsStyle("feature")).toBe("feature");
    expect(resolveCardsStyle("minimal")).toBe("minimal");
    expect(resolveCardsStyle("GRID")).toBe("grid");
    expect(resolveCardsStyle(undefined)).toBe("grid");
  });

  it("layout acepta grilla/destacado/carrusel/minimal, resto → grilla", () => {
    expect(resolveTestimonialsLayout("grilla")).toBe("grilla");
    expect(resolveTestimonialsLayout("destacado")).toBe("destacado");
    expect(resolveTestimonialsLayout("carrusel")).toBe("carrusel");
    expect(resolveTestimonialsLayout("minimal")).toBe("minimal");
    expect(resolveTestimonialsLayout("grid")).toBe("grilla");
    expect(resolveTestimonialsLayout(undefined)).toBe("grilla");
  });

  it("rating acepta dígitos 1–5, resto → undefined (sin avatar)", () => {
    expect(resolveTestimonialRating("1")).toBe(1);
    expect(resolveTestimonialRating("5")).toBe(5);
    expect(resolveTestimonialRating("0")).toBeUndefined();
    expect(resolveTestimonialRating("6")).toBeUndefined();
    expect(resolveTestimonialRating("")).toBeUndefined();
    expect(resolveTestimonialRating("4.5")).toBeUndefined();
    expect(resolveTestimonialRating(undefined)).toBeUndefined();
    expect(resolveTestimonialRating(5)).toBeUndefined();
  });
});

describe("Cards variants (#3882)", () => {
  it("default (sin params) → grilla de 3 columnas", () => {
    const { container } = render(<Cards data={{ cards: CARDS }} />);
    const grid = container.querySelector("div.grid");
    expect(grid?.className).toContain("lg:grid-cols-3");
    expect(screen.getByText("Card A")).toBeTruthy();
  });

  it("columns=2 y columns=4 cambian la grilla", () => {
    const { container: c2, unmount: u2 } = render(
      <Cards data={{ cards: CARDS, columns: "2" }} />,
    );
    expect(c2.querySelector("div.grid")?.className).toContain("sm:grid-cols-2");
    expect(c2.querySelector("div.grid")?.className).not.toContain("lg:grid-cols-3");
    u2();
    const { container: c4 } = render(
      <Cards data={{ cards: CARDS, columns: "4" }} />,
    );
    expect(c4.querySelector("div.grid")?.className).toContain("lg:grid-cols-4");
  });

  it("columns fuera del closed-set → default 3", () => {
    const { container } = render(
      <Cards data={{ cards: CARDS, columns: "7" }} />,
    );
    expect(container.querySelector("div.grid")?.className).toContain(
      "lg:grid-cols-3",
    );
  });

  it("style=feature destaca la primera tarjeta", () => {
    const { container } = render(
      <Cards data={{ cards: CARDS, style: "feature" }} />,
    );
    const articles = container.querySelectorAll("article");
    expect(articles).toHaveLength(3);
    expect(articles[0].className).toContain("sm:col-span-2");
    expect(articles[1].className).not.toContain("col-span-2");
  });

  it("style=minimal renderiza lista con divisores (sin cromo de card)", () => {
    const { container } = render(
      <Cards data={{ cards: CARDS, style: "minimal" }} />,
    );
    expect(container.querySelector("div.divide-y")).toBeTruthy();
    expect(screen.getByText("Card B")).toBeTruthy();
  });

  it("style fuera del closed-set → grid", () => {
    const { container } = render(
      <Cards data={{ cards: CARDS, style: "carousel" }} />,
    );
    expect(container.querySelector("div.grid")).toBeTruthy();
    expect(container.querySelector("div.divide-y")).toBeNull();
  });
});

describe("Testimonials variants (#3882)", () => {
  it("rating válido renderiza estrellas con aria-label", () => {
    render(<Testimonials data={{ items: ITEMS }} />);
    expect(screen.getByRole("img", { name: "5 de 5 estrellas" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "4 de 5 estrellas" })).toBeTruthy();
  });

  it("rating ausente/inválido → sin estrellas", () => {
    render(
      <Testimonials
        data={{ items: [{ quote: "Sin rating", author: "X" }] }}
      />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Sin rating")).toBeTruthy();
  });

  it("layout=destacado abre el primero grande y el resto en grilla", () => {
    const { container } = render(
      <Testimonials data={{ items: ITEMS, layout: "destacado" }} />,
    );
    expect(screen.getByText("Excelente")).toBeTruthy();
    expect(container.querySelector("div.grid")).toBeTruthy();
  });

  it("layout=carrusel renderiza región con scroll-snap", () => {
    const { container } = render(
      <Testimonials data={{ items: ITEMS, layout: "carrusel" }} />,
    );
    const region = container.querySelector('[aria-roledescription="carrusel"]');
    expect(region).toBeTruthy();
    expect(region?.className).toContain("overflow-x-auto");
    expect(screen.getByText("Muy bueno")).toBeTruthy();
  });

  it("layout=minimal renderiza lista con divisores", () => {
    const { container } = render(
      <Testimonials data={{ items: ITEMS, layout: "minimal" }} />,
    );
    expect(container.querySelector("div.divide-y")).toBeTruthy();
    expect(screen.getByText("Bien")).toBeTruthy();
  });

  it("layout fuera del closed-set → grilla", () => {
    const { container } = render(
      <Testimonials data={{ items: ITEMS, layout: "featured" }} />,
    );
    expect(container.querySelector("div.grid")).toBeTruthy();
    expect(
      container.querySelector('[aria-roledescription="carrusel"]'),
    ).toBeNull();
  });
});

describe("BlockZone passthrough intacto (#3882)", () => {
  it("variantes viajan en data sin tocar BlockZone", () => {
    const blocks: Block[] = [
      {
        id: "c1",
        type: "Cards",
        enabled: true,
        data: { cards: CARDS, columns: "4", style: "feature" },
      },
      {
        id: "t1",
        type: "Testimonials",
        enabled: true,
        data: { items: ITEMS, layout: "carrusel" },
      },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.querySelector("div.grid")?.className).toContain(
      "lg:grid-cols-4",
    );
    expect(
      container.querySelector('[aria-roledescription="carrusel"]'),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: "5 de 5 estrellas" })).toBeTruthy();
  });

  it("tipo desconocido se sigue ignorando", () => {
    const blocks: Block[] = [
      { id: "x", type: "Nope", enabled: true, data: {} },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });
});
