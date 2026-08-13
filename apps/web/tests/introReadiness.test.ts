import { describe, expect, it } from "vitest";
import { shouldRevealIntro } from "@/components/intro/introReadiness";
import { INTRO_TIMING } from "@/components/intro/introTiming";

describe("shouldRevealIntro", () => {
  it("waits for both the minimum duration and settled project request", () => {
    expect(
      shouldRevealIntro({
        elapsedMs: 999,
        isRequestSettled: true,
        minDurationMs: INTRO_TIMING.minDurationMs,
        maxDurationMs: INTRO_TIMING.maxDurationMs,
      })
    ).toBe(false);
    expect(
      shouldRevealIntro({
        elapsedMs: 1000,
        isRequestSettled: false,
        minDurationMs: INTRO_TIMING.minDurationMs,
        maxDurationMs: INTRO_TIMING.maxDurationMs,
      })
    ).toBe(false);
    expect(
      shouldRevealIntro({
        elapsedMs: 1000,
        isRequestSettled: true,
        minDurationMs: INTRO_TIMING.minDurationMs,
        maxDurationMs: INTRO_TIMING.maxDurationMs,
      })
    ).toBe(true);
  });

  it("forces the reveal at the maximum wait", () => {
    expect(
      shouldRevealIntro({
        elapsedMs: 7000,
        isRequestSettled: false,
        minDurationMs: INTRO_TIMING.minDurationMs,
        maxDurationMs: INTRO_TIMING.maxDurationMs,
      })
    ).toBe(true);
  });
});
