export function getIntroExitTransition(reduceMotion: boolean) {
  return {
    y: "-100%",
    duration: reduceMotion ? 0.12 : 0.8,
  };
}
