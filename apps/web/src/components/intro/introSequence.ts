export function getIntroSequencePhase(elapsedMs: number, revealAtMs: number) {
  return elapsedMs >= revealAtMs - 500 ? "burst" : "greetings";
}
