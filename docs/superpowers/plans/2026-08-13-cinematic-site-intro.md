# Cinematic Site Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time cinematic Bahaa Films home-page intro that warms the existing projects cache before revealing the site.

**Architecture:** A pure readiness helper decides when the intro can exit based on minimum duration, query settlement, and maximum duration. A client-side `CinematicIntro` starts the existing RTK Query endpoint, presents the photography-and-film sequence, then signals the home page to remove the overlay.

**Tech Stack:** Next.js 15 App Router, React 18, Redux Toolkit Query, TypeScript, CSS Modules, Vitest.

## Global Constraints

- Reuse `projectsApi.endpoints.getProjects` so no second Firestore data path exists.
- Run only on `/`, only once per browser tab/session, and reveal on a request error or maximum wait.
- Use `/bh-logo-white.png`, provide a status label, clear timers, and shorten for `prefers-reduced-motion`.

---

### Task 1: Intro readiness logic

**Files:**

- Create: `apps/web/src/components/intro/introReadiness.ts`
- Create: `apps/web/tests/introReadiness.test.ts`

**Interfaces:**

- Produces: `shouldRevealIntro({ elapsedMs, isRequestSettled, minDurationMs, maxDurationMs }): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { shouldRevealIntro } from "@/components/intro/introReadiness";

describe("shouldRevealIntro", () => {
  it("waits for both the minimum duration and settled project request", () => {
    expect(shouldRevealIntro({ elapsedMs: 1800, isRequestSettled: true, minDurationMs: 2200, maxDurationMs: 7000 })).toBe(false);
    expect(shouldRevealIntro({ elapsedMs: 2200, isRequestSettled: false, minDurationMs: 2200, maxDurationMs: 7000 })).toBe(false);
    expect(shouldRevealIntro({ elapsedMs: 2200, isRequestSettled: true, minDurationMs: 2200, maxDurationMs: 7000 })).toBe(true);
  });

  it("forces reveal at the maximum wait", () => {
    expect(shouldRevealIntro({ elapsedMs: 7000, isRequestSettled: false, minDurationMs: 2200, maxDurationMs: 7000 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @portfolio/web -- tests/introReadiness.test.ts`

Expected: FAIL because `introReadiness` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export type IntroReadinessInput = {
  elapsedMs: number;
  isRequestSettled: boolean;
  minDurationMs: number;
  maxDurationMs: number;
};

export function shouldRevealIntro(input: IntroReadinessInput) {
  return input.elapsedMs >= input.maxDurationMs ||
    (input.elapsedMs >= input.minDurationMs && input.isRequestSettled);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @portfolio/web -- tests/introReadiness.test.ts`

Expected: PASS with both readiness cases green.

- [ ] **Step 5: Commit**

Run: `git add apps/web/src/components/intro/introReadiness.ts apps/web/tests/introReadiness.test.ts && git commit -m "feat(web): add intro readiness logic"`

### Task 2: Cinematic intro component

**Files:**

- Create: `apps/web/src/components/intro/CinematicIntro.tsx`
- Create: `apps/web/src/components/intro/CinematicIntro.module.css`
- Create: `apps/web/tests/CinematicIntro.test.tsx`

**Interfaces:**

- Consumes: `shouldRevealIntro` and `store.dispatch(projectsApi.endpoints.getProjects.initiate())`.
- Produces: `CinematicIntro({ onComplete }: { onComplete: () => void }): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CinematicIntro from "@/components/intro/CinematicIntro";

it("shows the Bahaa Films loading status", () => {
  render(<CinematicIntro onComplete={vi.fn()} />);
  expect(screen.getByRole("status", { name: /loading bahaa films/i })).toBeInTheDocument();
  expect(screen.getByAltText("Bahaa Films")).toHaveAttribute("src", "/bh-logo-white.png");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @portfolio/web -- tests/CinematicIntro.test.tsx`

Expected: FAIL because `CinematicIntro` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create a client component that dispatches the existing zero-argument endpoint once, waits for `shouldRevealIntro`, advances the greeting sequence, uses a brief centered logo state before `onComplete`, and cleans up all timers. Add CSS for a full viewport black overlay, film grain, shutter blades, `REC`, timecode, greeting cadence, a logo reveal, responsive sizing, and a reduced-motion media query.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace @portfolio/web -- tests/CinematicIntro.test.tsx`

Expected: PASS with the accessible status and existing logo verified.

- [ ] **Step 5: Commit**

Run: `git add apps/web/src/components/intro/CinematicIntro.tsx apps/web/src/components/intro/CinematicIntro.module.css apps/web/tests/CinematicIntro.test.tsx && git commit -m "feat(web): add cinematic site intro"`

### Task 3: Home integration and full verification

**Files:**

- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/tests/CinematicIntro.test.tsx`

**Interfaces:**

- Consumes: `CinematicIntro({ onComplete })`.
- Produces: session-only home-route intro behavior while retaining current section order.

- [ ] **Step 1: Write the failing test**

```tsx
it("does not replay after its session flag is set", () => {
  sessionStorage.setItem("bahaa-films-intro-seen", "true");
  render(<Home />);
  expect(screen.queryByRole("status", { name: /loading bahaa films/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace @portfolio/web -- tests/CinematicIntro.test.tsx`

Expected: FAIL because `Home` has no session replay state.

- [ ] **Step 3: Write minimal implementation**

Convert `page.tsx` to a client component. Store the `bahaa-films-intro-seen` flag in `sessionStorage`; conditionally render the intro and set the flag when `onComplete` runs. Preserve `Hero`, `Clients`, `Portfolio`, and `Contact` in their current order.

- [ ] **Step 4: Run focused and full web verification**

Run: `npm run test --workspace @portfolio/web && npm run build --workspace @portfolio/web`

Expected: all web tests pass and the production build exits with code 0.

- [ ] **Step 5: Commit**

Run: `git add apps/web/src/app/page.tsx apps/web/tests/CinematicIntro.test.tsx && git commit -m "feat(web): show intro once per session"`
