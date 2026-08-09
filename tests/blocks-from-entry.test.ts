import { describe, expect, it } from "vitest";
import { blocksFromEntry } from "../registry/block-zone/blocks-from-entry";

describe("blocksFromEntry", () => {
  it("returns null when entry.empty (empty-clear)", () => {
    expect(blocksFromEntry({ empty: true, data: { blocks: [] } })).toBeNull();
  });

  it("returns null when data is null", () => {
    expect(blocksFromEntry({ empty: false, data: null })).toBeNull();
  });

  it("returns null when data has no blocks array", () => {
    expect(blocksFromEntry({ empty: false, data: { title: "x" } })).toBeNull();
  });

  it("returns Block[] when blocks present", () => {
    const blocks = [
      { id: "blk_1", type: "RichSection", enabled: true, data: { title: "Hola" } },
    ];
    expect(blocksFromEntry({ empty: false, data: { blocks } })).toEqual(blocks);
  });
});
