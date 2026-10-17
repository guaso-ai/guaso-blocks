"use client";

/**
 * Copia vendorizada del `tabs` de shadcn/ui (estilo default, sobre Radix Tabs).
 * Fuente: https://ui.shadcn.com/r/styles/default/tabs.json (shadcn CLI 4.22.0). Target: `@components/ui/tabs.tsx`
 * (mismo path que shadcn). Navegación de teclado de Radix: ←/→ mueven y activan, Home/End van al primero/último.
 *
 * Drift respecto del upstream (intencional, #4291):
 *  - `cn` local (sin tailwind-merge): los className del consumidor se concatenan.
 *  - Colores solo con tokens semánticos de la kit (⛔ literales de color); radios vía `--block-radius-*`.
 *  - Foco visible con `outline-primary` (mismo criterio que dialog).
 * Re-copiar desde upstream si cambia la base y actualizar esta versión.
 */
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const Tabs = TabsPrimitive.Root;

const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex items-center justify-center gap-1 border border-border bg-card p-1 text-muted-foreground rounded-[var(--block-radius-suave,0.375rem)]",
      className,
    )}
    {...props}
  />
);

const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 font-heading text-sm font-medium rounded-[var(--block-radius-suave,0.375rem)] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      className,
    )}
    {...props}
  />
);

const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn(
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      className,
    )}
    {...props}
  />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
