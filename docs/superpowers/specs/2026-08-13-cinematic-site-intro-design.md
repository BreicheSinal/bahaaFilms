# Cinematic Site Intro Design

## Goal

Create a one-time, full-screen cinematic introduction for the public home page that uses the Bahaa Films navbar logo, evokes photography and videography, and overlaps its screen time with the first projects-data request.

## Experience

On an initial visit to `/`, a near-black overlay covers the public site. A compact red `REC` marker and timecode frame a centered greeting. Greetings move from slow to fast in several languages, ending in a short burst of rapid cuts. A restrained aperture/shutter treatment and film-grain texture establish the photography-and-film direction without requiring extra media assets.

The existing white Bahaa Films logo then appears at the center, holds briefly, and the intro fades away to reveal the rendered home page.

## Readiness and Timing

The app begins an RTK Query `getProjects` request as soon as the intro mounts. The reveal waits for both of these conditions:

- the cinematic sequence's minimum duration has elapsed;
- the initial projects request has settled, either with data or an error.

This prevents a flash of unfinished portfolio content while retaining a deliberate feel on fast networks. A maximum wait prevents a network failure from trapping visitors in the overlay; errors still allow the page's current error-safe states to render.

The intro is kept only in browser memory. It runs once per browser tab/session and does not replay during normal client-side navigation. Direct visits to non-home public routes do not use it.

## Components and Data Flow

```text
Home route -> CinematicIntro -> RTK Query initiate(getProjects)
                               -> min animation + request settled
                               -> center logo -> remove overlay -> home sections
```

`CinematicIntro` owns the presentation state and receives a settled callback. It uses the existing `projectsApi` endpoint to warm the same cache consumed by `Hero`, `Portfolio`, and `Clients`; no additional Firestore read path is added. The root layout remains responsible for shared navigation and footer.

## Accessibility and Resilience

- The overlay uses a concise live status label and is not an interactive blocking dialog.
- `prefers-reduced-motion` shows a static greeting/logo and exits promptly after readiness rather than running the rapid sequence.
- The logo has meaningful `Bahaa Films` alt text.
- Timer and request cleanup prevents state updates after unmount.
- If a request errors or exceeds the fallback window, the intro exits and normal page error handling remains available.

## Testing

Unit tests will exercise the pure timing/readiness helper: reveal only after the minimum duration and settled request, reveal on a settled error, and force reveal at the configured maximum wait. The component test will verify that the intro starts the existing projects endpoint and that reduced-motion behavior uses the short path.

## Scope Boundaries

The change does not introduce a new media upload, replace the current project cache, block navigation, or persist a visitor flag across future browser sessions.
