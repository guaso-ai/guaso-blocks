// TODO(guaso-ui-builder): tokenized RichSection (markdown, align, image_url, cta).
// Props/empty-guard contract only — skin/layout owned by ui-builder.
import type { RichSectionData } from "../block-zone/types";

export default function RichSection({
  data,
  isOwner = false,
}: {
  data: RichSectionData;
  isOwner?: boolean;
}) {
  if (!data.title && !data.body) {
    return isOwner ? (
      <section className="text-muted-foreground px-6 py-8 text-center">
        <p className="font-heading text-sm">
          Sección de texto — agregá el contenido por chat
        </p>
      </section>
    ) : null;
  }
  // Placeholder until ui-builder ships the baseline UI.
  return null;
}
