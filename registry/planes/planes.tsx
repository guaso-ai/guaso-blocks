import type { PlanesData, PlanItem } from "../block-zone/types";
import { SECTION_ROOT_CLASS, BLOCK_RADIUS_CLASS, sectionHeadingClass } from "../block-zone/types";

type PlanesProps = {
  data: PlanesData;
  isOwner?: boolean;
};

function filled(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

// Plan válido = tiene nombre o precio (mismo criterio que Stats: una cifra o un rótulo alcanza).
// Entradas que no son objeto (null, strings sueltos) se descartan sin romper el render.
function validPlans(data: PlanesData): PlanItem[] {
  const raw: unknown[] = Array.isArray(data.plans) ? data.plans : [];
  return raw.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const plan = item as PlanItem;
    return filled(plan.name) !== "" || filled(plan.price) !== "" ? [plan] : [];
  });
}

function PlanesPlaceholder() {
  return (
    <section
      aria-label="Planes"
      className={SECTION_ROOT_CLASS}
    >
      <div className={`${BLOCK_RADIUS_CLASS} border border-border bg-card px-8 py-12 text-center`}>
        <p className="font-heading text-sm text-muted-foreground">
          Planes — agregá los planes por chat
        </p>
      </div>
    </section>
  );
}

export default function Planes({ data, isOwner = false }: PlanesProps) {
  const plans = validPlans(data);

  if (plans.length === 0 && !filled(data.title)) {
    return isOwner ? <PlanesPlaceholder /> : null;
  }

  return (
    <section
      aria-label={filled(data.title) || "Planes"}
      className={SECTION_ROOT_CLASS}
    >
      {filled(data.title) ? (
        <h2 className={sectionHeadingClass({})}>
          {data.title}
        </h2>
      ) : null}
      {plans.length > 0 ? (
        <ul className="mt-10 flex flex-col gap-6 md:flex-row">
          {plans.map((plan, i) => {
            const name = filled(plan.name);
            const price = filled(plan.price);
            return (
              <li
                key={i}
                className={`relative flex min-w-0 flex-1 flex-col ${BLOCK_RADIUS_CLASS} border border-border bg-card p-6`}
              >
                {plan.highlighted === true ? (
                  <span className="mb-4 self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Más elegido
                  </span>
                ) : null}
                {name ? (
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                ) : null}
                {price ? (
                  <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground tabular-nums md:text-4xl">
                    {plan.price}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
