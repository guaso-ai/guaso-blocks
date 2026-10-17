/**
 * #4288 — Carrusel del kit (embla, `registry/carousel/carousel.tsx`).
 * Render, teclado ←/→, botones en extremos y configuración del arrastre. embla corre real; el spy
 * sobre el hook solo confirma las opciones (watchDrag:true) sin cambiar el comportamiento.
 * Polyfills de matchMedia/ResizeObserver/IntersectionObserver: tests/setup/embla-jsdom.ts (global).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import useEmblaCarousel from "embla-carousel-react";
import { Carousel, CarouselItem } from "../registry/carousel/carousel";

vi.mock("embla-carousel-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("embla-carousel-react")>();
  return { default: vi.fn(actual.default) };
});

// Geometría mínima (solo este archivo): jsdom mide 0 en todo, y con 0 embla ve un solo snap y no navega.
// Cada nodo mide 300px; los slides (hijos del track `-ml-6`) quedan en serie de 300px.
const SLIDE_PX = 300;
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalOffsetLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetLeft");
const originalGetComputedStyle = window.getComputedStyle;

beforeAll(() => {
  // Embla lee margin-* del último slide con getPropertyValue; jsdom devuelve "" (NaN). Un navegador da "0px".
  // Proxy: delega todo al estilo real (testing-library usa getComputedStyle para accesibilidad).
  window.getComputedStyle = ((el: Element, pseudo?: string | null) =>
    new Proxy(originalGetComputedStyle.call(window, el, pseudo), {
      get(target, key) {
        if (key === "getPropertyValue") {
          return (name: string) => {
            const value = target.getPropertyValue(name);
            return value || (name.startsWith("margin-") ? "0px" : value);
          };
        }
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    })) as typeof window.getComputedStyle;
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return SLIDE_PX;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get(this: HTMLElement) {
      const parent = this.parentElement;
      if (!parent || !parent.classList.contains("-ml-6")) return 0;
      return Array.from(parent.children).indexOf(this) * SLIDE_PX;
    },
  });
});

afterAll(() => {
  window.getComputedStyle = originalGetComputedStyle;
  if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  if (originalOffsetLeft) Object.defineProperty(HTMLElement.prototype, "offsetLeft", originalOffsetLeft);
});

afterEach(() => {
  cleanup();
  vi.mocked(useEmblaCarousel).mockClear();
});

const ITEMS = ["Uno", "Dos", "Tres"];

function Harness() {
  return (
    <Carousel label="Demo">
      {ITEMS.map((text) => (
        <CarouselItem key={text}>
          <p>{text}</p>
        </CarouselItem>
      ))}
    </Carousel>
  );
}

const root = () => screen.getByRole("region", { name: "Demo" });
const index = () => Number(root().getAttribute("data-index"));
const nextBtn = () => screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement;
const prevBtn = () => screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement;
const viewport = () => root().querySelector<HTMLElement>('[tabindex="0"]') as HTMLElement;

describe("Carousel render (#4288)", () => {
  it("region con aria-roledescription carrusel y aria-label; N ítems; índice inicial 0", () => {
    render(<Harness />);
    expect(root().getAttribute("aria-roledescription")).toBe("carrusel");
    expect(screen.getByText("Uno")).toBeTruthy();
    expect(screen.getByText("Tres")).toBeTruthy();
    expect(index()).toBe(0);
  });

  it("botones Anterior y Siguiente con nombre accesible; Anterior arranca deshabilitado", () => {
    render(<Harness />);
    expect(prevBtn().disabled).toBe(true);
    expect(nextBtn().disabled).toBe(false);
  });
});

describe("Carousel teclado (#4288)", () => {
  it("ArrowRight con foco dentro avanza; ArrowLeft vuelve; ArrowLeft en el primero no baja de 0", () => {
    render(<Harness />);
    fireEvent.keyDown(viewport(), { key: "ArrowRight" });
    expect(index()).toBe(1);
    fireEvent.keyDown(viewport(), { key: "ArrowLeft" });
    expect(index()).toBe(0);
    fireEvent.keyDown(viewport(), { key: "ArrowLeft" });
    expect(index()).toBe(0);
  });
});

describe("Carousel botones (#4288)", () => {
  it("click en Siguiente y Anterior mueve el índice; extremos deshabilitados", () => {
    render(<Harness />);
    fireEvent.click(nextBtn());
    expect(index()).toBe(1);
    expect(prevBtn().disabled).toBe(false);
    fireEvent.click(nextBtn());
    expect(index()).toBe(2);
    expect(nextBtn().disabled).toBe(true);
    fireEvent.click(prevBtn());
    expect(index()).toBe(1);
    fireEvent.click(prevBtn());
    expect(index()).toBe(0);
    expect(prevBtn().disabled).toBe(true);
  });
});

// Fallback declarado (#4288): embla v8 escucha mousedown/mousemove/mouseup y touch*, no pointer*, y el
// flick depende de timestamps reales que jsdom no da. El arrastre se verifica a mano en navegador
// (mouse y touch); acá afirmamos la configuración que lo habilita.
describe("Carousel gesto (#4288)", () => {
  it("el hook corre con watchDrag:true, sin loop y alineado al inicio (sin autoplay)", () => {
    render(<Harness />);
    expect(useEmblaCarousel).toHaveBeenCalledWith({
      align: "start",
      loop: false,
      watchDrag: true,
    });
  });
});
