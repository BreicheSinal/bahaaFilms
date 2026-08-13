export function shouldPreviewIntro(search: string) {
  return new URLSearchParams(search).get("intro") === "1";
}

export function shouldShowIntro(search: string, hasSeenIntro: boolean) {
  return shouldPreviewIntro(search) || !hasSeenIntro;
}
