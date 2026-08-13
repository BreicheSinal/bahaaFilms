# Logo-Only Cinematic Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the greeting sequence with an immediately visible logo that holds for at least one second before the existing upward slide.

**Architecture:** `CinematicIntro` will render a single logo state and use the existing readiness helper to trigger `onExit`. The timing object will retain a 1000 ms minimum hold and 7000 ms maximum wait; obsolete greeting pacing code will be deleted.

**Tech Stack:** Next.js 15, React 18, Framer Motion 11, TypeScript, Vitest.

## Global Constraints

- Preserve grain, vignette, shutter, `REC`, timecode, and `PHOTO / FILM` visuals.
- Preserve project-query readiness, the 7000 ms fallback, session behavior, and 800 ms upward slide.
- Do not add dependencies.

---

### Task 1: Logo-only readiness timing

**Files:**

- Modify: `apps/web/tests/introTiming.test.ts`
- Modify: `apps/web/src/components/intro/introTiming.ts`
- Modify: `apps/web/tests/introReadiness.test.ts`

**Interfaces:**

- Produces: `INTRO_TIMING` with `minDurationMs: 1000` and `maxDurationMs: 7000`.
- Consumes: `shouldRevealIntro({ elapsedMs, isRequestSettled, minDurationMs, maxDurationMs })`.

- [ ] **Step 1: Write the failing timing test**

```ts
expect(INTRO_TIMING.minDurationMs).toBe(1000);
```

Add readiness assertions at 999 ms and 1000 ms using `INTRO_TIMING`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm run test --workspace @portfolio/web -- tests/introTiming.test.ts tests/introReadiness.test.ts`

Expected: FAIL because the current minimum is 4600 ms.

- [ ] **Step 3: Simplify the timing object**

```ts
export const INTRO_TIMING = {
  minDurationMs: 1000,
  maxDurationMs: 7000,
} as const;
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm run test --workspace @portfolio/web -- tests/introTiming.test.ts tests/introReadiness.test.ts`

Expected: both files pass.

### Task 2: Remove greeting phases and render the logo immediately

**Files:**

- Modify: `apps/web/src/components/intro/CinematicIntro.tsx`
- Modify: `apps/web/src/components/intro/CinematicIntro.module.css`
- Delete: `apps/web/src/components/intro/greetingPacing.ts`
- Delete: `apps/web/tests/greetingPacing.test.ts`

**Interfaces:**

- Consumes: `INTRO_TIMING`, `shouldRevealIntro`, and `getIntroExitTransition`.
- Produces: `CinematicIntro({ onExit })` with one immediate logo state.

- [ ] **Step 1: Remove greeting state and timers**

Delete the greeting list, `greetingStep`, `showLogo`, burst calculations, greeting timer effect, and post-logo timer effect. Change `complete` to call `onExit` once.

- [ ] **Step 2: Render only the logo in the center**

Remove the inner `AnimatePresence` and greeting branch. Keep the existing `motion.img` logo markup and reveal animation directly inside the overlay.

- [ ] **Step 3: Remove obsolete greeting styling and pacing files**

Delete the `.greeting` CSS rule and remove it from the shared grid selector. Delete `greetingPacing.ts` and its test.

- [ ] **Step 4: Run complete verification**

Run: `npm test`

Expected: all repository tests pass.

Run: `npm run build --workspace @portfolio/web`

Expected: the production build exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/intro/CinematicIntro.tsx apps/web/src/components/intro/CinematicIntro.module.css apps/web/src/components/intro/introTiming.ts apps/web/tests/introTiming.test.ts apps/web/tests/introReadiness.test.ts
git add -u apps/web/src/components/intro/greetingPacing.ts apps/web/tests/greetingPacing.test.ts
git commit -m "refactor(web): simplify cinematic intro to logo"
```
