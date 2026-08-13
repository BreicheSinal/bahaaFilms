# Cinematic Intro Timing Adjustment Design

## Goal

Shorten the rapid greeting burst to approximately 300 ms before the logo and shorten the logo hold from 2000 ms to 1000 ms.

## Design

Keep the minimum intro duration at 4600 ms. The readable greeting timeline will occupy the first 4300 ms, including a longer hold on the final readable greeting. The existing 10 ms greeting cuts then run for the remaining 300 ms before the logo appears.

Move the first greeting's 420 ms delay into the shared pacing helper so tests and the component use the same timeline. Store the intro duration, burst duration, maximum request wait, and logo hold in a small timing module. The pacing helper derives the final readable hold from those values, preventing the burst window from drifting when timing is adjusted later.

The existing projects-request readiness rule remains unchanged. If that request exceeds the 4600 ms minimum, the burst can remain visible while the intro waits, preserving the current rule that unfinished portfolio content is not exposed.

## Alternatives Considered

- A separate timer could start the burst exactly 300 ms before the logo, but request readiness makes the logo time variable and would reintroduce competing animation state.
- Reducing the overall 4600 ms intro would change the full cinematic rhythm, which was not requested.

## Testing

- Verify that the six readable greeting delays total 4300 ms, leaving a 300 ms burst in the normal 4600 ms path.
- Verify that post-readable greeting cuts remain 10 ms.
- Verify that the shared logo hold is 1000 ms.
- Run the repository-wide test suite and the web production build.

## Scope

This change does not alter the first five greeting timings, burst styling, query readiness, maximum wait, logo animation, session behavior, or overlay exit.
