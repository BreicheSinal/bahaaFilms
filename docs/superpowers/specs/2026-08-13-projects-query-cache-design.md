# Projects Query Cache Design

## Goal

Fetch the public Firestore project list once per active browser cache period and share it across every public-site consumer, without repeated requests for concurrent mounts, empty collections, or failures.

## Chosen Approach

Replace the bespoke `fetchProjects` async thunk and its `projects` slice request state with one RTK Query endpoint, `getProjects`.

The endpoint uses the existing `getProjects()` Firestore mapper as a `queryFn`, so Firestore remains the only data source and the existing project shape and media URL handling are unchanged. Every component consumes the same zero-argument endpoint cache entry.

## Data Flow

```text
Firestore -> getProjects() -> RTK Query getProjects cache -> public page components
```

`Hero`, `Portfolio`, `Clients`, the projects archive, and project details use the generated query hook rather than independently dispatching a thunk. RTK Query coalesces simultaneous subscriptions to the same cache key into one in-flight request, then serves the result to every subscriber.

## Cache and Refresh Policy

- Cache lifetime: 10 minutes after the final subscribing component unmounts (`keepUnusedDataFor: 600`).
- Navigation within the public application reuses the active cache and does not refetch on mount, focus, or reconnect.
- An empty array is a successful cached result; it never triggers a fetch loop.
- A failed request is represented by RTK Query error state. It is not retried automatically; the UI can call the hook's `refetch` function for an intentional retry.
- A full browser reload starts a new in-memory Redux cache and makes a new request. Cross-reload persistence is deliberately out of scope so published portfolio edits become visible normally.

## Component Contract

Consumers receive `data`, `isLoading`, and `isError` from `useGetProjectsQuery()`.

- While loading with no data, retain current loaders.
- If data is unavailable after an error, show the existing empty/error-safe states; no component dispatches a load action from an effect.
- Filtering, featured-project selection, client-logo selection, related-project selection, and search state continue to be computed locally or held in a small Redux UI slice. Only remote project data moves to RTK Query.

## Store Changes

- Add the RTK Query API reducer and middleware to the web Redux store.
- Remove `items`, `loading`, and `error` from the existing projects slice, retaining only `searchQuery`, `selectedTag`, and reset actions.
- Delete `fetchProjects` and replace its imports/usages with the query hook.

## Testing

Unit tests will cover the query endpoint's cache configuration and the retained filter reducer behavior. Component-level tests will verify public consumers no longer dispatch a manual load effect, ensuring a single shared cache is the sole project-data loading path.

## Scope Boundaries

This change does not add Firestore listeners, offline persistence, a server API route, or persisted Redux state. Those would alter freshness, billing, or deployment behavior without being needed to solve duplicate reads in the active tab.
