"use client";

/**
 * #4287 — Vista ampliada de la galería. Always-on: `Gallery` la monta una vez por bloque.
 * Sobre el `dialog` de shadcn vendorizado en el kit (`@/components/ui/dialog` →
 * target `@components/ui/dialog.tsx` al instalar; en el kit, alias a `registry/dialog/`).
 * Teclado: ← / → cambian de imagen (vuelta cíclica), Esc cierra, foco atrapado y devuelto a la miniatura.
 */
import { useRef, type ReactElement } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "../block-zone/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type GalleryLightboxProps = {
  images: GalleryImage[]; // ya filtradas por url (mismo filtro que Gallery)
  index: number | null; // null = cerrado
  onIndexChange: (index: number) => void; // navegación; el wrap cíclico lo resuelve el componente
  onClose: () => void; // Esc, overlay o botón Cerrar
};

const NAV_BUTTON_CLASS =
  "inline-flex size-10 items-center justify-center rounded-[var(--block-radius-suave,0.375rem)] border border-border bg-card text-foreground transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function wrapIndex(value: number, total: number): number {
  return ((value % total) + total) % total;
}

export default function GalleryLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: GalleryLightboxProps): ReactElement {
  const total = images.length;
  const current =
    index !== null && index >= 0 && index < total ? images[index] : null;

  // Foco devuelto a la miniatura que abrió el lightbox. Radix solo devuelve foco al DialogTrigger,
  // que acá no existe: capturamos el activeElement al abrir (la miniatura, antes de que Radix mueva el foco).
  const openerRef = useRef<HTMLElement | null>(null);

  const step = (delta: number) => {
    if (index === null || total === 0) return;
    onIndexChange(wrapIndex(index + delta, total));
  };

  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-4xl"
        onOpenAutoFocus={() => {
          const active = document.activeElement;
          openerRef.current = active instanceof HTMLElement ? active : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          openerRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        <DialogTitle className="sr-only">
          {index !== null ? `Imagen ${index + 1} de ${total}` : "Galería"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Usá las flechas para cambiar de imagen y Escape para cerrar.
        </DialogDescription>

        {current && index !== null ? (
          <>
            <figure className="grid gap-2">
              <img
                src={current.url.trim()}
                alt={current.alt ?? `Imagen ${index + 1}`}
                className="max-h-[80vh] w-full object-contain"
              />
              {current.caption ? (
                <figcaption className="text-sm text-muted-foreground break-words">
                  {current.caption}
                </figcaption>
              ) : null}
            </figure>

            <div className="flex items-center justify-between gap-4">
              {total > 1 ? (
                <button
                  type="button"
                  className={NAV_BUTTON_CLASS}
                  aria-label="Imagen anterior"
                  onClick={() => step(-1)}
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <span aria-hidden="true" className="size-10" />
              )}

              <p aria-live="polite" className="text-sm text-muted-foreground">
                {index + 1} de {total}
              </p>

              {total > 1 ? (
                <button
                  type="button"
                  className={NAV_BUTTON_CLASS}
                  aria-label="Imagen siguiente"
                  onClick={() => step(1)}
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <span aria-hidden="true" className="size-10" />
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
