// TODO(guaso-ui-builder): tokenized BlockZone UI polish if needed.
// Logic is canonical (no draftMode — pass isOwner from host wrapper).
import type { Block } from "./types";
import { getBlockComponent } from "./registry";

export default function BlockZone({
  blocks,
  isOwner = false,
}: {
  blocks?: Block[] | null;
  isOwner?: boolean;
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  const rendered = blocks
    .filter((b) => b.enabled)
    .map((b, i) => {
      const Component = getBlockComponent(b.type);
      if (!Component) return null;
      const key = b.id ? b.id : `blk-${i}`;
      return <Component key={key} data={b.data} isOwner={isOwner} />;
    });
  if (!rendered.some((r) => r !== null)) return null;
  return <>{rendered}</>;
}
