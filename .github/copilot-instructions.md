# Copilot Instructions

## Project Overview

**PipeNoLine** ("Kinetic Terminal") is a DevOps pipeline orchestration dashboard — a web UI for managing and monitoring CI/CD pipeline execution, task creation, and cluster node status.

## Repository Structure

pnpm monorepo (workspace root at `/`):

- `index.html` — current application (static SPA, fully self-contained)
- `packages/api/` — intended backend/API server (not yet implemented)
- `packages/web/` — intended frontend application (not yet implemented)

The architecture is being migrated from the monolithic `index.html` into the `packages/api` + `packages/web` split.

## Tech Stack

- **Styling**: Tailwind CSS (CDN, with custom config inline in `index.html`)
- **Icons**: Google Material Symbols
- **Fonts**: Space Grotesk (headings), Inter (body/labels)
- **Package manager**: pnpm (`packageManager: pnpm@10.14.0`)

## Design System & Conventions

**Material Design 3 color tokens** — always use these, never raw hex:
- Primary: `#9ba8ff` (blue)
- Secondary: `#9891fe` (purple)
- Tertiary: `#ffa4e4` (pink)
- Background: `#0e0e0e`, surfaces in dark shades

**Dark theme by default.** All new UI should follow the existing dark palette.

**Typography classes:**
- `font-space-grotesk` — headlines
- `font-body` / `font-label` — body and label text

**Border radius scale** (custom Tailwind, non-standard):
- `rounded` = `0.125rem`, `rounded-lg` = `0.25rem`, `rounded-xl` = `0.5rem`, `rounded-full` = `0.75rem`

**Status badge pattern:**
- Done → tertiary color, Running → primary color + pulse animation, Error → error color, Pending → outline style

**Interactive elements** use `transition`, hover states, and `active:scale-*` for tactile feedback.

**Glass morphism** surfaces use the `glass-effect` class.

## Commands

```bash
pnpm install              # install all workspace dependencies
pnpm run dev              # start api + web concurrently
pnpm run dev:api          # API only  (Fastify on :3000)
pnpm run dev:web          # Web only  (Vite on :5173)
pnpm --filter @pipenolinete/api build   # tsc compile api
pnpm --filter @pipenolinete/web build  # tsc + vite build web
```

## tRPC Architecture

- **`packages/api/src/router.ts`** — define all procedures here using `initTRPC`; export `AppRouter` type
- **`packages/api/src/index.ts`** — Fastify server, mounts tRPC plugin at `/trpc` prefix
- **`packages/web/src/trpc.ts`** — `createTRPCReact<AppRouter>()` client; imports `AppRouter` type directly from `../../api/src/router` (type-only, zero runtime coupling)
- **`packages/web/src/App.tsx`** — wraps app in `<trpc.Provider>` + `<QueryClientProvider>`
- Vite proxies `/trpc` → `http://localhost:3000` in dev; no CORS issues

**Adding a new procedure:** add it to `appRouter` in `packages/api/src/router.ts` — it's immediately available in the web client with full type safety via `trpc.<procedureName>.useQuery/useMutation()`.
