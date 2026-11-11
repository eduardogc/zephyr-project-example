# AGENTS.md — shop-api (Fastify, :4000)

REST API: Fastify 5 + **Drizzle ORM** on SQLite via `@libsql/client` (prebuilt binaries, no install scripts).

## Layers (dependencies only point downwards)
```
routes   (modules/*/**.routes.ts)       HTTP only: parse input with zod, call a service, set status codes
services (modules/*/**.service.ts)      business rules; throw typed errors; know nothing about HTTP or SQL
repositories (modules/*/**.repository.ts)  Drizzle queries; wrap failures with guardDb -> DatabaseError
db/      schema.ts, client.ts, migrations/, seed.ts
```
`container.ts` is the only place that assembles repositories -> services; `app.ts` wires routes + error handler;
`server.ts` loads config, migrates, seeds, listens. `config.ts` validates env with zod (`PORT`, `DB_FILE`, `LOG_LEVEL`).

## Errors (`src/errors`, contract in `@shop/types`)
- `BusinessError` family (4xx, message safe to show): `ValidationError` (400, `issues[]`), `BadRequestError` (400), `NotFoundError` (404), `ConflictError` (409), `OutOfStockError` (409).
- `ServerError` / `DatabaseError` (500): the client only ever gets `{ error: "Internal server error", code }`; message + cause go to the logs.
- Every response error is `{ error, code, issues? }` (`apiErrorSchema`). The single `plugins/error-handler.ts` converts anything thrown (our errors, `ZodError`, Fastify's 4xx, unknown) via `normalizeError` + `toApiError`. Throw typed errors; never `reply.status(4xx).send(...)` by hand.
- New code => add it to `ERROR_CODES` in `@shop/types`, a class here, and a test.

## Database
- Change `src/db/schema.ts`, then `pnpm --filter shop-api db:generate` and commit the new SQL in `src/db/migrations/`. Migrations run automatically on start.
- Databases created before Drizzle (old `node:sqlite` API) are adopted on start by `runMigrations`: it records the baseline migration as applied and keeps all rows (`db/migrate.ts`, tests in `migrate.test.ts`). A history table with no rows does NOT count as history: Drizzle creates it before the first migration, so a crashed first attempt leaves it empty.
- Transactions go through `database.transaction()` (queued: the client has one connection, overlapping transactions would fail with `TRANSACTION_ACTIVE`). Order creation uses a unit of work so stock decrement + order insert are atomic.
- Stock is taken with a guarded `UPDATE ... WHERE stock >= n` (`decrementStock`): never read-then-write.

## Tests (`pnpm --filter shop-api test`) — one layer at a time
- errors / config / db: pure unit tests. repositories: in-memory SQLite (`test/helpers.ts`). services: repositories faked, no DB. routes: services faked, no DB.
- `orders.integration.test.ts`: real DB, proves rollback + concurrency (no overselling). `app.integration.test.ts`: whole stack over HTTP.
- Add a test at the lowest layer that can show the behaviour.

## Run
`pnpm --filter shop-api dev` (tsx watch). Env: `PORT`, `DB_FILE` (default `data/shop.sqlite`, gitignored), `LOG_LEVEL`.
Not hosted by Zephyr (static only); deploys to Render via `render.yaml`.
