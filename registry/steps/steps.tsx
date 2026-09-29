import type { StepsData } from "../block-zone/types";

type StepsProps = {
  data: StepsData;
  isOwner?: boolean;
};

function filled(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function StepsPlaceholder() {
  return (
    <section
      aria-label="Pasos"
      className="mx-auto max-w-3xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
        <p className="font-heading text-sm text-muted-foreground">
          Pasos — agregá los pasos por chat
        </p>
      </div>
    </section>
  );
}

export default function Steps({ data, isOwner = false }: StepsProps) {
  const steps = (Array.isArray(data.steps) ? data.steps : []).filter(
    (item) => filled(item.heading) || filled(item.text),
  );

  if (steps.length === 0) {
    return isOwner ? <StepsPlaceholder /> : null;
  }

  return (
    <section
      aria-label={filled(data.title) || "Pasos"}
      className="mx-auto max-w-3xl px-6 py-16 md:py-20"
    >
      {filled(data.title) ? (
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          {data.title}
        </h2>
      ) : null}
      {filled(data.intro) ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground break-words">
          {data.intro}
        </p>
      ) : null}
      <ol className="mt-10 flex flex-col gap-0">
        {steps.map((step, i) => (
          <li key={i} className="grid grid-cols-[auto_1fr] gap-x-5 border-l border-border py-5 pl-0">
            <span className="ml-[-0.7rem] flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card font-heading text-xs font-semibold text-foreground">
              {i + 1}
            </span>
            <div className="-mt-0.5">
              {filled(step.heading) ? (
                <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground text-balance">
                  {step.heading}
                </h3>
              ) : null}
              {filled(step.text) ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words">
                  {step.text}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
