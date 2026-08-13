# Client Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logo-led, deduplicated client showcase to the public home page.

**Architecture:** A pure selector creates the unique, logo-bearing client list and is covered by Node Vitest tests. A client-side `Clients` section reuses the project Redux request and is mounted between the existing portfolio and contact sections.

**Tech Stack:** Next.js 15, React 18, TypeScript, Redux Toolkit, Framer Motion, CSS Modules, Vitest.

## Global Constraints

- Include every public project once, retaining the first project for each trimmed, case-insensitive title.
- Exclude projects with no non-empty title or resolved `logo` URL.
- Use the Firebase Storage `logo` URL; do not use `coverImage`.
- Render marks with `object-fit: contain`, support keyboard navigation, and hide the section when no client is eligible.
- Use a horizontally scrollable, snap-aligned mobile rail and respect `prefers-reduced-motion`.

---

## File Structure

- Create `apps/web/src/components/sections/Clients/clientProjects.ts`: pure unique-client selector.
- Create `apps/web/tests/clientProjects.test.ts`: selector tests.
- Create `apps/web/src/components/sections/Clients/Clients.tsx`: store-backed client showcase.
- Create `apps/web/src/components/sections/Clients/Clients.module.css`: responsive logo rail.
- Modify `apps/web/src/app/page.tsx`: home-page placement.

### Task 1: Unique client selector

**Files:**

- Create: `apps/web/src/components/sections/Clients/clientProjects.ts`
- Test: `apps/web/tests/clientProjects.test.ts`

**Interfaces:** Consumes `Project[]` from `@/data/projects`; produces `selectUniqueClients(projects: Project[]): Project[]`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import type { Project } from "@/data/projects";
import { selectUniqueClients } from "@/components/sections/Clients/clientProjects";
// Build a complete Project fixture with default fields, overridden by each test.
describe("selectUniqueClients", () => {
  it("keeps the first logo-bearing project for each normalized title", () => {
    const clients = selectUniqueClients([project({ id: "1", title: "Acme", logo: "https://bucket/acme.png" }), project({ id: "2", title: " acme ", logo: "https://bucket/new-acme.png" }), project({ id: "3", title: "Beacon", logo: "https://bucket/beacon.png" })]);
    expect(clients.map(({ id }) => id)).toEqual(["1", "3"]);
  });
  it("excludes projects without a title or resolved logo", () => {
    const clients = selectUniqueClients([project({ id: "1", title: "", logo: "https://bucket/empty-title.png" }), project({ id: "2", title: "No logo" }), project({ id: "3", title: "Shown", logo: "https://bucket/shown.png" })]);
    expect(clients.map(({ id }) => id)).toEqual(["3"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm run test --workspace @portfolio/web -- tests/clientProjects.test.ts`. Expect failure because the selector module does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Project } from "@/data/projects";
export function selectUniqueClients(projects: Project[]): Project[] {
  const seenTitles = new Set<string>();
  return projects.filter((project) => {
    const title = project.title.trim();
    const key = title.toLocaleLowerCase();
    if (!title || !project.logo || seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run `npm run test --workspace @portfolio/web -- tests/clientProjects.test.ts`. Expect both tests to pass.

- [ ] **Step 5: Commit**

Run `git add apps/web/src/components/sections/Clients/clientProjects.ts apps/web/tests/clientProjects.test.ts; git commit -m "feat: add unique client selector"`.

### Task 2: Logo-led client rail

**Files:**

- Create: `apps/web/src/components/sections/Clients/Clients.tsx`
- Create: `apps/web/src/components/sections/Clients/Clients.module.css`

**Interfaces:** Consumes `selectUniqueClients`, Redux `fetchProjects`, and resolved `Project.logo` URLs; produces default `Clients`.

- [ ] **Step 1: Write the failing test**

Add this to the selector suite:

```ts
it("returns no clients when every project lacks a logo", () => {
  expect(selectUniqueClients([project({ id: "1", title: "Acme" })])).toEqual([]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm run test --workspace @portfolio/web -- tests/clientProjects.test.ts`. Expect failure until missing-logo projects are excluded.

- [ ] **Step 3: Implement the component and styles**

Follow the `Portfolio` effect: dispatch `fetchProjects()` only when no store items exist and loading is false; derive `clients` using `selectUniqueClients`; return `null` when `!loading && clients.length === 0`; show the existing `Loader` while loading with no clients. Use `motion.a` project links in this structure:

```tsx
<section id="clients" className={styles.clients} aria-labelledby="clients-title">
  <div className={styles.container}>
    <motion.header className={styles.header}><p className={styles.eyebrow}>Clients</p><h2 id="clients-title" className={styles.title}>Selected collaborators</h2><p className={styles.description}>Brands and people I have had the pleasure to create with.</p></motion.header>
    <div className={styles.rail} aria-label="Client projects">{clients.map((project) => <motion.a key={project.id} href={`/projects/${project.slug}`} className={styles.client}><span className={styles.logoFrame}><img src={project.logo} alt={`${project.title} logo`} className={styles.logo} loading="lazy" decoding="async" /></span><span className={styles.name}>{project.title}</span><span className={styles.detail}>{project.shortDescription}</span></motion.a>)}</div>
  </div>
</section>
```

Create a near-black band with a clipped desktop rail, dark fixed-width panels, contained logos, visible `:focus-visible` outline, and hover/focus description reveal. On mobile add `overflow-x: auto` and `scroll-snap-type: x mandatory`; disable non-essential transitions under `prefers-reduced-motion`.

- [ ] **Step 4: Run the selector tests to verify they pass**

Run `npm run test --workspace @portfolio/web -- tests/clientProjects.test.ts`. Expect all three tests to pass.

- [ ] **Step 5: Commit**

Run `git add apps/web/src/components/sections/Clients/Clients.tsx apps/web/src/components/sections/Clients/Clients.module.css apps/web/tests/clientProjects.test.ts; git commit -m "feat: add client logo showcase"`.

### Task 3: Home-page integration and verification

**Files:**

- Modify: `apps/web/src/app/page.tsx`

**Interfaces:** Consumes default `Clients` from `@/components/sections/Clients/Clients`; produces home order `Hero → Portfolio → Clients → Contact`.

- [ ] **Step 1: Add the integration test**

```ts
it("exports the client showcase component", async () => {
  const module = await import("@/components/sections/Clients/Clients");
  expect(module.default).toBeTypeOf("function");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run `npm run test --workspace @portfolio/web -- tests/clientProjects.test.ts`. Expect failure until the component exists.

- [ ] **Step 3: Integrate the component**

```tsx
import Clients from "@/components/sections/Clients/Clients";
export default function Home() { return <><Hero /><Portfolio /><Clients /><Contact /></>; }
```

- [ ] **Step 4: Run automated verification**

Run `npm run test --workspace @portfolio/web && npm run build --workspace @portfolio/web`. Expect all Vitest tests and the production build to pass with no TypeScript errors.

- [ ] **Step 5: Commit**

Run `git add apps/web/src/app/page.tsx apps/web/tests/clientProjects.test.ts; git commit -m "feat: show clients on home page"`.
