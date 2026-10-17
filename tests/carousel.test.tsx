/**
 * #4288 — Carrusel del kit (embla, `registry/carousel/carousel.tsx`).
 * Render, teclado ←/→, botones en extremos y configuración del arrastre. embla corre real; el spy
 * sobre el hook solo confirma las opciones (watchDrag:true) sin cambiar el comportamiento.
 * Polyfills de matchMedia/ResizeObserver/IntersectionObserver: tests/setup/embla-jsdom.ts (global).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
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

function Harness({ items = ITEMS }: { items?: string[] }) {
  return (
    <Carousel label="Demo">
      {items.map((text) => (
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
// Extremos: el botón queda aria-disabled (sigue enfocable), no `disabled` (que saca el foco del teclado).
const isDisabled = (btn: HTMLElement) => btn.getAttribute("aria-disabled") === "true";
// Viewport = el nodo que contiene el track `-ml-6` (embla lo mide con emblaRef). Ya no es focusable.
const viewport = () => root().querySelector<HTMLElement>(".-ml-6")?.parentElement as HTMLElement;

describe("Carousel render (#4288)", () => {
  it("region con aria-roledescription carrusel y aria-label; N ítems; índice inicial 0", () => {
    render(<Harness />);
    expect(root().getAttribute("aria-roledescription")).toBe("carrusel");
    expect(screen.getByText("Uno")).toBeTruthy();
    expect(screen.getByText("Tres")).toBeTruthy();
    expect(index()).toBe(0);
  });

  it("botones Anterior y Siguiente con nombre accesible; Anterior arranca en extremo (aria-disabled)", () => {
    render(<Harness />);
    expect(isDisabled(prevBtn())).toBe(true);
    expect(isDisabled(nextBtn())).toBe(false);
  });
});

// Fix del Revisor (#4288): el viewport nacía con overflow-hidden y sin embla no había scroll (SSR / sin JS).
// Límite: `renderToStaticMarkup` muestra el HTML SSR (embla sin init, emblaApi undefined); el paso a
// overflow-hidden tras init se verifica con render() real (embla corre en jsdom). El arrastre no se prueba acá.
describe("Carousel viewport SSR / init (#4288)", () => {
  it("antes de init (HTML SSR) el viewport es overflow-x-auto y los botones nacen aria-disabled sin desaparecer", () => {
    const html = renderToStaticMarkup(<Harness />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const ssrRoot = doc.querySelector<HTMLElement>('[aria-roledescription="carrusel"]') as HTMLElement;
    const ssrViewport = ssrRoot.querySelector<HTMLElement>(".-ml-6")?.parentElement as HTMLElement;
    expect(ssrViewport.classList.contains("overflow-x-auto")).toBe(true);
    expect(ssrViewport.classList.contains("overflow-hidden")).toBe(false);
    const buttons = Array.from(ssrRoot.querySelectorAll("button"));
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Anterior", "Siguiente"]);
    expect(buttons.every((b) => b.getAttribute("aria-disabled") === "true")).toBe(true);
    expect(buttons.some((b) => b.hasAttribute("disabled"))).toBe(false);
  });

  it("tras init de embla el viewport pasa a overflow-hidden (mismo nodo)", () => {
    render(<Harness />);
    expect(viewport().classList.contains("overflow-hidden")).toBe(true);
    expect(viewport().classList.contains("overflow-x-auto")).toBe(false);
  });

  it("ningún elemento del carrusel tiene tabindex (el viewport no es focusable; ←/→ vive en el root)", () => {
    render(<Harness />);
    expect(root().querySelector("[tabindex]")).toBeNull();
  });
});

describe("Carousel teclado (#4288)", () => {
  it("ArrowRight con foco dentro avanza; ArrowLeft vuelve; ArrowLeft en el primero no baja de 0", () => {
    render(<Harness />);
    // Foco dentro del root: el botón Siguiente es el único elemento enfocable del carrusel.
    fireEvent.keyDown(nextBtn(), { key: "ArrowRight" });
    expect(index()).toBe(1);
    fireEvent.keyDown(nextBtn(), { key: "ArrowLeft" });
    expect(index()).toBe(0);
    fireEvent.keyDown(nextBtn(), { key: "ArrowLeft" });
    expect(index()).toBe(0);
  });

  // Fix del Revisor (#4288): sin preventDefault la flecha también desplaza el scroll del ancestro/página.
  // fireEvent.keyDown devuelve false cuando el evento fue cancelado (defaultPrevented).
  it("ArrowLeft y ArrowRight dentro del root llaman preventDefault; otras teclas no", () => {
    render(<Harness />);
    expect(fireEvent.keyDown(nextBtn(), { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(nextBtn(), { key: "ArrowLeft" })).toBe(false);
    expect(fireEvent.keyDown(nextBtn(), { key: "Tab" })).toBe(true);
  });
});

// Fix del Revisor (#4288): reInit al cambiar la cantidad de ítems en edición en vivo. Sin el efecto
// que llama reInit (o sin el listener que sincroniza el estado), los botones y el índice quedan stale.
describe("Carousel reInit al cambiar la cantidad de ítems (#4288)", () => {
  it("3 → 2 ítems: estando en el último, el índice se clampa al nuevo último y Siguiente queda en extremo", () => {
    const { rerender } = render(<Harness />);
    fireEvent.click(nextBtn());
    fireEvent.click(nextBtn());
    expect(index()).toBe(2);
    expect(isDisabled(nextBtn())).toBe(true);
    rerender(<Harness items={ITEMS.slice(0, 2)} />);
    expect(index()).toBe(1);
    expect(isDisabled(nextBtn())).toBe(true);
    expect(isDisabled(prevBtn())).toBe(false);
  });

  it("3 → 4 ítems: estando en el último, Siguiente se habilita de nuevo y el ítem nuevo es navegable", () => {
    const { rerender } = render(<Harness />);
    fireEvent.click(nextBtn());
    fireEvent.click(nextBtn());
    expect(isDisabled(nextBtn())).toBe(true);
    rerender(<Harness items={[...ITEMS, "Cuatro"]} />);
    expect(index()).toBe(2);
    expect(isDisabled(nextBtn())).toBe(false);
    fireEvent.click(nextBtn());
    expect(index()).toBe(3);
    expect(isDisabled(nextBtn())).toBe(true);
  });
});

describe("Carousel botones (#4288)", () => {
  it("click en Siguiente y Anterior mueve el índice; en los extremos el click no mueve nada", () => {
    render(<Harness />);
    fireEvent.click(nextBtn());
    expect(index()).toBe(1);
    expect(isDisabled(prevBtn())).toBe(false);
    fireEvent.click(nextBtn());
    expect(index()).toBe(2);
    expect(isDisabled(nextBtn())).toBe(true);
    fireEvent.click(nextBtn());
    expect(index()).toBe(2);
    fireEvent.click(prevBtn());
    expect(index()).toBe(1);
    fireEvent.click(prevBtn());
    expect(index()).toBe(0);
    expect(isDisabled(prevBtn())).toBe(true);
    fireEvent.click(prevBtn());
    expect(index()).toBe(0);
  });

  // Fix del Revisor (#4288): con `disabled`, al llegar al extremo el botón enfocado perdía el foco y
  // ←/→ (handler en el root) dejaba de andar. Con aria-disabled el botón sigue enfocable.
  it("con foco en Siguiente, llegar al último ítem no le quita el foco y ←/→ sigue moviendo el índice", () => {
    render(<Harness />);
    nextBtn().focus();
    expect(document.activeElement).toBe(nextBtn());
    fireEvent.keyDown(nextBtn(), { key: "ArrowRight" });
    fireEvent.keyDown(nextBtn(), { key: "ArrowRight" });
    expect(index()).toBe(2);
    expect(isDisabled(nextBtn())).toBe(true);
    // Límite: jsdom no reproduce el focus fixup del navegador (enfoca un `disabled` sin quejarse), así que
    // el foco real se verifica a mano. Acá se afirma la causa: el botón no puede ser `disabled` nativo.
    expect(nextBtn().hasAttribute("disabled")).toBe(false);
    expect(document.activeElement).toBe(nextBtn());
    // Enfocable en el extremo: volver con Tab/foco programático tiene que funcionar.
    nextBtn().blur();
    nextBtn().focus();
    expect(document.activeElement).toBe(nextBtn());
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" });
    expect(index()).toBe(1);
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
