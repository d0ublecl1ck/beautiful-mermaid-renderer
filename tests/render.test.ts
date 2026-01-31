import { describe, expect, test } from "bun:test";

import { parseArgs, renderFromText } from "../src/render";

describe("beautiful-mermaid-renderer", () => {
  test("parseArgs defaults to unicode", () => {
    const args = parseArgs([]);
    expect(args.format).toBe("unicode");
  });

  test("renders unicode output", async () => {
    const out = await renderFromText("graph LR; A-->B", {
      format: "unicode",
      transparent: false,
    });
    expect(out).toContain("┌");
  });

  test("renders ASCII output", async () => {
    const out = await renderFromText("graph LR; A-->B", {
      format: "ascii",
      transparent: false,
    });
    expect(out).toMatch(/\+[-]+\+/);
    expect(out).toContain("A");
  });

  test("renders SVG output", async () => {
    const out = await renderFromText("graph LR; A-->B", {
      format: "svg",
      transparent: false,
    });
    expect(out).toContain("<svg");
  });
});
