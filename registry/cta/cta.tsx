// TODO(guaso-ui-builder): tokenized CTA baseline (headline/subtext/button + safeHref).
// Empty guard = clinic∪store. ⛔ mesh-hero / grain / orbs / lucide skins.
import type { CTAData } from "../block-zone/types";

export default function CTA({
  data,
  isOwner = false,
}: {
  data: CTAData;
  isOwner?: boolean;
}) {
  if (!data.headline && !data.subtext && !data.button_label) {
    return isOwner ? (
      <section className="text-muted-foreground px-6 py-8 text-center">
        <p className="font-heading text-sm">
          Sección de llamado a la acción — completá el texto desde el chat
        </p>
      </section>
    ) : null;
  }
  // Placeholder until ui-builder ships the baseline UI.
  return null;
}
