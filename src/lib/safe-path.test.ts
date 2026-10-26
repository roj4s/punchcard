import { describe, expect, it } from "vitest";
import { safePath } from "./safe-path";

describe("safePath", () => {
  it("keeps same-site paths", () => {
    expect(safePath("/scan/abc")).toBe("/scan/abc");
  });

  it("falls back for missing or off-site targets", () => {
    for (const next of [null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example"]) {
      expect(safePath(next)).toBe("/cards");
    }
  });
});
