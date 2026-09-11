import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ComingSoon from "../registry/coming-soon/coming-soon";

afterEach(() => {
  cleanup();
});

describe("ComingSoon lockup (#3836)", () => {
  it("renders wolf SVG lockup + Guaso wordmark, not a dot", () => {
    const { container } = render(<ComingSoon siteName="Taller Norte" />);
    expect(screen.getByText("Taller Norte")).toBeTruthy();
    expect(screen.getByText("Próximamente")).toBeTruthy();
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 400 400");
    const path = svg?.querySelector("path");
    expect(path?.getAttribute("fill")).toBe("currentColor");
    expect(path?.getAttribute("d") ?? "").toContain("209.701584");
    expect(screen.getByText("Guaso")).toBeTruthy();
    expect(screen.getByText("Hecho con Guaso")).toBeTruthy();
    expect(container.querySelector(".rounded-full")).toBeNull();
  });

  it("applies wordmarkClassName on the Guaso span", () => {
    render(<ComingSoon wordmarkClassName="font-jost" />);
    expect(screen.getByText("Guaso").className).toContain("font-jost");
  });

  it("falls back site name when empty", () => {
    render(<ComingSoon siteName="  " />);
    expect(screen.getByText("Este sitio")).toBeTruthy();
  });
});
