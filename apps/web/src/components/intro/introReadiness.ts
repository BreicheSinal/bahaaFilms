export type IntroReadinessInput = {
  elapsedMs: number;
  isRequestSettled: boolean;
  minDurationMs: number;
  maxDurationMs: number;
};

export function shouldRevealIntro({
  elapsedMs,
  isRequestSettled,
  minDurationMs,
  maxDurationMs,
}: IntroReadinessInput) {
  return (
    elapsedMs >= maxDurationMs ||
    (elapsedMs >= minDurationMs && isRequestSettled)
  );
}
