# AGENTS.md — shop-api (Fastify, :4000)

REST API on Fastify 5 + Node's built-in `node:sqlite` (Node ≥ 22.5; prints an experimental warning).

- Routes (`src/app.ts`): `GET /health`, `GET /api/categories`, `GET /api/products` (search/category/sort/page), `GET /api/products/:id`, `POST /api/orders`.
- Validation: zod schemas from `@shop/types` (`productQuerySchema`, `orderInputSchema`); `ZodError` → 400 `{error, issues[{path,message}]}`; `OrderError` → 404/409. Keep the `{error, issues?}` shape — the client depends on it.
- Data layer `src/db.ts`: `createDb(file)`; `':memory:'` for tests. Seeds from `src/seed.ts` when empty. `createOrder` is transactional (stock check, decrement, rollback on failure).
- Tests (`src/app.test.ts`) use `app.inject` with an in-memory DB: `pnpm --filter shop-api test`. Add a test with every route/behaviour change.
- Run: `pnpm --filter shop-api dev` (tsx watch). Env: `PORT`, `DB_FILE`. Database file lives in `data/` (gitignored).
- The API is not hosted by Zephyr (static assets only); it deploys to Render via `render.yaml` (auto-deploys on push to main).
