# Cinematic Intro Timing Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit the normal rapid greeting burst to 300 ms and reduce the logo hold to 1000 ms.

**Architecture:** A focused `introTiming` module will own the shared sequence durations. The greeting pacing helper will use those values to derive a 4300 ms readable sequence, and `CinematicIntro` will consume the same timing object for readiness and the logo exit timer.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest.

## Global Constraints

- Keep the minimum intro duration at 4600 ms and maximum request wait at 7000 ms.
- Keep post-readable greeting cuts at 10 ms.
- Preserve project-query readiness and all visual styling.

---

### Task 1: Centralize and test the timing contract

**Files:**

- Create: `apps/web/src/components/intro/introTiming.ts`
- Create: `apps/web/tests/introTiming.test.ts`
- Modify: `apps/web/src/components/intro/greetingPacing.ts`
- Modify: `apps/web/tests/greetingPacing.test.ts`

**Interfaces:**

- Produces: `INTRO_TIMING` with `minDurationMs`, `maxDurationMs`, `burstDurationMs`, and `logoHoldMs` numeric fields.
- Produces: `getGreetingDelay(index: number): number` whose indexes zero through five total 4300 ms and whose later indexes return 10 ms.

- [ ] **Step 1: Write failing timing tests**

```ts
import { describe, expect, it } from "vitest";
import { getGreetingDelay } from "@/components/intro/greetingPacing";
import { INTRO_TIMING } from "@/components/intro/introTiming";

describe("cinematic intro timing", () => {
  it("leaves a 300 ms rapid burst before the normal logo reveal", () => {
    const readableDurationMs = Array.from({ length: 6 }, (_, index) => getGreetingDelay(index))
      .reduce((total, delay) => total + delay, 0);

    expect(readableDurationMs).toBe(4300);
    expect(INTRO_TIMING.minDurationMs - readableDurationMs).toBe(300);
  });

  it("holds the logo for one second", () => {
    expect(INTRO_TIMING.logoHoldMs).toBe(1000);
  });
});
```

Update the existing first-delay expectation to 420 ms because that is the component's real initial delay.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm run test --workspace @portfolio/web -- tests/introTiming.test.ts tests/greetingPacing.test.ts`

Expected: FAIL because `introTiming.ts` does not exist and the pacing helper still totals 2810 ms.

- [ ] **Step 3: Add shared timing and derive the final readable delay**

```ts
export const INTRO_TIMING = {
  minDurationMs: 4600,
  maxDurationMs: 7000,
  burstDurationMs: 300,
  logoHoldMs: 1000,
} as const;
```

Use greeting delays `[420, 600, 520, 440, 350]`, then derive index five as `4600 - 300 - 2330`, which is 1970 ms. Keep the fallback at 10 ms.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm run test --workspace @portfolio/web -- tests/introTiming.test.ts tests/greetingPacing.test.ts`

Expected: both files pass.

### Task 2: Consume the shared timing in the intro

**Files:**

- Modify: `apps/web/src/components/intro/CinematicIntro.tsx`

**Interfaces:**

- Consumes: `INTRO_TIMING` and `getGreetingDelay(index)`.
- Produces: the existing intro with a normal 300 ms burst window and 1000 ms logo hold.

- [ ] **Step 1: Replace local timing constants**

Import `INTRO_TIMING`, remove `MIN_DURATION_MS`, `MAX_DURATION_MS`, and `LOGO_HOLD_MS`, and pass the shared values into readiness checks and timers.

- [ ] **Step 2: Use shared pacing for the first greeting**

Replace the special `greetingStep === 0 ? 420 : ...` branch with `getGreetingDelay(greetingStep)`.

- [ ] **Step 3: Run complete verification**

Run: `npm test`

Expected: all repository tests pass.

Run: `npm run build --workspace @portfolio/web`

Expected: production build exits with code 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/intro/introTiming.ts apps/web/src/components/intro/greetingPacing.ts apps/web/src/components/intro/CinematicIntro.tsx apps/web/tests/introTiming.test.ts apps/web/tests/greetingPacing.test.ts
git commit -m "tune(web): shorten intro burst and logo hold"
```
