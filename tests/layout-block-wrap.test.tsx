import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { LayoutBlockWrap } from "../registry/block-zone/block-zone";

function wrap(data: Record<string, unknown> | null | undefined) {
  return render(
    <LayoutBlockWrap data={data}>
      <span data-testid="child">Hola</span>
    </LayoutBlockWrap>,
  ).container;
}

describe("LayoutBlockWrap (#4349)", () => {
  it("defaults (sin data, data vacío y todas en default explícito) → children sin <div> extra", () => {
    const bare = '<span data-testid="child">Hola</span>';
    expect(wrap(undefined).innerHTML).toBe(bare);
    expect(wrap(null).innerHTML).toBe(bare);
    expect(wrap({}).innerHTML).toBe(bare);
    expect(
      wrap({ surface: "neutro", width: "normal", spacing: "medio", visibility: "todos", anchor: "" })
        .innerHTML,
    ).toBe(bare);
  });

  it("valores inválidos caen a default → sin <div> extra", () => {
    expect(wrap({ surface: "rojo", spacing: 3, visibility: "oculto" }).innerHTML).toBe(
      '<span data-testid="child">Hola</span>',
    );
  });

  it("anchor-only → <div id> sin padding, sin surface ni ocultado", () => {
    const root = wrap({ anchor: "precios" });
    const div = root.firstElementChild as HTMLElement;
    expect(root.children).toHaveLength(1);
    expect(div.tagName).toBe("DIV");
    expect(div.id).toBe("precios");
    expect(div.className).toBe("empty:hidden");
    expect(div.className).not.toMatch(/py-|bg-|hidden md:/);
    expect(div.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("anchor inválido y sin otras props → sin <div> extra", () => {
    expect(wrap({ anchor: "Hero precios" }).innerHTML).toBe(
      '<span data-testid="child">Hola</span>',
    );
  });

  it("surface no default → clase de token semántico en el envoltorio", () => {
    const div = wrap({ surface: "suave" }).firstElementChild as HTMLElement;
    expect(div.tagName).toBe("DIV");
    expect(div.className).toContain("bg-muted");
    expect(div.className).toContain("text-foreground");
    expect(div.id).toBe("");
  });

  it("visibility solo_desktop → oculto bajo md", () => {
    const div = wrap({ visibility: "solo_desktop" }).firstElementChild as HTMLElement;
    expect(div.className).toContain("hidden md:block");
  });

  it("surface oscuro y acento no emiten clase de hex ni arbitrarias", () => {
    const oscuro = wrap({ surface: "oscuro" }).firstElementChild as HTMLElement;
    const acento = wrap({ surface: "acento" }).firstElementChild as HTMLElement;
    expect(oscuro.className).toContain("bg-foreground");
    expect(acento.className).toContain("bg-primary");
    expect(`${oscuro.className} ${acento.className}`).not.toMatch(/#|bg-\[|bg-gray-/);
  });
});
