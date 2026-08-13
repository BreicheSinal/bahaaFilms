# Client Showcase Design

## Goal

Add a client-focused home-page section that highlights every unique published client with the logo already stored for its project in Firebase Storage.

## Placement and composition

Place the section between the existing portfolio and contact sections. It will use a near-black surface, a compact uppercase `Clients` label, a large `Selected collaborators` heading, and concise supporting copy. The dominant visual is a horizontal rail of large, logo-led panels.

## Data flow

The section will consume the same public project list as the existing portfolio section. That list already contains published, visible projects whose `logo` values have been resolved to Firebase Storage download URLs.

Projects will be ordered by their existing public order. The showcase will retain the first project for each normalized title (trimmed and case-insensitive), preventing duplicate client entries without requiring a schema change. Projects without a title or logo will not be displayed.

## Tile behavior

Each panel centers the project logo with `object-fit: contain` inside a calm dark surface, so transparent logo assets remain clear. The client title sits below the mark. Hover and keyboard focus reveal the short description and a directional affordance. Selecting a panel navigates to its existing project detail route.

The rail clips at the viewport edges on desktop to suggest more clients, and it becomes a horizontally scrollable, touch-friendly row on mobile. It respects reduced-motion preferences and has an accessible label for navigation.

## Loading and empty states

While the shared projects request is pending, show the existing loader. If no eligible unique projects exist, hide the section rather than rendering an empty decorative band.

## Validation

Add a focused component test covering title-based deduplication and the exclusion of projects without a title or logo. Run the web test suite and a production build after implementation.
