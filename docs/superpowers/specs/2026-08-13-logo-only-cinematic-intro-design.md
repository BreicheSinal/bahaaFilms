# Logo-Only Cinematic Intro Design

## Goal

Remove all multilingual greetings and burst behavior so the cinematic intro immediately presents the Bahaa Films logo, holds briefly, and slides upward.

## Experience

The near-black overlay, grain, vignette, shutter, `REC` marker, timecode, and `PHOTO / FILM` label remain unchanged. The centered Bahaa Films logo appears immediately with its existing reveal animation. The intro stays visible for at least 1000 ms and until the initial projects request settles, then the existing 800 ms upward slide reveals the page. The 7000 ms maximum wait remains as a fallback.

## Architecture

`CinematicIntro` has one visual state instead of greeting and logo phases. It renders the logo from mount and calls `onExit` as soon as `shouldRevealIntro` permits the reveal. `introTiming` retains only the minimum hold and maximum wait; greeting cadence, burst duration, and post-readiness logo-hold state are removed.

## Testing

- Verify the intro is not ready before 1000 ms even when data is settled.
- Verify it becomes ready at 1000 ms when data is settled.
- Verify it still waits when data is loading and still forces exit at 7000 ms.
- Delete obsolete greeting-pacing tests with their production helper.
- Run the repository test suite and web production build.

## Scope

This change does not alter background effects, framing labels, query behavior, session behavior, logo reveal styling, or the upward exit transition.
