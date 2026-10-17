/**
 * #4288 — Polyfills mínimos de jsdom para montar `Carousel` (embla-carousel-react) en cualquier test del kit.
 * Embla llama a `window.matchMedia` (opciones por breakpoint), `ResizeObserver` e `IntersectionObserver`
 * al init; jsdom no los trae y el render crashea. Solo rellenan lo que falta: en navegador no hacen nada.
 * La geometría (offsetWidth/offsetLeft) NO va acá: solo la necesita tests/carousel.test.tsx.
 */
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  }
}
