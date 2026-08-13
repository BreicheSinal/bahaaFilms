const GREETING_DELAYS = [850, 760, 680, 580, 470, 360, 220];

export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? GREETING_DELAYS[GREETING_DELAYS.length - 1];
}
