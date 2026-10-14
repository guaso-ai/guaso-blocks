/**
 * #4575 — links de bloque como URL libre en el kit. Cada bloque lee su campo único
 * (CTA `button_url`, RichSection `cta_url`, Cards `link_url`) y pasa por `safeHref`:
 * válido → `<a href>`; `javascript:` / `data:` → sin link.
 * Cobertura previa (no duplicada acá): canonical-blocks-empty.test.tsx (Cards grid/default
 * con link válido + javascript:) y rich-section-fondo.test.tsx (cta_url relativo → href).
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CTA from "../registry/cta/cta";
import RichSection from "../registry/rich-section/rich-section";
import Cards from "../registry/cards/cards";

afterEach(() => cleanup());

const IMG = "https://cdn.example.com/x.jpg";
const DANGEROUS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "data:text/html,<script>alert(1)</script>",
];

describe("CTA button_url → <a href> (#4575)", () => {
  it.each([
    ["banda", {}],
    ["split", { image_url: IMG }],
    ["foto", { image_url: IMG }],
  ])("style %s: button_url https válido → <a href> con el label", (style, extra) => {
    const { container } = render(
      <CTA
        data={{
          headline: "Trabajemos juntos",
          button_label: "Contacto",
          button_url: "https://example.com/contacto",
          style,
          ...extra,
        }}
      />,
    );
    const link = screen.getByRole("link", { name: "Contacto" });
    expect(link.getAttribute("href")).toBe("https://example.com/contacto");
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it.each(DANGEROUS)("button_url %s → sin ningún <a> (el resto del bloque sigue)", (bad) => {
    const { container } = render(
      <CTA data={{ headline: "Trabajemos juntos", button_label: "Contacto", button_url: bad }} />,
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getByText("Trabajemos juntos")).toBeTruthy();
  });
});

describe("RichSection cta_url: esquemas peligrosos → sin link (#4575)", () => {
  const base = { title: "Hola", body: "Cuerpo", cta_label: "Ver" };

  it.each(DANGEROUS)("cta_url %s → sin ningún <a>", (bad) => {
    const { container } = render(<RichSection data={{ ...base, cta_url: bad }} />);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 2, name: "Hola" })).toBeTruthy();
  });
});

describe("Cards link_url → <a href> (#4575)", () => {
  it("style minimal: link_url válido → <a href>", () => {
    render(
      <Cards
        data={{
          style: "minimal",
          cards: [
            { heading: "Corte", link_label: "Ver", link_url: "https://example.com/corte" },
          ],
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "Ver" }).getAttribute("href")).toBe(
      "https://example.com/corte",
    );
  });

  it.each(DANGEROUS)("style minimal: link_url %s → sin ningún <a>", (bad) => {
    const { container } = render(
      <Cards
        data={{
          style: "minimal",
          cards: [{ heading: "Corte", link_label: "Ver", link_url: bad }],
        }}
      />,
    );
    expect(screen.getByText("Corte")).toBeTruthy();
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("style grid (default): link_url data: → sin ningún <a>", () => {
    const { container } = render(
      <Cards
        data={{
          cards: [
            {
              heading: "Corte",
              link_label: "Ver",
              link_url: "data:text/html,<script>alert(1)</script>",
            },
          ],
        }}
      />,
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });
});
