# AGENTS.md — repo root

Nx + pnpm monorepo: 4 Module Federation micro-frontends (`apps/shell|catalog|product|cart`), a Fastify API (`apps/api`) and shared TS-source packages (`packages/types|api-client|ui`). Every frontend is deployed with Zephyr Cloud via `withZephyr()` — never remove or gate it.

- Install `pnpm install`; run all `pnpm dev`; verify `pnpm typecheck && pnpm test`.
- Packages export TypeScript source (no build step). Frontends compile them via `source.include` in `rsbuild.config.ts`.
- Cross-app contracts live in `@shop/types` (zod schemas, `CART_ADD_EVENT`). Change them there, not per app.
- Remotes must not import from each other or from the shell; communicate via `window` events or the API.
- Keep `react`, `react-dom`, `react-router`, `@tanstack/react-query` as MF `singleton` shared deps in every frontend.

## Frontend folder convention (apps and `@shop/ui`)
```
src/
  index.ts · bootstrap.tsx · styles.css · env.d.ts      app entry / plumbing (index.ts only does `import('./bootstrap')`)
  pages/<Page>/        route-level components. These are what a remote exposes through Module Federation
  components/<X>/      ONE FOLDER PER COMPONENT: X.tsx, X.test.tsx, index.ts (barrel)
  hooks/<useX>/ · store/<name>/   same rule: implementation + test + index.ts
  test/                setup.ts and test helpers
```
- Import a component through its folder (`../../components/ProductCard`), never its inner file.
- A test lives next to the thing it tests and covers only that thing (pages are tested with children real, remotes/APIs faked).
- Exposed modules import `../../styles.css` themselves (bootstrap.tsx only runs in standalone mode).
