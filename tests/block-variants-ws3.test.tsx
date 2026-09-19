import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import CTA from "../registry/cta/cta";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";
import { resolveCtaAlign, resolveCtaStyle } from "../registry/block-zone/types";

afterEach(() => cleanup());

describe("resolvers kit-once (#3884)", () => {
  it("style acepta banda/foto/split, resto → banda", () => {
    expect(resolveCtaStyle("banda")).toBe("banda");
    expect(resolveCtaStyle("foto")).toBe("foto");
    expect(resolveCtaStyle("split")).toBe("split");
    expect(resolveCtaStyle("banner")).toBe("banda");
    expect(resolveCtaStyle(undefined)).toBe("banda");
    expect(resolveCtaStyle(3)).toBe("banda");
  });

  it("align acepta left/center/right, resto → center", () => {
    expect(resolveCtaAlign("left")).toBe("left");
    expect(resolveCtaAlign("center")).toBe("center");
    expect(resolveCtaAlign("right")).toBe("right");
    expect(resolveCtaAlign("arriba")).toBe("center");
    expect(resolveCtaAlign(undefined)).toBe("center");
  });
});

describe("CTA variants (#3884)", () => {
  const copy = {
    headline: "Trabajemos juntos",
    subtext: "Escribinos y lo vemos.",
    button_label: "Contacto",
    button_url: "/contact",
  };

  it("default (sin params) → banda centrada", () => {
    render(<CTA data={copy} />);
    expect(screen.getByText("Trabajemos juntos")).toBeTruthy();
    const section = screen.getByRole("region", { name: "Trabajemos juntos" });
    expect(section.className).toMatch(/items-center|text-center|justify-center/);
  });

  it("align left/center/right mueve el bloque", () => {
    const { container: left, unmount: uLeft } = render(
      <CTA data={{ ...copy, align: "left" }} />,
    );
    expect(left.querySelector("section")?.className ?? left.innerHTML).toMatch(
      /items-start|text-left|justify-start/,
    );
    uLeft();
    const { container: right } = render(
      <CTA data={{ ...copy, align: "right" }} />,
    );
    expect(right.querySelector("section")?.className ?? right.innerHTML).toMatch(
      /items-end|text-right|justify-end/,
    );
  });

  it("style=foto con image_url pinta fondo", () => {
    const { container } = render(
      <CTA
        data={{
          ...copy,
          style: "foto",
          image_url: "https://example.com/cta.jpg",
        }}
      />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/cta.jpg");
  });

  it("style=foto sin URL pinta banda", () => {
    const { container } = render(
      <CTA data={{ ...copy, style: "foto" }} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Trabajemos juntos")).toBeTruthy();
  });

  it("style=split con URL es grilla 2 col", () => {
    const { container } = render(
      <CTA
        data={{
          ...copy,
          style: "split",
          image_url: "https://example.com/cta.jpg",
        }}
      />,
    );
    const grid = container.querySelector("div.grid");
    expect(grid?.className).toContain("md:grid-cols-2");
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("style=split sin URL deja panel bg-card", () => {
    const { container } = render(
      <CTA data={{ ...copy, style: "split" }} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".bg-card")).toBeTruthy();
  });

  it("style fuera del closed-set → banda", () => {
    render(<CTA data={{ ...copy, style: "banner" }} />);
    expect(screen.getByText("Trabajemos juntos")).toBeTruthy();
  });
});

describe("BlockZone passthrough intacto (#3884)", () => {
  it("variantes viajan en data sin tocar BlockZone", () => {
    const blocks: Block[] = [
      {
        id: "c1",
        type: "CTA",
        enabled: true,
        data: {
          headline: "Promo",
          subtext: "Hoy",
          button_label: "Ir",
          button_url: "/x",
          style: "banda",
          align: "left",
        },
      },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByText("Promo")).toBeTruthy();
  });

  it("tipo desconocido se sigue ignorando", () => {
    const blocks: Block[] = [
      { id: "x", type: "Nope", enabled: true, data: {} },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });
});
