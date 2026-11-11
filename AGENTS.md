# AGENTS.md — repo root

Nx + pnpm monorepo: 4 Module Federation micro-frontends (`apps/shell|catalog|product|cart`), a Fastify API (`apps/api`) and shared TS-source packages (`packages/types|api-client|ui`). Every frontend is deployed with Zephyr Cloud via `withZephyr()` — never remove or gate it.

- Install `pnpm install`; run all `pnpm dev`; verify `pnpm typecheck && pnpm test`.
- Packages export TypeScript source (no build step). Frontends compile them via `source.include` in `rsbuild.config.ts`.
- Cross-app contracts live in `@shop/types` (zod schemas, `CART_ADD_EVENT`). Change them there, not per app.
- Remotes must not import from each other or from the shell; communicate via `window` events or the API.
- Keep `react`, `react-dom`, `react-router`, `@tanstack/react-query` as MF `singleton` shared deps in every frontend.
