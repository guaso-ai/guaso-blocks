import type { Block } from "./types";
import { getBlockComponent } from "./registry";

/**
 * Renders enabled schema-bound blocks. Unknown types → ignored.
 * Pass `isOwner` from the host (⛔ no draftMode inside the kit).
 */
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
