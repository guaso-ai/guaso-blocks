import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Planes from "../registry/planes/planes";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";

afterEach(() => cleanup());

const PLANES = {
  title: "Planes",
  plans: [
    { name: "Básico", price: "$15.000/mes" },
    { name: "Pro", price: "$29.000/mes", highlighted: true },
  ],
};

describe("Planes render (#4290)", () => {
  it("una tarjeta (li) por plan con nombre y precio", () => {
    const { container } = render(<Planes data={PLANES} />);
    const tarjetas = container.querySelectorAll("li");
    expect(tarjetas).toHaveLength(2);
    expect(screen.getByText("Básico")).toBeTruthy();
    expect(screen.getByText("$15.000/mes")).toBeTruthy();
    expect(screen.getByText("Pro")).toBeTruthy();
    expect(screen.getByText("$29.000/mes")).toBeTruthy();
    expect(tarjetas[0].textContent).toContain("Básico");
    expect(tarjetas[1].textContent).toContain("Pro");
  });

  it("el título va como h2 de la sección", () => {
    render(<Planes data={PLANES} />);
    const titulo = screen.getByRole("heading", { level: 2, name: "Planes" });
    expect(titulo).toBeTruthy();
  });

  it("badge 'Más elegido' solo sobre el plan highlighted", () => {
    render(<Planes data={PLANES} />);
    const badges = screen.getAllByText("Más elegido");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("li")?.textContent).toContain("Pro");
  });

  it("sin ningún highlighted no hay badge", () => {
    render(
      <Planes
        data={{ plans: [{ name: "Básico", price: "$15.000/mes" }] }}
      />,
    );
    expect(screen.queryByText("Más elegido")).toBeNull();
  });

  it("highlighted que no es true (string) no activa el badge", () => {
    render(
      <Planes
        data={{
          plans: [
            { name: "Básico", price: "$1", highlighted: "true" as unknown as boolean },
          ],
        }}
      />,
    );
    expect(screen.queryByText("Más elegido")).toBeNull();
  });
});

describe("Planes empty states (#4290)", () => {
  it("sin planes válidos y sin título + público → null", () => {
    const { container } = render(<Planes data={{ plans: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("planes sin nombre ni precio no cuentan como válidos", () => {
    const { container } = render(
      <Planes data={{ plans: [{ name: "  ", price: "" }, { highlighted: true }] }} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("sin planes válidos + isOwner → placeholder", () => {
    render(<Planes data={{ plans: [] }} isOwner />);
    expect(
      screen.getByText("Planes — agregá los planes por chat"),
    ).toBeTruthy();
  });

  it("con título y sin planes válidos pinta el título (no null)", () => {
    render(<Planes data={{ title: "Precios", plans: [] }} />);
    expect(screen.getByText("Precios")).toBeTruthy();
  });

  it("entradas que no son objeto se descartan sin romper", () => {
    const { container } = render(
      <Planes
        data={{
          title: "Precios",
          plans: [null, "suelto", 42, { name: "Único", price: "$9" }] as never,
        }}
      />,
    );
    expect(container.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByText("Único")).toBeTruthy();
  });
});

describe("BlockZone + Planes (catálogo)", () => {
  it("pinta Planes junto a un tipo desconocido sin romper", () => {
    const blocks: Block[] = [
      { id: "x1", type: "TipoInexistente", enabled: true, data: { foo: "bar" } },
      {
        id: "p1",
        type: "Planes",
        enabled: true,
        data: { title: "Planes", plans: [{ name: "Básico", price: "$15.000/mes" }] },
      },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByText("Básico")).toBeTruthy();
    expect(screen.getByText("$15.000/mes")).toBeTruthy();
  });

  it("Planes deshabilitado no pinta nada", () => {
    const blocks: Block[] = [
      {
        id: "p1",
        type: "Planes",
        enabled: false,
        data: { plans: [{ name: "Oculto", price: "$1" }] },
      },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });
});
