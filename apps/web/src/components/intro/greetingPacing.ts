const GREETING_DELAYS = [1100, 1000, 900, 780, 650, 500, 300];

export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? GREETING_DELAYS[GREETING_DELAYS.length - 1];
}
