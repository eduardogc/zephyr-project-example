# AGENTS.md — shop-shell (host, :2000)

Host app. Owns routing (React Router 7), the `QueryClientProvider`, layout/header and error isolation. Lazy-loads remotes `catalog/CatalogPage`, `product/ProductPage`, `cart/CartPage`, `cart/CartButton`.

- Run: `pnpm --filter shop-shell dev` (needs the remotes + API for real data; use root `pnpm dev`).
- Remotes are declared in `rsbuild.config.ts` (dev URLs) and `package.json` `zephyr:dependencies` (Zephyr resolution). Adding a remote means updating both, plus `src/remotes.d.ts`.
- Wrap every remote in `RemoteBoundary` so one failing remote can't take down the shell.
- Keep the shell thin: no product/cart business logic here.
- `/api` is proxied to `:4000` in dev.
