# Portfolio Monorepo

This repository is now a workspace monorepo with two Next.js apps:

- `apps/web`: public portfolio website (`www` or apex domain)
- `apps/admin`: admin dashboard (`admin.<domain>`)
- `packages/shared`: shared project schema/types/validators/helpers

## Architecture

- Firestore collection: `projects/{projectId}`
- Slug reservation: `projectSlugs/{slug}`
- Storage assets: `projects/**`
- Public web reads only `published` + `hidden == false` projects
- Admin writes happen through server API routes (validated with zod)
- Admin access requires Firebase Auth custom claim: `admin: true`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create env files:
- `apps/web/.env.local` from `apps/web/.env.example`
- `apps/admin/.env.local` from `apps/admin/.env.example`

3. Run apps:

```bash
npm run dev:web
npm run dev:admin
```

- Web app: http://localhost:3000
- Admin app: http://localhost:3001

## Deployment (Vercel)

Create two Vercel projects from the same repo:

1. Web project
- Root directory: `apps/web`
- Domain: `www.yourdomain.com` (or apex)

2. Admin project
- Root directory: `apps/admin`
- Domain: `admin.yourdomain.com`

Both projects use the same Firebase backend.

## Firestore Model (Normalized)

Each `projects/{projectId}` document uses:

- `slug`, `title`, `shortDescription`, `fullDescription`, `tags[]`
- `status` (`draft | published`), `featured`, `hidden`
- `sortOrder`, `publishedAt`, `createdAt`, `updatedAt`
- `coverImagePath`, `logoPath`
- `media[]` with `{ type, storagePath, thumbnailPath?, sources? }`
- `links` (`github`, `live`, `behance`)

## Rules and Migration

- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`
- Firebase config: `firebase.json`

Migration script:

```bash
npm run migrate:projects          # dry-run
npm run migrate:projects -- --apply
```

Admin claim helper:

```bash
# grant admin
node --env-file=.env scripts/admin-claim.mjs --email you@example.com --action grant

# check current claims
node --env-file=.env scripts/admin-claim.mjs --email you@example.com --action status

# revoke admin
node --env-file=.env scripts/admin-claim.mjs --email you@example.com --action revoke
```

## Tests

Shared package unit tests:

```bash
npm run test --workspace @portfolio/shared
```
