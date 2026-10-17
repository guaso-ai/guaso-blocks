/**
 * #4291 — Menú por categorías con tabs (shadcn Radix Tabs vendorizado en el kit).
 * Render de categorías/ítems/precios, degradación sin datos válidos y navegación por teclado.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Menu from "../registry/menu/menu";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";

afterEach(() => cleanup());

const MENU = {
  title: "Carta",
  categories: [
    {
      name: "Entradas",
      items: [
        { name: "Empanadas", price: "$4.500" },
        { name: "Provoleta", price: "$6.000" },
      ],
    },
    {
      name: "Principales",
      items: [{ name: "Bife de chorizo", price: "$15.000" }],
    },
    {
      name: "Postres",
      items: [{ name: "Flan", price: "$3.200" }],
    },
  ],
};

const tabs = () => screen.getAllByRole("tab");
const selected = () => tabs().find((t) => t.getAttribute("aria-selected") === "true");

describe("Menu render (#4291)", () => {
  it("un tab por categoría y el panel activo muestra sus ítems con precio", () => {
    render(<Menu data={MENU} />);
    expect(tabs().map((t) => t.textContent)).toEqual(["Entradas", "Principales", "Postres"]);
    expect(selected()?.textContent).toBe("Entradas");
    expect(screen.getByText("Empanadas")).toBeTruthy();
    expect(screen.getByText("$4.500")).toBeTruthy();
    expect(screen.getByText("Provoleta")).toBeTruthy();
    // Los paneles de las otras categorías no están montados.
    expect(screen.queryByText("Bife de chorizo")).toBeNull();
  });

  it("el título va como h2 de la sección", () => {
    render(<Menu data={MENU} />);
    expect(screen.getByRole("heading", { level: 2, name: "Carta" })).toBeTruthy();
  });

  it("click en un tab activa esa categoría", () => {
    render(<Menu data={MENU} />);
    fireEvent.mouseDown(tabs()[1], { button: 0, ctrlKey: false });
    expect(selected()?.textContent).toBe("Principales");
    expect(screen.getByText("Bife de chorizo")).toBeTruthy();
    expect(screen.queryByText("Empanadas")).toBeNull();
  });

  it("ítem con solo nombre renderiza sin precio; con solo precio, sin nombre", () => {
    render(
      <Menu
        data={{
          categories: [
            { name: "Varios", items: [{ name: "Agua" }, { price: "$1.000" }] },
          ],
        }}
      />,
    );
    expect(screen.getByText("Agua")).toBeTruthy();
    expect(screen.getByText("$1.000")).toBeTruthy();
  });
});

describe("Menu navegación por teclado (#4291)", () => {
  // Radix difiere el foco de las flechas/Home/End con setTimeout: esperar el cambio.
  it("←/→ mueven el foco y activan la categoría vecina", async () => {
    render(<Menu data={MENU} />);
    fireEvent.keyDown(tabs()[0], { key: "ArrowRight" });
    await waitFor(() => expect(selected()?.textContent).toBe("Principales"));
    expect(document.activeElement).toBe(tabs()[1]);
    fireEvent.keyDown(tabs()[1], { key: "ArrowLeft" });
    await waitFor(() => expect(selected()?.textContent).toBe("Entradas"));
  });

  it("Home y End van al primero y al último tab", async () => {
    render(<Menu data={MENU} />);
    fireEvent.keyDown(tabs()[0], { key: "End" });
    await waitFor(() => expect(selected()?.textContent).toBe("Postres"));
    fireEvent.keyDown(tabs()[2], { key: "Home" });
    await waitFor(() => expect(selected()?.textContent).toBe("Entradas"));
  });
});

describe("Menu sin datos válidos", () => {
  it("sin categorías ni título: público null (sin nodo)", () => {
    const { container } = render(<Menu data={{ categories: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("dueño sin datos: placeholder por chat", () => {
    render(<Menu data={{}} isOwner />);
    expect(screen.getByText(/agregá las categorías/)).toBeTruthy();
  });

  it("categorías sin nombre o sin ítems válidos se descartan", () => {
    render(
      <Menu
        data={{
          categories: [
            { name: "", items: [{ name: "Huérfano", price: "$1" }] },
            { name: "Vacía", items: [] },
            { name: "Sin ítems válidos", items: [null as unknown as { name: string }] },
            { name: "Válida", items: [{ name: "Té", price: "$900" }] },
          ],
        }}
      />,
    );
    expect(tabs().map((t) => t.textContent)).toEqual(["Válida"]);
    expect(screen.queryByText("Huérfano")).toBeNull();
  });

  it("entradas que no son objeto no rompen el render", () => {
    render(
      <Menu
        data={{
          categories: [null, "x", { name: "Ok", items: [null, "y", { name: "Café", price: "$700" }] }] as never,
        }}
      />,
    );
    expect(screen.getByText("Café")).toBeTruthy();
  });
});

describe("Menu dentro de BlockZone (#4291)", () => {
  it("el type 'Menu' se renderiza por el registry", () => {
    const blocks: Block[] = [
      { id: "m1", type: "Menu", enabled: true, data: MENU as Record<string, unknown> },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByRole("heading", { level: 2, name: "Carta" })).toBeTruthy();
    expect(tabs()).toHaveLength(3);
  });
});
