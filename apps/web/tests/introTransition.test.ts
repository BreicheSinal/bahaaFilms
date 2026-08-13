import { describe, expect, it } from "vitest";
import { getIntroExitTransition } from "@/components/intro/introTransition";

describe("getIntroExitTransition", () => {
  it("moves the completed overlay upward over a cinematic duration", () => {
    expect(getIntroExitTransition(false)).toEqual({
      y: "-100%",
      duration: 0.8,
    });
  });

  it("keeps the upward exit but shortens it for reduced motion", () => {
    expect(getIntroExitTransition(true)).toEqual({
      y: "-100%",
      duration: 0.12,
    });
  });
});
