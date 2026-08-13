const GREETING_DELAYS = [800, 700, 600, 500, 400, 300];

export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? 180;
}
