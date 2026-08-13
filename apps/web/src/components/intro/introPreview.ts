export function shouldPreviewIntro(search: string) {
  return new URLSearchParams(search).get("intro") === "1";
}
