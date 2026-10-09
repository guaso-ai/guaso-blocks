import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Grilla, { resolveGrillaRows } from "../registry/grilla/grilla";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block, GrillaChild, GrillaData } from "../registry/block-zone/types";
import {
  resolveGrillaAlturaIgual,
  resolveGrillaColumnas,
  resolveGrillaEnvolver,
  resolveGrillaOrdenMobile,
  resolveGrillaPreset,
  resolveGrillaProporcion,
} from "../registry/block-zone/types";

afterEach(() => cleanup());

// Hijo de prueba: un <div> con testid = id. El layout no depende del contenido.
const hijo = (id: string, proporcion?: string): GrillaChild => ({
  id,
  type: "Stats",
  data: {},
  proporcion,
});

const pintar = (child: GrillaChild) => (
  <div data-testid={child.id}>{child.id}</div>
);

function renderGrilla(data: GrillaData) {
  return render(<Grilla data={data} renderChild={pintar} />);
}

// Estructura: contenedor > filas > celdas (cada celda envuelve al hijo).
function filasDe(container: HTMLElement): HTMLElement[][] {
  const outer = container.firstElementChild as HTMLElement;
  return Array.from(outer.children).map((fila) =>
    Array.from(fila.children) as HTMLElement[],
  );
}

function celdaDe(testId: string): HTMLElement {
  return screen.getByTestId(testId).parentElement as HTMLElement;
}

describe("resolvers Grilla (#4304, paridad #4309)", () => {
  it("columnas acepta 1–4, resto → 2", () => {
    expect(resolveGrillaColumnas("1")).toBe("1");
    expect(resolveGrillaColumnas("4")).toBe("4");
    expect(resolveGrillaColumnas("5")).toBe("2");
    expect(resolveGrillaColumnas(undefined)).toBe("2");
  });

  it("envolver, altura_igual y orden_mobile caen a su default", () => {
    expect(resolveGrillaEnvolver("si")).toBe("si");
    expect(resolveGrillaEnvolver("tal vez")).toBe("no");
    expect(resolveGrillaAlturaIgual("si")).toBe("si");
    expect(resolveGrillaAlturaIgual(3)).toBe("no");
    expect(resolveGrillaOrdenMobile("invertido")).toBe("invertido");
    expect(resolveGrillaOrdenMobile("al-reves")).toBe("normal");
  });

  it("proporcion fuera del set → igual", () => {
    expect(resolveGrillaProporcion("1/4")).toBe("1/4");
    expect(resolveGrillaProporcion("2/3")).toBe("2/3");
    expect(resolveGrillaProporcion("1/5")).toBe("igual");
    expect(resolveGrillaProporcion(undefined)).toBe("igual");
  });

  it("preset: id válido o vacío (set cerrado de los 4 del contrato)", () => {
    expect(resolveGrillaPreset("mitad_y_mitad")).toBe("mitad_y_mitad");
    expect(resolveGrillaPreset("hero_2_3_1_3")).toBe("hero_2_3_1_3");
    expect(resolveGrillaPreset("3_tarjetas")).toBe("3_tarjetas");
    expect(resolveGrillaPreset("banda_de_4")).toBe("banda_de_4");
    expect(resolveGrillaPreset("tarjetas")).toBe("");
    expect(resolveGrillaPreset(undefined)).toBe("");
  });
});

describe("resolveGrillaRows (port de resolve_container_layout, doceavos)", () => {
  it("preset mitad_y_mitad: dos mitades en una fila", () => {
    expect(resolveGrillaRows(["1/2", "1/2"], 2, false)).toEqual([
      [
        { index: 0, units: 6 },
        { index: 1, units: 6 },
      ],
    ]);
  });

  it("preset hero_2_3_1_3: 2/3 + 1/3 en una fila de 12", () => {
    expect(resolveGrillaRows(["2/3", "1/3"], 2, false)).toEqual([
      [
        { index: 0, units: 8 },
        { index: 1, units: 4 },
      ],
    ]);
  });

  it("preset 3_tarjetas: tres tercios; banda_de_4: cuatro cuartos", () => {
    expect(
      resolveGrillaRows(["1/3", "1/3", "1/3"], 3, false)[0].map((c) => c.units),
    ).toEqual([4, 4, 4]);
    expect(
      resolveGrillaRows(["1/4", "1/4", "1/4", "1/4"], 4, false)[0].map(
        (c) => c.units,
      ),
    ).toEqual([3, 3, 3, 3]);
  });

  it("fila incompleta con envolver=si: el que no entra abre fila con su ancho", () => {
    const filas = resolveGrillaRows(["1/2", "1/2", "1/2"], 2, true);
    expect(filas).toEqual([
      [
        { index: 0, units: 6 },
        { index: 1, units: 6 },
      ],
      [{ index: 2, units: 6 }],
    ]);
  });

  it("envolver=no: el que no entra queda en fila propia de ancho completo", () => {
    const filas = resolveGrillaRows(["1/2", "1/2", "1/2"], 2, false);
    expect(filas[1]).toEqual([{ index: 2, units: 12 }]);
  });

  it("igual reparte 1/columnas; la última fila incompleta ocupa todo si es única", () => {
    const filas = resolveGrillaRows([undefined, undefined, undefined, undefined], 3, true);
    expect(filas).toEqual([
      [
        { index: 0, units: 4 },
        { index: 1, units: 4 },
        { index: 2, units: 4 },
      ],
      [{ index: 3, units: 12 }],
    ]);
  });

  it("suma > 12 en una fila cae a igual (2/3 + igual con 3 columnas)", () => {
    const filas = resolveGrillaRows(["2/3", undefined], 3, true);
    expect(filas).toEqual([
      [
        { index: 0, units: 6 },
        { index: 1, units: 6 },
      ],
    ]);
  });

  it("columnas=1: cada hijo ocupa su fila completa", () => {
    expect(resolveGrillaRows([undefined, undefined], 1, true)).toEqual([
      [{ index: 0, units: 12 }],
      [{ index: 1, units: 12 }],
    ]);
  });
});

describe("Grilla render (escritorio y mobile)", () => {
  it("default: dos hijos igual = mitades en fila (md:w-1/2), mobile apila", () => {
    const { container } = renderGrilla({
      children: [hijo("a"), hijo("b")],
    });
    const filas = filasDe(container);
    expect(filas).toHaveLength(1);
    expect(filas[0][0].className).toContain("md:w-1/2");
    expect(filas[0][0].className).toContain("w-full");
    expect(filas[0][0].parentElement?.className).toContain("flex-col md:flex-row");
  });

  it("mobile sin breakpoints extra: solo md en el markup", () => {
    const { container } = renderGrilla({
      columnas: "3",
      children: [hijo("a"), hijo("b"), hijo("c")],
    });
    expect(container.innerHTML).not.toMatch(/\b(sm|lg|xl|2xl):/);
  });

  it("orden_mobile=invertido invierte filas y celdas solo en mobile (DOM intacto)", () => {
    const { container } = renderGrilla({
      columnas: "2",
      orden_mobile: "invertido",
      children: [hijo("a"), hijo("b"), hijo("c")],
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("flex-col-reverse md:flex-col");
    const filas = filasDe(container);
    expect(filas[0][0].parentElement?.className).toContain(
      "flex-col-reverse md:flex-row",
    );
    // El orden del DOM no cambia: la inversión es solo CSS en mobile.
    const ids = screen.getAllByTestId(/^[abc]$/).map((n) => n.textContent);
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("orden_mobile=normal no invierte", () => {
    const { container } = renderGrilla({ children: [hijo("a")] });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).not.toContain("flex-col-reverse");
  });

  it("envolver=si: el hijo que no entra pasa a la fila siguiente con su proporción", () => {
    const { container } = renderGrilla({
      columnas: "2",
      envolver: "si",
      children: [hijo("a", "1/2"), hijo("b", "1/2"), hijo("c", "1/2")],
    });
    const filas = filasDe(container);
    expect(filas).toHaveLength(2);
    expect(filas[1]).toHaveLength(1);
    expect(filas[1][0].className).toContain("md:w-1/2");
  });

  it("envolver=no: el hijo que no entra queda en fila de ancho completo", () => {
    const { container } = renderGrilla({
      columnas: "2",
      envolver: "no",
      children: [hijo("a", "1/2"), hijo("b", "1/2"), hijo("c", "1/2")],
    });
    const filas = filasDe(container);
    expect(filas).toHaveLength(2);
    expect(filas[1][0].className).toContain("md:w-full");
  });

  it("columnas=1: cada hijo en su propia fila a ancho completo", () => {
    const { container } = renderGrilla({
      columnas: "1",
      children: [hijo("a"), hijo("b")],
    });
    const filas = filasDe(container);
    expect(filas).toHaveLength(2);
    expect(filas[0][0].className).toContain("md:w-full");
    expect(filas[1][0].className).toContain("md:w-full");
  });

  it("preset 3_tarjetas con proporciones resueltas: tres tercios en una fila", () => {
    const { container } = renderGrilla({
      columnas: "3",
      preset: "3_tarjetas",
      children: [hijo("a", "1/3"), hijo("b", "1/3"), hijo("c", "1/3")],
    });
    const filas = filasDe(container);
    expect(filas).toHaveLength(1);
    for (const celda of filas[0]) {
      expect(celda.className).toContain("md:w-1/3");
    }
  });

  it("preset hero_2_3_1_3: 2/3 y 1/3 lado a lado", () => {
    const { container } = renderGrilla({
      columnas: "2",
      preset: "hero_2_3_1_3",
      children: [hijo("a", "2/3"), hijo("b", "1/3")],
    });
    const [[izq, der]] = filasDe(container);
    expect(izq.className).toContain("md:w-2/3");
    expect(der.className).toContain("md:w-1/3");
  });

  it("espacio y alineaciones llegan a las clases de fila", () => {
    const { container } = renderGrilla({
      espacio: "grande",
      alineacion_horizontal: "centro",
      alineacion_vertical: "abajo",
      children: [hijo("a")],
    });
    const fila = filasDe(container)[0][0].parentElement as HTMLElement;
    expect(fila.className).toContain("md:gap-12");
    expect(fila.className).toContain("md:justify-center");
    expect(fila.className).toContain("md:items-end");
  });

  it("alineacion_horizontal=fin usa justify-end", () => {
    const { container } = renderGrilla({
      alineacion_horizontal: "fin",
      children: [hijo("a")],
    });
    const fila = filasDe(container)[0][0].parentElement as HTMLElement;
    expect(fila.className).toContain("md:justify-end");
  });

  it("altura_igual=si: filas stretch y el contenido se alinea dentro de la celda", () => {
    const { container } = renderGrilla({
      altura_igual: "si",
      alineacion_vertical: "centrado",
      children: [hijo("a"), hijo("b")],
    });
    const [[izq]] = filasDe(container);
    const fila = izq.parentElement as HTMLElement;
    expect(fila.className).toContain("md:items-stretch");
    expect(izq.className).toContain("md:flex md:flex-col md:justify-center");
  });

  it("altura_igual=no: la alineación vertical va en la fila (items-*)", () => {
    const { container } = renderGrilla({
      altura_igual: "no",
      alineacion_vertical: "centrado",
      children: [hijo("a")],
    });
    const fila = filasDe(container)[0][0].parentElement as HTMLElement;
    expect(fila.className).toContain("md:items-center");
    expect(fila.className).not.toContain("md:items-stretch");
  });

  it("hijo que no renderiza (renderChild → null) no ocupa celda", () => {
    const { container } = render(
      <Grilla
        data={{ columnas: "2", children: [hijo("x"), hijo("ok")] }}
        renderChild={(child) => (child.id === "x" ? null : pintar(child))}
      />,
    );
    const filas = filasDe(container);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toHaveLength(1);
    expect(filas[0][0].className).toContain("md:w-full");
  });

  it("sin hijos renderizables no pinta nada", () => {
    const { container } = render(
      <Grilla data={{ children: [] }} renderChild={() => null} />,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("BlockZone + Grilla (hijos del catálogo, un nivel)", () => {
  it("pinta hijos de primer nivel con su renderer del catálogo", () => {
    const blocks: Block[] = [
      {
        id: "g1",
        type: "Grilla",
        enabled: true,
        data: {
          columnas: "2",
          children: [
            { id: "c1", type: "Stats", data: { title: "Cifras" } },
            { id: "c2", type: "Stats", data: { title: "Metas" } },
          ],
        },
      },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByText("Cifras")).toBeTruthy();
    expect(screen.getByText("Metas")).toBeTruthy();
  });

  it("CTA dentro de Grilla se descarta", () => {
    const blocks: Block[] = [
      {
        id: "g1",
        type: "Grilla",
        enabled: true,
        data: {
          children: [
            { id: "c1", type: "Stats", data: { title: "Cifras" } },
            { id: "c2", type: "CTA", data: { headline: "Promo" } },
          ],
        },
      },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.getByText("Cifras")).toBeTruthy();
    expect(screen.queryByText("Promo")).toBeNull();
  });

  it("Grilla anidada se descarta (profundidad 1)", () => {
    const blocks: Block[] = [
      {
        id: "g1",
        type: "Grilla",
        enabled: true,
        data: {
          children: [
            {
              id: "c1",
              type: "Grilla",
              data: {
                children: [{ id: "n1", type: "Stats", data: { title: "Anidada" } }],
              },
            },
            { id: "c2", type: "Stats", data: { title: "Visible" } },
          ],
        },
      },
    ];
    render(<BlockZone blocks={blocks} />);
    expect(screen.queryByText("Anidada")).toBeNull();
    expect(screen.getByText("Visible")).toBeTruthy();
  });

  it("Grilla deshabilitada no pinta nada", () => {
    const blocks: Block[] = [
      {
        id: "g1",
        type: "Grilla",
        enabled: false,
        data: { children: [{ id: "c1", type: "Stats", data: { title: "Oculto" } }] },
      },
    ];
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });
});
