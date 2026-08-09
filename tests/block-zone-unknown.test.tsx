import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import BlockZone from "../registry/block-zone/block-zone";
import type { Block } from "../registry/block-zone/types";

describe("BlockZone unknown type", () => {
  it("does not throw and renders null for unknown type", () => {
    const blocks: Block[] = [
      {
        id: "blk_x",
        type: "NoSuchType",
        enabled: true,
        data: { foo: "bar" },
      },
    ];
    expect(() => render(<BlockZone blocks={blocks} />)).not.toThrow();
    const { container } = render(<BlockZone blocks={blocks} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null for empty / missing blocks", () => {
    expect(render(<BlockZone blocks={null} />).container.innerHTML).toBe("");
    expect(render(<BlockZone blocks={[]} />).container.innerHTML).toBe("");
  });

  it("skips disabled blocks", () => {
    const blocks: Block[] = [
      {
        id: "blk_off",
        type: "RichSection",
        enabled: false,
        data: { title: "Hidden" },
      },
    ];
    expect(render(<BlockZone blocks={blocks} />).container.innerHTML).toBe("");
  });
});
