# AGENTS.md — shop-cart (remote, :3003)

Exposes `./CartButton` (header badge, always mounted by the shell) and `./CartPage` (items + checkout).

- State: `src/store/cartStore/cartStore.ts` (external store + `useSyncExternalStore`, persisted to localStorage key `shop:cart:v1`). It listens for `CART_ADD_EVENT` at module load — this is why `CartButton` is loaded eagerly in the shell header. Quantity is capped at `min(10, stock)`.
- Checkout: `CheckoutForm` validates with `orderInputSchema` from `@shop/types`, posts via `api.createOrder`, maps server `issues` back to fields, clears the cart on success.
- Tests: `pnpm --filter shop-cart test` (store behaviour).
- Run: `pnpm --filter shop-cart dev` · build/deploy: `pnpm --filter shop-cart build`.
- Structure: `pages/CartPage` (exposed as `./CartPage`), `components/CartButton` (exposed as `./CartButton`), `components/CheckoutForm`, `store/cartStore`.
