import { INTRO_TIMING } from "./introTiming";

const EARLY_GREETING_DELAYS = [420, 600, 520, 440, 350];
const EARLY_GREETING_DURATION_MS = EARLY_GREETING_DELAYS.reduce(
  (total, delay) => total + delay,
  0
);
const FINAL_READABLE_GREETING_DELAY =
  INTRO_TIMING.minDurationMs - INTRO_TIMING.burstDurationMs - EARLY_GREETING_DURATION_MS;
const GREETING_DELAYS = [...EARLY_GREETING_DELAYS, FINAL_READABLE_GREETING_DELAY];

export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? 10;
}
