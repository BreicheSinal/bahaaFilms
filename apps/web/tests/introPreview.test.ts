import { describe, expect, it } from "vitest";
import { shouldPreviewIntro } from "@/components/intro/introPreview";

describe("shouldPreviewIntro", () => {
  it("forces the intro for the explicit preview query parameter", () => {
    expect(shouldPreviewIntro("?intro=1")).toBe(true);
  });

  it("does not force the intro for ordinary page visits", () => {
    expect(shouldPreviewIntro("")).toBe(false);
    expect(shouldPreviewIntro("?project=wedding")).toBe(false);
  });
});
