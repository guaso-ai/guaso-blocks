import type { Block } from "./types";

/**
 * Map a Guaso Content SDK entry (`getEntry`) to blocks[].
 * Empty-clear: `empty: true` or null data → null (do not invent sections).
 */
export function blocksFromEntry(entry: {
  empty: boolean;
  data: unknown;
}): Block[] | null {
  if (entry.empty || entry.data == null) return null;
  const blocks = (entry.data as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) ? (blocks as Block[]) : null;
}
