// The page only fetches and chooses a view; what each view shows is tested in components/*.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@shop/types';

vi.mock('@shop/api-client', async (orig) => ({ ...(await orig<typeof import('@shop/api-client')>()), api: { getProduct: vi.fn() } }));
import { api } from '@shop/api-client';
import ProductPage from './ProductPage';

const getProduct = vi.mocked(api.getProduct);
const make = (id: string, over: Partial<Product> = {}): Product => ({ id, name: `Product ${id}`, description: 'd', category: 'audio', priceCents: 12900, rating: 4.7, stock: 24, emoji: '🎧', hue: 215, ...over });

function GoTo({ id }: { id: string }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(`/products/${id}`)}>go to {id}</button>;
}
const renderPage = (id = 'aero-buds') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/products/${id}`]}>
        <GoTo id="other" />
        <Routes>
          <Route path="/products/:id" element={<ProductPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => getProduct.mockReset());

describe('ProductPage', () => {
  it('shows the loading view while fetching, then the product', async () => {
    getProduct.mockResolvedValue(make('aero-buds', { name: 'Aero Buds Pro' }));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading product…');
    expect(await screen.findByRole('heading', { level: 1, name: 'Aero Buds Pro' })).toBeInTheDocument();
    expect(screen.queryByText('Loading product…')).not.toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledWith('aero-buds');
  });

  it('sets the document title from the product', async () => {
    getProduct.mockResolvedValue(make('aero-buds', { name: 'Aero Buds Pro' }));
    renderPage();
    await screen.findByRole('heading', { name: 'Aero Buds Pro' });
    expect(document.title).toBe('Aero Buds Pro · Zephyr Shop');
  });

  it('starts each product with a fresh quantity and no stale confirmation', async () => {
    getProduct.mockImplementation(async (id) => make(id, { name: `Product ${id}` }));
    renderPage('first');
    await screen.findByRole('heading', { name: 'Product first' });
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(screen.getByText('Added 2 × Product first to your cart')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'go to other' }));
    await screen.findByRole('heading', { name: 'Product other' });
    expect(screen.getByRole('group', { name: 'Quantity' })).toHaveTextContent('1');
    expect(screen.queryByText(/Added 2 ×/)).not.toBeInTheDocument();
  });
});
