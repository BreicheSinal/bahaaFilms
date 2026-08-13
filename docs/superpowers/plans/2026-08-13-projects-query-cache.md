# Projects Query Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicated Firestore project loads with one shared RTK Query cache used by all public-site project consumers.

**Architecture:** `projectsApi` wraps the existing `getProjects(): Promise<Project[]>` Firestore mapper in a zero-argument RTK Query `queryFn`. RTK Query owns remote data, request state, in-flight deduplication, and the 10-minute unused-cache lifetime. The existing projects slice becomes a UI-only filter slice.

**Tech Stack:** Next.js 15, React 18, TypeScript, Redux Toolkit RTK Query, Firestore SDK, Vitest.

## Global Constraints

- Keep `getProjects()` as the only Firestore read entry point; do not add listeners, a server API route, offline persistence, or persisted Redux state.
- Set `keepUnusedDataFor: 600`; disable automatic refetch on mount, focus, and reconnect.
- An empty `Project[]` is a successful response and must not cause another request.
- Errors must not automatically retry. Deliberate retry is via the query hook's `refetch()`.
- Preserve the existing public project `Project` type and search/filter UX.

---

## File Structure

- Create: `apps/web/src/store/projectsApi.ts` — RTK Query endpoint and generated `useGetProjectsQuery` hook.
- Modify: `apps/web/src/store/index.ts` — register the API reducer and middleware.
- Modify: `apps/web/src/store/projectsSlice.ts` — retain only filter UI state and actions.
- Create: `apps/web/tests/projectsApi.test.ts` — prove a shared endpoint coalesces concurrent subscribers and caches empty data.
- Create: `apps/web/tests/projectsSlice.test.ts` — protect the retained filter reducer contract.
- Create: `apps/web/tests/publicProjectConsumers.test.ts` — ensure every public consumer uses the shared endpoint rather than a manual load effect.
- Modify: `apps/web/src/components/sections/Hero/Hero.tsx` — consume shared query data.
- Modify: `apps/web/src/components/sections/Portfolio/Portfolio.tsx` — consume shared query data.
- Modify: `apps/web/src/components/sections/Clients/Clients.tsx` — consume shared query data.
- Modify: `apps/web/src/app/projects/page.tsx` — consume shared query data and UI filters.
- Modify: `apps/web/src/app/projects/[slug]/page.tsx` — consume shared query data.

### Task 1: Add the shared Firestore query endpoint and store registration

**Files:**
- Create: `apps/web/src/store/projectsApi.ts`
- Modify: `apps/web/src/store/index.ts`
- Test: `apps/web/tests/projectsApi.test.ts`

**Interfaces:**
- Consumes: `getProjects(): Promise<Project[]>` from `@/data/projects`.
- Produces: `projectsApi` and `useGetProjectsQuery()` from `@/store/projectsApi`.

- [ ] **Step 1: Write the failing shared-query test**

```ts
import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProjects = vi.fn();
vi.mock("@/data/projects", () => ({ getProjects }));

import { projectsApi } from "@/store/projectsApi";

function createTestStore() {
  return configureStore({
    reducer: { [projectsApi.reducerPath]: projectsApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(projectsApi.middleware),
  });
}

describe("projectsApi", () => {
  beforeEach(() => getProjects.mockReset());

  it("coalesces concurrent subscribers and caches an empty project list", async () => {
    getProjects.mockResolvedValue([]);
    const store = createTestStore();
    const first = store.dispatch(projectsApi.endpoints.getProjects.initiate());
    const second = store.dispatch(projectsApi.endpoints.getProjects.initiate());

    await Promise.all([first.unwrap(), second.unwrap()]);

    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(projectsApi.endpoints.getProjects.select()(store.getState()).data).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails because the endpoint does not exist**

Run: `npm test --workspace @portfolio/web -- tests/projectsApi.test.ts`

Expected: FAIL with module-not-found for `@/store/projectsApi`.

- [ ] **Step 3: Implement the minimal endpoint and register it in the app store**

```ts
// apps/web/src/store/projectsApi.ts
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getProjects, type Project } from "@/data/projects";

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 600,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      async queryFn() {
        try {
          return { data: await getProjects() };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: String(error) } };
        }
      },
    }),
  }),
});

export const { useGetProjectsQuery } = projectsApi;
```

```ts
// store reducer and middleware additions
reducer: { projects: projectsReducer, [projectsApi.reducerPath]: projectsApi.reducer },
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat(projectsApi.middleware),
```

- [ ] **Step 4: Run the endpoint test to verify it passes**

Run: `npm test --workspace @portfolio/web -- tests/projectsApi.test.ts`

Expected: PASS; the mocked Firestore mapper is called exactly once and the cache holds `[]`.

- [ ] **Step 5: Commit the endpoint deliverable**

```bash
git add apps/web/src/store/projectsApi.ts apps/web/src/store/index.ts apps/web/tests/projectsApi.test.ts
git commit -m "feat(web): cache projects with RTK Query"
```

### Task 2: Reduce the projects slice to filter UI state

**Files:**
- Modify: `apps/web/src/store/projectsSlice.ts`
- Create: `apps/web/tests/projectsSlice.test.ts`

**Interfaces:**
- Consumes: Redux Toolkit `createSlice`.
- Produces: `setSearchQuery`, `setSelectedTag`, `resetFilters`, and the filter-only `projects` reducer.

- [ ] **Step 1: Write the failing reducer test**

```ts
import { describe, expect, it } from "vitest";
import reducer, { resetFilters, setSearchQuery, setSelectedTag } from "@/store/projectsSlice";

describe("projects filter state", () => {
  it("resets both filters without keeping remote project data", () => {
    let state = reducer(undefined, setSearchQuery("portrait"));
    state = reducer(state, setSelectedTag("Editorial"));
    state = reducer(state, resetFilters());

    expect(state).toEqual({ searchQuery: "", selectedTag: "All" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails against the current remote-data slice state**

Run: `npm test --workspace @portfolio/web -- tests/projectsSlice.test.ts`

Expected: FAIL because the state still includes `items`, `loading`, and `error`.

- [ ] **Step 3: Remove thunk and remote request state from the slice**

```ts
type ProjectsState = { searchQuery: string; selectedTag: string };

const initialState: ProjectsState = { searchQuery: "", selectedTag: "All" };

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: { /* keep the three existing filter reducers */ },
});
```

Delete the `createAsyncThunk` import, `getProjects` import, `fetchProjects` export, and all `extraReducers` cases.

- [ ] **Step 4: Run the reducer test to verify it passes**

Run: `npm test --workspace @portfolio/web -- tests/projectsSlice.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the UI-state deliverable**

```bash
git add apps/web/src/store/projectsSlice.ts apps/web/tests/projectsSlice.test.ts
git commit -m "refactor(web): separate project filters from query state"
```

### Task 3: Migrate all public project consumers to the shared query hook

**Files:**
- Modify: `apps/web/src/components/sections/Hero/Hero.tsx`
- Modify: `apps/web/src/components/sections/Portfolio/Portfolio.tsx`
- Modify: `apps/web/src/components/sections/Clients/Clients.tsx`
- Modify: `apps/web/src/app/projects/page.tsx`
- Modify: `apps/web/src/app/projects/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useGetProjectsQuery(): { data?: Project[]; isLoading: boolean; isError: boolean; refetch: () => unknown }`.
- Produces: public views that derive from `const allProjects = data ?? []` and never dispatch `fetchProjects`.

- [ ] **Step 1: Complete the migration in every consumer**

Remove all `useEffect` imports used only for data fetching, `useAppDispatch` usages used only for `fetchProjects`, and every `if (!projects.length && !loading) dispatch(fetchProjects())` block. Keep `useAppDispatch` only in `projects/page.tsx`, where it changes filters.

Use the shared hook exactly once per component:

```ts
const { data: projects = [], isLoading: loading } = useGetProjectsQuery();
```

For the archive page, preserve the existing filter state selector:

```ts
const { searchQuery, selectedTag } = useAppSelector((state) => state.projects);
```

All derived arrays (`featuredProjects`, `clients`, filtered projects, the selected project, and related projects) must derive from `projects`, not Redux remote state.

- [ ] **Step 2: Run type validation and web tests**

Run: `npx tsc --noEmit -p apps/web/tsconfig.json && npm test --workspace @portfolio/web`

Expected: PASS. The TypeScript build proves no public consumer references the removed thunk; tests prove shared cache and filters retain their contracts.

- [ ] **Step 3: Commit the consumer migration**

```bash
git add apps/web/src/components/sections/Hero/Hero.tsx apps/web/src/components/sections/Portfolio/Portfolio.tsx apps/web/src/components/sections/Clients/Clients.tsx apps/web/src/app/projects/page.tsx apps/web/src/app/projects/[slug]/page.tsx
git commit -m "refactor(web): share projects query across public views"
```

### Task 4: Verify the production build and cache behavior

**Files:**
- Verify only.

**Interfaces:**
- Consumes: the completed RTK Query endpoint and public-page consumers.
- Produces: verified build and documented behavior.

- [ ] **Step 1: Run the full web test suite**

Run: `npm test --workspace @portfolio/web`

Expected: PASS with no test failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build --workspace @portfolio/web`

Expected: successful Next.js production build.

- [ ] **Step 3: Perform a browser/network verification**

Run the web app, open the homepage, and inspect network activity while Hero, Portfolio, and Clients mount. Navigate to `/projects` and then one project detail page.

Expected: one initial Firestore projects query for the shared cache; navigation introduces no second projects query. Refreshing the browser intentionally creates one new query.

- [ ] **Step 4: Commit any verification-only corrections, if required**

```bash
git status --short
git add <only-files-corrected-during-verification>
git commit -m "fix(web): finalize projects query cache"
```

Do not create a commit if verification required no corrections.
