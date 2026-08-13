# Cinematic Intro Burst Fix Design

## Goal

Remove the separate blurred word-cloud immediately before the Bahaa Films logo while preserving a rapid final greeting burst whose individual words are intentionally unreadable.

## Root Cause

The intro currently drives two independent burst effects. The greeting counter switches to a 15 ms cadence after the readable greetings, while a fixed timer separately replaces that sequence with twelve overlapping, blurred greeting layers 500 ms before the logo reveal. Those timelines compete and create the unwanted smeared hold before the logo.

## Design

Use the existing greeting element as the only pre-logo animation. The first six greetings retain their readable pacing. Once the counter passes the readable sequence, it cycles through the same greetings at a 10 ms delay with a matching 10 ms transition, producing an unreadable rapid-cut burst until the logo is ready.

Delete the separate `sequencePhase` state, its fixed timer, the `introSequence` helper, and all `.burst` markup and styling. The logo continues to appear from the readiness-controlled `showLogo` state and keeps its existing hold and exit behavior.

## Testing

- Update the greeting pacing regression test to require a 10 ms post-sequence delay.
- Remove the obsolete sequence-phase test with the helper it covered.
- Run the complete web unit suite and production build.

## Scope

This repair does not change readable greeting timing, project-query readiness, logo hold duration, session behavior, film grain, shutter treatment, or the overlay exit transition.
