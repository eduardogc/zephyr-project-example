import { lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes } from 'react-router';
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2">Skip to content</a>
        <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <BoltIcon aria-hidden className="size-6 text-brand" /> Zephyr Shop
            </Link>
            <RemoteBoundary name="cart" inline>
              <CartButton />
            </RemoteBoundary>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-7xl p-4 py-8">
          <Routes>
            <Route path="/" element={<RemoteBoundary name="catalog"><CatalogPage /></RemoteBoundary>} />
            <Route path="/products/:id" element={<RemoteBoundary name="product"><ProductPage /></RemoteBoundary>} />
            <Route path="/cart" element={<RemoteBoundary name="cart"><CartPage /></RemoteBoundary>} />
            <Route path="*" element={<p className="py-16 text-center text-xl">Page not found</p>} />
          </Routes>
        </main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          Micro-frontends: shell · catalog · product · cart — each deployed independently with Zephyr Cloud.
        </footer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
