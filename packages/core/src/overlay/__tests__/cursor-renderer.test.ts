import { describe, expect, it } from "vitest";

import { renderCursor } from "../cursor-renderer.js";
import { DEFAULT_CURSOR_CONFIG } from "../types.js";

const PNG_SIGNATURE = "89504e470d0a1a0a";

describe("renderCursor", () => {
  it("returns a png buffer with shared default dimensions", async () => {
    const image = await renderCursor();

    expect(image.width).toBe(DEFAULT_CURSOR_CONFIG.size);
    expect(image.height).toBe(DEFAULT_CURSOR_CONFIG.size);
    expect(image.buffer.length).toBeGreaterThan(0);
    expect(image.buffer.subarray(0, 8).toString("hex")).toBe(PNG_SIGNATURE);
  });

  it("respects custom cursor svg and size", async () => {
    const size = 28;
    const customSvg = `
<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="22" height="22" fill="#ff6600" />
</svg>
`.trim();

    const image = await renderCursor({ size, svg: customSvg });

    expect(image.width).toBe(size);
    expect(image.height).toBe(size);
    expect(image.buffer.length).toBeGreaterThan(0);
  });

  it("falls back to shared default size for invalid values", async () => {
    const image = await renderCursor({ size: 0 });

    expect(image.width).toBe(DEFAULT_CURSOR_CONFIG.size);
    expect(image.height).toBe(DEFAULT_CURSOR_CONFIG.size);
  });
});
