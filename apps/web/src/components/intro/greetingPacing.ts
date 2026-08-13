const GREETING_DELAYS = [650, 600, 520, 440, 350, 250];

export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? 35;
}
