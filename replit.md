# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **File uploads**: Multer (local disk storage, /uploads dir)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── helpdesk/           # React + Vite helpdesk frontend (mounted at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Helpdesk Application

**SupportDesk** — a full-stack helpdesk system with integrated knowledge base.

### Features
- Ticket management (create, view, update, resolve, delete)
- File attachment support (upload/download, 10MB limit, stored in /uploads)
- Comment threads per ticket (public replies + internal notes)
- Knowledge Base with published articles, categories, tags, view counts
- Dashboard with real-time stats, status breakdown chart, recent activity feed
- Search and filter across tickets and KB articles

### Pages
- `/` — Dashboard with stats + recent activity
- `/tickets` — Ticket list with search + filters
- `/tickets/new` — New ticket submission form
- `/tickets/:id` — Ticket detail with comments, attachments, status management
- `/kb` — Knowledge Base article grid
- `/kb/new` — New KB article form
- `/kb/:id` — Article detail view

### Database Tables
- `tickets` — Support tickets
- `comments` — Ticket comments (public + internal)
- `attachments` — File attachments (metadata, files stored on disk)
- `kb_articles` — Knowledge base articles
- `activity_log` — Recent activity feed entries

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes:
  - `src/routes/health.ts` — GET /api/healthz
  - `src/routes/tickets.ts` — CRUD for tickets + comments + attachments list
  - `src/routes/attachments.ts` — File upload, file serving, delete
  - `src/routes/kb.ts` — Knowledge base CRUD + view count
  - `src/routes/stats.ts` — Dashboard stats, status breakdown, recent activity
- Depends on: `@workspace/db`, `@workspace/api-zod`, `multer`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle

### `artifacts/helpdesk` (`@workspace/helpdesk`)

React + Vite frontend for the helpdesk system. Mounted at `/` (root preview path).

- Deep navy/indigo primary palette
- Recharts for dashboard status chart
- Wouter for routing
- React Query via `@workspace/api-client-react` for all API calls

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/schema/tickets.ts` — tickets, comments, attachments tables
- `src/schema/kb.ts` — kb_articles, activity_log tables
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
