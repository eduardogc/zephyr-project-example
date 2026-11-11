# AGENTS.md — @shop/types

Single source of truth for contracts: zod schemas + inferred types (`Product`, `ProductQuery`, `OrderInput`, `Order`, `ApiError`), `CATEGORIES`, `SORTS`, `formatPrice`, and the cross-MFE event `CART_ADD_EVENT`/`CartAddDetail`.

- Used by the API (request validation) and frontends (response parsing, forms). Change a schema here and fix all consumers: run `pnpm typecheck && pnpm test` at the root.
- Source-only package (`main: src/index.ts`). Keep it dependency-light (zod only) and free of DOM/Node-specific code.
