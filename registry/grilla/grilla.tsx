import type { ReactElement } from "react";
import type {
  GrillaAlineacionHorizontal,
  GrillaAlineacionVertical,
  GrillaChild,
  GrillaData,
  GrillaEspacio,
  GrillaProporcion,
} from "../block-zone/types";
import {
  resolveGrillaAlineacionHorizontal,
  resolveGrillaAlineacionVertical,
  resolveGrillaAlturaIgual,
  resolveGrillaColumnas,
  resolveGrillaEnvolver,
  resolveGrillaEspacio,
  resolveGrillaOrdenMobile,
  resolveGrillaProporcion,
} from "../block-zone/types";

// Anchos en doceavos de fila: 1/4=3 · 1/3=4 · 1/2=6 · 2/3=8 · 3/4=9 · fila completa=12.
// Enteros exactos (sin floats) para que el empaquetado sea idéntico al del backend.
const UNITS_PER_ROW = 12;
const PROPORCION_UNITS: Record<Exclude<GrillaProporcion, "igual">, number> = {
  "1/4": 3,
  "1/3": 4,
  "1/2": 6,
  "2/3": 8,
  "3/4": 9,
};

export type GrillaCell = { index: number; units: number };

type Renderizado = { child: GrillaChild; node: ReactElement };

function baseUnits(proporcion: string | undefined): number | null {
  const valor = resolveGrillaProporcion(proporcion);
  return valor === "igual" ? null : PROPORCION_UNITS[valor];
}

function anchoFinal(base: number | null, largoFila: number, envolver: boolean): number {
  if (base === null) return UNITS_PER_ROW / largoFila;
  if (largoFila === 1 && !envolver) return UNITS_PER_ROW;
  return base;
}

/**
 * Filas del contenedor. Port de `resolve_container_layout` (backend, #4309): misma regla,
 * sin preset (las proporciones llegan ya resueltas por hijo). Empaqueta de izquierda a
 * derecha hasta `columnas`. Hijo que no entra: `envolver` = sí abre fila nueva; no queda
 * en fila propia de ancho completo. Suma > 12 en una fila → esa fila pasa a `igual`.
 */
export function resolveGrillaRows(
  proporciones: ReadonlyArray<string | undefined>,
  columnas: number,
  envolver: boolean,
): GrillaCell[][] {
  const bases = proporciones.map((p) => baseUnits(p));
  const filas: number[][] = [];
  let fila: number[] = [];
  let usado = 0;

  bases.forEach((base, idx) => {
    const ancho = base ?? UNITS_PER_ROW / columnas;
    if (fila.length < columnas && usado + ancho <= UNITS_PER_ROW) {
      fila.push(idx);
      usado += ancho;
      return;
    }
    if (fila.length > 0) filas.push(fila);
    if (envolver) {
      fila = [idx];
      usado = ancho;
    } else {
      filas.push([idx]);
      fila = [];
      usado = 0;
    }
  });
  if (fila.length > 0) filas.push(fila);

  return filas.map((indices) => {
    let anchos = indices.map((i) => anchoFinal(bases[i], indices.length, envolver));
    const suma = anchos.reduce((acc, n) => acc + n, 0);
    if (suma > UNITS_PER_ROW) {
      anchos = indices.map(() => UNITS_PER_ROW / indices.length);
    }
    return indices.map((index, k) => ({ index, units: anchos[k] }));
  });
}

// Clases estáticas (Tailwind las ve completas). Mobile = apilado sin breakpoints extra;
// `md` es el único breakpoint del kit.
const ESPACIO_GAP: Record<GrillaEspacio, string> = {
  chico: "gap-4",
  medio: "gap-6 md:gap-8",
  grande: "gap-8 md:gap-12",
};

const HORIZONTAL_JUSTIFY: Record<GrillaAlineacionHorizontal, string> = {
  inicio: "md:justify-start",
  centro: "md:justify-center",
  fin: "md:justify-end",
};

const VERTICAL_ITEMS: Record<GrillaAlineacionVertical, string> = {
  arriba: "md:items-start",
  centrado: "md:items-center",
  abajo: "md:items-end",
};

const VERTICAL_CONTENT: Record<GrillaAlineacionVertical, string> = {
  arriba: "md:justify-start",
  centrado: "md:justify-center",
  abajo: "md:justify-end",
};

const CELL_WIDTH: Record<number, string> = {
  3: "md:w-1/4",
  4: "md:w-1/3",
  6: "md:w-1/2",
  8: "md:w-2/3",
  9: "md:w-3/4",
  12: "md:w-full",
};

function cellClass(units: number, alturaIgual: boolean, vertical: GrillaAlineacionVertical): string {
  return [
    "min-w-0 w-full",
    CELL_WIDTH[units] ?? "md:w-full",
    alturaIgual ? `md:flex md:flex-col ${VERTICAL_CONTENT[vertical]}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Grilla de un nivel. `renderChild` decide cómo se pinta cada hijo (BlockZone del catálogo);
 * devolver null lo descarta antes del layout (tipo desconocido, CTA, anidada).
 * Mobile apila; `orden_mobile=invertido` invierte filas y celdas (desktop no cambia).
 */
export default function Grilla({
  data,
  renderChild,
}: {
  data: GrillaData;
  renderChild: (child: GrillaChild) => ReactElement | null;
}) {
  const renderizados: Renderizado[] = [];
  for (const child of Array.isArray(data.children) ? data.children : []) {
    const node = renderChild(child);
    if (node !== null) renderizados.push({ child, node });
  }
  if (renderizados.length === 0) return null;

  const columnas = Number(resolveGrillaColumnas(data.columnas));
  const envolver = resolveGrillaEnvolver(data.envolver) === "si";
  const alturaIgual = resolveGrillaAlturaIgual(data.altura_igual) === "si";
  const invertido = resolveGrillaOrdenMobile(data.orden_mobile) === "invertido";
  const espacio = resolveGrillaEspacio(data.espacio);
  const horizontal = resolveGrillaAlineacionHorizontal(data.alineacion_horizontal);
  const vertical = resolveGrillaAlineacionVertical(data.alineacion_vertical);

  const filas = resolveGrillaRows(
    renderizados.map(({ child }) => child.proporcion),
    columnas,
    envolver,
  );

  const contenedor = [
    "mx-auto flex max-w-6xl px-6 py-12 md:py-16",
    invertido ? "flex-col-reverse md:flex-col" : "flex-col",
    ESPACIO_GAP[espacio],
  ].join(" ");

  const fila = [
    "flex",
    invertido ? "flex-col-reverse md:flex-row" : "flex-col md:flex-row",
    HORIZONTAL_JUSTIFY[horizontal],
    alturaIgual ? "md:items-stretch" : VERTICAL_ITEMS[vertical],
    ESPACIO_GAP[espacio],
  ].join(" ");

  return (
    <div className={contenedor}>
      {filas.map((celdas, r) => (
        <div key={`fila-${r}`} className={fila}>
          {celdas.map(({ index, units }) => {
            const { child, node } = renderizados[index];
            return (
              <div key={child.id ?? `hijo-${index}`} className={cellClass(units, alturaIgual, vertical)}>
                {node}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
