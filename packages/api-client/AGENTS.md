# AGENTS.md — @shop/api-client

Typed fetch client (`api.listProducts|getProduct|createOrder`). Responses are parsed with the zod schemas from `@shop/types`; non-2xx responses throw `ApiRequestError {status, issues}`.

- Base URL: `process.env.PUBLIC_API_URL ?? '/api'` (inlined by Rsbuild at build time).
- Add a method per API endpoint, always validating the response with a schema. Don't call `fetch` directly from apps.
- `PUBLIC_API_URL` is inlined through `source.define` in every app's `rsbuild.config.ts` (default `/api`). Don't remove it: an unset `PUBLIC_*` var is otherwise left as `process.env...` and crashes in the browser.
