import { describe, expect, it } from "vitest";
import { shouldPreviewIntro, shouldShowIntro } from "@/components/intro/introPreview";

describe("shouldPreviewIntro", () => {
  it("forces the intro for the explicit preview query parameter", () => {
    expect(shouldPreviewIntro("?intro=1")).toBe(true);
  });

  it("does not force the intro for ordinary page visits", () => {
    expect(shouldPreviewIntro("")).toBe(false);
    expect(shouldPreviewIntro("?project=wedding")).toBe(false);
  });
});

describe("shouldShowIntro", () => {
  it("shows the intro on a first visit", () => {
    expect(shouldShowIntro("", false)).toBe(true);
  });

  it("skips the intro on a repeat visit without flashing it", () => {
    expect(shouldShowIntro("", true)).toBe(false);
  });

  it("keeps the explicit preview override available", () => {
    expect(shouldShowIntro("?intro=1", true)).toBe(true);
  });
});
