/**
 * #4567 — RichSection `fondo: completo` (hero full-bleed) con imagen y/o `video_url` de fondo.
 * Espejo de #4566 (SDK guaso-content): `fondo` normal|completo, `video_url` https .mp4/.webm.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RichSection from "../registry/rich-section/rich-section";
import {
  resolveRichFondo,
  resolveRichVideoUrl,
  sectionHeadingClass,
} from "../registry/block-zone/types";

const IMG = "https://cdn.example.com/hero.jpg";
const MP4 = "https://cdn.example.com/hero.mp4";
const WEBM = "https://cdn.example.com/hero.webm?v=2";

const base = { title: "Hola", body: "Cuerpo", cta_label: "Ver", cta_url: "/contacto" };

const hero = (x: Record<string, unknown> = {}) =>
  render(<RichSection data={{ ...base, fondo: "completo", image_url: IMG, ...x }} />).container;

const overlayOf = (c: HTMLElement) => c.querySelector(".bg-foreground\\/60");

// ─── Contraste WCAG (cálculo puro; paleta de referencia en tests, nunca en registry tsx) ───
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (rgb: number[]) =>
  0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Overlay `bg-foreground/N` compuesto sobre la imagen (alpha = N/100).
const overlayOver = (fg: number[], img: number[], alpha: number) =>
  fg.map((c, i) => alpha * c + (1 - alpha) * img[i]);

describe("RichSection fondo (#4567)", () => {
  afterEach(() => cleanup());

  describe("selección de rama", () => {
    it("fondo normal o ausente ignora video_url y no pinta overlay", () => {
      const c = render(
        <RichSection data={{ ...base, image_url: IMG, video_url: MP4 }} />,
      ).container;
      expect(c.querySelector("video")).toBeNull();
      expect(overlayOf(c)).toBeNull();

      const normal = render(
        <RichSection data={{ ...base, fondo: "normal", image_url: IMG, video_url: MP4 }} />,
      ).container;
      expect(normal.querySelector("video")).toBeNull();
      expect(overlayOf(normal)).toBeNull();
    });

    it("fondo completo con imagen → full-bleed (raíz sin contenedor centrado) + overlay", () => {
      const c = hero();
      const root = c.querySelector("section") as HTMLElement;
      expect(root.className).toContain("w-full");
      expect(root.className).not.toContain("max-w-[var(--block-container");
      expect(overlayOf(c)).not.toBeNull();
      expect(c.querySelector(`img[src="${IMG}"]`)).not.toBeNull();
    });

    it("fondo completo sin media (ni imagen ni video) → render normal, sin overlay", () => {
      const c = render(
        <RichSection data={{ ...base, fondo: "completo" }} />,
      ).container;
      expect(overlayOf(c)).toBeNull();
      expect(c.querySelector("section")?.className).toContain("max-w-[var(--block-container");
    });

    it("fondo fuera de closed-set → normal (kit-once, no explota)", () => {
      const c = hero({ fondo: "raro" });
      expect(overlayOf(c)).toBeNull();
      expect(c.querySelector("video")).toBeNull();
    });

    it("video https .mp4 → <video> decorativo con source mp4", () => {
      const c = hero({ video_url: MP4 });
      const video = c.querySelector("video") as HTMLVideoElement;
      expect(video).not.toBeNull();
      expect(video.querySelector("source")?.getAttribute("src")).toBe(MP4);
      expect(video.querySelector("source")?.getAttribute("type")).toBe("video/mp4");
      expect(video.getAttribute("poster")).toBe(IMG);
    });

    it("video .webm con query → source webm", () => {
      const c = hero({ video_url: WEBM });
      expect(c.querySelector("source")?.getAttribute("type")).toBe("video/webm");
      expect(c.querySelector("source")?.getAttribute("src")).toBe(WEBM);
    });

    it.each([
      ["http sin TLS", "http://cdn.example.com/a.mp4"],
      ["javascript:", "javascript:alert(1)//.mp4"],
      ["userinfo", "https://user:pw@cdn.example.com/a.mp4"],
      ["extensión no permitida", "https://cdn.example.com/a.mov"],
      ["comilla (breakout)", 'https://cdn.example.com/a".mp4'],
      ["espacio", "https://cdn.example.com/a .mp4"],
    ])("video_url inválido (%s) → sin <video>, cae a la imagen", (_name, bad) => {
      const c = hero({ video_url: bad });
      expect(c.querySelector("video")).toBeNull();
      expect(c.querySelector(`img[src="${IMG}"]`)).not.toBeNull();
      expect(overlayOf(c)).not.toBeNull();
    });

    it("solo video (sin imagen) → hero con video, sin <img> de fondo", () => {
      const c = render(
        <RichSection data={{ ...base, fondo: "completo", video_url: MP4 }} />,
      ).container;
      expect(c.querySelector("video")).not.toBeNull();
      expect(c.querySelector("img")).toBeNull();
      expect(overlayOf(c)).not.toBeNull();
    });

    it("solo video (sin imagen) → la raíz tiene base sólida bg-foreground bajo el overlay (reduce-motion o video caído no deja el fondo de página)", () => {
      const c = render(
        <RichSection data={{ ...base, fondo: "completo", video_url: MP4 }} />,
      ).container;
      const root = c.querySelector("section") as HTMLElement;
      // Token exacto (no `bg-foreground/60`): la base es sólida, el overlay sigue encima.
      expect(root.classList.contains("bg-foreground")).toBe(true);
      expect(overlayOf(c)).not.toBeNull();
    });
  });

  describe("tipografía y alineación sobre el overlay", () => {
    it("h2 y cuerpo usan tono inverso; el texto plano hereda text-background", () => {
      const c = hero();
      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2.className).toContain("text-background");
      expect(h2.className).not.toContain("text-foreground");
      const body = screen.getByText("Cuerpo").parentElement as HTMLElement;
      expect(body.className).toContain("text-background");
      expect(body.className).not.toContain("text-muted-foreground");
      expect(c.querySelector(".text-background")).not.toBeNull();
    });

    it("CTA inverso: borde y texto background, sin primary", () => {
      hero();
      const link = screen.getByRole("link", { name: "Ver" });
      expect(link.className).toContain("border-background");
      expect(link.className).toContain("text-background");
      expect(link.className).not.toContain("border-primary");
    });

    it("align center centra el texto del hero aunque haya imagen", () => {
      hero({ align: "center" });
      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2.parentElement?.className).toContain("items-center text-center");
    });

    it("sectionHeadingClass: default sin cambio; tono inverse cambia solo el color", () => {
      expect(sectionHeadingClass({})).toContain("text-foreground");
      expect(sectionHeadingClass({})).not.toContain("text-background");
      expect(sectionHeadingClass({}, "inverse")).toContain("text-background");
      expect(sectionHeadingClass({}, "inverse")).not.toContain("text-foreground");
    });
  });

  describe("helpers de resolución", () => {
    it("resolveRichFondo: closed-set normal|completo, resto → normal", () => {
      expect(resolveRichFondo("completo")).toBe("completo");
      expect(resolveRichFondo("normal")).toBe("normal");
      expect(resolveRichFondo("raro")).toBe("normal");
      expect(resolveRichFondo(undefined)).toBe("normal");
    });

    it("resolveRichVideoUrl acepta https .mp4/.webm y rechaza forma rota", () => {
      expect(resolveRichVideoUrl(MP4)).toBe(MP4);
      expect(resolveRichVideoUrl(WEBM)).toBe(WEBM);
      expect(resolveRichVideoUrl("https://cdn.example.com/a.mp4.exe")).toBeUndefined();
      expect(resolveRichVideoUrl("https:cdn.example.com/a.mp4")).toBeUndefined();
      expect(resolveRichVideoUrl(42)).toBeUndefined();
      expect(resolveRichVideoUrl("")).toBeUndefined();
    });
  });

  describe("a11y", () => {
    it("video decorativo: aria-hidden, sin controles, muted/loop/autoplay, se oculta con reduce-motion", () => {
      const c = hero({ video_url: MP4 });
      const video = c.querySelector("video") as HTMLVideoElement;
      expect(video.getAttribute("aria-hidden")).toBe("true");
      expect(video.hasAttribute("controls")).toBe(false);
      expect(video.muted).toBe(true);
      expect(video.hasAttribute("loop")).toBe(true);
      expect(video.hasAttribute("autoplay")).toBe(true);
      expect(video.className).toContain("motion-reduce:hidden");
    });

    it("imagen de fondo decorativa: alt vacío y aria-hidden", () => {
      const c = hero();
      const img = c.querySelector(`img[src="${IMG}"]`) as HTMLImageElement;
      expect(img.getAttribute("alt")).toBe("");
      expect(img.getAttribute("aria-hidden")).toBe("true");
    });

    it("la región tiene nombre accesible = título", () => {
      hero();
      expect(screen.getByRole("region", { name: "Hola" })).not.toBeNull();
    });

    it("AA sobre el overlay renderizado (paleta de referencia, peor caso: imagen blanca)", () => {
      const c = hero();
      // Alpha leído del DOM real, no hardcodeado: si el render cambia el overlay, esto lo detecta.
      const alpha = Number(/bg-foreground\/(\d+)/.exec(overlayOf(c)?.className ?? "")?.[1]) / 100;
      expect(alpha).toBeGreaterThan(0);
      const FG = hex("#111111"); // foreground oscuro de referencia
      const TEXT = hex("#ffffff"); // text-background de referencia
      const composite = overlayOver(FG, hex("#ffffff"), alpha);
      // Body: AA normal 4.5:1. Heading h2: texto grande, 3:1 mínimo; exigimos 4.5 igual.
      expect(contrast(TEXT, composite)).toBeGreaterThanOrEqual(4.5);
    });

    it("control negativo: un foreground medio (#555) NO alcanza AA con el mismo overlay", () => {
      const composite = overlayOver(hex("#555555"), hex("#ffffff"), 0.6);
      expect(contrast(hex("#ffffff"), composite)).toBeLessThan(4.5);
    });
  });
});
