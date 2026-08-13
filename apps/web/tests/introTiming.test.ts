import { describe, expect, it } from "vitest";
import { INTRO_TIMING } from "@/components/intro/introTiming";

describe("INTRO_TIMING", () => {
  it("holds the logo for one second", () => {
    expect(INTRO_TIMING.logoHoldMs).toBe(1000);
  });
});
