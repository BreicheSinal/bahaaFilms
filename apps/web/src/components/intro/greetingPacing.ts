const GREETING_DELAYS = [760, 680, 600, 500, 400, 300, 180];

export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? GREETING_DELAYS[GREETING_DELAYS.length - 1];
}
