# AGENTS.md — shop-product (remote, :3002)

Exposes `./ProductPage` (route `/products/:id`): product detail, stock messaging, quantity stepper, add to cart.

- "Add to cart" must NOT import the cart remote. Dispatch `CART_ADD_EVENT` (`CustomEvent<CartAddDetail>`) on `window` — the cart remote listens.
- 404s from the API render a "not found" view and are not retried; other errors show `ErrorState` with retry.
- Standalone harness (`src/bootstrap.tsx`) serves `/products/:id`, e.g. http://localhost:3002/products/aero-buds.
- Run: `pnpm --filter shop-product dev` · build/deploy: `pnpm --filter shop-product build`.
