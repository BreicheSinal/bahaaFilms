import { describe, expect, it } from "vitest";
import { INTRO_TIMING } from "@/components/intro/introTiming";

describe("INTRO_TIMING", () => {
  it("holds the logo-only intro for at least one second", () => {
    expect(INTRO_TIMING.minDurationMs).toBe(1000);
  });
});
