import type { TimelineData, TimelineItem } from "../block-zone/types";
import { NARROW_SECTION_ROOT_CLASS, BLOCK_RADIUS_CLASS, sectionHeadingClass } from "../block-zone/types";

type TimelineProps = {
  data: TimelineData;
  isOwner?: boolean;
};

function filled(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

// Hito válido = fecha, título y texto no vacíos (AND: un hito sin fecha o sin texto no se lee como línea de tiempo).
// Entradas que no son objeto (null, strings sueltos) se descartan sin romper el render.
// El kit no parsea ni ordena `date`: el orden de render es el del array.
function validItems(data: TimelineData): TimelineItem[] {
  const raw: unknown[] = Array.isArray(data.items) ? data.items : [];
  return raw.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const hito = item as TimelineItem;
    return filled(hito.date) !== "" && filled(hito.title) !== "" && filled(hito.text) !== ""
      ? [hito]
      : [];
  });
}

function TimelinePlaceholder() {
  return (
    <section
      aria-label="Línea de tiempo"
      className={NARROW_SECTION_ROOT_CLASS}
    >
      <div className={`${BLOCK_RADIUS_CLASS} border border-border bg-card px-8 py-12 text-center`}>
        <p className="font-heading text-sm text-muted-foreground">
          Línea de tiempo — agregá los hitos por chat
        </p>
      </div>
    </section>
  );
}

export default function Timeline({ data, isOwner = false }: TimelineProps) {
  const items = validItems(data);

  if (items.length === 0 && !filled(data.title)) {
    return isOwner ? <TimelinePlaceholder /> : null;
  }

  return (
    <section
      aria-label={filled(data.title) || "Línea de tiempo"}
      className={NARROW_SECTION_ROOT_CLASS}
    >
      {filled(data.title) ? (
        <h2 className={sectionHeadingClass({})}>
          {data.title}
        </h2>
      ) : null}
      {items.length > 0 ? (
        <ol className="mt-10 flex flex-col gap-0">
          {items.map((hito, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-x-5 border-l border-border py-5 pl-0">
              <span
                aria-hidden="true"
                className="-ml-[0.3rem] mt-2 h-2.5 w-2.5 rounded-full bg-primary"
              />
              <div className="-mt-0.5">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {hito.date}
                </p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight text-foreground text-balance">
                  {hito.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words">
                  {hito.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
