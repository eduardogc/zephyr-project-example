// Standalone harness so the remote can be developed in isolation (http://localhost:3001).
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import CatalogPage from './CatalogPage';

const client = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <main className="mx-auto max-w-6xl p-4">
          <CatalogPage />
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
