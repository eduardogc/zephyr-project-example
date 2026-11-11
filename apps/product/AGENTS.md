# AGENTS.md — shop-product (remote, :3002)

Exposes `./ProductPage` (route `/products/:id`): product detail, stock messaging, quantity stepper, add to cart.

- "Add to cart" must NOT import the cart remote. Dispatch `CART_ADD_EVENT` (`CustomEvent<CartAddDetail>`) on `window` — the cart remote listens.
- 404s from the API render a "not found" view and are not retried; other errors show `ErrorState` with retry.
- Standalone harness (`src/bootstrap.tsx`) serves `/products/:id`, e.g. http://localhost:3002/products/aero-buds.
- Run: `pnpm --filter shop-product dev` · build/deploy: `pnpm --filter shop-product build`.
- Photos: `src/components/ProductImage/productPhotos.ts` maps product id -> bundled Unsplash JPEG (+ photographer credit, shown by `ProductImage`). Adding a product means adding a photo there; unknown ids fall back to the emoji `ProductArt`. Keep the credit visible (Unsplash terms).
- Structure: `pages/ProductPage` (exposed as `./ProductPage`; its API-failure tests are in `ProductPage.errors.test.tsx`, with `fetch` stubbed), `components/ProductImage`, `assets/products/` (full-size photos).
