# Cinematic Intro Burst Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the blurred pre-logo word-cloud and make the existing rapid greeting burst too fast to read.

**Architecture:** `CinematicIntro` will use one greeting render path until the readiness state reveals the logo. `getGreetingDelay` remains the single source of greeting cadence and returns 10 ms after the six readable greetings.

**Tech Stack:** Next.js 15, React 18, Framer Motion 11, TypeScript, CSS Modules, Vitest.

## Global Constraints

- Preserve the readable timing of the first six greetings.
- Preserve project-query readiness, the 2000 ms logo hold, session behavior, and overlay exit behavior.
- Do not add dependencies or a second animation layer.

---

### Task 1: Rapid greeting cadence

**Files:**

- Modify: `apps/web/tests/greetingPacing.test.ts`
- Modify: `apps/web/src/components/intro/greetingPacing.ts`

**Interfaces:**

- Consumes: a zero-based greeting index.
- Produces: `getGreetingDelay(index: number): number`, returning existing readable delays for indexes zero through five and 10 ms afterward.

- [ ] **Step 1: Write the failing assertion**

Change the post-sequence assertion to:

```ts
expect(getGreetingDelay(6)).toBe(10);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test --workspace @portfolio/web -- tests/greetingPacing.test.ts`

Expected: FAIL because the current fallback is 15 ms.

- [ ] **Step 3: Implement the minimum pacing change**

```ts
export function getGreetingDelay(index: number) {
  return GREETING_DELAYS[index] ?? 10;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test --workspace @portfolio/web -- tests/greetingPacing.test.ts`

Expected: PASS.

### Task 2: Remove the duplicate blurred phase

**Files:**

- Modify: `apps/web/src/components/intro/CinematicIntro.tsx`
- Modify: `apps/web/src/components/intro/CinematicIntro.module.css`
- Delete: `apps/web/src/components/intro/introSequence.ts`
- Delete: `apps/web/tests/introSequence.test.ts`

**Interfaces:**

- Consumes: `getGreetingDelay(greetingStep)` and the existing readiness result.
- Produces: one greeting animation path followed directly by the existing logo state.

- [ ] **Step 1: Remove the obsolete phase helper and its test**

Delete `introSequence.ts` and `introSequence.test.ts`; the separate phase they specify is the bug being removed.

- [ ] **Step 2: Simplify the component state and rendering**

Remove `getIntroSequencePhase`, `sequencePhase`, and its 4100 ms timer. Render the greeting whenever `showLogo` is false, keep the 10 ms rapid transition for indexes after the readable greetings, and render the logo otherwise.

- [ ] **Step 3: Remove blurred overlay styling**

Remove `.burst` from the shared grid selector and delete the complete `.burst`, `.burst::before`, `.burst span`, and `.burst span:nth-child(...)` rules.

- [ ] **Step 4: Run full verification**

Run: `npm run test --workspace @portfolio/web`

Expected: all web tests pass.

Run: `npm run build --workspace @portfolio/web`

Expected: the production build exits with code 0 and no TypeScript or bundling errors.

- [ ] **Step 5: Commit the repair**

```bash
git add apps/web/src/components/intro/CinematicIntro.tsx apps/web/src/components/intro/CinematicIntro.module.css apps/web/src/components/intro/greetingPacing.ts apps/web/tests/greetingPacing.test.ts
git add -u apps/web/src/components/intro/introSequence.ts apps/web/tests/introSequence.test.ts
git commit -m "fix(web): streamline cinematic intro burst"
```
