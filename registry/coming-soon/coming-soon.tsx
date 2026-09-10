import type { ReactNode } from "react";

type ComingSoonProps = {
  siteName?: string | null;
};

export default function ComingSoon({ siteName }: ComingSoonProps): ReactNode {
  const name = (siteName ?? "").trim() || "Este sitio";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-5 py-8 text-center font-sans text-foreground">
      <p className="m-0 text-2xl font-semibold">{name}</p>
      <p className="m-0 text-base text-muted-foreground">Próximamente</p>
      <p className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-full bg-current"
        />
        Hecho con Guaso
      </p>
    </main>
  );
}
