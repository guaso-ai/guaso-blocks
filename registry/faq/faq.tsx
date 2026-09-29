import type { FAQData } from "../block-zone/types";

type FAQProps = {
  data: FAQData;
  isOwner?: boolean;
};

function filled(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function FAQPlaceholder() {
  return (
    <section
      aria-label="Preguntas"
      className="mx-auto max-w-3xl px-6 py-16 md:py-20"
    >
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center">
        <p className="font-heading text-sm text-muted-foreground">
          Preguntas — agregá las preguntas por chat
        </p>
      </div>
    </section>
  );
}

export default function FAQ({ data, isOwner = false }: FAQProps) {
  const questions = (Array.isArray(data.questions) ? data.questions : []).filter(
    (item) => filled(item.question) || filled(item.answer),
  );

  if (questions.length === 0) {
    return isOwner ? <FAQPlaceholder /> : null;
  }

  return (
    <section
      aria-label={filled(data.title) || "Preguntas"}
      className="mx-auto max-w-3xl px-6 py-16 md:py-20"
    >
      {filled(data.title) ? (
        <h2 className="mb-8 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
          {data.title}
        </h2>
      ) : null}
      <div className="divide-y divide-border border-y border-border">
        {questions.map((item, i) => (
          <details key={i} className="group py-1" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 font-heading text-lg font-medium text-foreground marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
              <span className="text-balance">{filled(item.question) || "Pregunta"}</span>
              <span
                aria-hidden
                className="mt-1 shrink-0 text-sm text-muted-foreground group-open:rotate-45"
              >
                +
              </span>
            </summary>
            {filled(item.answer) ? (
              <p className="pb-5 text-sm leading-relaxed text-muted-foreground break-words">
                {item.answer}
              </p>
            ) : null}
          </details>
        ))}
      </div>
    </section>
  );
}
