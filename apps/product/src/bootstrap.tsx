// Standalone harness (http://localhost:3002/products/aero-buds).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import ProductPage from './pages/ProductPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <main className="mx-auto max-w-7xl p-4">
          <Routes>
            <Route path="/products/:id" element={<ProductPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
