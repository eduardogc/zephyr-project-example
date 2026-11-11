import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_ADD_EVENT, type CartAddDetail, type Product } from '@shop/types';

vi.mock('@shop/api-client', async (orig) => ({ ...(await orig<typeof import('@shop/api-client')>()), api: { getProduct: vi.fn() } }));
import { api } from '@shop/api-client';
import ProductPage from './ProductPage';

const getProduct = vi.mocked(api.getProduct);
const product: Product = { id: 'aero-buds', name: 'Aero Buds Pro', description: 'Great earbuds', category: 'audio', priceCents: 12900, rating: 4.7, stock: 24, emoji: '🎧', hue: 215 };

const renderPage = (id = 'aero-buds') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[`/products/${id}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/" element={<p>home</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => getProduct.mockReset());
afterEach(() => vi.useRealTimers());

describe('ProductPage', () => {
  it('announces loading, then shows the product with photo, price, stock and credit', async () => {
    getProduct.mockResolvedValue(product);
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading product…');
    expect(await screen.findByRole('heading', { level: 1, name: 'Aero Buds Pro' })).toBeInTheDocument();
    expect(screen.getByText('$129.00')).toBeInTheDocument();
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Aero Buds Pro' })).toHaveAttribute('src', expect.stringContaining('aero-buds'));
    expect(screen.getByRole('link', { name: 'Daniel Romero' })).toHaveAttribute('href', expect.stringContaining('unsplash.com/photos/'));
    expect(document.title).toBe('Aero Buds Pro · Zephyr Shop');
    expect(getProduct).toHaveBeenCalledWith('aero-buds');
  });

  it('falls back to generated art for products without a photo', async () => {
    getProduct.mockResolvedValue({ ...product, id: 'new-thing', name: 'New Thing' });
    renderPage('new-thing');
    await screen.findByRole('heading', { name: 'New Thing' });
    expect(screen.queryByRole('img', { name: 'New Thing' })).not.toBeInTheDocument();
  });

  it('adds to the cart through a window event with the chosen quantity, and confirms it', async () => {
    getProduct.mockResolvedValue(product);
    const onAdd = vi.fn((e: Event) => (e as CustomEvent<CartAddDetail>).detail);
    window.addEventListener(CART_ADD_EVENT, onAdd);
    renderPage();
    await screen.findByRole('heading', { name: 'Aero Buds Pro' });

    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    window.removeEventListener(CART_ADD_EVENT, onAdd);

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd.mock.results[0]!.value).toEqual({ product, quantity: 3 });
    expect(screen.getByText('Added 3 × Aero Buds Pro to your cart')).toBeInTheDocument();
  });

  it('limits the quantity stepper to 1..stock', async () => {
    getProduct.mockResolvedValue({ ...product, stock: 2 });
    renderPage();
    await screen.findByRole('heading', { name: 'Aero Buds Pro' });
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
    expect(screen.getByText('Only 2 left')).toBeInTheDocument();
  });

  it('disables buying when sold out', async () => {
    getProduct.mockResolvedValue({ ...product, stock: 0 });
    renderPage();
    expect(await screen.findByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });
});
