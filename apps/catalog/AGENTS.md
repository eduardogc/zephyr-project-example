# AGENTS.md — shop-catalog (remote, :3001)

Exposes `./CatalogPage`: product list with search (debounced), category filter, sort and pagination.

- Filter state lives in the URL (`q`, `category`, `sort`, `page`) via `useSearchParams`; keep it that way so views stay shareable.
- Data via TanStack Query + `@shop/api-client` (`keepPreviousData` for smooth paging). Handle loading (skeletons), error (retry) and empty states.
- Uses the host's Router/QueryClient contexts (shared singletons). `src/bootstrap.tsx` is a standalone harness for isolated dev.
- Styling: Tailwind classes + tokens from `@shop/ui/theme.css`; keep components accessible (labels, `aria-pressed`, live regions).
- Run: `pnpm --filter shop-catalog dev` · build/deploy: `pnpm --filter shop-catalog build`.
