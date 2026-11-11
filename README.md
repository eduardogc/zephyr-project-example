# Zephyr Shop — micro-frontend storefront

[![CI](https://github.com/eduardogc/zephyr-project-example/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardogc/zephyr-project-example/actions/workflows/ci.yml)
[![Render API](https://img.shields.io/website?url=https%3A%2F%2Fshop-api-3vgw.onrender.com%2Fhealth&label=render%20api&up_message=healthy&down_message=down)](https://shop-api-3vgw.onrender.com/health)
[![Zephyr shell](https://img.shields.io/website?url=https%3A%2F%2Fgeceduardo-16-shop-shell-zephyr-project-example-e-1a39ef0a7-ze.zephyrcloud.app&label=zephyr%20shell&up_message=deployed&down_message=down)](https://geceduardo-16-shop-shell-zephyr-project-example-e-1a39ef0a7-ze.zephyrcloud.app)


## Live demo
**https://eduardogc.github.io/zephyr-project-example/** redirects to the newest production build on Zephyr Cloud (Zephyr URLs are versioned, so this is the stable link). The API runs on Render's free plan: the first request after idle can take ~30 s while it wakes up.

A small but complete storefront built to showcase a modern full-stack setup:
four independently deployable micro-frontends, a typed Fastify API and an Nx monorepo, shipped with [Zephyr Cloud](https://docs.zephyr-cloud.io).

```
apps/
  shell/     host: routing, layout, error isolation        (React 19 · React Router 7)   :2000
  catalog/   remote: product list, search/filter/sort/page (TanStack Query, URL state)   :3001
  product/   remote: product detail, add to cart           (a11y, loading/error states)  :3002
  cart/      remote: cart state, checkout form + mutation  (zod validation)              :3003
  api/       Fastify + Drizzle ORM (SQLite) REST API       (layered, typed errors)       :4000
packages/
  types/       zod schemas + shared types (single source of truth for API and UI)
  api-client/  typed, validated fetch client
  ui/          design tokens (Tailwind v4) + accessible components, with tests
```

## Code layout
Every frontend follows the same structure, so you always know where to look:
```
src/
  pages/<Page>/        route-level components (what each remote exposes)
  components/<X>/      one folder per component: X.tsx · X.test.tsx · index.ts
  hooks/ · store/      same rule
  test/                setup + helpers
apps/api/src/          modules/<feature>/ {routes, service, repository}, db/, errors/, plugins/
```

## Highlights
- **Module Federation + Zephyr**: each remote builds and deploys on its own; the shell resolves them via `zephyr:dependencies`. Roll back or ship one remote without touching the others.
- **Resilience**: every remote is behind an error boundary + Suspense — if `catalog` is down, the header and cart still work.
- **Decoupled remotes**: `product` → `cart` communication is a typed `window` event (`CART_ADD_EVENT`), not an import.
- **End-to-end types**: zod schemas in `@shop/types` validate API input *and* API responses on the client.
- **Real backend behaviour**: layered API (routes → services → repositories → Drizzle), typed business/server errors, and order creation that is transactional and race-safe (concurrent checkouts can't oversell).
- **Nx**: task graph, caching (`nx build`, `nx test`), `nx graph`, `nx affected -t test`.
- **Tests**: Vitest for API (Fastify `inject`), UI components (Testing Library) and the cart store.

## Prerequisites
- **Node.js ≥ 22** (developed on 22.15)
- **pnpm ≥ 10** 
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
| `pnpm dev` | Runs all apps in dev mode (`nx run-many -t dev`). Ports are fixed (shell 2000, catalog 3001, product 3002, cart 3003, api 4000); if one is taken it fails instead of moving |
| `pnpm dev:stop` | Kills whatever is listening on those ports (stale dev servers) |
| `pnpm build` | Typechecks, builds and **deploys every app to Zephyr** (Nx orders by dependency, caches results) |
| `pnpm test` | Vitest across all 8 projects (API, shared packages, every frontend) |
| `pnpm test:coverage` | Same, with a v8 coverage report per project (`coverage/`) |
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

- **API → Render:** *New → Blueprint*, pick this repo (it reads `render.yaml`). Render redeploys on every push to `main`. Health check: `/health`.
- **Frontends → Zephyr:** `.github/workflows/deploy.yml` runs on every push to `main`: typecheck and tests, then `nx run-many -t build` (shared packages → remotes → shell, each deployed to Zephyr), then a smoke test of the shell and the API. Locally: `PUBLIC_API_URL=https://shop-api-3vgw.onrender.com/api pnpm build` (needs a Zephyr login).
- **Stable demo URL → GitHub Pages:** after Zephyr, a small Pages site redirects to the newest shell URL.
- **CI:** `.github/workflows/ci.yml` runs `nx affected -t typecheck test` on every PR/branch.

**One-time GitHub setup**
1. Secret `ZE_CI_TOKEN`: Zephyr CI token (app.zephyr-cloud.io → Settings → Tokens → CI Tokens).
2. Settings → Pages → **Source: GitHub Actions**.
3. Optional variable `API_URL` (defaults to the Render URL above) if you move the API.

> The free Render plan has an ephemeral disk and sleeps when idle: the SQLite file is re-seeded on each deploy/restart. For persistent orders, use a paid plan with a disk mounted at `/data` and set `DB_FILE=/data/shop.sqlite`.

## Credits
Product photos are from [Unsplash](https://unsplash.com) (free licence); photographers are credited on each product page and in `apps/product/src/components/ProductImage/productPhotos.ts`. The images are bundled with the `product` remote, so Zephyr serves them from its edge.

## Accessibility
Skip link, landmarks, focus + title management on route changes, labelled controls and fieldsets, live regions for search/filter status, visible focus, reduced-motion support and AA-contrast tokens. `pnpm test` runs axe checks on the catalog components.
