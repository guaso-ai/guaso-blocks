import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Timeline from "../registry/timeline/timeline";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";

afterEach(() => cleanup());

const HITOS = {
  title: "Trayectoria",
  items: [
    { date: "2015", title: "Fundamos el local", text: "Abrimos la primera sucursal en el centro." },
    { date: "2019", title: "Segunda sucursal", text: "Sumamos un local en la zona norte." },
    { date: "2024", title: "Tienda online", text: "Lanzamos la venta por internet." },
  ],
};

describe("Timeline render (#4292)", () => {
  it("un hito → una li con fecha, título y texto; la lista es OL", () => {
    const { container } = render(
      <Timeline
        data={{
          items: [{ date: "2015", title: "Fundamos el local", text: "Abrimos la primera sucursal." }],
        }}
      />,
    );
    expect(container.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByText("2015")).toBeTruthy();
    expect(screen.getByText("Fundamos el local")).toBeTruthy();
    expect(screen.getByText("Abrimos la primera sucursal.")).toBeTruthy();
    expect(screen.getByRole("list").tagName).toBe("OL");
  });

  it("tres hitos → tres li en el orden del array", () => {
    const { container } = render(<Timeline data={HITOS} />);
    const hitos = container.querySelectorAll("li");
    expect(hitos).toHaveLength(3);
    expect(hitos[0].textContent).toContain("2015");
    expect(hitos[1].textContent).toContain("2019");
    expect(hitos[2].textContent).toContain("2024");
  });

  it("array desordenado → el DOM sigue el orden del array (el kit no ordena por date)", () => {
    const { container } = render(
      <Timeline
        data={{
          items: [
            { date: "2024", title: "Tienda online", text: "Lanzamos la venta por internet." },
            { date: "2015", title: "Fundamos el local", text: "Abrimos la primera sucursal." },
            { date: "2019", title: "Segunda sucursal", text: "Sumamos un local en la zona norte." },
          ],
        }}
      />,
    );
    const hitos = container.querySelectorAll("li");
    expect(hitos).toHaveLength(3);
    expect(hitos[0].textContent).toContain("2024");
    expect(hitos[1].textContent).toContain("2015");
    expect(hitos[2].textContent).toContain("2019");
  });

  it("descarta ítems incompletos o no-objeto; solo cuentan los válidos", () => {
    const { container } = render(
      <Timeline
        data={{
          title: "Trayectoria",
          items: [
            null,
            "suelto",
            { title: "Sin fecha", text: "x" },
            { date: "   ", title: "Fecha en blanco", text: "x" },
            { date: "2020", text: "Sin título" },
            { date: "2021", title: "Sin texto" },
            { date: "2022", title: "Válido", text: "Este sí se pinta." },
          ] as never,
        }}
      />,
    );
    expect(container.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByText("Válido")).toBeTruthy();
    expect(screen.queryByText("Sin fecha")).toBeNull();
    expect(screen.queryByText("Fecha en blanco")).toBeNull();
    expect(screen.queryByText("Sin título")).toBeNull();
    expect(screen.queryByText("Sin texto")).toBeNull();
  });
});

describe("Timeline empty states (#4292)", () => {
  it("vacío y público → null", () => {
    const { container } = render(<Timeline data={{ items: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("vacío + isOwner → placeholder", () => {
    render(<Timeline data={{ items: [] }} isOwner />);
    expect(
      screen.getByText("Línea de tiempo — agregá los hitos por chat"),
    ).toBeTruthy();
  });

  it("solo título sin hitos válidos → h2 y sin ol", () => {
    const { container } = render(
      <Timeline data={{ title: "Trayectoria", items: [{ date: "2015" }] }} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Trayectoria" })).toBeTruthy();
    expect(container.querySelector("ol")).toBeNull();
  });

  it("sin título con hitos → section con aria-label 'Línea de tiempo'", () => {
    render(<Timeline data={{ items: HITOS.items }} />);
    expect(screen.getByRole("region", { name: "Línea de tiempo" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });
});

describe("BlockZone + Timeline (catálogo)", () => {
  it("pinta Timeline junto a un tipo desconocido sin romper", () => {
    const blocks: Block[] = [
      { id: "x1", type: "TipoInexistente", enabled: true, data: { foo: "bar" } },
      { id: "t1", type: "Timeline", enabled: true, data: HITOS },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByText("Fundamos el local")).toBeTruthy();
    expect(screen.getByText("Tienda online")).toBeTruthy();
  });

  it("Timeline deshabilitado no pinta nada", () => {
    const blocks: Block[] = [
      { id: "t1", type: "Timeline", enabled: false, data: HITOS },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });
});
