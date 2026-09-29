import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Stats from "../registry/stats/stats";

describe("Stats empty states (#3867)", () => {
  it("empty + !owner → null", () => {
    const { container } = render(<Stats data={{ metrics: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("empty + isOwner → placeholder", () => {
    render(<Stats data={{ metrics: [] }} isOwner />);
    expect(
      screen.getByText("Números — agregá las cifras por chat"),
    ).toBeTruthy();
  });

  it("renders title, intro and figures", () => {
    render(
      <Stats
        data={{
          title: "En números",
          intro: "Lo que venimos haciendo.",
          metrics: [
            { value: "120", label: "alumnos" },
            { value: "8", label: "años" },
          ],
        }}
      />,
    );
    expect(screen.getByText("En números")).toBeTruthy();
    expect(screen.getByText("Lo que venimos haciendo.")).toBeTruthy();
    expect(screen.getByText("120")).toBeTruthy();
    expect(screen.getByText("alumnos")).toBeTruthy();
  });

  it("omits the figure when value is empty", () => {
    render(
      <Stats
        data={{
          title: "Trayectoria",
          metrics: [{ value: "  ", label: "sin cifra todavía" }],
        }}
      />,
    );
    expect(screen.getByText("Trayectoria")).toBeTruthy();
    expect(screen.getByText("sin cifra todavía")).toBeTruthy();
    expect(screen.queryByText("  ")).toBeNull();
  });
});
