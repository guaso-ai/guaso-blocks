import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FAQ from "../registry/faq/faq";

describe("FAQ empty states (#3867)", () => {
  it("empty + !owner → null", () => {
    const { container } = render(<FAQ data={{ questions: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("questions without text + !owner → null", () => {
    const { container } = render(
      <FAQ data={{ questions: [{ question: "  ", answer: "" }] }} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("empty + isOwner → placeholder", () => {
    render(<FAQ data={{ questions: [] }} isOwner />);
    expect(
      screen.getByText("Preguntas — agregá las preguntas por chat"),
    ).toBeTruthy();
  });

  it("renders an accordion with the first item open", () => {
    render(
      <FAQ
        data={{
          title: "Dudas",
          questions: [
            { question: "¿Atienden sábados?", answer: "Sí, hasta el mediodía." },
            { question: "¿Hay turno?", answer: "Por chat." },
          ],
        }}
      />,
    );
    expect(screen.getByText("Dudas")).toBeTruthy();
    const first = screen.getByText("¿Atienden sábados?").closest("details");
    const second = screen.getByText("¿Hay turno?").closest("details");
    expect(first?.hasAttribute("open")).toBe(true);
    expect(second?.hasAttribute("open")).toBe(false);
    expect(screen.getByText("Sí, hasta el mediodía.")).toBeTruthy();
  });
});
