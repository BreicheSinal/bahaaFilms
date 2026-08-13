# Client Showcase Design

## Goal

Add a client-focused home-page section that highlights every unique published client with the cover image already stored for its project in Firebase Storage.

## Placement and composition

Place the section between the existing portfolio and contact sections. It will use a near-black surface, a compact uppercase `Clients` label, a large `Selected collaborators` heading, and concise supporting copy. The dominant visual is a horizontal rail of large, landscape cover-image tiles.

## Data flow

The section will consume the same public project list as the existing portfolio section. That list already contains published, visible projects whose `coverImage` values have been resolved to Firebase Storage download URLs.

Projects will be ordered by their existing public order. The showcase will retain the first project for each normalized title (trimmed and case-insensitive), preventing duplicate client entries without requiring a schema change. A project with an empty title will not be displayed.

## Tile behavior

Each tile renders the project cover image with `object-fit: cover`, the client title, and a subtle dark lower gradient for legibility. Hover and keyboard focus reveal the short description and a directional affordance. Selecting a tile navigates to its existing project detail route.

The rail clips at the viewport edges on desktop to suggest more clients, and it becomes a horizontally scrollable, touch-friendly row on mobile. It respects reduced-motion preferences and has an accessible label for navigation.

## Loading and empty states

While the shared projects request is pending, show the existing loader. If no eligible unique projects exist, hide the section rather than rendering an empty decorative band.

## Validation

Add a focused component test covering title-based deduplication and the exclusion of empty titles. Run the web test suite and a production build after implementation.
