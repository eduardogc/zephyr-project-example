// Standalone harness (http://localhost:3003).
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import CartButton from './CartButton';
import CartPage from './CartPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <main className="mx-auto max-w-7xl space-y-4 p-4">
          <CartButton />
          <CartPage />
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
