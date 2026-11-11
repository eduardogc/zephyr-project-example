# AGENTS.md — @shop/ui

Shared design system: tokens in `src/theme.css` (CSS variables + Tailwind v4 `@theme`, light/dark) and accessible components (`Button`, `Skeleton`, `ErrorState`, `ProductArt`, `Rating`, `cn`).

- Apps import `@shop/ui/theme.css` after `@import 'tailwindcss'` and add `@source '../../../packages/ui/src'` so Tailwind sees these classes.
- Use semantic token classes (`bg-surface`, `text-muted`, `border-border`, `text-brand`) — no hard-coded colors, so dark mode keeps working.
- Components must be keyboard accessible and expose proper roles/labels; cover them in `src/components.test.tsx` (`pnpm --filter @shop/ui test`).
- No app-specific logic here.
- `@shop/ui/product-photo` (`ProductPhoto`) is a separate entry on purpose: it imports the 640px thumbnails in `src/photos/`, so only apps that import it bundle those images. Never re-export it from `src/index.ts` (the shell would then ship the photos). New product => add its thumbnail + entry in `src/photos/index.ts` and the full-size one in `apps/product/src/productImages.ts`.
