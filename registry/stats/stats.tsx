import type { StatsData } from "../block-zone/types";

type StatsProps = {
  data: StatsData;
  isOwner?: boolean;
};

function filled(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function StatsPlaceholder() {
  return (
    <section
      aria-label="Números"
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
        <p className="font-heading text-sm text-muted-foreground">
          Números — agregá las cifras por chat
        </p>
      </div>
    </section>
  );
}

export default function Stats({ data, isOwner = false }: StatsProps) {
  const metrics = (Array.isArray(data.metrics) ? data.metrics : []).filter(
    (item) => filled(item.value) || filled(item.label),
  );

  if (metrics.length === 0 && !filled(data.title) && !filled(data.intro)) {
    return isOwner ? <StatsPlaceholder /> : null;
  }

  return (
    <section
      aria-label={filled(data.title) || "Números"}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20"
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
      {metrics.length > 0 ? (
        <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, i) => {
            const value = filled(metric.value);
            const label = filled(metric.label);
            return (
              <div key={i} className="border-t border-border pt-4">
                {value ? (
                  <dd className="font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums md:text-5xl">
                    {metric.value}
                  </dd>
                ) : null}
                {label ? (
                  <dt className={value ? "mt-2 text-sm text-muted-foreground" : "text-base text-foreground"}>
                    {metric.label}
                  </dt>
                ) : null}
              </div>
            );
          })}
        </dl>
      ) : null}
    </section>
  );
}
