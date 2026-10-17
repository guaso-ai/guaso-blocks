"use client";

/**
 * #4289 — Comparación antes/después del kit: dos imágenes superpuestas con un divisor que se mueve.
 * Primitivo, NO tipo de BlockZone (sin entrada en `registry.ts` ni `_CANONICAL_BLOCKS`); el host lo monta a mano.
 * Target: `@components/before-after/before-after.tsx` (hermano de `carousel/` al instalar).
 *
 * Divisor = `role="slider"` (tabIndex 0): ←/↓ -5, →/↑ +5, Home 0, End 100; clamp en extremos; preventDefault solo
 * en teclas manejadas. Pointer: arrastre sobre el marco (`getBoundingClientRect`). Recorte: `clip-path` sobre la
 * imagen "antes" (la de la izquierda del divisor); la "después" es el fondo. Sin autoplay, sin animación, sin fetch.
 * Si faltan URLs devuelve `null`: el host decide el placeholder. Copy fijo solo en fallbacks de accesibilidad.
 * ⛔ literales de color y de radio: solo tokens semánticos y helpers de `block-zone/types.ts`.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactElement } from "react";
import {
  BLOCK_RADIUS_BUTTON_CLASS,
  BLOCK_RADIUS_CLASS,
  imageAspectClass,
  imageFitClass,
  imageFrameClass,
  type ImageProps,
} from "../block-zone/types";

export type BeforeAfterProps = ImageProps & {
  beforeUrl: string; // "antes": lado izquierdo del divisor
  afterUrl: string; // "después": fondo, lado derecho
  beforeAlt?: string; // fallback "Antes"
  afterAlt?: string; // fallback "Después"
  beforeLabel?: string; // chip visible; sin valor no se pinta
  afterLabel?: string;
  label?: string; // aria-label del role="slider"; fallback "Comparación"
  initialPosition?: number; // 0–100; default 50; se clampea
  className?: string;
};

export const BEFORE_AFTER_STEP = 5;

const DEFAULT_POSITION = 50;
const DEFAULT_ASPECT = "4:3" as const;

/** Posición válida 0–100. No numérico (o NaN) → 50; fuera de rango → 0 / 100. */
export function clampPosition(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_POSITION;
  return Math.min(100, Math.max(0, value));
}

/** Nueva posición para una tecla del divisor; `null` = tecla no manejada. */
export function stepPosition(current: number, key: string): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return clampPosition(current - BEFORE_AFTER_STEP);
    case "ArrowRight":
    case "ArrowUp":
      return clampPosition(current + BEFORE_AFTER_STEP);
    case "Home":
      return 0;
    case "End":
      return 100;
    default:
      return null;
  }
}

function ChevronsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
    </svg>
  );
}

export function BeforeAfter(props: BeforeAfterProps): ReactElement | null {
  const { beforeUrl, afterUrl, beforeAlt, afterAlt, beforeLabel, afterLabel, label, initialPosition, className } =
    props;
  const [position, setPosition] = useState(() => clampPosition(initialPosition));
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Hooks antes del early return. Sin URLs no hay comparación posible: el host pinta su placeholder.
  if (!beforeUrl || !afterUrl) return null;

  const positionFromClientX = (clientX: number): number | null => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;
    return clampPosition(Math.round(((clientX - rect.left) / rect.width) * 100));
  };

  const moveTo = (clientX: number) => {
    const next = positionFromClientX(clientX);
    if (next !== null) setPosition(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    moveTo(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) moveTo(event.clientX);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepPosition(position, event.key);
    if (next === null) return;
    event.preventDefault();
    setPosition(next);
  };

  const frameClass = [
    "relative w-full touch-none select-none overflow-hidden",
    imageAspectClass(props, DEFAULT_ASPECT),
    BLOCK_RADIUS_CLASS,
    imageFrameClass(props),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const imgClass = `absolute inset-0 size-full ${imageFitClass(props)}`;
  const chipClass = `absolute top-3 bg-card px-2 py-1 text-sm font-medium text-foreground ${BLOCK_RADIUS_BUTTON_CLASS}`;

  return (
    <div
      ref={frameRef}
      className={frameClass}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <img src={afterUrl} alt={afterAlt ?? "Después"} draggable={false} className={imgClass} />
      <img
        src={beforeUrl}
        alt={beforeAlt ?? "Antes"}
        draggable={false}
        className={imgClass}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      {beforeLabel ? <span className={`${chipClass} left-3`}>{beforeLabel}</span> : null}
      {afterLabel ? <span className={`${chipClass} right-3`}>{afterLabel}</span> : null}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label ?? "Comparación"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={position}
        onKeyDown={onKeyDown}
        style={{ left: `${position}%` }}
        className="group absolute inset-y-0 w-0 focus-visible:outline-none"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-card" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary"
        >
          <ChevronsIcon />
        </span>
      </div>
    </div>
  );
}
