# Intro Reload Flash Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the once-per-session intro from flashing during reload hydration.

**Architecture:** A pure helper will decide whether the intro should run from the URL and session flag. `Home` will begin in an unresolved `null` state and mount `CinematicIntro` only after the layout effect explicitly resolves that decision to `true`.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest.

## Global Constraints

- Preserve once-per-tab behavior and the `?intro=1` override.
- Preserve exit animation and scroll locking.
- Do not add dependencies.

---

### Task 1: Intro display decision

**Files:**

- Modify: `apps/web/src/components/intro/introPreview.ts`
- Modify: `apps/web/tests/introPreview.test.ts`

**Interfaces:**

- Produces: `shouldShowIntro(search: string, hasSeenIntro: boolean): boolean`.

- [ ] **Step 1: Write failing helper tests**

```ts
expect(shouldShowIntro("", false)).toBe(true);
expect(shouldShowIntro("", true)).toBe(false);
expect(shouldShowIntro("?intro=1", true)).toBe(true);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test --workspace @portfolio/web -- tests/introPreview.test.ts`

Expected: FAIL because `shouldShowIntro` does not exist.

- [ ] **Step 3: Implement the helper**

```ts
export function shouldShowIntro(search: string, hasSeenIntro: boolean) {
  return shouldPreviewIntro(search) || !hasSeenIntro;
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm run test --workspace @portfolio/web -- tests/introPreview.test.ts`

Expected: PASS.

### Task 2: Hydration-safe home state

**Files:**

- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**

- Consumes: `shouldShowIntro(search, hasSeenIntro)`.
- Produces: a nullable intro visibility state that never mounts the intro on repeat reloads.

- [ ] **Step 1: Replace the eager visibility default**

Initialize `introVisible` as `boolean | null` with `null`, and initialize scroll locking to `false`.

- [ ] **Step 2: Resolve state before paint**

In `useLayoutEffect`, call `shouldShowIntro`. Set both visibility and scroll locking to `true` only when the intro should run; otherwise set visibility to `false`.

- [ ] **Step 3: Render only explicit visibility**

Change the condition to `introVisible === true` so `null` never mounts the overlay.

- [ ] **Step 4: Verify and commit**

Run: `npm test`

Run: `npm run build --workspace @portfolio/web`

Expected: all tests and the production build pass.

```bash
git add apps/web/src/components/intro/introPreview.ts apps/web/tests/introPreview.test.ts apps/web/src/app/page.tsx
git commit -m "fix(web): prevent intro flash on reload"
```
