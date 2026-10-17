/**
 * #4289 — BeforeAfter del kit: slider antes/después con role="slider".
 * Teclado ←/→ ±5, Home 0, End 100, clamp en extremos; pointer sobre el marco; SSR sin window en render.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BeforeAfter,
  BEFORE_AFTER_STEP,
  clampPosition,
  stepPosition,
} from "../registry/before-after/before-after";

// jsdom no trae PointerEvent: polyfill mínimo sobre MouseEvent para que clientX/pointerId lleguen a React.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  Object.defineProperty(window, "PointerEvent", { value: PointerEventPolyfill, configurable: true });
}

const BASE = {
  beforeUrl: "https://example.com/antes.jpg",
  afterUrl: "https://example.com/despues.jpg",
};

const slider = () => screen.getByRole("slider");
const frameOf = () => slider().parentElement as HTMLElement;
const valueNow = () => Number(slider().getAttribute("aria-valuenow"));

const stubRect = (frame: HTMLElement, left = 0, width = 200) =>
  vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({
    left,
    top: 0,
    width,
    height: 100,
    right: left + width,
    bottom: 100,
    x: left,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);

afterEach(cleanup);

describe("BeforeAfter render (#4289)", () => {
  it("pinta dos imágenes y un slider en 50 por default", () => {
    render(<BeforeAfter {...BASE} />);
    expect(screen.getByAltText("Antes").getAttribute("src")).toBe(BASE.beforeUrl);
    expect(screen.getByAltText("Después").getAttribute("src")).toBe(BASE.afterUrl);
    expect(slider().getAttribute("aria-valuenow")).toBe("50");
    expect(slider().getAttribute("aria-valuemin")).toBe("0");
    expect(slider().getAttribute("aria-valuemax")).toBe("100");
    expect(slider().getAttribute("tabindex")).toBe("0");
  });

  it("aria-label fallback 'Comparación'; el host puede pasar el suyo", () => {
    const { unmount } = render(<BeforeAfter {...BASE} />);
    expect(slider().getAttribute("aria-label")).toBe("Comparación");
    unmount();
    render(<BeforeAfter {...BASE} label="Antes y después del tratamiento" />);
    expect(slider().getAttribute("aria-label")).toBe("Antes y después del tratamiento");
  });

  it("alts fallback 'Antes' / 'Después'; el host puede pasar los suyos", () => {
    render(<BeforeAfter {...BASE} beforeAlt="Pared original" afterAlt="Pared pintada" />);
    expect(screen.getByAltText("Pared original")).toBeTruthy();
    expect(screen.getByAltText("Pared pintada")).toBeTruthy();
  });

  it("chips beforeLabel/afterLabel solo se pintan si el host los pasa", () => {
    const { unmount } = render(<BeforeAfter {...BASE} />);
    expect(screen.queryByText("Antes")).toBeNull();
    unmount();
    render(<BeforeAfter {...BASE} beforeLabel="Antes" afterLabel="Después" />);
    expect(screen.getByText("Antes")).toBeTruthy();
    expect(screen.getByText("Después")).toBeTruthy();
  });

  it("devuelve null si falta alguna URL (el host pone el placeholder)", () => {
    const { container, unmount } = render(<BeforeAfter {...BASE} beforeUrl="" />);
    expect(container.firstChild).toBeNull();
    unmount();
    const second = render(<BeforeAfter {...BASE} afterUrl="" />);
    expect(second.container.firstChild).toBeNull();
  });

  it("initialPosition se clampea (150 → 100, -20 → 0, no numérico → 50)", () => {
    const { unmount } = render(<BeforeAfter {...BASE} initialPosition={150} />);
    expect(valueNow()).toBe(100);
    unmount();
    const low = render(<BeforeAfter {...BASE} initialPosition={-20} />);
    expect(Number(low.container.querySelector('[role="slider"]')?.getAttribute("aria-valuenow"))).toBe(0);
    low.unmount();
    render(<BeforeAfter {...BASE} initialPosition={Number.NaN} />);
    expect(valueNow()).toBe(50);
  });

  it("el divisor queda en left = posición y la imagen 'antes' recorta con clip-path", () => {
    render(<BeforeAfter {...BASE} initialPosition={30} />);
    expect(slider().style.left).toBe("30%");
    const before = screen.getByAltText("Antes");
    expect(before.getAttribute("style")).toContain("inset(0 70% 0 0)");
  });

  it("SSR: renderToStaticMarkup no rompe y trae el slider", () => {
    const html = renderToStaticMarkup(<BeforeAfter {...BASE} />);
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuenow="50"');
  });
});

describe("BeforeAfter teclado (#4289)", () => {
  it("←/→ mueven ±5 y ↑/↓ también", () => {
    render(<BeforeAfter {...BASE} />);
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(valueNow()).toBe(50 + BEFORE_AFTER_STEP);
    fireEvent.keyDown(slider(), { key: "ArrowLeft" });
    fireEvent.keyDown(slider(), { key: "ArrowLeft" });
    expect(valueNow()).toBe(45);
    fireEvent.keyDown(slider(), { key: "ArrowUp" });
    expect(valueNow()).toBe(50);
    fireEvent.keyDown(slider(), { key: "ArrowDown" });
    expect(valueNow()).toBe(45);
  });

  it("Home lleva a 0 y End a 100", () => {
    render(<BeforeAfter {...BASE} />);
    fireEvent.keyDown(slider(), { key: "Home" });
    expect(valueNow()).toBe(0);
    fireEvent.keyDown(slider(), { key: "End" });
    expect(valueNow()).toBe(100);
  });

  it("clamp en los extremos: ←/→ no pasan de 0 ni de 100", () => {
    render(<BeforeAfter {...BASE} initialPosition={98} />);
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(valueNow()).toBe(100);
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(valueNow()).toBe(100);
    fireEvent.keyDown(slider(), { key: "Home" });
    fireEvent.keyDown(slider(), { key: "ArrowLeft" });
    expect(valueNow()).toBe(0);
  });

  it("preventDefault solo en teclas manejadas (no scrollea la página)", () => {
    render(<BeforeAfter {...BASE} />);
    expect(fireEvent.keyDown(slider(), { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(slider(), { key: "End" })).toBe(false);
    expect(fireEvent.keyDown(slider(), { key: "a" })).toBe(true);
    expect(valueNow()).toBe(100);
  });

  it("el divisor conserva el foco al moverse con teclado", () => {
    render(<BeforeAfter {...BASE} />);
    slider().focus();
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(document.activeElement).toBe(slider());
  });
});

describe("BeforeAfter pointer (#4289)", () => {
  it("arrastre sobre el marco mueve el divisor según getBoundingClientRect", () => {
    render(<BeforeAfter {...BASE} />);
    stubRect(frameOf(), 0, 200);
    fireEvent.pointerDown(frameOf(), { clientX: 150, pointerId: 1 });
    expect(valueNow()).toBe(75);
    fireEvent.pointerMove(frameOf(), { clientX: 50, pointerId: 1 });
    expect(valueNow()).toBe(25);
  });

  it("el marco con offset: la posición se mide desde su borde izquierdo", () => {
    render(<BeforeAfter {...BASE} />);
    stubRect(frameOf(), 100, 200);
    fireEvent.pointerDown(frameOf(), { clientX: 200, pointerId: 1 });
    expect(valueNow()).toBe(50);
  });

  it("sin arrastre activo, pointermove no mueve el divisor; pointerup corta el arrastre", () => {
    render(<BeforeAfter {...BASE} />);
    stubRect(frameOf(), 0, 200);
    fireEvent.pointerMove(frameOf(), { clientX: 180, pointerId: 1 });
    expect(valueNow()).toBe(50);
    fireEvent.pointerDown(frameOf(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(frameOf(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(frameOf(), { clientX: 10, pointerId: 1 });
    expect(valueNow()).toBe(50);
  });

  it("clampea el arrastre fuera del marco a 0 / 100", () => {
    render(<BeforeAfter {...BASE} />);
    stubRect(frameOf(), 0, 200);
    fireEvent.pointerDown(frameOf(), { clientX: 400, pointerId: 1 });
    expect(valueNow()).toBe(100);
    fireEvent.pointerMove(frameOf(), { clientX: -50, pointerId: 1 });
    expect(valueNow()).toBe(0);
  });
});

describe("BeforeAfter funciones puras (#4289)", () => {
  it("clampPosition: no numérico o NaN → 50; fuera de rango → 0 / 100; en rango se respeta", () => {
    expect(clampPosition(undefined)).toBe(50);
    expect(clampPosition("30")).toBe(50);
    expect(clampPosition(Number.NaN)).toBe(50);
    expect(clampPosition(-5)).toBe(0);
    expect(clampPosition(120)).toBe(100);
    expect(clampPosition(Number.POSITIVE_INFINITY)).toBe(100);
    expect(clampPosition(33)).toBe(33);
  });

  it("stepPosition: flechas ±5, Home 0, End 100, tecla no manejada → null", () => {
    expect(stepPosition(50, "ArrowRight")).toBe(55);
    expect(stepPosition(50, "ArrowUp")).toBe(55);
    expect(stepPosition(50, "ArrowLeft")).toBe(45);
    expect(stepPosition(50, "ArrowDown")).toBe(45);
    expect(stepPosition(50, "Home")).toBe(0);
    expect(stepPosition(50, "End")).toBe(100);
    expect(stepPosition(98, "ArrowRight")).toBe(100);
    expect(stepPosition(2, "ArrowLeft")).toBe(0);
    expect(stepPosition(50, "Enter")).toBeNull();
  });
});
