/**
 * #4284 — RichSection `movimiento: marquee`: banda con el title como texto.
 * Camino `estatico` (o ausente) = markup idéntico al de hoy; title vacío = sección normal.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RichSection from "../registry/rich-section/rich-section";
import RichMarquee from "../registry/rich-section/marquee";
import { resolveRichMovimiento } from "../registry/block-zone/types";

const TITLE = "Envío gratis en compras de más de $50.000";
const base = { title: TITLE, body: "Cuerpo de prueba", cta_label: "Ver", cta_url: "/contacto" };

const marquee = (x: Record<string, unknown> = {}) =>
  render(<RichSection data={{ ...base, movimiento: "marquee", ...x }} />).container;

const css = (c: HTMLElement) => c.querySelector("style")?.textContent ?? "";

afterEach(cleanup);

describe("RichMarquee — banda", () => {
  it("renderiza una <section> con aria-label = title y el texto en dos grupos", () => {
    const c = marquee();
    const section = c.querySelector("section");
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-label")).toBe(TITLE);

    const groups = c.querySelectorAll(".guaso-marquee-track > div");
    expect(groups).toHaveLength(2);
    expect(groups[0].textContent).toBe(TITLE);
    expect(groups[1].textContent).toBe(TITLE);
  });

  it("el segundo grupo es aria-hidden y el primero no", () => {
    const c = marquee();
    const groups = c.querySelectorAll(".guaso-marquee-track > div");
    expect(groups[0].getAttribute("aria-hidden")).toBeNull();
    expect(groups[1].getAttribute("aria-hidden")).toBe("true");
    // El lector de pantalla ve el texto una sola vez: el duplicado queda fuera del árbol accesible.
    expect(c.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });

  it("loop: keyframes translateX 0 → -50%, duración fija 30s, infinito", () => {
    const s = css(marquee());
    expect(s).toMatch(/@keyframes\s+guaso-marquee\s*{[^}]*translateX\(0\)[^}]*}/);
    expect(s).toMatch(/translateX\(-50%\)/);
    expect(s).toMatch(/animation:\s*guaso-marquee\s+30s\s+linear\s+infinite/);
  });

  it("reduced-motion vive en el CSS del componente: sin animación, segundo grupo oculto, texto con wrap", () => {
    const s = css(marquee());
    const reduced = s.slice(s.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).not.toBe("");
    expect(reduced).toMatch(/\.guaso-marquee-track\s*{[^}]*animation:\s*none/);
    expect(reduced).toMatch(/\.guaso-marquee-group\[aria-hidden="true"\]\s*{[^}]*display:\s*none/);
    expect(reduced).toMatch(/\.guaso-marquee-group\s*{[^}]*white-space:\s*normal/);
  });

  it("RichMarquee directo: props text y label", () => {
    const { container } = render(<RichMarquee text="Hola" label="Etiqueta" />);
    expect(container.querySelector("section")?.getAttribute("aria-label")).toBe("Etiqueta");
    expect(container.textContent).toContain("Hola");
  });
});

describe("RichSection — movimiento", () => {
  it("title vacío con marquee → sección normal, nunca banda vacía", () => {
    const c = marquee({ title: "" });
    expect(c.querySelector(".guaso-marquee-track")).toBeNull();
    expect(c.textContent).toContain("Cuerpo de prueba");
  });

  it("title solo espacios con marquee → sección normal", () => {
    const c = marquee({ title: "   " });
    expect(c.querySelector(".guaso-marquee-track")).toBeNull();
    expect(c.textContent).toContain("Cuerpo de prueba");
  });

  it("marquee con title: body, CTA y media no se renderizan", () => {
    const c = marquee({ image_url: "https://cdn.example.com/a.jpg" });
    expect(c.textContent).not.toContain("Cuerpo de prueba");
    expect(c.querySelector("a")).toBeNull();
    expect(c.querySelector("img")).toBeNull();
  });

  it("camino estatico explícito == ausente (markup idéntico al default)", () => {
    const sinCampo = render(<RichSection data={{ ...base }} />).container.innerHTML;
    const estatico = render(<RichSection data={{ ...base, movimiento: "estatico" }} />).container.innerHTML;
    const invalido = render(<RichSection data={{ ...base, movimiento: "pausa" as never }} />).container.innerHTML;
    expect(estatico).toBe(sinCampo);
    expect(invalido).toBe(sinCampo);
    expect(sinCampo).not.toContain("guaso-marquee");
  });

  it("resolveRichMovimiento: closed-set; fuera de set → estatico, sin lanzar", () => {
    expect(resolveRichMovimiento("estatico")).toBe("estatico");
    expect(resolveRichMovimiento("marquee")).toBe("marquee");
    for (const v of ["pausa", "MARQUEE", "", 0, null, undefined, {}]) {
      expect(() => resolveRichMovimiento(v)).not.toThrow();
      expect(resolveRichMovimiento(v)).toBe("estatico");
    }
  });
});
