/**
 * #4599 — RichSection slot `offer` (oferta viva resuelta por el host).
 * El kit solo pinta el objeto recibido: no conoce productos ni formatea precios.
 * "Producto inexistente" en el kit = `offer` ausente o con campos vacíos (el
 * resolver que devuelve null es test del host, #4600).
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RichSection from "../registry/rich-section/rich-section";
import type { RichOffer, RichSectionData } from "../registry/block-zone/types";
import { OFFER_CTA_DEFAULT } from "../registry/block-zone/types";

const IMG = "https://cdn.example.com/producto.jpg";

const base: RichSectionData = { title: "Hola", body: "Cuerpo" };

const offer: RichOffer = {
  name: "Remera negra",
  priceLabel: "$ 12.500",
  imageUrl: IMG,
  href: "/store/remera-negra",
};

const withOffer = (o: Partial<RichOffer> | undefined, extra: Partial<RichSectionData> = {}) =>
  render(
    <RichSection
      data={{ ...base, ...extra, ...(o === undefined ? {} : { offer: { ...offer, ...o } }) }}
    />,
  ).container;

describe("RichSection offer slot (#4599)", () => {
  afterEach(() => cleanup());

  describe("con oferta", () => {
    it("pinta nombre (h3), precio recibido tal cual y foto", () => {
      const c = withOffer({});
      const h3 = c.querySelector("h3");
      expect(h3?.textContent).toBe("Remera negra");
      expect(screen.getByText("$ 12.500")).toBeTruthy();
      const img = c.querySelector(`img[src="${IMG}"]`);
      expect(img).not.toBeNull();
      expect(img?.getAttribute("loading")).toBe("lazy");
    });

    it("CTA sin ctaLabel usa OFFER_CTA_DEFAULT y apunta a offer.href", () => {
      expect(OFFER_CTA_DEFAULT).toBe("Ver producto");
      const c = withOffer({});
      const link = screen.getByText("Ver producto").closest("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("/store/remera-negra");
    });

    it("ctaLabel sobrescribe el texto del CTA", () => {
      withOffer({ ctaLabel: "Comprar ahora" });
      expect(screen.getByText("Comprar ahora")).toBeTruthy();
      expect(screen.queryByText("Ver producto")).toBeNull();
    });

    it("ctaLabel vacío = sin CTA (el resto de la oferta sigue)", () => {
      const c = withOffer({ ctaLabel: "" });
      expect(c.querySelector('a[href="/store/remera-negra"]')).toBeNull();
      expect(screen.getByText("$ 12.500")).toBeTruthy();
    });
  });

  describe("sin oferta", () => {
    it("offer ausente: DOM idéntico a no tener la key", () => {
      const without = render(<RichSection data={{ ...base }} />).container.innerHTML;
      cleanup();
      const undef = render(<RichSection data={{ ...base, offer: undefined }} />).container.innerHTML;
      expect(undef).toBe(without);
      expect(without).not.toContain("<h3");
      expect(without).not.toContain("Ver producto");
    });

    it("producto inexistente en el kit (campos vacíos): sin precio, foto ni CTA", () => {
      const c = withOffer({ priceLabel: "", imageUrl: "", href: "", ctaLabel: "" });
      expect(screen.queryByText("$ 12.500")).toBeNull();
      expect(c.querySelector("img")).toBeNull();
      expect(c.querySelector("a")).toBeNull();
      expect(screen.queryByText("Ver producto")).toBeNull();
    });

    it("imageUrl solo espacios = sin foto", () => {
      const c = withOffer({ imageUrl: "   " });
      expect(c.querySelector(`img[src="${IMG}"]`)).toBeNull();
    });

    it("name vacío = sin h3 de oferta pero el precio sigue", () => {
      const c = withOffer({ name: "" });
      expect(c.querySelector("h3")).toBeNull();
      expect(screen.getByText("$ 12.500")).toBeTruthy();
    });
  });

  describe("href inseguro", () => {
    it("javascript: no genera CTA de oferta", () => {
      const c = withOffer({ href: "javascript:alert(1)" });
      expect(c.querySelector("a")).toBeNull();
      expect(screen.queryByText("Ver producto")).toBeNull();
      expect(screen.getByText("$ 12.500")).toBeTruthy();
    });

    it("protocol-relative // no genera CTA de oferta", () => {
      const c = withOffer({ href: "//evil.example.com/x" });
      expect(c.querySelector("a")).toBeNull();
    });
  });

  describe("fondo completo (#4580)", () => {
    const hero = (o: Partial<RichOffer> = {}) =>
      withOffer(o, {
        fondo: "completo",
        image_url: "https://cdn.example.com/hero.jpg",
      });

    it("muestra nombre y precio, pero no el CTA de la oferta", () => {
      const c = hero();
      expect(c.querySelector("h3")?.textContent).toBe("Remera negra");
      expect(screen.getByText("$ 12.500")).toBeTruthy();
      expect(screen.queryByText("Ver producto")).toBeNull();
      expect(c.querySelector('a[href="/store/remera-negra"]')).toBeNull();
    });

    it("tono inverso: precio con text-background", () => {
      const c = hero();
      const price = screen.getByText("$ 12.500");
      expect(price.className).toContain("text-background");
    });
  });

  describe("bloque sin texto propio", () => {
    it("offer sin title ni body = no renderiza el bloque (early return intacto)", () => {
      const c = render(
        <RichSection data={{ offer }} />,
      ).container;
      expect(c.innerHTML).toBe("");
      expect(screen.queryByText("$ 12.500")).toBeNull();
    });
  });
});
