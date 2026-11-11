// Failure cases run against the REAL api-client with `fetch` stubbed (no module mock).
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductPage from './ProductPage';

const stubFetch = (status: number, body: unknown) => {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fn);
  return fn;
};
const renderPage = (id: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })}>
      <MemoryRouter initialEntries={[`/products/${id}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('ProductPage when the API fails', () => {
  it('shows "not found" for a 404 and does not retry', async () => {
    const fetchMock = stubFetch(404, { error: 'Product not found' });
    renderPage('nope');
    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the shop' })).toHaveAttribute('href', '/');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries server errors twice, then shows a retryable error', async () => {
    const fetchMock = stubFetch(500, { error: 'Internal server error' });
    renderPage('aero-buds');
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load this product.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries (see `retry` in ProductPage)
  });
});
