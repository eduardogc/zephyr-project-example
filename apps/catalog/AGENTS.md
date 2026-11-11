# AGENTS.md — shop-catalog (remote, :3001)

Exposes `./CatalogPage`: product list with search (debounced), category filter, sort and pagination.

- Filter state lives in the URL (`q`, `category`, `sort`, `page`) via `useSearchParams`; keep it that way so views stay shareable.
- Data via TanStack Query + `@shop/api-client` (`keepPreviousData` for smooth paging). Handle loading (skeletons), error (retry) and empty states.
- Uses the host's Router/QueryClient contexts (shared singletons). `src/bootstrap.tsx` is a standalone harness for isolated dev.
- Styling: Tailwind classes + tokens from `@shop/ui/theme.css`; keep components accessible (labels, `aria-pressed`, live regions).
- Run: `pnpm --filter shop-catalog dev` · build/deploy: `pnpm --filter shop-catalog build`.
- Loading UX: while a debounced search or refetch is in flight, `busy` drives the search-box spinner, the `ProgressBar`, a dimmed `aria-busy` list and the `role="status"` message. Keep these in sync when changing the query logic.
- A11y: each component folder has its own test, including an axe check (colour contrast can't run in jsdom). Keep new controls labelled and keyboard operable.
- Layout: 1 "giant" card per row on mobile, 2 columns from `sm`, 3 columns from `lg` (see `GRID` in `pages/CatalogPage/CatalogPage.tsx` and the responsive classes in `components/ProductCard`).
- CSS: each exposed module imports `./styles.css` itself (`bootstrap.tsx` only runs in standalone mode, so CSS imported there never reaches the shell). Same rule for every remote.
- Structure: `pages/CatalogPage` (exposed as `./CatalogPage`), `components/{ProductCard,SearchBar,FilterMenu}`, `hooks/useDebounced`. See the root AGENTS.md convention.
