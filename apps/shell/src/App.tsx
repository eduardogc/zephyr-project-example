import { lazy, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router';
import { BoltIcon } from '@shop/ui';
import { RemoteBoundary } from './RemoteBoundary';

// Each import below is a separately deployed micro-frontend (see rsbuild.config.ts / Zephyr).
const CatalogPage = lazy(() => import('catalog/CatalogPage'));
const ProductPage = lazy(() => import('product/ProductPage'));
const CartPage = lazy(() => import('cart/CartPage'));
const CartButton = lazy(() => import('cart/CartButton'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Shop'],
  [/^\/products\//, 'Product'],
  [/^\/cart$/, 'Your cart'],
];

/** SPA navigation does not reload the page, so move focus + update the title for keyboard/AT users. */
function RouteEffects({ mainRef }: { mainRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    document.title = `${TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Not found'} · Zephyr Shop`;
    if (first.current) first.current = false;
    else mainRef.current?.focus({ preventScroll: false });
  }, [pathname, mainRef]);
  return null;
}

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-contrast">
          Skip to content
        </a>
        <RouteEffects mainRef={mainRef} />
        <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
          <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <BoltIcon aria-hidden className="size-6 text-brand" /> Zephyr Shop
            </Link>
            <RemoteBoundary name="cart" inline>
              <CartButton />
            </RemoteBoundary>
          </nav>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-7xl p-4 py-8 focus:outline-none">
          <Routes>
            <Route path="/" element={<RemoteBoundary name="catalog"><CatalogPage /></RemoteBoundary>} />
            <Route path="/products/:id" element={<RemoteBoundary name="product"><ProductPage /></RemoteBoundary>} />
            <Route path="/cart" element={<RemoteBoundary name="cart"><CartPage /></RemoteBoundary>} />
            <Route path="*" element={<h1 className="py-16 text-center text-xl font-semibold">Page not found</h1>} />
          </Routes>
        </main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          Micro-frontends: shell · catalog · product · cart — each deployed independently with Zephyr Cloud.
        </footer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
