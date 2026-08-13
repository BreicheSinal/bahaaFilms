import { describe, expect, it } from "vitest";
import { shouldRevealIntro } from "@/components/intro/introReadiness";

describe("shouldRevealIntro", () => {
  it("waits for both the minimum duration and settled project request", () => {
    expect(
      shouldRevealIntro({
        elapsedMs: 1800,
        isRequestSettled: true,
        minDurationMs: 2200,
        maxDurationMs: 7000,
      })
    ).toBe(false);
    expect(
      shouldRevealIntro({
        elapsedMs: 2200,
        isRequestSettled: false,
        minDurationMs: 2200,
        maxDurationMs: 7000,
      })
    ).toBe(false);
    expect(
      shouldRevealIntro({
        elapsedMs: 2200,
        isRequestSettled: true,
        minDurationMs: 2200,
        maxDurationMs: 7000,
      })
    ).toBe(true);
  });

  it("forces the reveal at the maximum wait", () => {
    expect(
      shouldRevealIntro({
        elapsedMs: 7000,
        isRequestSettled: false,
        minDurationMs: 2200,
        maxDurationMs: 7000,
      })
    ).toBe(true);
  });
});
