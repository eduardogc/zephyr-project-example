# Zephyr Shop — micro-frontend storefront

A small but complete storefront built to showcase a modern full-stack setup:
four independently deployable micro-frontends, a typed Fastify API and an Nx monorepo, shipped with [Zephyr Cloud](https://docs.zephyr-cloud.io).

```
apps/
  shell/     host: routing, layout, error isolation        (React 19 · React Router 7)   :2000
  catalog/   remote: product list, search/filter/sort/page (TanStack Query, URL state)   :3001
  product/   remote: product detail, add to cart           (a11y, loading/error states)  :3002
  cart/      remote: cart state, checkout form + mutation  (zod validation)              :3003
  api/       Fastify + node:sqlite REST API                (zod validation, tx orders)   :4000
packages/
  types/       zod schemas + shared types (single source of truth for API and UI)
  api-client/  typed, validated fetch client
  ui/          design tokens (Tailwind v4) + accessible components, with tests
```

## Highlights
- **Module Federation + Zephyr**: each remote builds and deploys on its own; the shell resolves them via `zephyr:dependencies`. Roll back or ship one remote without touching the others.
- **Resilience**: every remote is behind an error boundary + Suspense — if `catalog` is down, the header and cart still work.
- **Decoupled remotes**: `product` → `cart` communication is a typed `window` event (`CART_ADD_EVENT`), not an import.
- **End-to-end types**: zod schemas in `@shop/types` validate API input *and* API responses on the client.
- **Real backend behaviour**: order creation is transactional (stock check + decrement, rollback on failure).
- **Nx**: task graph, caching (`nx build`, `nx test`), `nx graph`, `nx affected -t test`.
- **Tests**: Vitest for API (Fastify `inject`), UI components (Testing Library) and the cart store.

## Prerequisites
- **Node.js ≥ 22.5** (the API uses the built-in `node:sqlite`; developed on 22.15)
- **pnpm ≥ 10** (`corepack enable` or `npm i -g pnpm`)
- A **Zephyr Cloud account**. Zephyr is mandatory: every app is wrapped with `withZephyr()`, so `dev` and `build` need you logged in (the first run opens a browser login).

## Setup
```bash
git clone <repo> && cd <repo>
pnpm install          # installs every workspace (apps + packages)
pnpm dev              # API + shell + 3 remotes in parallel via Nx
```
Open http://localhost:2000. The remotes also run standalone: catalog `:3001`, product `:3002/products/aero-buds`, cart `:3003`; the API at `:4000` (`/health`, `/api/products`).

If pnpm reports ignored build scripts, approve them (`pnpm approve-builds`); `esbuild` and `nx` are already allowed in `pnpm-workspace.yaml`.

## Scripts
| Command | What it does |
|---|---|
| `pnpm dev` | Runs all apps in dev mode (`nx run-many -t dev`) |
| `pnpm build` | Typechecks, builds and **deploys every app to Zephyr** (Nx orders by dependency, caches results) |
| `pnpm test` | Vitest for API, UI package and cart store |
| `pnpm typecheck` | `tsc` for every project |
| `pnpm graph` | Visualise the Nx project graph |
| `npx nx affected -t test` | Only test what your changes touch |
| `npx nx build shop-cart` | Build/deploy a single app (remotes deploy independently) |

## Configuration
| Variable | Used by | Default |
|---|---|---|
| `PUBLIC_API_URL` | frontends (build time) | `/api` (dev proxy to `:4000`) |
| `PORT` | API | `4000` |
| `DB_FILE` | API | `data/shop.sqlite` (created and seeded on first run) |

## Working in the repo
Each app has an `AGENTS.md` describing its purpose, commands and conventions for humans and AI agents; read the one in the app you're changing.

## Deploying
Zephyr hosts the static frontends only; it does not run Node servers, so the API is deployed to **Render**.

**One-time setup**
1. Render: *New → Blueprint* and pick this repo (uses `render.yaml`). Copy the service's **Deploy Hook URL** and public URL.
2. GitHub repo → *Settings → Secrets and variables → Actions*:
   - secret `RENDER_DEPLOY_HOOK_URL`: the Render deploy hook
   - secret `ZE_SECRET_TOKEN`: Zephyr API token (Zephyr dashboard → settings)
   - variable `API_URL`: e.g. `https://shop-api.onrender.com/api` (the frontends' `PUBLIC_API_URL`)
   - variable `API_HEALTH_URL`: e.g. `https://shop-api.onrender.com/health`

**Pipelines** (`.github/workflows/`)
- `ci.yml`: every PR/branch runs `nx affected -t typecheck test`.
- `deploy-api.yml`: on push to `main` touching `apps/api`, `packages/types`, the lockfile or `render.yaml`. It tests, triggers the Render deploy hook, then waits for `/health`.
- `deploy.yml`: on push to `main` for everything else. It runs `nx run-many -t build` (remotes, then shell, each deployed to Zephyr).

> The free Render plan has an ephemeral disk and sleeps when idle: the SQLite file is re-seeded on each deploy/restart. For persistent orders, use a paid plan with a disk mounted at `/data` and set `DB_FILE=/data/shop.sqlite`.
