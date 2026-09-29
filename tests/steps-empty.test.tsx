import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Steps from "../registry/steps/steps";

describe("Steps empty states (#3867)", () => {
  it("empty + !owner → null", () => {
    const { container } = render(<Steps data={{ steps: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("steps without heading or text + !owner → null", () => {
    const { container } = render(
      <Steps data={{ steps: [{ heading: " ", text: "" }] }} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("empty + isOwner → placeholder", () => {
    render(<Steps data={{ steps: [] }} isOwner />);
    expect(screen.getByText("Pasos — agregá los pasos por chat")).toBeTruthy();
  });

  it("renders an ordered list", () => {
    render(
      <Steps
        data={{
          title: "Cómo arrancar",
          intro: "Tres movimientos.",
          steps: [
            { heading: "Escribime", text: "Contame qué necesitás." },
            { heading: "Coordinamos", text: "Te paso día y hora." },
          ],
        }}
      />,
    );
    expect(screen.getByText("Cómo arrancar")).toBeTruthy();
    expect(screen.getByText("Tres movimientos.")).toBeTruthy();
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(screen.getByText("Escribime")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });
});
