# Intro Reload Flash Fix Design

## Goal

Keep the cinematic intro once per browser tab while eliminating the momentary intro flash on reload.

## Root Cause

The home page initializes `introVisible` to `true` during server rendering and the first client render. On reload, a layout effect finds the existing session flag and immediately changes it to `false`, but the already-rendered intro can appear briefly during hydration.

## Design

Represent visibility as `boolean | null`, where `null` means the session decision has not been made. Render the intro only when the value is explicitly `true`. In `useLayoutEffect`, show and scroll-lock the intro for a first visit or `?intro=1`; otherwise set it hidden without ever mounting `CinematicIntro`.

Keep the session flag, exit animation, scroll-lock cleanup, and preview override unchanged. This preserves the optimized once-per-tab experience and removes the reload flash rather than replaying the animation.

## Testing

Add a pure `shouldShowIntro(search, hasSeenIntro)` decision helper and test first visit, repeat visit, and preview override behavior. Run all repository tests and the web production build.
