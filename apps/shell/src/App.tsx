import { useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { RemoteBoundary } from './components/RemoteBoundary';
import { RouteEffects } from './components/RouteEffects';
import { SkipLink } from './components/SkipLink';
import { NotFoundPage } from './pages/NotFoundPage';
import { CartPage, CatalogPage, ProductPage } from './remotes';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SkipLink targetId="main" />
        <RouteEffects mainRef={mainRef} />
        <Header />
        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-7xl p-4 py-8 focus:outline-none">
          <Routes>
            <Route path="/" element={<RemoteBoundary name="catalog"><CatalogPage /></RemoteBoundary>} />
            <Route path="/products/:id" element={<RemoteBoundary name="product"><ProductPage /></RemoteBoundary>} />
            <Route path="/cart" element={<RemoteBoundary name="cart"><CartPage /></RemoteBoundary>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
